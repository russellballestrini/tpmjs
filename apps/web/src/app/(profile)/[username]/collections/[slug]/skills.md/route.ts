/**
 * GET /:username/collections/:slug/skills.md
 * Generate AI-powered skills documentation for a collection
 * Clean URL endpoint for machine-readable skills documentation
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { fetchMultiplePackageSources } from '~/lib/ai/package-source-fetcher';
import { generateSkillsMarkdown } from '~/lib/ai/skills-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Extended for source fetching + AI generation

// Cache for 1 week
const CACHE_DURATION_SECONDS = 7 * 24 * 60 * 60; // 604800 seconds

type RouteContext = {
  params: Promise<{ username: string; slug: string }>;
};

/**
 * GET /:username/collections/:slug/skills.md
 * Generate skills.md markdown for a collection
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    // Check for cachebust query param
    const cachebust = request.nextUrl.searchParams.has('cachebust');

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!user || !user.username) {
      return new Response('User not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Find the collection by slug belonging to this user
    const collection = await prisma.collection.findFirst({
      where: {
        slug,
        userId: user.id,
      },
      include: {
        tools: {
          include: {
            tool: {
              select: {
                id: true,
                name: true,
                description: true,
                inputSchema: true,
                package: {
                  select: {
                    npmPackageName: true,
                    npmVersion: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
          take: 50, // Limit tools for performance
        },
      },
    });

    if (!collection) {
      return new Response('Collection not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Only return if public
    if (!collection.isPublic) {
      return new Response('This collection is not public', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Check cache if not busting
    if (!cachebust && collection.skillsMarkdown && collection.skillsGeneratedAt) {
      // Check if cache is still valid (within 1 week)
      const cacheAge = Date.now() - collection.skillsGeneratedAt.getTime();
      if (cacheAge < CACHE_DURATION_SECONDS * 1000) {
        return new Response(collection.skillsMarkdown, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': `public, s-maxage=${CACHE_DURATION_SECONDS}, stale-while-revalidate=86400`,
            'X-Cache': 'HIT',
            'X-Cache-Age': Math.floor(cacheAge / 1000).toString(),
          },
        });
      }
    }

    // Extract tools data
    const tools = collection.tools.map((ct) => ({
      id: ct.tool.id,
      name: ct.tool.name,
      description: ct.tool.description,
      packageName: ct.tool.package.npmPackageName,
      inputSchema: ct.tool.inputSchema,
    }));

    if (tools.length === 0) {
      return new Response('Collection has no tools', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Get unique packages to fetch
    const uniquePackages = [
      ...new Map(
        collection.tools.map((ct) => [
          ct.tool.package.npmPackageName,
          {
            name: ct.tool.package.npmPackageName,
            version: ct.tool.package.npmVersion,
          },
        ])
      ).values(),
    ];

    // Fetch package sources (limit to 5 packages for performance)
    const packageSources = await fetchMultiplePackageSources(uniquePackages.slice(0, 5));

    // Build MCP URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';
    const mcpUrls = {
      http: `${baseUrl}/api/mcp/${username}/${slug}/http`,
      sse: `${baseUrl}/api/mcp/${username}/${slug}/sse`,
    };

    // Generate skills markdown
    const skillsMarkdown = await generateSkillsMarkdown(
      {
        id: collection.id,
        name: collection.name,
        slug: collection.slug || slug,
        description: collection.description,
        username: user.username,
      },
      tools,
      packageSources,
      mcpUrls
    );

    // Save to database for caching
    await prisma.collection.update({
      where: { id: collection.id },
      data: {
        skillsMarkdown,
        skillsGeneratedAt: new Date(),
      },
    });

    return new Response(skillsMarkdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': `public, s-maxage=${CACHE_DURATION_SECONDS}, stale-while-revalidate=86400`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[Skills.md Error] GET /:username/collections/:slug/skills.md:', error);

    const message =
      error instanceof Error ? error.message : 'Failed to generate skills documentation';

    return new Response(`Error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
