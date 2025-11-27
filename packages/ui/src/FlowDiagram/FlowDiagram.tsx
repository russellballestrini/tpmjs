/**
 * FlowDiagram Component
 *
 * Animated SVG diagram showing the flow from AI Agent → Semantic Query → Registry → Tools.
 * Uses stroke-dashoffset animation for path reveals and expanding circles for radiating effect.
 */

'use client';

import type { FlowDiagramProps } from './types';

export function FlowDiagram({
  className = '',
  speed = 5000,
  autoPlay = true,
}: FlowDiagramProps): React.ReactElement {
  const animationDuration = `${speed / 1000}s`;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <svg
        viewBox="0 0 400 500"
        className="w-full h-auto"
        role="img"
        aria-label="Flow diagram showing AI Agent discovering tools through TPMJS Registry"
      >
        {/* Definitions */}
        <defs>
          {/* Glow filter for accent elements */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow marker */}
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--brutalist-accent))" />
          </marker>
        </defs>

        {/* AI Agent (Top) */}
        <g id="agent">
          <rect
            x="150"
            y="20"
            width="100"
            height="60"
            className="fill-surface stroke-foreground"
            strokeWidth="2"
            rx="0"
          />
          <text
            x="200"
            y="45"
            className="text-sm font-mono font-bold fill-foreground"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            AI Agent
          </text>
        </g>

        {/* Arrow 1: Agent → Query */}
        <path
          id="path1"
          d="M 200 80 L 200 130"
          className="stroke-brutalist-accent"
          strokeWidth="3"
          fill="none"
          markerEnd="url(#arrowhead)"
          strokeDasharray="50"
          strokeDashoffset={autoPlay ? '-50' : '0'}
          style={{
            animation: autoPlay ? `flowPath ${animationDuration} infinite` : 'none',
          }}
        />

        {/* Semantic Query */}
        <g id="query">
          <rect
            x="120"
            y="130"
            width="160"
            height="50"
            className="fill-brutalist-accent/10 stroke-brutalist-accent"
            strokeWidth="2"
            rx="0"
          />
          <text
            x="200"
            y="152"
            className="text-xs font-mono font-bold fill-foreground"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            Semantic Query
          </text>
          <text
            x="200"
            y="168"
            className="text-xs font-mono fill-foreground-secondary"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            &quot;email, slack...&quot;
          </text>
        </g>

        {/* Arrow 2: Query → Registry */}
        <path
          id="path2"
          d="M 200 180 L 200 240"
          className="stroke-brutalist-accent"
          strokeWidth="3"
          fill="none"
          markerEnd="url(#arrowhead)"
          strokeDasharray="60"
          strokeDashoffset={autoPlay ? '-60' : '0'}
          style={{
            animation: autoPlay ? `flowPath ${animationDuration} 0.5s infinite` : 'none',
          }}
        />

        {/* Registry (Center - with shimmer) */}
        <g id="registry">
          <rect
            x="100"
            y="240"
            width="200"
            height="80"
            className="fill-surface stroke-foreground"
            strokeWidth="3"
            rx="0"
          />
          <text
            x="200"
            y="265"
            className="text-base font-bold fill-foreground"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            TPMJS REGISTRY
          </text>
          <text
            x="200"
            y="285"
            className="text-xs font-mono fill-foreground-secondary"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            Dynamic Discovery
          </text>
          <text
            x="200"
            y="305"
            className="text-xs font-mono fill-brutalist-accent"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            2,847 tools
          </text>
        </g>

        {/* Radiating circles from registry (expanding pulse) */}
        <circle
          cx="200"
          cy="280"
          r="5"
          className="fill-none stroke-brutalist-accent"
          strokeWidth="2"
          opacity="0"
          style={{
            animation: autoPlay ? `radiate ${animationDuration} 1s infinite` : 'none',
          }}
        />

        {/* Arrows 3a, 3b, 3c: Registry → Tools */}
        <path
          id="path3a"
          d="M 150 320 L 80 380"
          className="stroke-brutalist-accent"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          strokeDasharray="80"
          strokeDashoffset={autoPlay ? '-80' : '0'}
          style={{
            animation: autoPlay ? `flowPath ${animationDuration} 1.5s infinite` : 'none',
          }}
        />
        <path
          id="path3b"
          d="M 200 320 L 200 380"
          className="stroke-brutalist-accent"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          strokeDasharray="60"
          strokeDashoffset={autoPlay ? '-60' : '0'}
          style={{
            animation: autoPlay ? `flowPath ${animationDuration} 1.5s infinite` : 'none',
          }}
        />
        <path
          id="path3c"
          d="M 250 320 L 320 380"
          className="stroke-brutalist-accent"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          strokeDasharray="80"
          strokeDashoffset={autoPlay ? '-80' : '0'}
          style={{
            animation: autoPlay ? `flowPath ${animationDuration} 1.5s infinite` : 'none',
          }}
        />

        {/* Tool Cards (Bottom) */}
        <g id="tools">
          {/* Tool A */}
          <rect
            x="20"
            y="380"
            width="100"
            height="80"
            className="fill-surface stroke-foreground"
            strokeWidth="2"
            rx="0"
          />
          <text x="70" y="405" className="text-sm font-bold fill-foreground" textAnchor="middle">
            Email
          </text>
          <text
            x="70"
            y="425"
            className="text-xs font-mono fill-foreground-secondary"
            textAnchor="middle"
          >
            Tool
          </text>
          <text x="70" y="445" className="text-xs fill-brutalist-accent" textAnchor="middle">
            12K calls
          </text>

          {/* Tool B */}
          <rect
            x="150"
            y="380"
            width="100"
            height="80"
            className="fill-surface stroke-foreground"
            strokeWidth="2"
            rx="0"
          />
          <text x="200" y="405" className="text-sm font-bold fill-foreground" textAnchor="middle">
            Slack
          </text>
          <text
            x="200"
            y="425"
            className="text-xs font-mono fill-foreground-secondary"
            textAnchor="middle"
          >
            Tool
          </text>
          <text x="200" y="445" className="text-xs fill-brutalist-accent" textAnchor="middle">
            8K calls
          </text>

          {/* Tool C */}
          <rect
            x="280"
            y="380"
            width="100"
            height="80"
            className="fill-surface stroke-foreground"
            strokeWidth="2"
            rx="0"
          />
          <text x="330" y="405" className="text-sm font-bold fill-foreground" textAnchor="middle">
            Calendar
          </text>
          <text
            x="330"
            y="425"
            className="text-xs font-mono fill-foreground-secondary"
            textAnchor="middle"
          >
            Tool
          </text>
          <text x="330" y="445" className="text-xs fill-brutalist-accent" textAnchor="middle">
            5K calls
          </text>
        </g>

        {/* CSS animations inline for self-containment */}
        <style>
          {`
            @keyframes flowPath {
              0% { stroke-dashoffset: 100; }
              40% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 0; }
            }

            @keyframes radiate {
              0% { r: 5; opacity: 0; }
              20% { opacity: 0.6; }
              100% { r: 100; opacity: 0; }
            }
          `}
        </style>
      </svg>
    </div>
  );
}
