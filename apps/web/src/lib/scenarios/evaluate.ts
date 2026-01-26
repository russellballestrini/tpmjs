/**
 * Scenario Evaluation Service
 *
 * Uses LLM judgment to evaluate if a scenario execution was successful.
 * Supports both regex pattern matching and JSON Schema validation for assertions.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { z } from 'zod';

// Initialize Ajv with common formats (email, uri, date-time, etc.)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const EvaluationSchema = z.object({
  verdict: z.enum(['pass', 'fail']).describe('Whether the scenario was completed successfully'),
  reason: z.string().describe('Brief explanation of why the scenario passed or failed'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the evaluation (0-1)'),
});

export type EvaluationResult = z.infer<typeof EvaluationSchema>;

/**
 * Supported evaluator model IDs
 */
export type EvaluatorModelId =
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-haiku-latest'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4.1-mini';

/**
 * Get the model instance for an evaluator model ID
 */
function getEvaluatorModel(modelId: EvaluatorModelId) {
  switch (modelId) {
    case 'claude-3-5-sonnet-latest':
      return anthropic('claude-3-5-sonnet-latest');
    case 'claude-3-5-haiku-latest':
      return anthropic('claude-3-5-haiku-latest');
    case 'gpt-4o':
      return openai('gpt-4o');
    case 'gpt-4o-mini':
      return openai('gpt-4o-mini');
    case 'gpt-4.1-mini':
      return openai('gpt-4.1-mini');
    default:
      return openai('gpt-4.1-mini');
  }
}

const DEFAULT_EVALUATOR: EvaluatorModelId = 'gpt-4.1-mini';

/**
 * Evaluate if a scenario execution was successful
 *
 * @param scenarioPrompt The original scenario prompt/task
 * @param agentOutput The output produced by the agent
 * @param conversation Optional conversation history for context
 * @param modelId Which model to use for evaluation
 */
export async function evaluateScenarioRun(
  scenarioPrompt: string,
  agentOutput: string,
  conversation?: unknown[],
  modelId: EvaluatorModelId = DEFAULT_EVALUATOR
): Promise<EvaluationResult> {
  const model = getEvaluatorModel(modelId);

  const conversationContext = conversation
    ? `\n\nConversation history:\n${JSON.stringify(conversation, null, 2)}`
    : '';

  const { object } = await generateObject({
    model,
    schema: EvaluationSchema,
    prompt: `You are evaluating whether an AI agent successfully completed a task.

## Task
${scenarioPrompt}

## Agent Output
${agentOutput}
${conversationContext}

## Instructions
Evaluate if the agent successfully completed the task described above.
- A "pass" means the core objective was achieved, even if some minor aspects weren't perfect
- A "fail" means the agent failed to accomplish the main goal
- Consider partial success as a pass if the primary task was completed
- Be fair but rigorous in your evaluation

Provide your verdict, a brief reason, and your confidence level.`,
  });

  return object;
}

/**
 * Extract JSON from text output
 *
 * Attempts to find and parse JSON from various formats:
 * - Direct JSON
 * - JSON wrapped in markdown code blocks
 * - JSON embedded in text
 *
 * @param output The text to extract JSON from
 * @returns Parsed JSON or null if not found
 */
export function extractJsonFromOutput(output: string): unknown | null {
  // Try direct parse first
  try {
    return JSON.parse(output.trim());
  } catch {
    // Continue to other strategies
  }

  // Try extracting from markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue to other strategies
    }
  }

  // Try finding JSON object or array in the text
  const jsonMatch = output.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch?.[1]) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Could not parse as JSON
    }
  }

  return null;
}

/**
 * Validate data against a JSON Schema
 *
 * @param data The data to validate
 * @param schema The JSON Schema to validate against
 * @returns Validation result with errors if any
 */
export function validateJsonSchema(
  data: unknown,
  schema: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // Format errors into readable strings
    const errors = (validate.errors || []).map((err) => {
      const path = err.instancePath || 'root';
      const message = err.message || 'Unknown error';
      return `${path}: ${message}`;
    });

    return { valid: false, errors };
  } catch (err) {
    return {
      valid: false,
      errors: [`Schema compilation error: ${err instanceof Error ? err.message : 'Unknown error'}`],
    };
  }
}

/**
 * Run assertions against the output
 *
 * Supports two types of assertions:
 * - regex: Array of regex patterns that must match the output
 * - schema: JSON Schema that the output (parsed as JSON) must validate against
 *
 * @param output The agent output to check
 * @param assertions The assertions to run
 */
export function runAssertions(
  output: string,
  assertions: { regex?: string[]; schema?: Record<string, unknown> }
): { passed: string[]; failed: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];

  // Check regex assertions
  if (assertions.regex) {
    for (const pattern of assertions.regex) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(output)) {
          passed.push(`regex:${pattern}`);
        } else {
          failed.push(`regex:${pattern}`);
        }
      } catch {
        failed.push(`regex:${pattern} (invalid pattern)`);
      }
    }
  }

  // Validate against JSON Schema if provided
  if (assertions.schema && Object.keys(assertions.schema).length > 0) {
    const extractedJson = extractJsonFromOutput(output);

    if (extractedJson === null) {
      failed.push('schema: Output does not contain valid JSON');
    } else {
      const validation = validateJsonSchema(extractedJson, assertions.schema);

      if (validation.valid) {
        passed.push('schema: JSON validates against schema');
      } else {
        // Include first 3 errors for clarity
        const errorSummary = validation.errors.slice(0, 3).join('; ');
        const moreErrors =
          validation.errors.length > 3 ? ` (+${validation.errors.length - 3} more)` : '';
        failed.push(`schema: ${errorSummary}${moreErrors}`);
      }
    }
  }

  return { passed, failed };
}

/**
 * Combine LLM evaluation and assertions into final verdict
 */
export function determineFinalVerdict(
  evaluation: EvaluationResult,
  assertions?: { passed: string[]; failed: string[] } | null
): 'pass' | 'fail' {
  // If LLM says fail, it fails
  if (evaluation.verdict === 'fail') {
    return 'fail';
  }

  // If there are failed assertions, it fails
  if (assertions && assertions.failed.length > 0) {
    return 'fail';
  }

  return 'pass';
}
