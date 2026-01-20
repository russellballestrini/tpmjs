'use client';

import * as d3 from 'd3';
import { useEffect } from 'react';
import { useDiagramSetup } from './useDiagramSetup';

/**
 * UsersDiagram - Visualizes user workflows and entities
 * Shows: User → Collections → Agents / MCP Servers → Sharing
 */
export function UsersDiagram(): React.ReactElement {
  const {
    svgRef,
    containerRef,
    tooltipRef,
    dimensions,
    mounted,
    setupSvg,
    drawConnection,
    drawNode,
  } = useDiagramSetup({ defaultHeight: 400 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: svgRef.current is a ref and doesn't need to be in deps
  useEffect(() => {
    if (!svgRef.current || !mounted) return;

    const svg = d3.select(svgRef.current);
    const mainGroup = setupSvg(svg);

    const { width, height } = dimensions;

    // Layout - hub and spoke from user
    const centerX = width / 2;
    const userY = 55;
    const midY = height / 2 - 10;
    const bottomY = height - 70;

    // Responsive column positions
    const leftX = Math.max(100, width * 0.2);
    const rightX = Math.min(width - 100, width * 0.8);

    // === User (top center) ===
    drawNode(mainGroup, centerX, userY, 120, 60, {
      label: 'User',
      sublabel: 'authenticated',
      type: 'secondary',
      tooltip: {
        title: 'Authenticated User',
        description: 'Sign in with GitHub or email to create and manage your tools.',
      },
      delay: 0,
    });

    // === Collections (center) ===
    drawNode(mainGroup, centerX, midY, 150, 65, {
      label: 'Collections',
      sublabel: 'group tools',
      type: 'primary',
      tooltip: {
        title: 'Tool Collections',
        description: 'Curate tools for specific use cases. Share with your team or the community.',
      },
      delay: 100,
    });

    // Collection features
    const collectionFeatures = [
      {
        label: 'Add tools',
        tooltip: {
          title: 'Add Tools',
          description: 'Browse registry and add any tool to your collection.',
        },
      },
      {
        label: 'Configure env',
        tooltip: {
          title: 'Environment Variables',
          description: 'Set API keys that are injected when tools execute.',
        },
      },
      {
        label: 'Share URL',
        tooltip: {
          title: 'Shareable URL',
          description: 'Each collection gets a unique public URL.',
        },
      },
    ];

    collectionFeatures.forEach((f, i) => {
      const x = centerX - 85 + i * 85;
      drawNode(mainGroup, x, midY + 60, 75, 32, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 150 + i * 30,
      });
    });

    // === Agents (bottom left) ===
    drawNode(mainGroup, leftX, bottomY, 140, 65, {
      label: 'AI Agents',
      sublabel: 'conversational',
      type: 'success',
      tooltip: {
        title: 'AI Agents',
        description: 'Create custom AI assistants with tool access. Multi-provider support.',
      },
      delay: 250,
    });

    // Agent features
    drawNode(mainGroup, leftX - 55, bottomY + 58, 95, 32, {
      label: 'Chat UI',
      type: 'neutral',
      tooltip: {
        title: 'Chat Interface',
        description: 'Built-in conversation UI with message history.',
      },
      delay: 280,
    });

    drawNode(mainGroup, leftX + 55, bottomY + 58, 95, 32, {
      label: 'API Access',
      type: 'neutral',
      tooltip: { title: 'API Access', description: 'Programmatic access to agents via REST API.' },
      delay: 310,
    });

    // === MCP Servers (bottom right) ===
    drawNode(mainGroup, rightX, bottomY, 140, 65, {
      label: 'MCP Servers',
      sublabel: 'protocol',
      type: 'info',
      tooltip: {
        title: 'MCP Servers',
        description:
          'Auto-generated MCP endpoints. Connect Claude Desktop, Cursor, or any MCP client.',
      },
      delay: 340,
    });

    // MCP clients
    const mcpClients = [
      {
        label: 'Claude',
        tooltip: { title: 'Claude Desktop', description: "Anthropic's desktop AI." },
      },
      { label: 'Cursor', tooltip: { title: 'Cursor IDE', description: 'AI-powered code editor.' } },
      {
        label: 'Custom',
        tooltip: { title: 'Custom Client', description: 'Any MCP-compatible client.' },
      },
    ];

    mcpClients.forEach((client, i) => {
      drawNode(mainGroup, rightX - 65 + i * 65, bottomY + 58, 60, 32, {
        label: client.label,
        type: 'neutral',
        tooltip: client.tooltip,
        delay: 370 + i * 30,
      });
    });

    // === Public sharing (top sides) ===
    drawNode(mainGroup, leftX, userY + 35, 110, 50, {
      label: 'Fork',
      sublabel: 'clone & customize',
      type: 'neutral',
      tooltip: {
        title: 'Fork Collections',
        description: 'Clone public collections to customize for your needs.',
      },
      delay: 450,
    });

    drawNode(mainGroup, rightX, userY + 35, 110, 50, {
      label: 'Browse',
      sublabel: 'discover tools',
      type: 'neutral',
      tooltip: {
        title: 'Browse Public',
        description: 'Explore public collections and agents from the community.',
      },
      delay: 480,
    });

    // === Connections ===
    // User to collections
    drawConnection(mainGroup, centerX, userY + 30, centerX, midY - 32, {
      label: 'create',
      animated: true,
      delay: 500,
    });

    // User to fork/browse
    drawConnection(mainGroup, centerX - 50, userY + 20, leftX + 55, userY + 25, {
      animated: true,
      delay: 520,
    });
    drawConnection(mainGroup, centerX + 50, userY + 20, rightX - 55, userY + 25, {
      animated: true,
      delay: 540,
    });

    // Collections to features
    drawConnection(mainGroup, centerX, midY + 32, centerX, midY + 44, {
      animated: true,
      dashed: true,
      delay: 560,
    });

    // Collections to Agents
    drawConnection(mainGroup, centerX - 60, midY + 25, leftX + 60, bottomY - 35, {
      label: 'powers',
      animated: true,
      curved: true,
      delay: 580,
    });

    // Collections to MCP
    drawConnection(mainGroup, centerX + 60, midY + 25, rightX - 60, bottomY - 35, {
      label: 'exposes',
      animated: true,
      curved: true,
      delay: 600,
    });

    // Agents to features
    drawConnection(mainGroup, leftX, bottomY + 32, leftX, bottomY + 42, {
      animated: true,
      dashed: true,
      delay: 620,
    });

    // MCP to clients
    drawConnection(mainGroup, rightX, bottomY + 32, rightX, bottomY + 42, {
      animated: true,
      dashed: true,
      delay: 640,
    });
  }, [dimensions, mounted, setupSvg, drawConnection, drawNode]);

  if (!mounted) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="h-80 bg-surface/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full"
        role="img"
        aria-label="Users and Collections workflow diagram"
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  );
}
