/**
 * Registry Execute Tool Renderer
 *
 * Specialized renderer for the registryExecuteTool that displays
 * the tool being executed with its input and output.
 */

import { cn } from '@tpmjs/utils/cn';
import { useState } from 'react';
import { Badge } from '../../Badge/Badge';
import { Button } from '../../Button/Button';
import { Icon } from '../../Icon/Icon';
import type { ToolRendererProps } from '../types';

/**
 * Input for registryExecuteTool
 */
interface ExecuteInput {
  toolId?: string;
  params?: Record<string, unknown>;
}

/**
 * Output from registryExecuteTool
 */
interface ExecuteOutput {
  result?: unknown;
  error?: string;
  executionTimeMs?: number;
}

/**
 * Parse toolId into package and tool name
 */
function parseToolId(toolId: string): { packageName: string; toolName: string } {
  const parts = toolId.split('::');
  if (parts.length >= 2) {
    return {
      packageName: parts[0] || 'unknown',
      toolName: parts.slice(1).join('::') || 'unknown',
    };
  }
  return {
    packageName: toolId,
    toolName: 'unknown',
  };
}

/**
 * Format data as JSON string for display
 */
function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * RegistryExecuteRenderer - Displays tool execution with input/output
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex renderer with multiple UI states
export function RegistryExecuteRenderer({
  input,
  output,
  state,
  isStreaming,
  error,
}: ToolRendererProps<ExecuteInput, ExecuteOutput>): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInput, setShowInput] = useState(false);

  const execInput = input as ExecuteInput | undefined;
  const execOutput = output as ExecuteOutput | undefined;
  const hasError = error || execOutput?.error;

  const { packageName, toolName } = parseToolId(execInput?.toolId ?? '');

  // Determine status
  const status = hasError
    ? 'error'
    : state === 'result'
      ? 'success'
      : isStreaming
        ? 'running'
        : 'pending';

  const statusConfig = {
    pending: {
      icon: 'info' as const,
      colorClass: 'bg-warning/10 text-warning border-warning/30',
      label: 'Pending',
    },
    running: {
      icon: 'loader' as const,
      colorClass: 'bg-info/10 text-info border-info/30',
      label: 'Executing',
    },
    success: {
      icon: 'check' as const,
      colorClass: 'bg-success/10 text-success border-success/30',
      label: 'Success',
    },
    error: {
      icon: 'alertCircle' as const,
      colorClass: 'bg-error/10 text-error border-error/30',
      label: 'Error',
    },
  };

  const { icon, colorClass, label } = statusConfig[status];

  return (
    <div className="rounded-lg border border-border bg-surface-secondary/50 overflow-hidden">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 h-auto justify-start rounded-none hover:bg-surface-secondary/80"
      >
        <div className={cn('p-1.5 rounded border', colorClass)}>
          <Icon icon={icon} size="xs" className={status === 'running' ? 'animate-spin' : ''} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" size="sm" className="font-mono">
              {packageName}
            </Badge>
            <span className="text-sm font-medium text-foreground">{toolName}</span>
            <span className="text-xs text-foreground-tertiary">{label}</span>
          </div>
          {execOutput?.executionTimeMs && (
            <span className="text-[10px] text-foreground-tertiary">
              {execOutput.executionTimeMs}ms
            </span>
          )}
        </div>
        <Icon
          icon="chevronRight"
          size="xs"
          className={cn('text-foreground-tertiary transition-transform', isExpanded && 'rotate-90')}
        />
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Input toggle */}
          {execInput?.params && Object.keys(execInput.params).length > 0 && (
            <div className="border-b border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInput(!showInput)}
                className="w-full rounded-none text-xs text-foreground-tertiary flex items-center gap-2 justify-start"
              >
                <Icon
                  icon="chevronRight"
                  size="xs"
                  className={cn('transition-transform', showInput && 'rotate-90')}
                />
                <span>Input Parameters ({Object.keys(execInput.params).length})</span>
              </Button>
              {showInput && (
                <pre className="p-3 text-[11px] font-mono text-foreground-secondary bg-background/50 overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto border-t border-border/30">
                  {formatJson(execInput.params)}
                </pre>
              )}
            </div>
          )}

          {/* Loading state */}
          {status === 'running' && (
            <div className="p-4 flex items-center gap-2 text-foreground-tertiary">
              <Icon icon="loader" size="sm" className="animate-spin" />
              <span className="text-sm">Executing {toolName}...</span>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="alertCircle" size="xs" className="text-error" />
                <span className="text-[10px] uppercase tracking-wider text-error">Error</span>
              </div>
              <pre className="text-[11px] font-mono text-error overflow-x-auto whitespace-pre-wrap break-all">
                {error || execOutput?.error}
              </pre>
            </div>
          )}

          {/* Success output */}
          {state === 'result' && !hasError && execOutput?.result !== undefined && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Output
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre className="text-[11px] font-mono text-success overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                {formatJson(execOutput.result)}
              </pre>
            </div>
          )}

          {/* No output state */}
          {state === 'result' && !hasError && execOutput?.result === undefined && (
            <div className="p-3 text-sm text-foreground-tertiary text-center">
              No output returned
            </div>
          )}
        </div>
      )}
    </div>
  );
}
