'use client';

import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import { techDiagramData } from './techDiagramData';

// Isoflow uses canvas/paper.js and must be loaded client-side only
const Isoflow = dynamic(() => import('isoflow'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" label="Loading architecture diagram..." />
    </div>
  ),
});

// ── Error Boundary ──────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
}

class DiagramErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <p className="text-foreground-secondary">The interactive diagram failed to load.</p>
          <a href="/architecture" className="text-blue-500 hover:underline text-sm">
            View the alternative architecture diagram &rarr;
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main Component ──────────────────────────────────────────────────
export function TechDiagram() {
  return (
    <div className="w-full h-[700px] border border-border rounded-lg overflow-hidden bg-white">
      <DiagramErrorBoundary>
        <Isoflow
          initialData={techDiagramData}
          editorMode="EXPLORABLE_READONLY"
          width="100%"
          height="100%"
          renderer={{ showGrid: true }}
        />
      </DiagramErrorBoundary>
    </div>
  );
}
