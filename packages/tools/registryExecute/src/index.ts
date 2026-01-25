import { jsonSchema, tool } from 'ai';

const TPMJS_API_URL = process.env.TPMJS_API_URL || 'https://tpmjs.com';
const TPMJS_EXECUTOR_URL = process.env.TPMJS_EXECUTOR_URL || 'https://executor.tpmjs.com';

/**
 * Input type for Registry Execute Tool
 */
type RegistryExecuteInput = {
  toolId: string;
  params: Record<string, unknown>;
  env?: Record<string, string>;
};

/**
 * AI SDK tool for executing tools from the TPMJS registry
 *
 * Use registrySearchTool first to find the toolId, then execute with this tool.
 * Tools run in a secure sandbox - no local installation required.
 *
 * Supports self-hosted registries via environment variables:
 * - TPMJS_API_URL: Registry API (default: https://tpmjs.com)
 * - TPMJS_EXECUTOR_URL: Sandbox executor (default: https://executor.tpmjs.com)
 */
export const registryExecuteTool = tool({
  description:
    'Execute a tool from the TPMJS registry. Use registrySearchTool first to find the toolId. Tools run in a secure sandbox.',
  inputSchema: jsonSchema<RegistryExecuteInput>({
    type: 'object',
    properties: {
      toolId: {
        type: 'string',
        description: "Tool identifier from registrySearchTool (format: 'package::name')",
      },
      params: {
        type: 'object',
        description: 'Parameters to pass to the tool',
        additionalProperties: true,
      },
      env: {
        type: 'object',
        description: 'Environment variables (API keys) if required by the tool',
        additionalProperties: {
          type: 'string',
        },
      },
    },
    required: ['toolId', 'params'],
    additionalProperties: false,
  }),
  async execute({ toolId, params, env }) {
    try {
      // Parse toolId format: "package::name"
      const separatorIndex = toolId.lastIndexOf('::');
      if (separatorIndex === -1) {
        return {
          error: true,
          message: `Invalid toolId format. Expected "package::name", got "${toolId}"`,
          toolId,
        };
      }

      const packageName = toolId.substring(0, separatorIndex);
      const name = toolId.substring(separatorIndex + 2);

      if (!packageName || !name) {
        return {
          error: true,
          message: `Invalid toolId format. Expected "package::name", got "${toolId}"`,
          toolId,
        };
      }

      // Fetch tool metadata to get version and importUrl
      const metaParams = new URLSearchParams({
        q: name,
        limit: '10',
      });
      const metaResponse = await fetch(`${TPMJS_API_URL}/api/tools/search?${metaParams}`);

      if (!metaResponse.ok) {
        return {
          error: true,
          message: `Failed to fetch tool metadata: ${metaResponse.statusText}`,
          toolId,
        };
      }

      // biome-ignore lint/suspicious/noExplicitAny: API response types vary
      const metaData = (await metaResponse.json()) as any;
      const toolsArray = metaData.results?.tools || [];

      // Find the exact tool match
      // biome-ignore lint/suspicious/noExplicitAny: API response types vary
      const toolMeta = toolsArray.find(
        (t: any) => t.package.npmPackageName === packageName && t.name === name
      );

      if (!toolMeta) {
        return {
          error: true,
          message: `Tool not found: ${toolId}. Try using registrySearchTool to find available tools.`,
          toolId,
        };
      }

      const version = toolMeta.package.npmVersion;
      const importUrl = `https://esm.sh/${packageName}@${version}`;

      // Execute via sandbox executor
      const response = await fetch(`${TPMJS_EXECUTOR_URL}/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName,
          name,
          version,
          importUrl,
          params,
          env: env || {},
        }),
      });

      // biome-ignore lint/suspicious/noExplicitAny: API response types vary
      const result = (await response.json()) as any;

      if (!result.success) {
        return {
          error: true,
          message: result.error || 'Tool execution failed',
          toolId,
          executionTimeMs: result.executionTimeMs,
        };
      }

      return {
        toolId,
        executionTimeMs: result.executionTimeMs,
        output: result.output,
      };
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown execution error',
        toolId,
      };
    }
  },
});
