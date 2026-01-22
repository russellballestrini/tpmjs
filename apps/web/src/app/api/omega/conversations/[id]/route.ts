/**
 * Omega Single Conversation Endpoint
 *
 * GET: Fetch conversation with messages
 * DELETE: Delete a conversation
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { authenticateRequest } from '~/lib/api-keys/middleware';
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
} from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/omega/conversations/[id]
 * Fetch conversation with messages (paginated)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    const { id } = await context.params;

    // Fetch conversation
    const conversation = await prisma.omegaConversation.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            displayName: true,
            email: true,
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
            toolRuns: true,
          },
        },
      },
    });

    if (!conversation) {
      return apiNotFound('Conversation', requestId);
    }

    // Check if user is owner or participant
    const isOwner = authResult.userId === conversation.ownerId;
    const isParticipant = conversation.participants.some((p) => p.userId === authResult.userId);

    if (!isOwner && !isParticipant) {
      return apiForbidden('Access denied', requestId);
    }

    // Fetch messages with pagination
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10), 100);
    const before = searchParams.get('before');
    const after = searchParams.get('after');

    const whereClause: {
      conversationId: string;
      createdAt?: { lt?: Date; gt?: Date };
    } = { conversationId: id };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    } else if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    }

    const shouldFetchDesc = !after;

    const messages = await prisma.omegaMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: shouldFetchDesc ? 'desc' : 'asc' },
      take: limit + 1,
    });

    const hasMoreMessages = messages.length > limit;
    let paginatedMessages = hasMoreMessages ? messages.slice(0, limit) : messages;

    if (shouldFetchDesc) {
      paginatedMessages = paginatedMessages.reverse();
    }

    // Fetch recent tool runs
    const toolRuns = await prisma.omegaToolRun.findMany({
      where: { conversationId: id },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return apiSuccess(
      {
        id: conversation.id,
        title: conversation.title,
        executionState: conversation.executionState,
        inputTokensTotal: conversation.inputTokensTotal,
        outputTokensTotal: conversation.outputTokensTotal,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        isOwner,
        participants: conversation.participants,
        messageCount: conversation._count.messages,
        toolRunCount: conversation._count.toolRuns,
        messages: paginatedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          authorId: m.authorId,
          authorName: m.authorName,
          toolCalls: m.toolCalls,
          inputTokens: m.inputTokens,
          outputTokens: m.outputTokens,
          createdAt: m.createdAt,
        })),
        toolRuns: toolRuns.map((tr) => ({
          id: tr.id,
          toolName: tr.toolName,
          status: tr.status,
          startedAt: tr.startedAt,
          completedAt: tr.completedAt,
          executionTimeMs: tr.executionTimeMs,
          error: tr.error,
        })),
      },
      {
        requestId,
        pagination: {
          limit,
          hasMore: hasMoreMessages,
          ...(before && { before }),
          ...(after && { after }),
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch Omega conversation:', error);
    return apiInternalError('Failed to fetch conversation', requestId);
  }
}

/**
 * DELETE /api/omega/conversations/[id]
 * Delete a conversation (owner only)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Check ownership
    const conversation = await prisma.omegaConversation.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!conversation) {
      return apiNotFound('Conversation', requestId);
    }

    if (conversation.ownerId !== authResult.userId) {
      return apiForbidden('Only the owner can delete this conversation', requestId);
    }

    // Delete conversation (cascades to messages, participants, tool runs)
    await prisma.omegaConversation.delete({
      where: { id },
    });

    return apiSuccess({ deleted: true }, { requestId });
  } catch (error) {
    console.error('Failed to delete Omega conversation:', error);
    return apiInternalError('Failed to delete conversation', requestId);
  }
}
