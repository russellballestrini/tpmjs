import type { ScenarioRun } from './page';

interface ExpandedRunDetailsProps {
  run: ScenarioRun;
}

export function ExpandedRunDetails({ run }: ExpandedRunDetailsProps) {
  return (
    <div className="px-4 pb-4 border-t border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Evaluator */}
        {run.evaluator?.verdict && (
          <div className="p-3 bg-surface-secondary rounded-lg">
            <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
              LLM Evaluation
            </h4>
            <div className="flex items-center gap-2 mb-2">
              {run.evaluator.model && <span className="text-xs">{run.evaluator.model}</span>}
            </div>
            {run.evaluator?.reason && (
              <p className="text-sm text-foreground-secondary">{run.evaluator.reason}</p>
            )}
          </div>
        )}

        {/* Usage Stats */}
        <div className="p-3 bg-surface-secondary rounded-lg">
          <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
            Usage
          </h4>
          {run.usage ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-foreground-tertiary">Duration:</span>{' '}
                <span className="text-foreground">
                  {run.usage?.executionTimeMs
                    ? `${Math.floor(run.usage.executionTimeMs / 1000)}s`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-foreground-tertiary">Tokens:</span>{' '}
                <span className="text-foreground">
                  {run.usage?.totalTokens?.toLocaleString() || '—'}
                </span>
              </div>
              <div>
                <span className="text-foreground-tertiary">Retries:</span>{' '}
                <span className="text-foreground">{run.retryCount || 0}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground-secondary">No usage data available</div>
          )}
        </div>
      </div>

      {/* Output (if owner) */}
      {run.output && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
            Output
          </h4>
          <pre className="p-3 bg-surface-secondary rounded-lg text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
            {run.output}
          </pre>
        </div>
      )}

      {/* Error Log (if owner and error) */}
      {run.errorLog && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-error uppercase tracking-wide mb-2">
            Error Log
          </h4>
          <pre className="p-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error overflow-x-auto whitespace-pre-wrap">
            {run.errorLog}
          </pre>
        </div>
      )}

      {/* Conversation History */}
      {run.conversation && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
              Conversation History
            </h4>
          </div>
          <div className="space-y-4">
            {run.conversation.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'USER' && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-4 bg-primary text-primary-foreground">
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                )}
                {msg.role === 'ASSISTANT' && (
                  <div className="space-y-2">
                    {msg.content && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-4 bg-surface-secondary">
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {msg.role === 'TOOL' && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg border border-border bg-surface-secondary overflow-hidden">
                      <div className="p-3">
                        <div className="text-sm font-medium text-foreground">
                          {msg.toolName || 'Unknown Tool'}
                        </div>
                        {msg.toolResult != null && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <pre className="text-xs text-success overflow-x-auto whitespace-pre-wrap break-all">
                              {typeof msg.toolResult === 'string'
                                ? msg.toolResult
                                : JSON.stringify(msg.toolResult, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
