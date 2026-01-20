'use client';

import * as d3 from 'd3';
import { useEffect } from 'react';
import { useDiagramSetup } from './useDiagramSetup';

/**
 * ExecutorsDiagram - Visualizes tool execution flow
 * Shows: Request → Executor → Sandbox → Tool Loading → Result
 */
export function ExecutorsDiagram(): React.ReactElement {
  const {
    svgRef,
    containerRef,
    tooltipRef,
    dimensions,
    mounted,
    isDark,
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

    // Layout - left to right flow
    const col1 = Math.max(80, width * 0.12);
    const col2 = Math.max(190, width * 0.32);
    const col3 = Math.max(320, width * 0.55);
    const col4 = Math.min(width - 80, width * 0.85);

    const topY = 55;
    const midY = height / 2;
    const bottomY = height - 55;

    // === Request (left) ===
    drawNode(mainGroup, col1, midY - 50, 120, 60, {
      label: 'API Request',
      sublabel: 'POST /execute',
      type: 'primary',
      tooltip: {
        title: 'Execution Request',
        description: 'Client sends tool ID, parameters, and optional environment variables.',
      },
      delay: 0,
    });

    // Request components
    const requestParts = [
      {
        label: 'toolId',
        tooltip: { title: 'Tool ID', description: 'Package name and export identifier.' },
      },
      {
        label: 'params',
        tooltip: { title: 'Parameters', description: 'Input arguments matching tool schema.' },
      },
      {
        label: 'env',
        tooltip: { title: 'Environment', description: 'API keys and secrets (per-request).' },
      },
    ];

    requestParts.forEach((part, i) => {
      drawNode(mainGroup, col1, midY + 35 + i * 38, 85, 30, {
        label: part.label,
        type: 'neutral',
        tooltip: part.tooltip,
        delay: 50 + i * 30,
      });
    });

    // === Executor (center-left) ===
    drawNode(mainGroup, col2, topY, 150, 60, {
      label: 'Official Executor',
      sublabel: 'Railway (Deno)',
      type: 'danger',
      tooltip: {
        title: 'Official Executor',
        description: 'Hosted on Railway. Sandboxed Deno runtime for secure execution.',
      },
      delay: 150,
    });

    drawNode(mainGroup, col2, topY + 90, 150, 60, {
      label: 'Custom Executor',
      sublabel: 'Self-hosted',
      type: 'neutral',
      tooltip: {
        title: 'Custom Executor',
        description: 'Deploy your own executor. Same API contract, your infrastructure.',
      },
      delay: 180,
    });

    // === Sandbox (center-right) ===
    drawNode(mainGroup, col3, midY - 25, 160, 70, {
      label: 'Deno Sandbox',
      sublabel: 'isolated runtime',
      type: 'info',
      tooltip: {
        title: 'Deno Sandbox',
        description:
          'Secure V8 isolate. No filesystem access. Network requests allowed for tool APIs.',
      },
      delay: 250,
    });

    // Sandbox features
    const sandboxFeatures = [
      {
        label: 'No FS access',
        tooltip: { title: 'No Filesystem', description: 'Tools cannot read or write local files.' },
      },
      {
        label: 'Time limit',
        tooltip: { title: 'Time Limit', description: '60 second max execution time.' },
      },
      {
        label: 'Memory cap',
        tooltip: { title: 'Memory Cap', description: 'Limited memory per execution.' },
      },
    ];

    sandboxFeatures.forEach((f, i) => {
      drawNode(mainGroup, col3, midY + 60 + i * 38, 105, 30, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 300 + i * 30,
      });
    });

    // === Tool Loading (top right) ===
    drawNode(mainGroup, col4, topY + 35, 130, 60, {
      label: 'Dynamic Import',
      sublabel: 'esm.sh',
      type: 'success',
      tooltip: {
        title: 'Dynamic Import',
        description: 'Tool code loaded from esm.sh CDN. No pre-installation required.',
      },
      delay: 400,
    });

    // === Result (bottom right) ===
    drawNode(mainGroup, col4, bottomY - 40, 130, 60, {
      label: 'Result',
      sublabel: 'JSON response',
      type: 'success',
      tooltip: {
        title: 'Execution Result',
        description: 'Tool output, execution time, and any errors returned to client.',
      },
      delay: 450,
    });

    // Result fields
    const resultFields = [
      { label: 'output', tooltip: { title: 'Output', description: 'Tool return value.' } },
      { label: 'timeMs', tooltip: { title: 'Timing', description: 'Execution duration.' } },
      { label: 'error?', tooltip: { title: 'Error', description: 'Error message if failed.' } },
    ];

    resultFields.forEach((f, i) => {
      const x = col4 - 55 + i * 55;
      drawNode(mainGroup, x, bottomY + 15, 50, 28, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 500 + i * 30,
      });
    });

    // === Connections ===
    // Request to executor
    drawConnection(mainGroup, col1 + 60, midY - 50, col2 - 75, topY + 15, {
      animated: true,
      delay: 580,
    });
    drawConnection(mainGroup, col1 + 60, midY - 30, col2 - 75, topY + 105, {
      animated: true,
      dashed: true,
      delay: 600,
    });

    // Request to parts
    drawConnection(mainGroup, col1, midY - 20, col1, midY + 20, {
      animated: true,
      dashed: true,
      delay: 620,
    });

    // Executors to sandbox
    drawConnection(mainGroup, col2 + 75, topY + 25, col3 - 80, midY - 40, {
      animated: true,
      delay: 640,
    });
    drawConnection(mainGroup, col2 + 75, topY + 105, col3 - 80, midY - 15, {
      animated: true,
      dashed: true,
      delay: 660,
    });

    // Sandbox to features
    drawConnection(mainGroup, col3, midY + 10, col3, midY + 45, {
      animated: true,
      dashed: true,
      delay: 680,
    });

    // Sandbox to tool loading
    drawConnection(mainGroup, col3 + 65, midY - 45, col4 - 65, topY + 50, {
      label: 'import',
      animated: true,
      curved: true,
      delay: 700,
    });

    // Tool loading to result
    drawConnection(mainGroup, col4, topY + 65, col4, bottomY - 70, {
      label: 'execute',
      animated: true,
      delay: 720,
    });

    // Result to fields
    drawConnection(mainGroup, col4, bottomY - 10, col4, bottomY + 1, {
      animated: true,
      dashed: true,
      delay: 740,
    });

    // Security badge
    const securityGroup = mainGroup
      .append('g')
      .attr('transform', `translate(${col3}, ${bottomY + 5})`);

    securityGroup
      .append('rect')
      .attr('x', -60)
      .attr('y', -14)
      .attr('width', 120)
      .attr('height', 28)
      .attr('rx', 14)
      .attr('fill', isDark ? '#1b4332' : '#e8f5e9')
      .attr('stroke', isDark ? '#66bb6a' : '#388e3c');

    securityGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 5)
      .attr('fill', isDark ? '#a5d6a7' : '#1b5e20')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('🔒 Sandboxed');
  }, [dimensions, mounted, isDark, setupSvg, drawConnection, drawNode]);

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
        aria-label="Tool Execution flow diagram"
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  );
}
