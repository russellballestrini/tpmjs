'use client';

import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NodeDetailOverlay } from './NodeDetailOverlay';

// Node types for the diagram
type NodeType = 'tools' | 'npm' | 'tpmjs' | 'users' | 'executors' | 'outputs';

interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  children?: { id: string; label: string }[];
}

interface DiagramConnection {
  from: string;
  to: string;
  label: string;
}

// Color schemes for light and dark modes
const colorSchemes = {
  light: {
    tools: { fill: '#e3f2fd', stroke: '#1976d2', text: '#0d47a1' },
    npm: { fill: '#fff3e0', stroke: '#f57c00', text: '#e65100' },
    tpmjs: { fill: '#e8f5e9', stroke: '#388e3c', text: '#1b5e20' },
    users: { fill: '#f3e5f5', stroke: '#7b1fa2', text: '#4a148c' },
    executors: { fill: '#fce4ec', stroke: '#c2185b', text: '#880e4f' },
    outputs: { fill: '#e8f5e9', stroke: '#388e3c', text: '#1b5e20' },
  },
  dark: {
    tools: { fill: '#1e3a5f', stroke: '#64b5f6', text: '#90caf9' },
    npm: { fill: '#4a3000', stroke: '#ffb74d', text: '#ffe0b2' },
    tpmjs: { fill: '#1b4332', stroke: '#66bb6a', text: '#a5d6a7' },
    users: { fill: '#3a1f5c', stroke: '#ba68c8', text: '#ce93d8' },
    executors: { fill: '#4a1f35', stroke: '#f06292', text: '#f48fb1' },
    outputs: { fill: '#1b4332', stroke: '#66bb6a', text: '#a5d6a7' },
  },
};

// Node detail content for the drawer
export const nodeDetails: Record<
  string,
  {
    title: string;
    description: string;
    bullets: string[];
    links?: { label: string; href: string }[];
  }
> = {
  tools: {
    title: 'TPMJS Tools',
    description:
      'Tools are npm packages that export AI SDK-compatible functions. Any package can become a TPMJS tool by adding the tpmjs keyword and field to package.json.',
    bullets: [
      'Tools are standard npm packages with AI SDK tool exports',
      'Each tool has a description, parameters schema, and execute function',
      'Examples: weather-tool, calculator-tool, web-scraper',
    ],
    links: [
      { label: 'Browse Tools', href: '/tool/tool-search' },
      { label: 'Publish a Tool', href: '/publish' },
    ],
  },
  npm: {
    title: 'npm Registry',
    description:
      'The npm registry serves as the source of truth for TPMJS tools. Packages with the "tpmjs" keyword are automatically discovered and indexed.',
    bullets: [
      'Packages must have the "tpmjs" keyword in package.json',
      'Metadata is extracted from the "tpmjs" field',
      'Tools are dynamically loaded from esm.sh at runtime',
    ],
    links: [
      { label: 'TPMJS Specification', href: '/spec' },
      { label: 'Publishing Guide', href: '/publish' },
    ],
  },
  tpmjs: {
    title: 'TPMJS Platform',
    description:
      'TPMJS continuously syncs with npm to discover new tools, extract schemas, and calculate quality scores. The Tool Registry stores metadata for fast search and discovery.',
    bullets: [
      'Sync Workers poll npm every 2-15 minutes',
      'Schema extraction automatically analyzes tool signatures',
      'Quality scores based on metadata, downloads, and stars',
      'PostgreSQL database stores all tool metadata',
    ],
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'API Documentation', href: '/docs/api' },
    ],
  },
  users: {
    title: 'Users & Collections',
    description:
      'Users create Collections to group related tools, build AI Agents that use those tools, or connect MCP Servers directly to AI clients like Claude Desktop.',
    bullets: [
      'Collections group tools for specific use cases',
      'Agents are conversational AI assistants with tool access',
      'MCP Servers provide JSON-RPC endpoints for AI clients',
      'Share collections and agents via public URLs',
    ],
    links: [
      { label: 'Browse Collections', href: '/collections' },
      { label: 'Browse Agents', href: '/agents' },
      { label: 'MCP Documentation', href: '/docs#mcp-overview' },
    ],
  },
  executors: {
    title: 'Tool Executors',
    description:
      'Executors run tool code in secure sandboxes. The official executor runs on Railway with Deno, but you can deploy your own custom executor.',
    bullets: [
      'Official Sandbox: Deno runtime on Railway',
      'Tools loaded dynamically from esm.sh',
      'API keys passed per-request, never stored',
      'Custom executors can be self-hosted',
    ],
    links: [
      { label: 'Custom Executors', href: '/docs/executors' },
      { label: 'Security Model', href: '/docs#security' },
    ],
  },
  outputs: {
    title: 'Response Formats',
    description:
      'Tool execution results are returned in two formats: SSE for streaming playground responses, and JSON-RPC for MCP protocol compatibility.',
    bullets: [
      'SSE Response: Streaming text chunks for real-time UI',
      'JSON-RPC Response: MCP protocol for AI clients',
      'Both formats include tool outputs and metadata',
      'Execution time and token usage tracked',
    ],
    links: [
      { label: 'API Reference', href: '/docs/api' },
      { label: 'MCP Protocol', href: '/docs#mcp-protocol' },
    ],
  },
};

// Diagram data
const nodes: DiagramNode[] = [
  {
    id: 'tools',
    label: 'Tools',
    sublabel: 'npm packages',
    type: 'tools',
    children: [
      { id: 'weather', label: 'weather-tool' },
      { id: 'calculator', label: 'calculator' },
      { id: 'scraper', label: 'web-scraper' },
    ],
  },
  {
    id: 'npm',
    label: 'npm Registry',
    sublabel: "packages with 'tpmjs' keyword",
    type: 'npm',
  },
  {
    id: 'tpmjs',
    label: 'TPMJS',
    sublabel: 'Platform',
    type: 'tpmjs',
    children: [
      { id: 'sync', label: 'Sync Workers' },
      { id: 'registry', label: 'Tool Registry' },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    sublabel: 'collect & share',
    type: 'users',
    children: [
      { id: 'collections', label: 'Collections' },
      { id: 'agents', label: 'Agents' },
      { id: 'mcp', label: 'MCP Servers' },
    ],
  },
  {
    id: 'executors',
    label: 'Executors',
    sublabel: 'run tools',
    type: 'executors',
    children: [
      { id: 'sandbox', label: 'Official Sandbox' },
      { id: 'custom', label: 'Custom Executor' },
    ],
  },
  {
    id: 'outputs',
    label: 'Outputs',
    sublabel: 'responses',
    type: 'outputs',
    children: [
      { id: 'sse', label: 'SSE Response' },
      { id: 'jsonrpc', label: 'JSON-RPC' },
    ],
  },
];

const connections: DiagramConnection[] = [
  { from: 'tools', to: 'npm', label: 'publish' },
  { from: 'npm', to: 'tpmjs', label: 'sync' },
  { from: 'tpmjs', to: 'users', label: 'discover' },
  { from: 'users', to: 'executors', label: 'run' },
  { from: 'executors', to: 'outputs', label: 'return' },
];

export function SystemOverviewDiagram(): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle mounting for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const isMobile = width < 768;
        // Horizontal layout needs less height but more width
        const height = isMobile ? 1100 : 280;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || !mounted) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const isMobile = width < 768;
    const isDark = resolvedTheme === 'dark';
    const colors = isDark ? colorSchemes.dark : colorSchemes.light;

    // Calculate layout - LEFT TO RIGHT for desktop, TOP TO BOTTOM for mobile
    const padding = isMobile ? 20 : 30;
    const nodeCount = nodes.length;

    let nodePositions: Record<string, { x: number; y: number; width: number; height: number }>;

    if (isMobile) {
      // Mobile: vertical layout (top to bottom)
      const nodeHeight = 120;
      const nodeWidth = width - padding * 2;
      const verticalGap = 170;
      const startY = padding + nodeHeight / 2 + 10;
      const centerX = width / 2;

      nodePositions = {};
      nodes.forEach((node, i) => {
        nodePositions[node.id] = {
          x: centerX,
          y: startY + i * verticalGap,
          width: nodeWidth,
          height: nodeHeight,
        };
      });
    } else {
      // Desktop: horizontal layout (left to right)
      const nodeWidth = 160;
      const nodeHeight = 160;
      const totalNodesWidth = nodeCount * nodeWidth;
      const totalGapWidth = width - padding * 2 - totalNodesWidth;
      const gap = totalGapWidth / (nodeCount - 1);
      const startX = padding + nodeWidth / 2;
      const centerY = height / 2;

      nodePositions = {};
      nodes.forEach((node, i) => {
        nodePositions[node.id] = {
          x: startX + i * (nodeWidth + gap),
          y: centerY,
          width: nodeWidth,
          height: nodeHeight,
        };
      });
    }

    // Create defs for filters and markers
    const defs = svg.append('defs');

    // Drop shadow filter
    const shadow = defs
      .append('filter')
      .attr('id', 'overview-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    shadow
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '3')
      .attr('stdDeviation', '4')
      .attr('flood-color', isDark ? '#000' : '#000')
      .attr('flood-opacity', isDark ? '0.4' : '0.15');

    // Glow filter for hover
    const glow = defs
      .append('filter')
      .attr('id', 'overview-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker
    defs
      .append('marker')
      .attr('id', 'overview-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', isDark ? '#666' : '#999');

    const mainGroup = svg.append('g');

    // Draw connections with animation
    connections.forEach((conn, i) => {
      const fromPos = nodePositions[conn.from];
      const toPos = nodePositions[conn.to];
      if (!fromPos || !toPos) return;

      let pathData: string;
      let labelX: number;
      let labelY: number;

      if (isMobile) {
        // Vertical path (top to bottom)
        const startY = fromPos.y + fromPos.height / 2;
        const endY = toPos.y - toPos.height / 2;
        pathData = `M ${fromPos.x} ${startY} L ${toPos.x} ${endY - 10}`;
        labelX = fromPos.x + 8;
        labelY = (startY + endY) / 2;
      } else {
        // Horizontal path (left to right)
        const startX = fromPos.x + fromPos.width / 2;
        const endX = toPos.x - toPos.width / 2;
        pathData = `M ${startX} ${fromPos.y} L ${endX - 10} ${toPos.y}`;
        labelX = (startX + endX) / 2;
        labelY = fromPos.y - 12;
      }

      // Background path (static)
      mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', isDark ? '#333' : '#e5e5e5')
        .attr('stroke-width', 2);

      // Animated path
      const animatedPath = mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', isDark ? '#555' : '#aaa')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,8')
        .attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#overview-arrow)');

      // Get path length for animation
      const pathNode = animatedPath.node();
      if (pathNode) {
        const pathLength = (pathNode as SVGPathElement).getTotalLength();

        // Initial state - path not drawn
        animatedPath
          .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
          .attr('stroke-dashoffset', pathLength);

        // Animate path drawing on load
        animatedPath
          .transition()
          .delay(300 + i * 150)
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            // After draw animation, start flow animation
            animatedPath.attr('stroke-dasharray', '8,8').attr('stroke-dashoffset', 0);

            const animateFlow = () => {
              animatedPath
                .attr('stroke-dashoffset', 0)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', -32)
                .on('end', animateFlow);
            };
            animateFlow();
          });
      }

      // Connection label
      mainGroup
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#888' : '#666')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
        .attr('opacity', 0)
        .text(conn.label)
        .transition()
        .delay(400 + i * 150)
        .duration(400)
        .attr('opacity', 1);
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const pos = nodePositions[node.id];
      if (!pos) return;
      const color = colors[node.type];

      const nodeGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this)
            .select('.node-rect')
            .transition()
            .duration(200)
            .attr('stroke-width', 3)
            .attr('filter', 'url(#overview-glow)');
        })
        .on('mouseleave', function () {
          d3.select(this)
            .select('.node-rect')
            .transition()
            .duration(200)
            .attr('stroke-width', 2)
            .attr('filter', 'url(#overview-shadow)');
        })
        .on('click', () => handleNodeClick(node.id));

      // Main container rectangle
      nodeGroup
        .append('rect')
        .attr('class', 'node-rect')
        .attr('x', -pos.width / 2)
        .attr('y', -pos.height / 2)
        .attr('width', pos.width)
        .attr('height', pos.height)
        .attr('rx', 12)
        .attr('fill', color.fill)
        .attr('stroke', color.stroke)
        .attr('stroke-width', 2)
        .attr('filter', 'url(#overview-shadow)');

      // Node title
      nodeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', node.children ? -pos.height / 2 + 22 : -4)
        .attr('text-anchor', 'middle')
        .attr('fill', color.text)
        .attr('font-size', isMobile ? '14px' : '15px')
        .attr('font-weight', '700')
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
        .text(node.label);

      // Node sublabel
      if (node.sublabel) {
        nodeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', node.children ? -pos.height / 2 + 38 : 14)
          .attr('text-anchor', 'middle')
          .attr('fill', color.text)
          .attr('font-size', '11px')
          .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
          .attr('opacity', 0.7)
          .text(node.sublabel);
      }

      // Child items (if any)
      if (node.children) {
        const childStartY = -pos.height / 2 + 50;
        const childHeight = 22;
        const childGap = 4;

        node.children.forEach((child, ci) => {
          const childY = childStartY + ci * (childHeight + childGap);

          // Child pill background
          nodeGroup
            .append('rect')
            .attr('x', -pos.width / 2 + 12)
            .attr('y', childY)
            .attr('width', pos.width - 24)
            .attr('height', childHeight)
            .attr('rx', 4)
            .attr('fill', isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)')
            .attr('stroke', isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
            .attr('stroke-width', 1);

          // Child label
          nodeGroup
            .append('text')
            .attr('x', 0)
            .attr('y', childY + childHeight / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', color.text)
            .attr('font-size', '11px')
            .attr('font-family', 'ui-monospace, monospace')
            .text(child.label);
        });
      }

      // Entrance animation
      const startTransform = isMobile
        ? `translate(${pos.x}, ${pos.y - 20})`
        : `translate(${pos.x - 20}, ${pos.y})`;
      const endTransform = `translate(${pos.x}, ${pos.y})`;

      nodeGroup
        .attr('opacity', 0)
        .attr('transform', startTransform)
        .transition()
        .delay(100 + i * 60)
        .duration(400)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1)
        .attr('transform', endTransform);
    });
  }, [dimensions, mounted, resolvedTheme, handleNodeClick]);

  // Don't render until mounted (to avoid hydration mismatch)
  if (!mounted) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="p-4 md:p-6 border border-border rounded-xl bg-surface/50 min-h-[280px]" />
      </div>
    );
  }

  const selectedDetail = selectedNode ? nodeDetails[selectedNode] : null;

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative p-4 md:p-6 border border-border rounded-xl bg-surface/50 backdrop-blur overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="mx-auto relative"
          style={{ maxWidth: '100%', height: 'auto' }}
          role="img"
          aria-label="TPMJS System Overview diagram showing the flow from Tools to npm Registry to TPMJS Platform to Users to Executors to Outputs"
        />
      </div>

      {/* Node Detail Overlay */}
      {selectedDetail && selectedNode && (
        <NodeDetailOverlay
          open={!!selectedNode}
          onClose={handleCloseDrawer}
          nodeId={selectedNode}
          title={selectedDetail.title}
          description={selectedDetail.description}
          bullets={selectedDetail.bullets}
          links={selectedDetail.links}
        />
      )}
    </div>
  );
}
