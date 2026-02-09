'use client';

import { useState } from 'react';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';

export function TechDiagram() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-[700px] border border-border rounded-lg overflow-hidden flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-foreground-secondary">
          The interactive diagram failed to load.
        </p>
        <a
          href="/architecture"
          className="text-blue-500 hover:underline text-sm"
        >
          View the alternative architecture diagram &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-[700px] border border-border rounded-lg overflow-hidden relative bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
          <Spinner size="lg" label="Loading architecture diagram..." />
        </div>
      )}
      <iframe
        src="/isoflow-embed.html"
        title="TPMJS Ecosystem Architecture Diagram"
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
