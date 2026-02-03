/**
 * Registry Search Tool Renderer
 *
 * Specialized renderer for the registrySearchTool that displays
 * search results as a grid of tool cards.
 */

import { cn } from '@tpmjs/utils/cn';
import { useState } from 'react';
import { Badge } from '../../Badge/Badge';
import { Button } from '../../Button/Button';
import { Icon } from '../../Icon/Icon';
import type { ToolRendererProps } from '../types';

/**
 * Input for registrySearchTool
 */
interface SearchInput {
  query?: string;
  limit?: number;
}

/**
 * A tool result from the search
 */
interface SearchResultTool {
  toolId: string;
  package: string;
  name: string;
  description: string;
}

/**
 * Output from registrySearchTool
 */
interface SearchOutput {
  tools?: SearchResultTool[];
  total?: number;
  error?: string;
}

/**
 * RegistrySearchRenderer - Displays search results as tool cards
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex renderer with multiple UI states
export function RegistrySearchRenderer({
  input,
  output,
  state,
  isStreaming,
  error,
}: ToolRendererProps<SearchInput, SearchOutput>): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);

  const searchInput = input as SearchInput | undefined;
  const searchOutput = output as SearchOutput | undefined;
  const tools = searchOutput?.tools ?? [];
  const hasError = error || searchOutput?.error;

  // Determine status
  const status = hasError
    ? 'error'
    : state === 'result'
      ? 'success'
      : isStreaming
        ? 'running'
        : 'pending';

  const statusConfig = {
    pending: { icon: 'info' as const, colorClass: 'text-warning' },
    running: { icon: 'loader' as const, colorClass: 'text-info' },
    success: { icon: 'check' as const, colorClass: 'text-success' },
    error: { icon: 'alertCircle' as const, colorClass: 'text-error' },
  };

  const { icon, colorClass } = statusConfig[status];

  const handleCopyToolId = (toolId: string) => {
    navigator.clipboard.writeText(toolId);
  };

  return (
    <div className="rounded-lg border border-border bg-surface-secondary/50 overflow-hidden">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 h-auto justify-start rounded-none hover:bg-surface-secondary/80"
      >
        <Icon icon="search" size="sm" className="text-primary" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Registry Search</span>
            {searchInput?.query && (
              <Badge variant="secondary" size="sm">
                &ldquo;{searchInput.query}&rdquo;
              </Badge>
            )}
          </div>
          {state === 'result' && !hasError && (
            <span className="text-xs text-foreground-tertiary">
              Found {tools.length} tool{tools.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Icon
          icon={icon}
          size="xs"
          className={cn(colorClass, status === 'running' && 'animate-spin')}
        />
        <Icon
          icon="chevronRight"
          size="xs"
          className={cn('text-foreground-tertiary transition-transform', isExpanded && 'rotate-90')}
        />
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Loading state */}
          {status === 'running' && (
            <div className="p-4 flex items-center justify-center gap-2 text-foreground-tertiary">
              <Icon icon="loader" size="sm" className="animate-spin" />
              <span className="text-sm">Searching registry...</span>
            </div>
          )}

          {/* Error state */}
          {hasError && <div className="p-4 text-sm text-error">{error || searchOutput?.error}</div>}

          {/* Results grid */}
          {state === 'result' && !hasError && tools.length > 0 && (
            <div className="p-3 space-y-2">
              {tools.map((tool) => (
                <div
                  key={tool.toolId}
                  className="p-3 rounded-md border border-border/50 bg-background/50 hover:bg-background transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-primary font-mono">{tool.package}</span>
                        <span className="text-foreground-tertiary">::</span>
                        <span className="text-sm font-medium text-foreground">{tool.name}</span>
                      </div>
                      <p className="text-xs text-foreground-secondary line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToolId(tool.toolId);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy toolId"
                    >
                      <Icon icon="copy" size="xs" />
                    </Button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <code className="text-[10px] text-foreground-tertiary font-mono">
                      {tool.toolId}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty results */}
          {state === 'result' && !hasError && tools.length === 0 && (
            <div className="p-4 text-center text-sm text-foreground-tertiary">
              No tools found for this search
            </div>
          )}

          {/* Raw JSON toggle */}
          {state === 'result' && (
            <div className="border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full rounded-none text-xs text-foreground-tertiary"
              >
                {showRawJson ? 'Hide' : 'Show'} Raw JSON
              </Button>
              {showRawJson && (
                <pre className="p-3 text-[10px] font-mono text-foreground-tertiary bg-background/50 overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(output, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
