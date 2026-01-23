/**
 * ToolRenderer Component
 *
 * Main component for rendering tool calls in chat interfaces.
 * Uses the registry to find the appropriate renderer for each tool.
 */

import { DefaultJsonRenderer } from './DefaultJsonRenderer';
import { toolRendererRegistry } from './registry';
import type { ToolPart, ToolRendererProps, ToolState } from './types';

export interface ToolRendererComponentProps {
  /** The tool part from AI SDK message.parts */
  part: ToolPart;
  /** Whether this tool is currently streaming/executing */
  isStreaming?: boolean;
}

/**
 * Extract input from various tool part formats
 */
function extractInput(part: ToolPart): unknown {
  // AI SDK uses 'args' for tool-call and tool-invocation
  if ('args' in part) {
    return part.args;
  }
  return undefined;
}

/**
 * Extract output from various tool part formats
 */
function extractOutput(part: ToolPart): unknown {
  // AI SDK uses 'result' for tool-result
  if ('result' in part) {
    return part.result;
  }
  return undefined;
}

/**
 * Determine the tool state from the part type
 */
function determineState(part: ToolPart): ToolState {
  // If state is explicitly set, use it
  if (part.state) {
    return part.state;
  }
  // Otherwise infer from type
  if (part.type === 'tool-result') {
    return 'result';
  }
  if (part.type === 'tool-call') {
    return 'call';
  }
  return 'partial-call';
}

/**
 * Check if output indicates an error
 */
function extractError(output: unknown): string | undefined {
  if (output && typeof output === 'object' && 'error' in output) {
    const err = (output as { error: unknown }).error;
    return typeof err === 'string' ? err : JSON.stringify(err);
  }
  return undefined;
}

/**
 * ToolRenderer - Renders a tool call using the appropriate registered renderer
 *
 * @example
 * ```tsx
 * import { ToolRenderer } from '@tpmjs/ui/ToolRenderer/ToolRenderer';
 *
 * // In a chat message component
 * {message.parts?.map((part, idx) => {
 *   if (part.type.startsWith('tool-')) {
 *     return (
 *       <ToolRenderer
 *         key={part.toolCallId || idx}
 *         part={part}
 *         isStreaming={isStreaming && part.state !== 'result'}
 *       />
 *     );
 *   }
 *   return null;
 * })}
 * ```
 */
export function ToolRenderer({
  part,
  isStreaming = false,
}: ToolRendererComponentProps): React.ReactElement {
  const toolName = part.toolName;
  const input = extractInput(part);
  const output = extractOutput(part);
  const state = determineState(part);
  const error = extractError(output);

  // Find a registered renderer or use default
  const RegisteredRenderer = toolRendererRegistry.getRenderer(toolName);
  const Renderer = RegisteredRenderer ?? DefaultJsonRenderer;

  const props: ToolRendererProps = {
    part,
    toolName,
    input,
    output,
    state,
    isStreaming,
    error,
  };

  return <Renderer {...props} />;
}
