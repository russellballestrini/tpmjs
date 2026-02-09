// eslint-disable-next-line import/no-internal-modules
import isoflowIsopack from '@isoflow/isopacks/dist/isoflow';
// eslint-disable-next-line import/no-internal-modules -- @isoflow/isopacks requires deep imports for individual collections
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import type { InitialData } from 'isoflow';

const icons = flattenCollections([isoflowIsopack]);

// ── Colors (5 categories) ──────────────────────────────────────────
const colors = [
  { id: 'orange', value: '#f97316' }, // External Services
  { id: 'blue', value: '#3b82f6' }, // Applications
  { id: 'green', value: '#22c55e' }, // Published Packages
  { id: 'purple', value: '#a855f7' }, // Internal Packages
  { id: 'pink', value: '#ec4899' }, // Official Tools
];

// ── Items (nodes) ──────────────────────────────────────────────────

// External Services (orange)
const externalServices = [
  {
    id: 'npm-registry',
    name: 'npm Registry',
    icon: 'cloud',
    description:
      'Source of truth for all TPMJS packages. Synced via changes feed and keyword search.',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'document',
    description: 'Source code hosting, CI/CD via GitHub Actions, and repository metadata.',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: 'server',
    description:
      'Hosting platform for Next.js apps. Handles deployments, cron jobs, and edge functions.',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: 'storage',
    description:
      'Primary database via Neon. Stores tools, sync checkpoints, users, and conversations.',
  },
  {
    id: 'ai-providers',
    name: 'AI Providers',
    icon: 'diamond',
    description:
      'OpenAI, Anthropic, Google, Groq, Mistral — LLM providers for tool execution and chat.',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'speech',
    description: 'Community platform for TPMJS users and contributors.',
  },
  {
    id: 'resend',
    name: 'Resend',
    icon: 'mail',
    description: 'Transactional email service for notifications and auth flows.',
  },
];

// Applications (blue)
const applications = [
  {
    id: 'web',
    name: 'web (Next.js)',
    icon: 'desktop',
    description:
      'Main tpmjs.com application. Next.js 16 App Router with SSR, API routes, and cron syncing.',
  },
  {
    id: 'playground',
    name: 'Playground',
    icon: 'laptop',
    description:
      'Interactive tool testing environment where users can try TPMJS tools in the browser.',
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    icon: 'document',
    description: 'Step-by-step guide for creating and publishing TPMJS tools.',
  },
  {
    id: 'railway-executor',
    name: 'Railway Executor',
    icon: 'vm',
    description: 'Sandboxed tool execution engine deployed on Railway for secure code execution.',
  },
];

// Published Packages (green) — @tpmjs/* on npm
const publishedPackages = [
  {
    id: 'pkg-cli',
    name: '@tpmjs/cli',
    icon: 'function-module',
    description: 'CLI tool for creating, validating, and publishing TPMJS tools.',
  },
  {
    id: 'pkg-types',
    name: '@tpmjs/types',
    icon: 'cube',
    description: 'Shared TypeScript types and Zod schemas used across the ecosystem.',
  },
  {
    id: 'pkg-ui',
    name: '@tpmjs/ui',
    icon: 'block',
    description: 'React component library with .ts-only components. Design system for TPMJS apps.',
  },
  {
    id: 'pkg-utils',
    name: '@tpmjs/utils',
    icon: 'switch-module',
    description: 'Utility functions: cn(), formatting helpers, and shared logic.',
  },
  {
    id: 'pkg-env',
    name: '@tpmjs/env',
    icon: 'lock',
    description: 'Environment variable validation with Zod schemas.',
  },
  {
    id: 'pkg-bridge',
    name: '@tpmjs/bridge',
    icon: 'router',
    description:
      'Bridge between TPMJS tools and AI SDK. Converts tool definitions to AI-compatible format.',
  },
  {
    id: 'pkg-mcp-client',
    name: '@tpmjs/mcp-client',
    icon: 'loadbalancer',
    description: 'MCP (Model Context Protocol) client for connecting TPMJS tools to AI agents.',
  },
  {
    id: 'pkg-executor-test',
    name: '@tpmjs/executor-test',
    icon: 'cronjob',
    description: 'Testing utilities for tool executors. Validates tool inputs/outputs.',
  },
  {
    id: 'pkg-registry-search',
    name: '@tpmjs/registry-search',
    icon: 'dns',
    description: 'Search client for querying the TPMJS tool registry.',
  },
  {
    id: 'pkg-registry-execute',
    name: '@tpmjs/registry-execute',
    icon: 'queue',
    description: 'Execution client for running tools from the TPMJS registry.',
  },
];

// Internal Packages (purple)
const internalPackages = [
  {
    id: 'int-db',
    name: '@tpmjs/db',
    icon: 'storage',
    description: 'Prisma database client. Schema, migrations, and generated client.',
  },
  {
    id: 'int-npm-client',
    name: '@tpmjs/npm-client',
    icon: 'package-module',
    description: 'npm registry API client. Fetches package metadata, downloads, and changes feed.',
  },
  {
    id: 'int-package-executor',
    name: '@tpmjs/package-executor',
    icon: 'vm',
    description: 'Sandboxed package execution engine. Runs npm packages safely.',
  },
  {
    id: 'int-config',
    name: '@tpmjs/config',
    icon: 'cube',
    description: 'Shared configurations: Biome, ESLint, Tailwind, TypeScript.',
  },
  {
    id: 'int-test',
    name: '@tpmjs/test',
    icon: 'cronjob',
    description: 'Shared Vitest configuration for all packages.',
  },
  {
    id: 'int-mocks',
    name: '@tpmjs/mocks',
    icon: 'sphere',
    description: 'MSW mock server for testing. Mocks npm, GitHub, and internal APIs.',
  },
  {
    id: 'int-logger',
    name: '@tpmjs/logger',
    icon: 'document',
    description: 'Structured logging utility used across packages.',
  },
];

// Official Tools (pink)
const officialTools = [
  {
    id: 'official-tools',
    name: '191 Official Tools',
    icon: 'tower',
    description:
      'The TPMJS official tool collection: AI-powered utilities published to npm and synced to the registry.',
  },
];

const items = [
  ...externalServices,
  ...applications,
  ...publishedPackages,
  ...internalPackages,
  ...officialTools,
];

// ── View: positions + connectors ────────────────────────────────────
// Isometric grid layout. Items spaced ~4 tiles apart, grouped in rows.

const viewItems = [
  // Row y≈0: External Services (7 nodes)
  { id: 'npm-registry', tile: { x: 0, y: 0 } },
  { id: 'github', tile: { x: 4, y: 0 } },
  { id: 'vercel', tile: { x: 8, y: 0 } },
  { id: 'postgresql', tile: { x: 12, y: 0 } },
  { id: 'ai-providers', tile: { x: 16, y: 0 } },
  { id: 'discord', tile: { x: 20, y: 0 } },
  { id: 'resend', tile: { x: 24, y: 0 } },

  // Row y≈6: Applications (4 nodes)
  { id: 'web', tile: { x: 4, y: 6 } },
  { id: 'playground', tile: { x: 10, y: 6 } },
  { id: 'tutorial', tile: { x: 16, y: 6 } },
  { id: 'railway-executor', tile: { x: 22, y: 6 } },

  // Row y≈12: Published Packages — row 1 (5 nodes)
  { id: 'pkg-cli', tile: { x: 2, y: 12 } },
  { id: 'pkg-types', tile: { x: 6, y: 12 } },
  { id: 'pkg-ui', tile: { x: 10, y: 12 } },
  { id: 'pkg-utils', tile: { x: 14, y: 12 } },
  { id: 'pkg-env', tile: { x: 18, y: 12 } },

  // Row y≈16: Published Packages — row 2 (5 nodes)
  { id: 'pkg-bridge', tile: { x: 2, y: 16 } },
  { id: 'pkg-mcp-client', tile: { x: 6, y: 16 } },
  { id: 'pkg-executor-test', tile: { x: 10, y: 16 } },
  { id: 'pkg-registry-search', tile: { x: 14, y: 16 } },
  { id: 'pkg-registry-execute', tile: { x: 18, y: 16 } },

  // Row y≈21: Internal Packages (7 nodes)
  { id: 'int-db', tile: { x: 0, y: 21 } },
  { id: 'int-npm-client', tile: { x: 4, y: 21 } },
  { id: 'int-package-executor', tile: { x: 8, y: 21 } },
  { id: 'int-config', tile: { x: 12, y: 21 } },
  { id: 'int-test', tile: { x: 16, y: 21 } },
  { id: 'int-mocks', tile: { x: 20, y: 21 } },
  { id: 'int-logger', tile: { x: 24, y: 21 } },

  // Row y≈26: Official Tools (1 aggregate node)
  { id: 'official-tools', tile: { x: 12, y: 26 } },
];

// Helper to create a connector between two items
let connectorId = 0;
function conn(
  fromItem: string,
  toItem: string,
  color: string,
  style: 'SOLID' | 'DOTTED' | 'DASHED' = 'SOLID'
) {
  connectorId++;
  return {
    id: `c${connectorId}`,
    color,
    style,
    anchors: [
      { id: `c${connectorId}-a1`, ref: { item: fromItem } },
      { id: `c${connectorId}-a2`, ref: { item: toItem } },
    ],
  };
}

const connectors = [
  // External Services → Applications
  conn('npm-registry', 'web', 'orange'),
  conn('npm-registry', 'int-npm-client', 'orange', 'DASHED'),
  conn('github', 'web', 'orange'),
  conn('vercel', 'web', 'orange'),
  conn('vercel', 'playground', 'orange', 'DASHED'),
  conn('vercel', 'tutorial', 'orange', 'DASHED'),
  conn('postgresql', 'int-db', 'orange'),
  conn('ai-providers', 'web', 'orange'),
  conn('ai-providers', 'railway-executor', 'orange', 'DASHED'),
  conn('resend', 'web', 'orange', 'DASHED'),

  // Applications → Published Packages
  conn('web', 'pkg-types', 'blue'),
  conn('web', 'pkg-ui', 'blue'),
  conn('web', 'pkg-utils', 'blue'),
  conn('web', 'pkg-env', 'blue'),
  conn('web', 'pkg-registry-search', 'blue', 'DASHED'),
  conn('web', 'pkg-registry-execute', 'blue', 'DASHED'),

  // Internal → Applications
  conn('int-db', 'web', 'purple'),
  conn('int-npm-client', 'web', 'purple', 'DASHED'),
  conn('int-package-executor', 'railway-executor', 'purple'),

  // Official Tools → npm → web (publish & sync pipeline)
  conn('official-tools', 'npm-registry', 'pink'),
  conn('official-tools', 'pkg-cli', 'pink', 'DASHED'),

  // Bridge / MCP connections
  conn('pkg-bridge', 'web', 'green', 'DASHED'),
  conn('pkg-mcp-client', 'web', 'green', 'DASHED'),
];

// Colored rectangles to group categories
const rectangles = [
  {
    id: 'rect-external',
    color: 'orange',
    from: { x: -1, y: -1 },
    to: { x: 26, y: 2 },
  },
  {
    id: 'rect-apps',
    color: 'blue',
    from: { x: 3, y: 5 },
    to: { x: 24, y: 8 },
  },
  {
    id: 'rect-published',
    color: 'green',
    from: { x: 1, y: 11 },
    to: { x: 20, y: 18 },
  },
  {
    id: 'rect-internal',
    color: 'purple',
    from: { x: -1, y: 20 },
    to: { x: 26, y: 23 },
  },
  {
    id: 'rect-tools',
    color: 'pink',
    from: { x: 10, y: 25 },
    to: { x: 15, y: 28 },
  },
];

// Text labels for category regions
const textBoxes = [
  {
    id: 'label-external',
    tile: { x: -1, y: -2 },
    content: 'External Services',
    fontSize: 16,
    orientation: 'X' as const,
  },
  {
    id: 'label-apps',
    tile: { x: 3, y: 4 },
    content: 'Applications',
    fontSize: 16,
    orientation: 'X' as const,
  },
  {
    id: 'label-published',
    tile: { x: 1, y: 10 },
    content: 'Published Packages (@tpmjs/*)',
    fontSize: 16,
    orientation: 'X' as const,
  },
  {
    id: 'label-internal',
    tile: { x: -1, y: 19 },
    content: 'Internal Packages',
    fontSize: 16,
    orientation: 'X' as const,
  },
  {
    id: 'label-tools',
    tile: { x: 10, y: 24 },
    content: 'Official Tools',
    fontSize: 16,
    orientation: 'X' as const,
  },
];

export const techDiagramData: InitialData = {
  title: 'TPMJS Ecosystem Architecture',
  description:
    'Interactive isometric diagram of the TPMJS monorepo: external services, applications, published packages, internal packages, and official tools.',
  icons,
  colors,
  items,
  views: [
    {
      id: 'overview',
      name: 'Ecosystem Overview',
      description: 'Full view of the TPMJS architecture',
      items: viewItems,
      connectors,
      rectangles,
      textBoxes,
    },
  ],
  fitToView: true,
  view: 'overview',
};
