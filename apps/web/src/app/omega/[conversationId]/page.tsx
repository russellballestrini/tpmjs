'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { Streamdown } from 'streamdown';
import { AppHeader } from '~/components/AppHeader';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: unknown;
  }>;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: string;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
  isError?: boolean;
}

interface Conversation {
  id: string;
  title: string | null;
  executionState: string;
  inputTokensTotal: number;
  outputTokensTotal: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tool call debug card component
 */
function ToolCallCard({
  toolCall,
  isExpanded,
  onToggle,
}: {
  toolCall: ToolCall;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusColors = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    running: 'bg-info/10 text-info border-info/30',
    success: 'bg-success/10 text-success border-success/30',
    error: 'bg-error/10 text-error border-error/30',
  };

  const statusIcons: Record<ToolCall['status'], 'loader' | 'check' | 'alertCircle' | 'info'> = {
    pending: 'info',
    running: 'loader',
    success: 'check',
    error: 'alertCircle',
  };

  const formatJson = (data: unknown): React.ReactNode => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-secondary/50 overflow-hidden font-mono text-xs">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 h-auto justify-start rounded-none hover:bg-surface-secondary/80"
      >
        <div className={`p-1.5 rounded ${statusColors[toolCall.status]}`}>
          <Icon
            icon={statusIcons[toolCall.status]}
            size="xs"
            className={toolCall.status === 'running' ? 'animate-spin' : ''}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">{toolCall.toolName}</span>
            <span className="text-foreground-tertiary text-[10px]">
              {toolCall.toolCallId.slice(0, 8)}...
            </span>
          </div>
        </div>
        <Icon
          icon="chevronRight"
          size="xs"
          className={`text-foreground-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Input Section */}
          {toolCall.input !== undefined && toolCall.input !== null ? (
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Input
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre className="text-[11px] text-foreground-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {formatJson(toolCall.input)}
              </pre>
            </div>
          ) : null}

          {/* Output Section */}
          {toolCall.output !== undefined && toolCall.output !== null ? (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Output
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre
                className={`text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto ${toolCall.isError ? 'text-error' : 'text-success'}`}
              >
                {formatJson(toolCall.output)}
              </pre>
            </div>
          ) : null}

          {/* Status indicator for running */}
          {toolCall.status === 'running' && !toolCall.output && (
            <div className="p-3 flex items-center gap-2 text-foreground-tertiary">
              <Icon icon="loader" size="xs" className="animate-spin" />
              <span>Executing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Omega Chat Page
 */
export default function OmegaChatPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'chat' | 'debug'>('chat');

  // Track first item index for prepending (Virtuoso pattern)
  const [firstItemIndex, setFirstItemIndex] = useState(10000);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleToolCall = (toolCallId: string) => {
    setExpandedToolCalls((prev) => {
      const next = new Set(prev);
      if (next.has(toolCallId)) {
        next.delete(toolCallId);
      } else {
        next.add(toolCallId);
      }
      return next;
    });
  };

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    try {
      const response = await fetch(`/api/omega/conversations/${conversationId}`);

      if (response.status === 404) {
        setError('Conversation not found');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch conversation');
      }

      const data = await response.json();
      // API returns conversation data directly with messages nested
      const { messages: messageList, ...conversationData } = data.data;
      setConversation(conversationData);
      setMessages(messageList || []);
      setFirstItemIndex(10000);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Check for initial prompt from landing page
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount and when messages load
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem(`omega_prompt_${conversationId}`);
    if (initialPrompt && messages.length === 0 && !isSending) {
      sessionStorage.removeItem(`omega_prompt_${conversationId}`);
      setInput(initialPrompt);
      // Auto-send after a brief delay
      const timer = setTimeout(() => {
        handleSendWithContent(initialPrompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [conversationId, messages.length]);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Chat send handler with streaming and tool calls
  const handleSendWithContent = async (messageContent: string) => {
    if (!messageContent.trim() || isSending) return;

    setInput('');
    setIsSending(true);
    setStreamingContent('');
    setError(null);
    setToolCalls([]);

    // Optimistically add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(`/api/omega/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            switch (eventType) {
              case 'message.delta':
                setStreamingContent((prev) => prev + data.content);
                break;
              case 'run.step.tool.started':
                // Add tool call to tracking
                setToolCalls((prev) => [
                  ...prev,
                  {
                    toolCallId: data.toolCallId,
                    toolName: data.toolName,
                    input: data.input,
                    status: 'running',
                  },
                ]);
                // Auto-expand new tool calls
                setExpandedToolCalls((prev) => new Set([...prev, data.toolCallId]));
                break;
              case 'run.step.tool.completed':
                // Update tool call with result
                setToolCalls((prev) =>
                  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Tool call update logic
                  prev.map((tc) =>
                    tc.toolCallId === data.toolCallId
                      ? {
                          ...tc,
                          output: data.output,
                          status: data.isError ? ('error' as const) : ('success' as const),
                          isError: data.isError,
                        }
                      : tc
                  )
                );
                break;
              case 'run.completed':
                // Refresh messages
                await fetchConversation();
                setStreamingContent('');
                setToolCalls([]);
                break;
              case 'run.failed':
                throw new Error(data.error);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
      setStreamingContent('');
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    await handleSendWithContent(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = async () => {
    try {
      const response = await fetch('/api/omega/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create conversation');
      }

      const data = await response.json();
      router.push(`/omega/${data.data.id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Unable to Load Chat</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Link href="/omega">
              <Button>Start New Conversation</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-border bg-surface/50 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/omega"
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Icon icon="arrowLeft" size="sm" className="text-foreground-secondary" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {conversation?.title || 'New Conversation'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
                  <Badge variant="secondary" size="sm">
                    Omega
                  </Badge>
                  <span>GPT-4.1 Mini</span>
                  {conversation && (
                    <span className="text-xs">
                      {conversation.inputTokensTotal + conversation.outputTokensTotal} tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={startNewConversation}>
                <Icon icon="plus" size="xs" className="mr-2" />
                New Chat
              </Button>
            </div>
          </div>
          {/* View Mode Tabs */}
          <div className="flex gap-1 mt-3 max-w-4xl mx-auto">
            <Button
              variant={viewMode === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('chat')}
            >
              Chat
            </Button>
            <Button
              variant={viewMode === 'debug' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('debug')}
            >
              Debug JSON
            </Button>
          </div>
        </div>

        {/* Debug JSON View */}
        {viewMode === 'debug' && (
          <div className="flex-1 overflow-auto p-4 bg-background">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-medium text-foreground mb-2">
                    Raw Messages Array ({messages.length} messages)
                  </h2>
                  <p className="text-xs text-foreground-tertiary">
                    Messages are ordered by createdAt. Each message includes role, content, and tool
                    call data.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(messages, null, 2));
                  }}
                >
                  <Icon icon="copy" size="xs" className="mr-2" />
                  Copy JSON
                </Button>
              </div>
              <pre className="text-xs font-mono bg-surface-secondary border border-border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(messages, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Chat View */}
        {viewMode === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 && !streamingContent ? (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon icon="star" size="lg" className="text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Start a conversation with Omega
                    </h3>
                    <p className="text-foreground-secondary max-w-sm">
                      Describe what you need, and Omega will find and use the right tools from the
                      TPMJS registry.
                    </p>
                  </div>
                </div>
              ) : (
                <Virtuoso
                  ref={virtuosoRef}
                  className="h-full"
                  data={messages}
                  firstItemIndex={firstItemIndex}
                  initialTopMostItemIndex={messages.length - 1}
                  followOutput="smooth"
                  components={{
                    Footer: () => (
                      <div className="px-4 pb-4 space-y-4 max-w-4xl mx-auto">
                        {/* Live tool calls during streaming */}
                        {toolCalls.length > 0 && (
                          <div className="space-y-2">
                            {toolCalls.map((tc) => (
                              <div key={tc.toolCallId} className="flex justify-start">
                                <div className="max-w-[80%]">
                                  <ToolCallCard
                                    toolCall={tc}
                                    isExpanded={expandedToolCalls.has(tc.toolCallId)}
                                    onToggle={() => toggleToolCall(tc.toolCallId)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {streamingContent && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-4 bg-surface-secondary">
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                <Streamdown>{streamingContent}</Streamdown>
                              </div>
                              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                            </div>
                          </div>
                        )}

                        {isSending && !streamingContent && toolCalls.length === 0 && (
                          <div className="flex justify-start">
                            <div className="rounded-lg p-4 bg-surface-secondary">
                              <div className="flex items-center gap-2 text-foreground-secondary">
                                <Icon icon="loader" size="sm" className="animate-spin" />
                                <span className="text-sm">Omega is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  }}
                  itemContent={(_index, message) => (
                    <div className="px-4 py-2 max-w-4xl mx-auto">
                      {/* USER message */}
                      {message.role === 'USER' && (
                        <div className="flex justify-end">
                          <div className="max-w-[80%] rounded-lg p-4 bg-primary text-primary-foreground">
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          </div>
                        </div>
                      )}

                      {/* ASSISTANT message */}
                      {message.role === 'ASSISTANT' && message.content && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg p-4 bg-surface-secondary">
                            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                              <Streamdown>{message.content}</Streamdown>
                            </div>
                            {/* Token usage for debugging */}
                            {(message.inputTokens || message.outputTokens) && (
                              <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-foreground-tertiary font-mono">
                                {message.inputTokens && <span>In: {message.inputTokens}</span>}
                                {message.inputTokens && message.outputTokens && <span> | </span>}
                                {message.outputTokens && <span>Out: {message.outputTokens}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TOOL message - show as collapsed tool result */}
                      {message.role === 'TOOL' && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%]">
                            <div className="text-xs text-foreground-tertiary mb-1">
                              Tool Results
                            </div>
                            <pre className="text-xs font-mono bg-surface-secondary border border-border rounded p-2 overflow-x-auto max-h-32 overflow-y-auto">
                              {message.content}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-2 bg-error/10 border-t border-error/20">
                <p className="text-sm text-error max-w-4xl mx-auto">{error}</p>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Omega anything..."
                  rows={1}
                  resize="none"
                  className="flex-1 min-h-[48px] max-h-[200px]"
                  style={{
                    height: 'auto',
                    minHeight: '48px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                  }}
                />
                <Button onClick={handleSend} disabled={isSending || !input.trim()}>
                  <Icon icon="send" size="sm" />
                </Button>
              </div>
              <p className="text-xs text-foreground-tertiary mt-2 max-w-4xl mx-auto">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
