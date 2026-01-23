/**
 * Omega Messages Endpoint
 *
 * POST: Send a message and stream the AI response via SSE
 *
 * This endpoint implements the core Omega chat functionality with:
 * - Automatic BM25 search to find relevant tools based on user message
 * - Dynamic tool loading - top 15 matching tools become available to the AI
 * - SSE streaming for real-time updates
 */

import { Prisma, prisma } from '@tpmjs/db';
import { jsonSchema, type ModelMessage } from 'ai';
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

// Executor service URL
const EXECUTOR_URL = process.env.TPMJS_EXECUTOR_URL || 'https://executor.tpmjs.com';

/**
 * Search for relevant tools based on user query
 */
async function searchRelevantTools(
  query: string,
  limit = 15
): Promise<
  Array<{
    toolId: string;
    packageName: string;
    name: string;
    description: string;
    version: string;
    importUrl: string;
    inputSchema?: unknown;
  }>
> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  // Use internal API (same server)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/tools/search?${params}`);

  if (!response.ok) {
    console.error(`Tool search failed: ${response.status} ${response.statusText}`);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: API response types vary
  const data = (await response.json()) as any;
  const toolsArray = data.results?.tools || [];

  // biome-ignore lint/suspicious/noExplicitAny: API response types vary
  return toolsArray.map((tool: any) => ({
    toolId: `${tool.package.npmPackageName}::${tool.name}`,
    packageName: tool.package.npmPackageName,
    name: tool.name,
    description: tool.description || `Tool: ${tool.name}`,
    version: tool.package.npmVersion,
    importUrl: `https://esm.sh/${tool.package.npmPackageName}@${tool.package.npmVersion}`,
    inputSchema: tool.inputSchema,
  }));
}

/**
 * Create a dynamic tool wrapper that executes via the sandbox executor
 */
function createDynamicTool(toolMeta: {
  toolId: string;
  packageName: string;
  name: string;
  description: string;
  version: string;
  importUrl: string;
  inputSchema?: unknown;
}) {
  // Import tool() dynamically to avoid top-level await
  const { tool } = require('ai');

  return tool({
    description: toolMeta.description,
    inputSchema: toolMeta.inputSchema
      ? jsonSchema(toolMeta.inputSchema as Parameters<typeof jsonSchema>[0])
      : jsonSchema({
          type: 'object',
          properties: {},
          additionalProperties: true,
        }),
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool params
    execute: async (params: any) => {
      console.log(`🚀 Executing ${toolMeta.packageName}/${toolMeta.name} with params:`, params);

      const response = await fetch(`${EXECUTOR_URL}/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: toolMeta.packageName,
          name: toolMeta.name,
          version: toolMeta.version,
          importUrl: toolMeta.importUrl,
          params,
          env: {}, // TODO: Pass user's env vars if needed
        }),
      });

      // biome-ignore lint/suspicious/noExplicitAny: API response types vary
      const result = (await response.json()) as any;

      if (!result.success) {
        console.error(`❌ Tool execution failed: ${result.error}`);
        throw new Error(result.error || 'Tool execution failed');
      }

      console.log(`✅ Tool executed in ${result.executionTimeMs}ms`);
      return result.output;
    },
  });
}

/**
 * Sanitize tool name to be a valid JS identifier
 */
function sanitizeToolName(name: string): string {
  return name
    .replace(/@/g, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/::/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
}

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

    // 🔍 Search for relevant tools based on user's message
    console.log(`🔍 Searching for tools matching: "${parsed.data.message}"`);
    const relevantTools = await searchRelevantTools(parsed.data.message, 15);
    console.log(`📦 Found ${relevantTools.length} relevant tools`);

    // Create dynamic tool wrappers for each found tool
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool types
    const tools: Record<string, any> = {};

    for (const toolMeta of relevantTools) {
      const sanitizedName = sanitizeToolName(toolMeta.toolId);
      try {
        tools[sanitizedName] = createDynamicTool(toolMeta);
        console.log(`✅ Loaded tool: ${sanitizedName}`);
      } catch (error) {
        console.error(`❌ Failed to create tool wrapper for ${toolMeta.toolId}:`, error);
      }
    }

    console.log(`🔧 ${Object.keys(tools).length} tools available for this request`);

    // Fetch recent messages for context
    const recentMessages = await prisma.omegaMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Last 20 messages for context
    });
    recentMessages.reverse();

    // Build AI SDK messages
    const messages: ModelMessage[] = [];

    // Build tool list for system prompt
    const toolsList = Object.entries(tools)
      .map(([name, t]) => {
        const tool = t as { description?: string };
        return `- ${name}: ${tool.description || 'No description'}`;
      })
      .join('\n');

    // Add system prompt with available tools
    const baseSystemPrompt = buildSystemPrompt({
      customSystemPrompt: userSettings?.customSystemPrompt,
      pinnedToolIds: userSettings?.pinnedToolIds || [],
    });

    const systemPrompt = `${baseSystemPrompt}

## Available Tools

The following tools have been automatically loaded based on the user's request. Use them directly to accomplish the task:

${toolsList || 'No tools matched this query. Try to help the user with general knowledge.'}

## Instructions

1. If a tool is available that can help, USE IT immediately
2. Don't describe what tools could do - actually call them
3. After calling a tool, explain the results to the user
4. If no tools match, help the user with general knowledge`;

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

          const result = streamText({
            model,
            messages,
            tools: Object.keys(tools).length > 0 ? tools : undefined,
            stopWhen: stepCountIs(5), // Allow up to 5 tool calls
            onChunk: async (chunk) => {
              // Handle tool call (complete tool call with args)
              if (chunk.chunk.type === 'tool-call') {
                const input =
                  'input' in chunk.chunk
                    ? chunk.chunk.input
                    : 'args' in chunk.chunk
                      ? (chunk.chunk as { args: unknown }).args
                      : {};

                // Create tool run record
                await prisma.omegaToolRun.create({
                  data: {
                    conversationId,
                    toolName: chunk.chunk.toolName,
                    input: input as Prisma.InputJsonValue,
                    status: 'running',
                  },
                });

                sendEvent('run.step.tool.started', {
                  toolCallId: chunk.chunk.toolCallId,
                  toolName: chunk.chunk.toolName,
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

          // Update conversation token totals
          await prisma.omegaConversation.update({
            where: { id: conversationId },
            data: {
              executionState: 'idle',
              inputTokensTotal: { increment: inputTokens },
              outputTokensTotal: { increment: outputTokens },
            },
          });

          // Update title if this is the first message pair
          const messageCount = await prisma.omegaMessage.count({ where: { conversationId } });
          if (messageCount <= 3 && !conversation.title) {
            // Use first 50 chars of user message as title
            const title =
              parsed.data.message.slice(0, 50) + (parsed.data.message.length > 50 ? '...' : '');
            await prisma.omegaConversation.update({
              where: { id: conversationId },
              data: { title },
            });
          }

          sendEvent('run.completed', {
            messageId: assistantMessage.id,
            inputTokens,
            outputTokens,
            toolCallCount: allToolCalls.length,
            toolsLoaded: Object.keys(tools).length,
            loadedToolNames: Object.keys(tools),
            bm25Results: relevantTools.map((t) => ({
              toolId: t.toolId,
              name: t.name,
              packageName: t.packageName,
              description: t.description,
            })),
          });

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);

          // Update conversation state on error
          await prisma.omegaConversation.update({
            where: { id: conversationId },
            data: { executionState: 'idle' },
          });

          sendEvent('run.failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Message handler error:', error);

    // Reset conversation state
    await prisma.omegaConversation.update({
      where: { id: conversationId },
      data: { executionState: 'idle' },
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
