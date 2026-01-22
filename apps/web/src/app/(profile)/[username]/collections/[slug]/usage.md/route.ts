/**
 * GET /:username/collections/:slug/usage.md
 * Generate usage documentation showing common usage patterns from scenarios
 *
 * This endpoint provides AI agents with real-world usage examples derived from
 * the collection's test scenarios. Excludes health check scenarios.
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ username: string; slug: string }>;
};

interface Scenario {
  id: string;
  name: string | null;
  description: string | null;
  prompt: string;
  tags: string[];
  totalRuns: number;
  lastRunStatus: string | null;
  consecutivePasses: number;
  qualityScore: number;
}

/**
 * Check if a scenario is health-related and should be excluded
 */
function isHealthScenario(scenario: Scenario): boolean {
  const lowerName = (scenario.name || '').toLowerCase();
  const lowerDesc = (scenario.description || '').toLowerCase();
  const lowerPrompt = scenario.prompt.toLowerCase();
  const lowerTags = scenario.tags.map((t) => t.toLowerCase());

  const healthKeywords = [
    'health',
    'healthcheck',
    'health check',
    'ping',
    'status check',
    'api health',
  ];

  return (
    healthKeywords.some((kw) => lowerName.includes(kw)) ||
    healthKeywords.some((kw) => lowerDesc.includes(kw)) ||
    healthKeywords.some((kw) => lowerPrompt.includes(kw)) ||
    lowerTags.some((tag) => healthKeywords.some((kw) => tag.includes(kw)))
  );
}

/**
 * Format a scenario as a markdown usage example
 */
function formatScenario(scenario: Scenario, index: number): string {
  const status =
    scenario.lastRunStatus === 'pass' ? '✅' : scenario.lastRunStatus === 'fail' ? '❌' : '⏳';
  const name = scenario.name || `Example ${index + 1}`;
  const reliability =
    scenario.totalRuns > 0
      ? `${Math.round((scenario.consecutivePasses / Math.max(scenario.totalRuns, 1)) * 100)}%`
      : 'N/A';

  let md = `### ${index + 1}. ${name} ${status}\n\n`;

  if (scenario.description) {
    md += `${scenario.description}\n\n`;
  }

  if (scenario.tags.length > 0) {
    md += `**Tags:** ${scenario.tags.map((t) => `\`${t}\``).join(', ')}\n\n`;
  }

  md += `**Prompt:**\n\`\`\`\n${scenario.prompt}\n\`\`\`\n\n`;

  if (scenario.totalRuns > 0) {
    md += `**Stats:** ${scenario.totalRuns} runs | ${scenario.consecutivePasses} consecutive passes | Reliability: ${reliability}\n\n`;
  }

  return md;
}

/**
 * GET /:username/collections/:slug/usage.md
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    // Find user
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

    // Find collection
    const collection = await prisma.collection.findFirst({
      where: { slug, userId: user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isPublic: true,
      },
    });

    if (!collection) {
      return new Response('Collection not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (!collection.isPublic) {
      return new Response('This collection is not public', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Fetch scenarios for this collection
    const scenarios = await prisma.scenario.findMany({
      where: { collectionId: collection.id },
      orderBy: [{ qualityScore: 'desc' }, { consecutivePasses: 'desc' }, { totalRuns: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        tags: true,
        totalRuns: true,
        lastRunStatus: true,
        consecutivePasses: true,
        qualityScore: true,
      },
    });

    // Filter out health scenarios
    const usageScenarios = scenarios.filter((s) => !isHealthScenario(s));

    // Build markdown document
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';
    let markdown = `# Usage Examples: ${collection.name}\n\n`;

    if (collection.description) {
      markdown += `${collection.description}\n\n`;
    }

    markdown += `---\n\n`;
    markdown += `## Overview\n\n`;
    markdown += `This document contains ${usageScenarios.length} real-world usage examples for the **${collection.name}** collection. `;
    markdown += `These examples are derived from tested scenarios that demonstrate common usage patterns.\n\n`;

    // Add quick reference
    markdown += `## Quick Reference\n\n`;
    markdown += `| # | Example | Status | Runs | Tags |\n`;
    markdown += `|---|---------|--------|------|------|\n`;

    for (let i = 0; i < usageScenarios.length; i++) {
      const s = usageScenarios[i]!;
      const status = s.lastRunStatus === 'pass' ? '✅' : s.lastRunStatus === 'fail' ? '❌' : '⏳';
      const name = s.name || `Example ${i + 1}`;
      const tags = s.tags.slice(0, 3).join(', ') || '-';
      markdown += `| ${i + 1} | ${name} | ${status} | ${s.totalRuns} | ${tags} |\n`;
    }

    markdown += `\n---\n\n`;
    markdown += `## Detailed Examples\n\n`;

    if (usageScenarios.length === 0) {
      markdown += `No usage examples available yet. Test scenarios will appear here once created.\n\n`;
    } else {
      // Group by tags for better organization
      const tagGroups = new Map<string, Scenario[]>();
      const uncategorized: Scenario[] = [];

      for (const scenario of usageScenarios) {
        if (scenario.tags.length === 0) {
          uncategorized.push(scenario);
        } else {
          const primaryTag = scenario.tags[0]!;
          const existing = tagGroups.get(primaryTag) ?? [];
          existing.push(scenario);
          tagGroups.set(primaryTag, existing);
        }
      }

      // Output grouped scenarios
      let globalIndex = 0;

      for (const [tag, tagScenarios] of tagGroups) {
        markdown += `### Category: ${tag}\n\n`;
        for (const scenario of tagScenarios) {
          markdown += formatScenario(scenario, globalIndex++);
          markdown += `---\n\n`;
        }
      }

      // Output uncategorized
      if (uncategorized.length > 0) {
        if (tagGroups.size > 0) {
          markdown += `### Other Examples\n\n`;
        }
        for (const scenario of uncategorized) {
          markdown += formatScenario(scenario, globalIndex++);
          markdown += `---\n\n`;
        }
      }
    }

    // Add footer with links
    markdown += `## Additional Resources\n\n`;
    markdown += `- **Skills Documentation:** [${baseUrl}/${username}/collections/${slug}/skills.md](${baseUrl}/${username}/collections/${slug}/skills.md)\n`;
    markdown += `- **Collection Page:** [${baseUrl}/${username}/collections/${slug}](${baseUrl}/${username}/collections/${slug})\n`;
    markdown += `- **MCP Endpoint:** \`${baseUrl}/api/mcp/${username}/${slug}/http\`\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated from ${usageScenarios.length} test scenarios. Last updated: ${new Date().toISOString()}*\n`;

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[Usage.md Error]:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate usage documentation';
    return new Response(`Error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
