/**
 * DitherHeadline Component
 *
 * Large hero headline with dramatic dithered reveal animation.
 * Supports multi-line text with staggered line reveals.
 */

'use client';

import { DitherCanvas } from '../DitherCanvas/DitherCanvas';
import type { DitherHeadlineProps } from './types';

export function DitherHeadline({
  children,
  delay = 500,
  stagger = 150,
  speed = 1500,
  fontSize = '120px',
  fontWeight = '800',
  className = '',
  onComplete,
}: DitherHeadlineProps): React.ReactElement {
  // Split text into lines
  const lines = children.split(/\n|<br\s*\/?>/);

  // Track completion
  const handleLineComplete = () => {
    onComplete?.();
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {lines.map((line, index) => (
        <DitherCanvas
          key={`${line}-${index}`}
          text={line}
          mode="reveal"
          speed={speed}
          delay={delay + index * stagger}
          font={`${fontWeight} ${fontSize} Space Grotesk, sans-serif`}
          threshold={128}
          onComplete={index === lines.length - 1 ? handleLineComplete : undefined}
          className="leading-none"
        />
      ))}
    </div>
  );
}
