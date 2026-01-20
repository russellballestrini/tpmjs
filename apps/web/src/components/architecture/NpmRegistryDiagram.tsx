'use client';

import * as d3 from 'd3';
import { useEffect } from 'react';
import { useDiagramSetup } from './useDiagramSetup';

/**
 * NpmRegistryDiagram - Visualizes npm package discovery and loading
 * Shows: npm publish → registry → esm.sh → runtime loading
 */
export function NpmRegistryDiagram(): React.ReactElement {
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
  } = useDiagramSetup({ defaultHeight: 380 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: svgRef.current is a ref and doesn't need to be in deps
  useEffect(() => {
    if (!svgRef.current || !mounted) return;

    const svg = d3.select(svgRef.current);
    const mainGroup = setupSvg(svg);

    const { width, height } = dimensions;
    const centerY = height / 2;

    // Layout - horizontal flow with more spacing
    const col1 = Math.max(90, width * 0.12);
    const col2 = Math.max(200, width * 0.32);
    const col3 = Math.max(340, width * 0.55);
    const col4 = Math.min(width - 90, width * 0.85);

    // === Developer publishes ===
    drawNode(mainGroup, col1, centerY - 60, 120, 55, {
      label: 'Developer',
      sublabel: 'npm publish',
      type: 'neutral',
      tooltip: {
        title: 'Developer Publishes',
        description: 'Run "npm publish" to upload your package to the npm registry.',
      },
      delay: 0,
    });

    // === npm Registry ===
    drawNode(mainGroup, col2, centerY - 60, 150, 65, {
      label: 'npm Registry',
      sublabel: 'registry.npmjs.org',
      type: 'warning',
      tooltip: {
        title: 'npm Registry',
        description: 'The world\'s largest software registry. Hosts packages with "tpmjs" keyword.',
      },
      delay: 100,
    });

    // Registry features
    const features = [
      {
        label: '_changes feed',
        tooltip: { title: 'Changes Feed', description: 'Real-time stream of package updates.' },
      },
      {
        label: 'search API',
        tooltip: {
          title: 'Search API',
          description: 'Query packages by keyword, name, or description.',
        },
      },
      {
        label: 'tarball CDN',
        tooltip: {
          title: 'Tarball CDN',
          description: 'Download package source code as compressed archives.',
        },
      },
    ];

    features.forEach((f, i) => {
      drawNode(mainGroup, col2, centerY + 35 + i * 42, 120, 34, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 150 + i * 50,
      });
    });

    // === esm.sh CDN ===
    drawNode(mainGroup, col3, centerY - 60, 140, 65, {
      label: 'esm.sh',
      sublabel: 'ESM CDN',
      type: 'info',
      tooltip: {
        title: 'esm.sh CDN',
        description: 'Transforms npm packages to ES modules on-the-fly. Zero build step required.',
      },
      delay: 300,
    });

    // esm.sh features
    const esmFeatures = [
      {
        label: 'auto-bundling',
        tooltip: { title: 'Auto Bundling', description: 'Dependencies bundled automatically.' },
      },
      {
        label: 'TypeScript',
        tooltip: { title: 'TypeScript Support', description: 'Type definitions included.' },
      },
      {
        label: 'tree-shaking',
        tooltip: { title: 'Tree Shaking', description: 'Only imports what you use.' },
      },
    ];

    esmFeatures.forEach((f, i) => {
      drawNode(mainGroup, col3, centerY + 35 + i * 42, 115, 34, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 350 + i * 50,
      });
    });

    // === Runtime Loading ===
    drawNode(mainGroup, col4, centerY, 130, 70, {
      label: 'Runtime',
      sublabel: 'dynamic import()',
      type: 'success',
      tooltip: {
        title: 'Runtime Loading',
        description: 'Tools loaded dynamically at execution time. No pre-installation needed.',
      },
      delay: 500,
    });

    // === Connections ===
    // Developer to npm
    drawConnection(mainGroup, col1 + 60, centerY - 60, col2 - 75, centerY - 60, {
      label: 'publish',
      animated: true,
      delay: 550,
    });

    // npm to features
    drawConnection(mainGroup, col2, centerY - 27, col2, centerY + 18, {
      animated: true,
      dashed: true,
      delay: 600,
    });

    // npm to esm.sh
    drawConnection(mainGroup, col2 + 75, centerY - 60, col3 - 70, centerY - 60, {
      label: 'sync',
      animated: true,
      delay: 650,
    });

    // esm.sh to features
    drawConnection(mainGroup, col3, centerY - 27, col3, centerY + 18, {
      animated: true,
      dashed: true,
      delay: 700,
    });

    // esm.sh to runtime
    drawConnection(mainGroup, col3 + 70, centerY - 35, col4 - 65, centerY - 20, {
      label: 'import',
      animated: true,
      delay: 750,
    });

    // Decorative: URL example
    const urlGroup = mainGroup
      .append('g')
      .attr('transform', `translate(${(col3 + col4) / 2}, ${centerY + 100})`);

    urlGroup
      .append('rect')
      .attr('x', -140)
      .attr('y', -15)
      .attr('width', 280)
      .attr('height', 30)
      .attr('rx', 6)
      .attr('fill', isDark ? '#1a1a2e' : '#f8f9fa')
      .attr('stroke', isDark ? '#333' : '#e9ecef');

    urlGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 5)
      .attr('fill', isDark ? '#90caf9' : '#1976d2')
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, monospace')
      .text('esm.sh/@tpmjs/weather-tool@latest');
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
        aria-label="npm Registry discovery and loading diagram"
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  );
}
