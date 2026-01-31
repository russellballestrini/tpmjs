/**
 * Health Check Service
 * Checks tool import and execution health via Railway executor
 */

import { type HealthStatus, type Package, type Prisma, prisma, type Tool } from '@tpmjs/db';
import type { ToolHealthCheckConfig } from '@tpmjs/types/tpmjs';
import { env } from '~/env';

const RAILWAY_EXECUTOR_URL = env.RAILWAY_EXECUTOR_URL;

interface HealthCheckResult {
  toolId: string;
  importStatus: HealthStatus;
  importError: string | null;
  importTimeMs: number | null;
  executionStatus: HealthStatus;
  executionError: string | null;
  executionTimeMs: number | null;
  overallStatus: HealthStatus;
}

/**
 * Parse healthCheckConfig from DB JSON to typed config.
 * Returns null if not present or invalid.
 */
function parseHealthCheckConfig(tool: Tool): ToolHealthCheckConfig | null {
  if (!tool.healthCheckConfig || typeof tool.healthCheckConfig !== 'object') return null;
  return tool.healthCheckConfig as ToolHealthCheckConfig;
}

/**
 * Process template variables in test parameters.
 * Supported: {{timestamp}} - replaced with Date.now()
 */
function processTestParams(params: Record<string, unknown>): Record<string, unknown> {
  const processed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      processed[key] = value.replace(/\{\{timestamp\}\}/g, String(Date.now()));
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

/**
 * Execute cleanup steps after a health check execution to undo side effects.
 * Each step calls a tool from the same package with params mapped from the execution result.
 * Best-effort: failures are logged but don't fail the health check.
 */
async function executeCleanup(
  tool: Tool & { package: Package },
  cleanupSteps: NonNullable<ToolHealthCheckConfig['cleanup']>,
  executionResult: Record<string, unknown>
): Promise<void> {
  for (const step of cleanupSteps) {
    try {
      // Map params from execution result using the mapping config
      const cleanupParams: Record<string, unknown> = {};
      for (const [paramName, resultField] of Object.entries(step.mapping)) {
        cleanupParams[paramName] = executionResult[resultField];
      }

      console.log(
        `  Cleanup: calling ${step.tool} with params ${JSON.stringify(cleanupParams)}`
      );

      const response = await fetch(`${RAILWAY_EXECUTOR_URL}/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: tool.package.npmPackageName,
          name: step.tool,
          version: tool.package.npmVersion,
          params: cleanupParams,
          env: tool.package.env || {},
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn(
          `  Cleanup warning: ${step.tool} returned ${response.status}: ${data.error || 'unknown error'}`
        );
      } else {
        console.log(`  Cleanup: ${step.tool} succeeded`);
      }
    } catch (error) {
      console.warn(
        `  Cleanup warning: ${step.tool} failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
}

/**
 * Check if a tool can be imported (load-and-describe)
 */
async function checkImportHealth(tool: Tool & { package: Package }): Promise<{
  status: HealthStatus;
  error: string | null;
  timeMs: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: tool.package.npmPackageName,
        name: tool.name,
        version: tool.package.npmVersion,
        env: tool.package.env || {},
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const timeMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || `HTTP ${response.status}`;

      // If error is config/input issue, tool is not broken
      if (isNonBreakingError(error)) {
        return {
          status: 'HEALTHY',
          error: null,
          timeMs,
        };
      }

      return {
        status: 'BROKEN',
        error,
        timeMs,
      };
    }

    // Verify tool has required fields
    if (!data.tool?.description || !data.tool?.inputSchema) {
      return {
        status: 'BROKEN',
        error: 'Missing required tool fields (description or inputSchema)',
        timeMs,
      };
    }

    return { status: 'HEALTHY', error: null, timeMs };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If error is config/input issue, tool is not broken
    if (isNonBreakingError(errorMessage)) {
      return {
        status: 'HEALTHY',
        error: null,
        timeMs: Date.now() - startTime,
      };
    }

    return {
      status: 'BROKEN',
      error: errorMessage,
      timeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check if a tool can execute with test parameters
 *
 * IMPORTANT: If the tool executes at all (even with errors), it's HEALTHY.
 * We only mark as BROKEN for infrastructure failures (timeouts, network errors).
 * Validation errors mean the tool IS working - it's correctly rejecting bad input.
 *
 * Respects healthCheckConfig from the tool's tpmjs spec:
 * - skipExecution: skip execution entirely, only verify import
 * - testParams: use author-provided params instead of auto-generated
 * - cleanup: run cleanup steps after execution to undo side effects
 */
async function checkExecutionHealth(tool: Tool & { package: Package }): Promise<{
  status: HealthStatus;
  error: string | null;
  timeMs: number;
  testParams: Record<string, unknown>;
}> {
  const startTime = Date.now();
  const healthCheckConfig = parseHealthCheckConfig(tool);

  // If tool declares skipExecution, skip execution health check entirely.
  // This is for tools that require existing external resources (would 404 with fake IDs).
  if (healthCheckConfig?.skipExecution) {
    console.log(`  Execution: skipped (healthCheck.skipExecution=true)`);
    return { status: 'HEALTHY', error: null, timeMs: 0, testParams: {} };
  }

  // Use author-provided test params if available, otherwise auto-generate
  const testParams = healthCheckConfig?.testParams
    ? processTestParams(healthCheckConfig.testParams)
    : generateTestParameters(tool);

  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: tool.package.npmPackageName,
        name: tool.name,
        version: tool.package.npmVersion,
        params: testParams,
        env: tool.package.env || {},
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const timeMs = Date.now() - startTime;

    // If we got a response from the executor, the tool executed
    // Any error in the response is from the tool itself (validation, env, etc.)
    // which means the tool IS working - it's correctly processing/rejecting input
    if (response.ok) {
      // Run cleanup steps if defined (undo side effects from execution)
      if (healthCheckConfig?.cleanup?.length) {
        const data = await response.json().catch(() => ({}));
        const executionResult = data.result ?? data;
        await executeCleanup(tool, healthCheckConfig.cleanup, executionResult);
      }
      return { status: 'HEALTHY', error: null, timeMs, testParams };
    }

    // HTTP error from executor - could be tool-level or infrastructure
    const data = await response.json().catch(() => ({}));
    const error = data.error || `HTTP ${response.status}`;

    // Check if this is a config/validation error (tool is working, just missing setup)
    // The executor returns 500 for all tool errors, so we need to inspect the message
    if (isNonBreakingError(error)) {
      return { status: 'HEALTHY', error: null, timeMs, testParams };
    }

    // True infrastructure failures (executor down, rate limited, etc.)
    if (response.status >= 500) {
      return { status: 'BROKEN', error, timeMs, testParams };
    }

    // 4xx errors are likely tool-level validation/config issues
    return { status: 'HEALTHY', error: null, timeMs, testParams };
  } catch (error) {
    // Network/timeout errors are infrastructure issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Timeout or network error = infrastructure issue = BROKEN
    return {
      status: 'BROKEN',
      error: errorMessage,
      timeMs: Date.now() - startTime,
      testParams,
    };
  }
}

/**
 * Check if an error is due to missing environment variables (configuration issue)
 * rather than a broken tool (code issue)
 */
function isEnvironmentConfigError(error: string | null): boolean {
  if (!error) return false;

  const envErrorPatterns = [
    /is required/i,
    /is not set/i,
    /missing.*environment/i,
    /environment.*missing/i,
    /api key.*required/i,
    /api key.*not provided/i,
    /missing.*api key/i,
    /must be set/i,
    /not found.*environment/i,
    /please set/i,
    /please provide/i,
    /configure.*environment/i,
  ];

  return envErrorPatterns.some((pattern) => pattern.test(error));
}

/**
 * Check if an error is due to input validation (Zod validation, URL format, etc.)
 * These errors mean the tool is working correctly - it's validating input as expected
 */
function isInputValidationError(error: string | null): boolean {
  if (!error) return false;

  const validationErrorPatterns = [
    /must have a valid.*domain/i, // URL validation
    /valid.*path/i, // Path validation
    /invalid.*url/i, // URL format
    /invalid.*format/i, // General format validation
    /expected.*received/i, // Zod type errors
    /must be.*string/i, // Type validation
    /must be.*number/i,
    /must be.*boolean/i,
    /must be.*array/i,
    /must be.*object/i,
    /validation.*failed/i, // General validation
    /does not match/i, // Pattern/regex validation
    /too short/i, // Length validation
    /too long/i,
    /minimum.*length/i,
    /maximum.*length/i,
  ];

  return validationErrorPatterns.some((pattern) => pattern.test(error));
}

/**
 * Check if an error is a configuration or input issue (not a broken tool)
 */
function isNonBreakingError(error: string | null): boolean {
  return isEnvironmentConfigError(error) || isInputValidationError(error);
}

/**
 * Generate minimal test parameters for a tool
 * Uses required parameters with sensible defaults
 */
function generateTestParameters(tool: Tool & { package: Package }): Record<string, unknown> {
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as Array<{ name: string; type: string; required: boolean }>)
    : [];

  const testParams: Record<string, unknown> = {};

  for (const param of parameters) {
    if (param.required) {
      // Generate minimal test value based on type
      switch (param.type) {
        case 'string':
          testParams[param.name] = 'test';
          break;
        case 'number':
          testParams[param.name] = 1;
          break;
        case 'boolean':
          testParams[param.name] = true;
          break;
        case 'object':
          testParams[param.name] = {};
          break;
        case 'array':
          testParams[param.name] = [];
          break;
        default:
          testParams[param.name] = 'test';
      }
    }
  }

  return testParams;
}

/**
 * Perform full health check on a tool (import + execution)
 */
export async function performHealthCheck(
  toolId: string,
  triggerSource = 'manual'
): Promise<HealthCheckResult> {
  // Fetch tool with package relation
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: { package: true },
  });

  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  console.log(`🏥 Health check starting for ${tool.package.npmPackageName}/${tool.name}`);

  // Check import health
  const importResult = await checkImportHealth(tool);
  console.log(
    `  Import: ${importResult.status} ${importResult.error ? `(${importResult.error})` : ''}`
  );

  // Only check execution if import succeeded
  let executionResult: Awaited<ReturnType<typeof checkExecutionHealth>>;
  if (importResult.status === 'HEALTHY') {
    executionResult = await checkExecutionHealth(tool);
    console.log(
      `  Execution: ${executionResult.status} ${executionResult.error ? `(${executionResult.error})` : ''}`
    );
  } else {
    // Skip execution check if import failed
    executionResult = {
      status: 'UNKNOWN',
      error: 'Skipped due to import failure',
      timeMs: 0,
      testParams: {},
    };
    console.log('  Execution: UNKNOWN (skipped due to import failure)');
  }

  // Determine overall status
  const overallStatus: HealthStatus =
    importResult.status === 'BROKEN' || executionResult.status === 'BROKEN'
      ? 'BROKEN'
      : importResult.status === 'HEALTHY' && executionResult.status === 'HEALTHY'
        ? 'HEALTHY'
        : 'UNKNOWN';

  console.log(`  Overall: ${overallStatus}`);

  // Create HealthCheck record
  await prisma.healthCheck.create({
    data: {
      toolId: tool.id,
      checkType: 'FULL',
      triggerSource,
      importStatus: importResult.status,
      importError: importResult.error,
      importTimeMs: importResult.timeMs,
      executionStatus: executionResult.status,
      executionError: executionResult.error,
      executionTimeMs: executionResult.timeMs,
      testParameters: executionResult.testParams as Prisma.InputJsonValue,
      overallStatus,
    },
  });

  // Update Tool record with latest health status
  await prisma.tool.update({
    where: { id: tool.id },
    data: {
      importHealth: importResult.status,
      executionHealth: executionResult.status,
      lastHealthCheck: new Date(),
      healthCheckError: importResult.error || executionResult.error,
    },
  });

  return {
    toolId: tool.id,
    importStatus: importResult.status,
    importError: importResult.error,
    importTimeMs: importResult.timeMs,
    executionStatus: executionResult.status,
    executionError: executionResult.error,
    executionTimeMs: executionResult.timeMs,
    overallStatus,
  };
}

/**
 * Batch health check for multiple tools
 * Processes in batches to avoid overwhelming Railway
 */
export async function performBatchHealthCheck(
  toolIds: string[],
  triggerSource = 'daily-cron',
  batchSize = 5
): Promise<{
  total: number;
  healthy: number;
  broken: number;
  unknown: number;
  errors: number;
}> {
  let healthy = 0;
  let broken = 0;
  let unknown = 0;
  let errors = 0;

  console.log(
    `🏥 Batch health check starting for ${toolIds.length} tools (batch size: ${batchSize})`
  );

  // Process in batches
  for (let i = 0; i < toolIds.length; i += batchSize) {
    const batch = toolIds.slice(i, i + batchSize);
    console.log(
      `  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toolIds.length / batchSize)}`
    );

    await Promise.all(
      batch.map(async (toolId) => {
        try {
          const result = await performHealthCheck(toolId, triggerSource);
          if (result.overallStatus === 'HEALTHY') healthy++;
          else if (result.overallStatus === 'BROKEN') broken++;
          else unknown++;
        } catch (error) {
          errors++;
          console.error(`  ❌ Health check failed for tool ${toolId}:`, error);
        }
      })
    );

    // Brief delay between batches to avoid rate limiting
    if (i + batchSize < toolIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `✅ Batch health check complete: ${healthy} healthy, ${broken} broken, ${unknown} unknown, ${errors} errors`
  );

  return { total: toolIds.length, healthy, broken, unknown, errors };
}
