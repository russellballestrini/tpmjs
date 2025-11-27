import { prisma } from '@tpmjs/db';
import { fetchDownloadStats } from '@tpmjs/npm-client';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

/**
 * POST /api/sync/metrics
 * Update download stats and quality scores for all tools
 *
 * This endpoint is called by Vercel Cron (every hour)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex but straightforward CRUD operation
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let processed = 0;
  const skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    // Get all tools from database
    const tools = await prisma.tool.findMany({
      select: {
        id: true,
        npmPackageName: true,
        tier: true,
        npmDownloadsLastMonth: true,
        githubStars: true,
      },
    });

    // Process each tool
    for (const tool of tools) {
      try {
        // Fetch download stats from NPM
        const downloads = await fetchDownloadStats(tool.npmPackageName);

        // Calculate quality score (0.00 to 1.00)
        const qualityScore = calculateQualityScore({
          tier: tool.tier,
          downloads,
          githubStars: tool.githubStars || 0,
        });

        // Update tool metrics
        await prisma.tool.update({
          where: { id: tool.id },
          data: {
            npmDownloadsLastMonth: downloads,
            qualityScore,
          },
        });

        processed++;
      } catch (error) {
        errors++;
        const errorMsg = `Failed to process ${tool.npmPackageName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update checkpoint with last run timestamp
    await prisma.syncCheckpoint.upsert({
      where: { source: 'metrics' },
      create: {
        source: 'metrics',
        checkpoint: {
          lastRun: new Date().toISOString(),
          totalTools: tools.length,
        },
      },
      update: {
        checkpoint: {
          lastRun: new Date().toISOString(),
          totalTools: tools.length,
        },
      },
    });

    // Log sync operation
    await prisma.syncLog.create({
      data: {
        source: 'metrics',
        status: errors > 0 ? 'partial' : 'success',
        processed,
        skipped,
        errors,
        message:
          errors > 0
            ? `Processed with errors: ${errorMessages.slice(0, 3).join('; ')}`
            : `Successfully updated metrics for ${processed} tools`,
        metadata: {
          durationMs: Date.now() - startTime,
          totalTools: tools.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        totalTools: tools.length,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Metrics sync failed:', error);

    // Log failed sync
    await prisma.syncLog.create({
      data: {
        source: 'metrics',
        status: 'error',
        processed,
        skipped,
        errors: errors + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          durationMs: Date.now() - startTime,
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate quality score based on multiple factors
 * Returns a value between 0.00 and 1.00
 */
function calculateQualityScore(params: {
  tier: string;
  downloads: number;
  githubStars: number;
}): number {
  const { tier, downloads, githubStars } = params;

  // Base score from tier
  const tierScore = tier === 'rich' ? 0.6 : 0.4;

  // Downloads score (logarithmic scale, max 0.3)
  const downloadsScore = Math.min(0.3, Math.log10(downloads + 1) / 10);

  // GitHub stars score (logarithmic scale, max 0.1)
  const starsScore = Math.min(0.1, Math.log10(githubStars + 1) / 10);

  // Total score (capped at 1.00)
  const totalScore = Math.min(1.0, tierScore + downloadsScore + starsScore);

  // Round to 2 decimal places
  return Math.round(totalScore * 100) / 100;
}
