/**
 * Temporary API route to analyze a user's account data
 * DELETE THIS AFTER USE
 */

import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ADMIN_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    // 1. Basic User Info with accounts and sessions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            id: true,
            providerId: true,
            accountId: true,
            createdAt: true,
          },
        },
        sessions: {
          select: {
            id: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. TPMJS API Keys with usage records
    const tpmjsApiKeys = await prisma.tpmjsApiKey.findMany({
      where: { userId },
      include: {
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    // 3. API Usage Summary (via userId)
    const apiUsageSummary = await prisma.apiUsageSummary.findMany({
      where: { userId },
      orderBy: { periodStart: 'desc' },
      take: 30,
    });

    // 4. User API Keys (stored env vars - DO NOT RETURN VALUES)
    const userApiKeys = await prisma.userApiKey.findMany({
      where: { userId },
      select: {
        id: true,
        keyName: true,
        keyHint: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly NOT selecting encryptedKey or keyIv
      },
    });

    // 5. Agents with conversations
    const agents = await prisma.agent.findMany({
      where: { userId },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            _count: {
              select: { messages: true },
            },
          },
        },
        _count: {
          select: { conversations: true },
        },
      },
    });

    // 6. Collections with tools
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tools: true, likes: true },
        },
      },
    });

    // 7. Bridge Connections
    const bridgeConnections = await prisma.bridgeConnection.findMany({
      where: { userId },
    });

    // 8. Tool Likes
    const toolLikes = await prisma.toolLike.findMany({
      where: { userId },
      include: {
        tool: {
          select: {
            name: true,
            package: {
              select: { npmPackageName: true },
            },
          },
        },
      },
    });

    // 9. Collection Likes
    const collectionLikes = await prisma.collectionLike.findMany({
      where: { userId },
      include: {
        collection: {
          select: { name: true, slug: true },
        },
      },
    });

    // 10. Summary Statistics
    const apiKeyIds = tpmjsApiKeys.map((k) => k.id);
    const totalApiCalls =
      apiKeyIds.length > 0
        ? await prisma.apiUsageRecord.count({
            where: { apiKeyId: { in: apiKeyIds } },
          })
        : 0;

    const totalConversations = await prisma.conversation.count({
      where: { agent: { userId } },
    });

    const totalMessages = await prisma.message.count({
      where: { conversation: { agent: { userId } } },
    });

    return NextResponse.json({
      user,
      tpmjsApiKeys,
      apiUsageSummary,
      userApiKeys,
      agents,
      collections,
      bridgeConnections,
      toolLikes,
      collectionLikes,
      summary: {
        totalApiCalls,
        totalConversations,
        totalMessages,
        totalAgents: agents.length,
        totalCollections: collections.length,
        totalApiKeys: tpmjsApiKeys.length,
        totalUserEnvVars: userApiKeys.length,
        totalBridgeConnections: bridgeConnections.length,
        totalToolLikes: toolLikes.length,
        totalCollectionLikes: collectionLikes.length,
      },
    });
  } catch (error) {
    console.error('Error analyzing user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
