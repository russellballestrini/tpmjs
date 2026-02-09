import type { IconName } from '@tpmjs/ui/Icon/Icon';

export interface ToolCard {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  category: string;
  categoryVariant: 'default' | 'secondary' | 'outline' | 'success' | 'error' | 'warning' | 'info';
  weeklyUsage: string;
  href: string;
}

export const featuredTools: ToolCard[] = [
  {
    id: 'tool-search',
    name: 'tool-search',
    icon: 'check',
    description:
      'Meta-tool that lets AI agents discover and load tools on-demand using semantic search.',
    category: 'Meta-Tools',
    categoryVariant: 'warning',
    weeklyUsage: '847K/week',
    href: '/tool/tool-search',
  },
  {
    id: 'web-scraper',
    name: 'web-scraper',
    icon: 'externalLink',
    description:
      'Extract structured data from any website with automatic schema detection and pagination support.',
    category: 'Web & APIs',
    categoryVariant: 'info',
    weeklyUsage: '524K/week',
    href: '/tool/web-scraper',
  },
  {
    id: 'github-manager',
    name: 'github-manager',
    icon: 'github',
    description:
      'Manage GitHub repositories, issues, pull requests, and workflows programmatically.',
    category: 'Code & Git',
    categoryVariant: 'default',
    weeklyUsage: '392K/week',
    href: '/tool/github-manager',
  },
  {
    id: 'sql-query',
    name: 'sql-query',
    icon: 'copy',
    description:
      'Execute SQL queries across PostgreSQL, MySQL, and SQLite databases with connection pooling.',
    category: 'Databases',
    categoryVariant: 'success',
    weeklyUsage: '287K/week',
    href: '/tool/sql-query',
  },
  {
    id: 'pdf-parser',
    name: 'pdf-parser',
    icon: 'copy',
    description:
      'Extract text, tables, and metadata from PDF documents with OCR support for scanned pages.',
    category: 'Documents',
    categoryVariant: 'outline',
    weeklyUsage: '156K/week',
    href: '/tool/pdf-parser',
  },
  {
    id: 'email-sender',
    name: 'email-sender',
    icon: 'check',
    description: 'Send transactional emails with templates, attachments, and delivery tracking.',
    category: 'Email',
    categoryVariant: 'secondary',
    weeklyUsage: '203K/week',
    href: '/tool/email-sender',
  },
];

// Note: categories and statistics arrays were removed in favor of real data
// from the database. See EcosystemStats component and getHomePageData() in page.tsx.

export interface ProblemPoint {
  title: string;
  description: string;
  icon: IconName;
}

export const problemPoints: ProblemPoint[] = [
  {
    title: 'Manual Configuration',
    description:
      'Agents require hard-coded tool imports and manual config files for every capability',
    icon: 'copy',
  },
  {
    title: 'No Discovery',
    description: 'Tools must be known ahead of time—no way to find new capabilities on-demand',
    icon: 'check',
  },
  {
    title: 'Version Hell',
    description: 'Breaking changes force manual updates across every agent using a tool',
    icon: 'chevronDown',
  },
  {
    title: 'Limited Capabilities',
    description: 'Static toolsets restrict agents to predetermined functions—no room to grow',
    icon: 'externalLink',
  },
];

export interface DeveloperStory {
  code: string;
  quote: string;
  author: string;
  company: string;
}

export const developerStories: DeveloperStory[] = [
  {
    code: `const agent = new Agent({
  tools: await tpmjs.search({
    query: "email, slack, calendar"
  })
})`,
    quote: 'Reduced config from 500 lines to 3',
    author: 'Sarah Chen',
    company: 'Support.ai',
  },
  {
    code: `// Agents find tools semantically
const tools = await tpmjs.search({
  query: "parse PDF invoices",
  limit: 5
})`,
    quote: 'Our agents adapt to new doc formats instantly',
    author: 'Marcus Rodriguez',
    company: 'DocFlow',
  },
  {
    code: `// No more version conflicts
agent.loadTool("sql-query@latest")
// Always get the newest, tested version`,
    quote: 'Eliminated 80% of our integration bugs',
    author: 'Priya Patel',
    company: 'DataSync Pro',
  },
];
