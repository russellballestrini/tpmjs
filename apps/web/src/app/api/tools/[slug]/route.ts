import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/tools/[slug]
 *
 * Fetch a single tool by its NPM package name (slug)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // Find the tool by npmPackageName
    const tool = await prisma.tool.findUnique({
      where: {
        npmPackageName: decodeURIComponent(slug),
      },
    });

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tool not found',
        },
        { status: 404 }
      );
    }

    // Return the tool data
    return NextResponse.json({
      success: true,
      data: tool,
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tool',
      },
      { status: 500 }
    );
  }
}
