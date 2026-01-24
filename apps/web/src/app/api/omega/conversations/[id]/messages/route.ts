/**
 * Omega Messages Endpoint
 *
 * POST: Send a message and stream the AI response via SSE
 *
 * This endpoint implements the core Omega chat functionality with:
 * - Static tools: registrySearchTool and registryExecuteTool for external users
 * - Dynamic tool loading: tools found via search are injected as callable tools
 * - SSE streaming for real-time updates
 */

import { Prisma, prisma } from '@tpmjs/db';
import { jsonSchema, wrapLanguageModel, type ModelMessage } from 'ai';

// Registry tools - lazy loaded to avoid module resolution issues in serverless
let _registryExecuteTool: typeof import('@tpmjs/registry-execute').registryExecuteTool | null = null;
let _registrySearchTool: typeof import('@tpmjs/registry-search').registrySearchTool | null = null;

async function getRegistryTools() {
  if (!_registryExecuteTool) {
    const { registryExecuteTool } = await import('@tpmjs/registry-execute');
    _registryExecuteTool = registryExecuteTool;
  }
  if (!_registrySearchTool) {
    const { registrySearchTool } = await import('@tpmjs/registry-search');
    _registrySearchTool = registrySearchTool;
  }
  return { registryExecuteTool: _registryExecuteTool, registrySearchTool: _registrySearchTool };
}
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { decryptApiKey } from '~/lib/crypto/api-keys';
import { buildSystemPrompt } from '~/lib/omega/system-prompt';
import { checkRateLimit, type RateLimitConfig } from '~/lib/rate-limit';

// Devtools middleware - lazy loaded only in development
let devtools: ReturnType<typeof import('@ai-sdk/devtools').devToolsMiddleware> | null = null;
async function getDevtools() {
  if (process.env.NODE_ENV !== 'development') return null;
  if (!devtools) {
    const { devToolsMiddleware } = await import('@ai-sdk/devtools');
    devtools = devToolsMiddleware();
    console.log('[Omega] AI SDK DevTools middleware initialized');
  }
  return devtools;
}

/**
 * Warning about missing environment variables
 */
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

/**
 * Fetch and decrypt user's environment variables
 */
async function getUserEnvVarsDecrypted(userId: string): Promise<Record<string, string>> {
  try {
    const keys = await prisma.userApiKey.findMany({ where: { userId } });
    const result: Record<string, string> = {};
    for (const key of keys) {
      try {
        result[key.keyName] = decryptApiKey(key.encryptedKey, key.keyIv);
      } catch (error) {
        console.error(`Failed to decrypt env var ${key.keyName}:`, error);
        // Skip this key if decryption fails
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to fetch user env vars:', error);
    return {};
  }
}

/**
 * Detect missing required environment variables for tools
 */
function detectMissingEnvVars(
  tools: Array<{
    toolId: string;
    packageName: string;
    name: string;
    env?: Array<{ name: string; description?: string; required?: boolean }> | null;
  }>,
  userEnvVars: Record<string, string>
): EnvVarWarning[] {
  const warnings: EnvVarWarning[] = [];
  const userEnvKeys = new Set(Object.keys(userEnvVars));

  for (const tool of tools) {
    if (!tool.env || !Array.isArray(tool.env)) continue;

    for (const envVar of tool.env) {
      // Only warn about required env vars that are not set
      if (envVar.required && !userEnvKeys.has(envVar.name)) {
        warnings.push({
          toolId: tool.toolId,
          toolName: tool.name,
          packageName: tool.packageName,
          envVar: {
            name: envVar.name,
            description: envVar.description || '',
            required: true,
          },
        });
      }
    }
  }

  // Deduplicate by env var name (same env var might be needed by multiple tools)
  const seen = new Set<string>();
  return warnings.filter((w) => {
    if (seen.has(w.envVar.name)) return false;
    seen.add(w.envVar.name);
    return true;
  });
}

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

// In-memory conversation state for dynamically loaded tools
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
const conversationStates = new Map<string, { loadedTools: Record<string, any> }>();

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
    env?: Array<{ name: string; description?: string; required?: boolean }>;
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
    env: tool.package.env || [],
  }));
}

/**
 * Create a dynamic tool wrapper that executes via the sandbox executor
 */
async function createDynamicTool(
  toolMeta: {
    toolId: string;
    packageName: string;
    name: string;
    description: string;
    version: string;
    importUrl: string;
    inputSchema?: unknown;
  },
  userEnvVars: Record<string, string>
) {
  // Import tool() dynamically to avoid top-level await
  const { tool } = await import('ai');

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
          env: userEnvVars,
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
 * Add dynamically found tools to the conversation state
 */
async function addToolsToConversation(
  conversationId: string,
  toolMetas: Array<{
    toolId: string;
    packageName: string;
    name: string;
    description: string;
    version: string;
    importUrl: string;
    inputSchema?: unknown;
  }>,
  userEnvVars: Record<string, string>
): Promise<string[]> {
  if (!conversationStates.has(conversationId)) {
    conversationStates.set(conversationId, { loadedTools: {} });
  }
  // biome-ignore lint/style/noNonNullAssertion: We just ensured it exists
  const state = conversationStates.get(conversationId)!;

  const addedTools: string[] = [];

  for (const toolMeta of toolMetas) {
    const sanitizedName = sanitizeToolName(toolMeta.toolId);
    if (!state.loadedTools[sanitizedName]) {
      try {
        state.loadedTools[sanitizedName] = await createDynamicTool(toolMeta, userEnvVars);
        addedTools.push(sanitizedName);
        console.log(`✅ Added dynamic tool: ${sanitizedName}`);
      } catch (error) {
        console.error(`❌ Failed to create tool wrapper for ${toolMeta.toolId}:`, error);
      }
    }
  }

  return addedTools;
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

    // Fetch user's environment variables (decrypted) for tool execution
    const userEnvVars = await getUserEnvVarsDecrypted(authResult.userId);
    console.log(`🔑 Loaded ${Object.keys(userEnvVars).length} user env vars`);

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

    // Initialize or get conversation state
    if (!conversationStates.has(conversationId)) {
      conversationStates.set(conversationId, { loadedTools: {} });
    }
    // biome-ignore lint/style/noNonNullAssertion: We just ensured it exists
    const state = conversationStates.get(conversationId)!;

    // 🔍 Auto-search for relevant tools based on user's message (BM25)
    console.log(`🔍 Auto-searching for tools matching: "${parsed.data.message}"`);
    const relevantTools = await searchRelevantTools(parsed.data.message, 10);
    console.log(`📦 Found ${relevantTools.length} relevant tools via BM25`);

    // Add auto-discovered tools to conversation state
    const autoAddedTools = await addToolsToConversation(conversationId, relevantTools, userEnvVars);
    console.log(`✨ Auto-added ${autoAddedTools.length} new tools`);

    // Detect missing required environment variables
    const missingEnvVars = detectMissingEnvVars(relevantTools, userEnvVars);
    if (missingEnvVars.length > 0) {
      console.log(
        `⚠️ Missing ${missingEnvVars.length} required env vars:`,
        missingEnvVars.map((w) => w.envVar.name)
      );
    }

    // Load registry tools (lazy loaded to avoid module issues in serverless)
    const { registrySearchTool, registryExecuteTool } = await getRegistryTools();

    // Build final tools object: static tools + dynamically loaded tools
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool types
    const tools: Record<string, any> = {
      // Static tools - these are the ones users can import into their own agents
      registrySearchTool,
      registryExecuteTool,
      // Dynamically loaded tools from this conversation
      ...state.loadedTools,
    };

    console.log(
      `🔧 ${Object.keys(tools).length} total tools available (2 static + ${Object.keys(state.loadedTools).length} dynamic)`
    );

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
    const staticToolsList = [
      '- registrySearchTool: Search the TPMJS registry to find AI SDK tools by keyword. Returns toolIds for registryExecuteTool.',
      '- registryExecuteTool: Execute any tool from the TPMJS registry by toolId. Use registrySearchTool first to find tools.',
    ].join('\n');

    const dynamicToolsList = Object.entries(state.loadedTools)
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

## Static Tools (Always Available)

These tools let you access the entire TPMJS registry of 1M+ tools:

${staticToolsList}

## Dynamically Loaded Tools

These tools have been discovered and loaded for this conversation. Call them directly:

${dynamicToolsList || 'No tools loaded yet. Use registrySearchTool to find tools, or they will be auto-loaded based on your requests.'}

## How to Use Tools

1. **To find a tool**: Use registrySearchTool with a keyword (e.g., "weather", "web scraping", "database")
2. **To execute a found tool**: Use registryExecuteTool with the toolId returned from search
3. **Direct execution**: If a tool is already loaded above, call it directly by name

## Example Workflow

User: "Get the weather in Tokyo"
1. Use registrySearchTool to find weather tools
2. Use registryExecuteTool to execute the found tool
   OR call a loaded tool directly if available

Remember: Your value is in EXECUTING tools to get real results, not just describing what tools could do.`;

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
    const baseModel = openai('gpt-4.1-mini');

    // Wrap with devtools middleware in development
    const devtoolsMiddleware = await getDevtools();
    const model = devtoolsMiddleware
      ? wrapLanguageModel({ model: baseModel, middleware: devtoolsMiddleware })
      : baseModel;

    if (devtoolsMiddleware) {
      console.log('[Omega] Model wrapped with DevTools middleware');
    }

    // Create SSE stream
    const stream = new ReadableStream({
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex streaming logic
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Emit env var warnings at the start of the stream
        if (missingEnvVars.length > 0) {
          sendEvent('env.warning', { missingEnvVars });
        }

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
            stopWhen: stepCountIs(10), // Allow up to 10 tool calls for search + execute patterns
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

                  // Check if this is a registrySearchTool result - inject found tools
                  if (
                    tr.toolName === 'registrySearchTool' &&
                    tr.output &&
                    typeof tr.output === 'object'
                  ) {
                    const searchOutput = tr.output as {
                      tools?: Array<{
                        toolId: string;
                        package: string;
                        name: string;
                        description: string;
                      }>;
                    };
                    if (searchOutput.tools && Array.isArray(searchOutput.tools)) {
                      console.log(
                        `🔍 registrySearchTool found ${searchOutput.tools.length} tools - injecting dynamically`
                      );

                      // Convert search results to tool metadata format and add to conversation
                      const toolMetas = searchOutput.tools.map((t) => {
                        const parts = t.toolId.split('::');
                        const pkg = t.package || parts[0] || t.toolId;
                        const toolName = t.name || parts[1] || 'unknown';
                        return {
                          toolId: t.toolId,
                          packageName: pkg,
                          name: toolName,
                          description: t.description || `Tool: ${toolName}`,
                          version: 'latest',
                          importUrl: `https://esm.sh/${pkg}`,
                        };
                      });

                      const newlyAdded = await addToolsToConversation(
                        conversationId,
                        toolMetas,
                        userEnvVars
                      );
                      if (newlyAdded.length > 0) {
                        sendEvent('tools.loaded', {
                          newTools: newlyAdded,
                          totalDynamicTools: Object.keys(state.loadedTools).length,
                        });
                      }
                    }
                  }

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
            staticTools: ['registrySearchTool', 'registryExecuteTool'],
            dynamicToolsLoaded: Object.keys(state.loadedTools),
            autoDiscoveredTools: relevantTools.map((t) => ({
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
