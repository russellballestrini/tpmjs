'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { registerBuiltInRenderers } from '@tpmjs/ui/ToolRenderer/registerBuiltInRenderers';
import { ToolRenderer } from '@tpmjs/ui/ToolRenderer/ToolRenderer';
import type { ToolPart, ToolState } from '@tpmjs/ui/ToolRenderer/types';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { AppHeader } from '~/components/AppHeader';
import { EnvVarWarningBanner } from '~/components/omega/EnvVarWarningBanner';

// Initialize built-in tool renderers (idempotent)
registerBuiltInRenderers();

interface ToolDiscoveryInfo {
  staticTools?: string[];
  dynamicToolsLoaded?: string[];
  autoDiscoveredTools?: Array<{
    toolId: string;
    name: string;
    packageName: string;
    description: string;
  }>;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args?: unknown;
    output?: unknown;
  }>;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: string;
  // Tool discovery info (populated from SSE events, per message)
  toolDiscovery?: ToolDiscoveryInfo;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
  isError?: boolean;
}

interface EnvVarWarning {
  toolId: string;
  toolName: string;
  packageName: string;
  envVar: {
    name: string;
    description: string;
    required: boolean;
  };
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
 * Convert ToolCall status to ToolState
 */
function statusToToolState(status: ToolCall['status']): ToolState {
  switch (status) {
    case 'pending':
      return 'partial-call';
    case 'running':
      return 'call';
    case 'success':
    case 'error':
      return 'result';
  }
}

/**
 * Convert ToolCall to ToolPart for rendering
 */
function toolCallToToolPart(tc: ToolCall): ToolPart {
  return {
    type: tc.status === 'success' || tc.status === 'error' ? 'tool-result' : 'tool-call',
    toolCallId: tc.toolCallId,
    toolName: tc.toolName,
    args: tc.input,
    result: tc.isError ? { error: tc.output } : tc.output,
    state: statusToToolState(tc.status),
  };
}

/**
 * Omega Chat Page
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex chat page with multiple UI states and SSE handling
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
  const [viewMode, setViewMode] = useState<'chat' | 'debug'>('chat');
  // Map of message IDs to their tool discovery info (persisted in frontend state)
  const [messageToolDiscovery, setMessageToolDiscovery] = useState<Map<string, ToolDiscoveryInfo>>(
    new Map()
  );
  // Environment variable warnings for tools that need API keys
  const [envWarnings, setEnvWarnings] = useState<EnvVarWarning[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-scroll to bottom when messages change or streaming
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally trigger scroll when messages/streamingContent change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

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
              case 'env.warning':
                // Set environment variable warnings
                if (data.missingEnvVars && Array.isArray(data.missingEnvVars)) {
                  setEnvWarnings(data.missingEnvVars);
                }
                break;
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
              case 'run.completed': {
                // Capture tool info for this message
                const toolDiscovery: ToolDiscoveryInfo = {
                  staticTools: data.staticTools,
                  dynamicToolsLoaded: data.dynamicToolsLoaded,
                  autoDiscoveredTools: data.autoDiscoveredTools,
                };

                // Refresh messages then attach tool discovery to the new assistant message
                const refreshResponse = await fetch(`/api/omega/conversations/${conversationId}`);
                if (refreshResponse.ok) {
                  const respData = await refreshResponse.json();
                  const { messages: messageList, ...conversationData } = respData.data;
                  setConversation(conversationData);
                  setMessages(messageList || []);

                  // Find the newest assistant message and associate tool discovery with it
                  const assistantMessages = (messageList || []).filter(
                    (m: Message) => m.role === 'ASSISTANT'
                  );
                  if (assistantMessages.length > 0) {
                    const newestAssistant = assistantMessages[assistantMessages.length - 1];
                    setMessageToolDiscovery((prev) => {
                      const next = new Map(prev);
                      next.set(newestAssistant.id, toolDiscovery);
                      return next;
                    });
                  }
                }
                setStreamingContent('');
                setToolCalls([]);
                break;
              }
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
              <Link href="/omega/settings">
                <Button variant="ghost" size="sm">
                  <Icon icon="key" size="xs" className="mr-2" />
                  Settings
                </Button>
              </Link>
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
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header with Copy Button */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-medium text-foreground mb-2">
                    Messages with Tool Discovery ({messages.length} messages)
                  </h2>
                  <p className="text-xs text-foreground-tertiary">
                    Each message shows the tools discovered and loaded during that response.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Merge tool discovery info into messages for export
                    const messagesWithTools = messages.map((m) => ({
                      ...m,
                      toolDiscovery: messageToolDiscovery.get(m.id) || null,
                    }));
                    navigator.clipboard.writeText(JSON.stringify(messagesWithTools, null, 2));
                  }}
                >
                  <Icon icon="copy" size="xs" className="mr-2" />
                  Copy All JSON
                </Button>
              </div>

              {/* Per-Message View */}
              {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Debug view with multiple conditional sections */}
              {messages.map((message, index) => {
                const discovery = messageToolDiscovery.get(message.id);
                return (
                  <div
                    key={message.id}
                    className="bg-surface-secondary border border-border rounded-lg overflow-hidden"
                  >
                    {/* Message Header */}
                    <div className="px-4 py-3 border-b border-border/50 bg-surface/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-tertiary">#{index + 1}</span>
                          <Badge
                            variant={
                              message.role === 'USER'
                                ? 'secondary'
                                : message.role === 'ASSISTANT'
                                  ? 'default'
                                  : 'outline'
                            }
                            size="sm"
                          >
                            {message.role}
                          </Badge>
                          <span className="text-xs text-foreground-tertiary font-mono">
                            {message.id.slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-xs text-foreground-tertiary">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="p-4 space-y-4">
                      {/* Content */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-foreground-tertiary mb-2">
                          Content
                        </div>
                        <pre className="text-xs font-mono bg-background/50 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {message.content || '(empty)'}
                        </pre>
                      </div>

                      {/* Tool Discovery (only for assistant messages) */}
                      {message.role === 'ASSISTANT' && discovery && (
                        <div className="space-y-3 pt-3 border-t border-border/50">
                          <div className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                            Tool Discovery for this Response
                          </div>

                          {/* Static Tools */}
                          {discovery.staticTools && discovery.staticTools.length > 0 && (
                            <div>
                              <div className="text-xs text-foreground-secondary mb-1">
                                Static Tools ({discovery.staticTools.length})
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {discovery.staticTools.map((name) => (
                                  <span
                                    key={name}
                                    className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-mono rounded"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Auto-Discovered Tools */}
                          {discovery.autoDiscoveredTools &&
                            discovery.autoDiscoveredTools.length > 0 && (
                              <div>
                                <div className="text-xs text-foreground-secondary mb-1">
                                  Auto-Discovered via BM25 ({discovery.autoDiscoveredTools.length})
                                </div>
                                <div className="space-y-1">
                                  {discovery.autoDiscoveredTools.map((tool) => (
                                    <div
                                      key={tool.toolId}
                                      className="text-[10px] font-mono bg-background/50 rounded px-2 py-1"
                                    >
                                      <span className="text-primary">{tool.packageName}</span>
                                      <span className="text-foreground-tertiary">::</span>
                                      <span className="text-foreground">{tool.name}</span>
                                      <span className="text-foreground-tertiary ml-2">
                                        - {tool.description?.slice(0, 60)}
                                        {(tool.description?.length || 0) > 60 ? '...' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Dynamically Loaded Tools */}
                          {discovery.dynamicToolsLoaded &&
                            discovery.dynamicToolsLoaded.length > 0 && (
                              <div>
                                <div className="text-xs text-foreground-secondary mb-1">
                                  Dynamic Tools Loaded ({discovery.dynamicToolsLoaded.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {discovery.dynamicToolsLoaded.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-mono rounded"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Tool Calls */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="text-[10px] uppercase tracking-wider text-foreground-tertiary mb-2">
                            Tool Calls ({message.toolCalls.length})
                          </div>
                          <pre className="text-xs font-mono bg-background/50 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {JSON.stringify(message.toolCalls, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Token Usage */}
                      {(message.inputTokens || message.outputTokens) && (
                        <div className="text-[10px] text-foreground-tertiary font-mono pt-2 border-t border-border/50">
                          {message.inputTokens && <span>Input: {message.inputTokens}</span>}
                          {message.inputTokens && message.outputTokens && <span> | </span>}
                          {message.outputTokens && <span>Output: {message.outputTokens}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {messages.length === 0 && (
                <div className="text-center py-8 text-foreground-tertiary">
                  No messages yet. Start a conversation to see debug data.
                </div>
              )}
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
                <div ref={messagesContainerRef} className="h-full overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    {/* Messages */}
                    {messages.map((message) => (
                      <div key={message.id} className="px-4 py-2">
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

                        {/* TOOL message - show tool results from toolCalls field */}
                        {message.role === 'TOOL' && message.toolCalls && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] space-y-2">
                              {message.toolCalls.map((tc) => (
                                <ToolRenderer
                                  key={tc.toolCallId}
                                  part={{
                                    type: 'tool-result',
                                    toolCallId: tc.toolCallId,
                                    toolName: tc.toolName,
                                    args: tc.args,
                                    result: tc.output,
                                    state: 'result',
                                  }}
                                  isStreaming={false}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Live tool calls during streaming */}
                    {toolCalls.length > 0 && (
                      <div className="px-4 pb-4 space-y-2">
                        {toolCalls.map((tc) => (
                          <div key={tc.toolCallId} className="flex justify-start">
                            <div className="max-w-[80%]">
                              <ToolRenderer
                                part={toolCallToToolPart(tc)}
                                isStreaming={tc.status === 'running'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Streaming content */}
                    {streamingContent && (
                      <div className="px-4 pb-4">
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg p-4 bg-surface-secondary">
                            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                              <Streamdown>{streamingContent}</Streamdown>
                            </div>
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thinking indicator */}
                    {isSending && !streamingContent && toolCalls.length === 0 && (
                      <div className="px-4 pb-4">
                        <div className="flex justify-start">
                          <div className="rounded-lg p-4 bg-surface-secondary">
                            <div className="flex items-center gap-2 text-foreground-secondary">
                              <Icon icon="loader" size="sm" className="animate-spin" />
                              <span className="text-sm">Omega is thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Environment Variable Warnings */}
            {envWarnings.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <EnvVarWarningBanner warnings={envWarnings} onDismiss={() => setEnvWarnings([])} />
              </div>
            )}

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
