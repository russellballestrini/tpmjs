/**
 * Omega Conversations Endpoint
 *
 * POST: Create a new Omega conversation
 * GET: List user's Omega conversations
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { authenticateRequest } from '~/lib/api-keys/middleware';
import { apiForbidden, apiInternalError, apiSuccess, apiUnauthorized } from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/omega/conversations
 * List all Omega conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    const conversations = await prisma.omegaConversation.findMany({
      where: { ownerId: authResult.userId },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      skip: offset,
      include: {
        _count: {
          select: {
            messages: true,
            toolRuns: true,
          },
        },
      },
    });

    const hasMore = conversations.length > limit;
    const data = hasMore ? conversations.slice(0, limit) : conversations;

    return apiSuccess(
      data.map((c) => ({
        id: c.id,
        title: c.title,
        executionState: c.executionState,
        inputTokensTotal: c.inputTokensTotal,
        outputTokensTotal: c.outputTokensTotal,
        messageCount: c._count.messages,
        toolRunCount: c._count.toolRuns,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      {
        requestId,
        pagination: {
          limit,
          offset,
          hasMore,
        },
      }
    );
  } catch (error) {
    console.error('Failed to list Omega conversations:', error);
    return apiInternalError('Failed to list conversations', requestId);
  }
}

/**
 * POST /api/omega/conversations
 * Create a new Omega conversation
 */
export async function POST(_request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    // Get user info for participant
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return apiForbidden('User not found', requestId);
    }

    const userId = authResult.userId;

    // Create conversation with owner as participant
    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.omegaConversation.create({
        data: {
          ownerId: userId,
        },
      });

      // Add owner as participant
      await tx.omegaParticipant.create({
        data: {
          conversationId: conv.id,
          userId: user.id,
          displayName: user.name,
          email: user.email,
          role: 'owner',
        },
      });

      return conv;
    });

    return apiSuccess(
      {
        id: conversation.id,
        title: conversation.title,
        executionState: conversation.executionState,
        createdAt: conversation.createdAt,
      },
      { requestId, status: 201 }
    );
  } catch (error) {
    console.error('Failed to create Omega conversation:', error);
    return apiInternalError('Failed to create conversation', requestId);
  }
}
