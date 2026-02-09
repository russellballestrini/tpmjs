import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { getClientId } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const VALID_ENTITY_TYPES = ['tool', 'collection', 'agent'] as const;

// Simple in-memory dedup: 1 view per entity per IP per hour
const recentViews = new Map<string, number>();

// Clean up every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentViews) {
    if (now - timestamp > 3600_000) {
      recentViews.delete(key);
    }
  }
  // Prevent unbounded growth
  if (recentViews.size > 50_000) {
    recentViews.clear();
  }
}, 600_000);

/**
 * POST /api/track/view
 * Fire-and-forget view tracking. Upserts into PageView with daily bucket.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId } = body;

    // Validate input
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing entityType or entityId' }, { status: 400 });
    }

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    }

    // Rate-limit: 1 view per entity per IP per hour
    const clientId = getClientId(request);
    const dedupKey = `${clientId}:${entityType}:${entityId}`;
    const lastView = recentViews.get(dedupKey);

    if (lastView && Date.now() - lastView < 3600_000) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    recentViews.set(dedupKey, Date.now());

    // Today's date bucket (midnight UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Upsert page view (fire-and-forget style, don't await in production but we need to for correctness)
    await prisma.pageView.upsert({
      where: {
        entityType_entityId_date: {
          entityType,
          entityId,
          date: today,
        },
      },
      create: {
        entityType,
        entityId,
        date: today,
        viewCount: 1,
      },
      update: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Silently fail - view tracking should never break the user experience
    console.error('[track/view] Error:', error);
    return NextResponse.json({ ok: true });
  }
}
