/**
 * Omega Messages Endpoint
 *
 * POST: Send a message and stream the AI response via SSE
 *
 * This endpoint implements the core Omega chat functionality with:
 * - Registry search tool for discovering tools
 * - Tool executor for running discovered tools
 * - SSE streaming for real-time updates
 */

import { Prisma, prisma } from '@tpmjs/db';
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { registrySearchTool } from '@tpmjs/registry-search';
import type { ModelMessage } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { buildSystemPrompt } from '~/lib/omega/system-prompt';
import { checkRateLimit, type RateLimitConfig } from '~/lib/rate-limit';

/**
 * Rate limit for Omega chat: 20 requests per minute
 * Stricter limit because this involves multiple tool executions
 */
const OMEGA_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowSeconds: 60,
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex tool chains

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SendMessageSchema = z.object({
  message: z.string().min(1).max(10000),
});

/**
 * POST /api/omega/conversations/[id]/messages
 * Send a message and stream the AI response via SSE
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex streaming logic required
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const startTime = Date.now();

  // Authenticate request
  const authResult = await authenticateRequest();
  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check rate limit
  const rateLimitResponse = checkRateLimit(request, OMEGA_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id: conversationId } = await context.params;

  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch conversation and verify access
    const conversation = await prisma.omegaConversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or participant
    const isOwner = authResult.userId === conversation.ownerId;
    const isParticipant = conversation.participants.some((p) => p.userId === authResult.userId);

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { id: true, name: true, email: true },
    });

    // Get user settings for pinned/blocked tools and custom prompt
    const userSettings = await prisma.omegaUserSettings.findUnique({
      where: { userId: authResult.userId },
    });

    // Update conversation state to running
    await prisma.omegaConversation.update({
      where: { id: conversationId },
      data: { executionState: 'running' },
    });

    // Save user message
    await prisma.omegaMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: parsed.data.message,
        authorId: user?.id,
        authorEmail: user?.email,
        authorName: user?.name,
      },
    });

    // Fetch recent messages for context
    const recentMessages = await prisma.omegaMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Last 20 messages for context
    });
    recentMessages.reverse();

    // Build AI SDK messages
    const messages: ModelMessage[] = [];

    // Add system prompt
    const systemPrompt = buildSystemPrompt({
      customSystemPrompt: userSettings?.customSystemPrompt,
      pinnedToolIds: userSettings?.pinnedToolIds || [],
    });
    messages.push({ role: 'system', content: systemPrompt });

    // Add conversation history
    for (const msg of recentMessages.slice(0, -1)) {
      // Exclude the message we just added
      if (msg.role === 'USER') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'ASSISTANT') {
        if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
          const toolCallParts = (
            msg.toolCalls as Array<{ toolCallId: string; toolName: string; args: unknown }>
          ).map((tc) => ({
            type: 'tool-call' as const,
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            input: tc.args,
          }));

          const content: Array<
            | { type: 'text'; text: string }
            | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }
          > = [];

          if (msg.content) {
            content.push({ type: 'text', text: msg.content });
          }
          content.push(...toolCallParts);
          messages.push({ role: 'assistant', content });
        } else {
          messages.push({ role: 'assistant', content: msg.content });
        }
      } else if (msg.role === 'TOOL') {
        // Handle tool results (stored in toolCalls as a workaround)
        const toolResults = msg.toolCalls as Array<{
          toolCallId: string;
          toolName: string;
          output: unknown;
        }> | null;
        if (toolResults && toolResults.length > 0) {
          for (const tr of toolResults) {
            messages.push({
              role: 'tool',
              content: [
                {
                  type: 'tool-result' as const,
                  toolCallId: tr.toolCallId,
                  toolName: tr.toolName,
                  output: {
                    type: 'json' as const,
                    value: tr.output as Parameters<typeof JSON.stringify>[0],
                  },
                },
              ],
            });
          }
        }
      }
    }

    // Add new user message
    messages.push({ role: 'user', content: parsed.data.message });

    // Build Omega tools using published TPMJS packages
    const tools = {
      registrySearch: registrySearchTool,
      registryExecute: registryExecuteTool,
    };

    // Get the provider model (using OpenAI by default)
    const { createOpenAI } = await import('@ai-sdk/openai');
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      await prisma.omegaConversation.update({
        where: { id: conversationId },
        data: { executionState: 'idle' },
      });
      return NextResponse.json(
        { success: false, error: 'Omega is not configured. Missing OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const openai = createOpenAI({ apiKey });
    const model = openai('gpt-4.1-mini');

    // Create SSE stream
    const stream = new ReadableStream({
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex streaming logic
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          const { streamText, stepCountIs } = await import('ai');

          let fullContent = '';
          const toolCallsMap: Map<string, { toolCallId: string; toolName: string; args: unknown }> =
            new Map();
          const pendingToolResults: Array<{
            toolCallId: string;
            toolName: string;
            output: unknown;
          }> = [];
          let inputTokens = 0;
          let outputTokens = 0;

          // Stream the response with up to 10 tool call iterations
          const result = await streamText({
            model,
            messages,
            tools,
            stopWhen: stepCountIs(10),
            onChunk: async ({ chunk }) => {
              if (chunk.type === 'tool-call') {
                const input = 'args' in chunk ? chunk.args : chunk.input;

                console.log('[Omega] Tool call:', {
                  toolName: chunk.toolName,
                  toolCallId: chunk.toolCallId,
                });

                toolCallsMap.set(chunk.toolCallId, {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  args: input,
                });

                // Create tool run record
                await prisma.omegaToolRun.create({
                  data: {
                    conversationId,
                    toolName: chunk.toolName,
                    input: input as Prisma.InputJsonValue,
                    status: 'running',
                  },
                });

                sendEvent('run.step.tool.started', {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  input,
                });
              }
            },
            // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex tool result handling
            onStepFinish: async ({ toolCalls, toolResults, usage }) => {
              // Capture tool calls
              if (toolCalls && Array.isArray(toolCalls)) {
                for (const tc of toolCalls) {
                  if (!toolCallsMap.has(tc.toolCallId)) {
                    const args =
                      'input' in tc ? tc.input : 'args' in tc ? (tc as { args: unknown }).args : {};
                    toolCallsMap.set(tc.toolCallId, {
                      toolCallId: tc.toolCallId,
                      toolName: tc.toolName,
                      args,
                    });
                  }
                }
              }

              // Process tool results
              if (toolResults && toolResults.length > 0) {
                for (const tr of toolResults) {
                  const isError =
                    tr.output && typeof tr.output === 'object' && 'error' in tr.output;

                  // Build update data for tool run
                  const toolRunUpdateData: Prisma.OmegaToolRunUpdateManyMutationInput = {
                    output: tr.output as Prisma.InputJsonValue,
                    status: isError ? 'error' : 'success',
                    completedAt: new Date(),
                    executionTimeMs: Date.now() - startTime,
                  };

                  // Add error message if the tool execution failed
                  if (isError) {
                    toolRunUpdateData.error =
                      typeof tr.output === 'object' && tr.output && 'error' in tr.output
                        ? String((tr.output as { error: unknown }).error)
                        : 'Unknown error';
                  }

                  // Update tool run record
                  await prisma.omegaToolRun.updateMany({
                    where: {
                      conversationId,
                      toolName: tr.toolName,
                      status: 'running',
                    },
                    data: toolRunUpdateData,
                  });

                  sendEvent('run.step.tool.completed', {
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    output: tr.output,
                    isError,
                  });

                  pendingToolResults.push({
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    output: tr.output,
                  });
                }
              }

              if (usage) {
                inputTokens += usage.inputTokens ?? 0;
                outputTokens += usage.outputTokens ?? 0;
              }
            },
          });

          // Stream text chunks
          for await (const chunk of result.textStream) {
            fullContent += chunk;
            sendEvent('message.delta', { content: chunk });
          }

          // Get final usage
          const finalUsage = await result.usage;
          if (finalUsage) {
            inputTokens = finalUsage.inputTokens ?? inputTokens;
            outputTokens = finalUsage.outputTokens ?? outputTokens;
          }

          const allToolCalls = Array.from(toolCallsMap.values());

          // Save assistant message
          const assistantMessage = await prisma.omegaMessage.create({
            data: {
              conversationId,
              role: 'ASSISTANT',
              content: fullContent,
              toolCalls:
                allToolCalls.length > 0
                  ? (allToolCalls as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              inputTokens,
              outputTokens,
            },
          });

          // Save tool results as TOOL messages
          if (pendingToolResults.length > 0) {
            await prisma.omegaMessage.create({
              data: {
                conversationId,
                role: 'TOOL',
                content: 'Tool results',
                toolCalls: pendingToolResults as unknown as Prisma.InputJsonValue,
              },
            });
          }

          // Update conversation
          const updateData: Prisma.OmegaConversationUpdateInput = {
            executionState: 'idle',
            inputTokensTotal: { increment: inputTokens },
            outputTokensTotal: { increment: outputTokens },
            updatedAt: new Date(),
          };

          // Auto-generate title from first message if not set
          if (conversation.title === null) {
            updateData.title = parsed.data.message.slice(0, 100);
          }

          await prisma.omegaConversation.update({
            where: { id: conversationId },
            data: updateData,
          });

          const executionTimeMs = Date.now() - startTime;

          sendEvent('run.completed', {
            messageId: assistantMessage.id,
            conversationId,
            inputTokens,
            outputTokens,
            executionTimeMs,
          });
        } catch (error) {
          console.error('[Omega] Stream error:', error);

          // Update conversation state
          await prisma.omegaConversation.update({
            where: { id: conversationId },
            data: { executionState: 'idle' },
          });

          sendEvent('run.failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Omega] Failed to process message:', error);

    // Reset conversation state
    await prisma.omegaConversation.update({
      where: { id: conversationId },
      data: { executionState: 'idle' },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 }
    );
  }
}
