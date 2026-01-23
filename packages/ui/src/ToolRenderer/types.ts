/**
 * Tool Renderer Types
 *
 * Interfaces for the abstract tool rendering system.
 * Used to render tool calls in AI chat interfaces.
 */

/**
 * Tool state during streaming
 */
export type ToolState = 'partial-call' | 'call' | 'result';

/**
 * A part representing a tool call or result from AI SDK
 */
export interface ToolPart {
  type: 'tool-invocation' | 'tool-call' | 'tool-result';
  toolCallId: string;
  toolName: string;
  args?: unknown;
  result?: unknown;
  state?: ToolState;
}

/**
 * Props passed to every tool renderer
 */
export interface ToolRendererProps<TInput = unknown, TOutput = unknown> {
  /** The full tool part from AI SDK */
  part: ToolPart;
  /** Name of the tool being rendered */
  toolName: string;
  /** Input parameters for the tool */
  input: TInput;
  /** Output from the tool (undefined while running) */
  output: TOutput | undefined;
  /** Current state of the tool call */
  state: ToolState;
  /** Whether the tool is currently streaming/executing */
  isStreaming: boolean;
  /** Error message if the tool failed */
  error?: string;
}

/**
 * Configuration for registering a tool renderer
 */
export interface ToolRendererConfig<TInput = unknown, TOutput = unknown> {
  /** Function to determine if this renderer handles a given tool */
  match: (toolName: string) => boolean;
  /** Priority for matching (higher = more specific, checked first) */
  priority?: number;
  /** The React component to render the tool */
  component: React.ComponentType<ToolRendererProps<TInput, TOutput>>;
}
