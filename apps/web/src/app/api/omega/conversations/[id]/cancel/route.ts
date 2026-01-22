/**
 * Omega Cancel Endpoint
 *
 * POST: Cancel a running conversation execution
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
  apiValidationError,
} from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/omega/conversations/[id]/cancel
 * Cancel a running conversation execution
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Fetch conversation
    const conversation = await prisma.omegaConversation.findUnique({
      where: { id },
      select: {
        ownerId: true,
        executionState: true,
        participants: {
          select: { userId: true },
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

    // Check if conversation is running
    if (conversation.executionState !== 'running') {
      return apiValidationError(
        'Conversation is not running',
        { currentState: conversation.executionState },
        requestId
      );
    }

    // Update conversation state to cancelled
    await prisma.omegaConversation.update({
      where: { id },
      data: { executionState: 'cancelled' },
    });

    // Mark any running tool runs as cancelled
    await prisma.omegaToolRun.updateMany({
      where: {
        conversationId: id,
        status: 'running',
      },
      data: {
        status: 'error',
        error: 'Cancelled by user',
        completedAt: new Date(),
      },
    });

    return apiSuccess({ cancelled: true }, { requestId });
  } catch (error) {
    console.error('Failed to cancel Omega conversation:', error);
    return apiInternalError('Failed to cancel conversation', requestId);
  }
}
