'use client';

import { useEffect, useState } from 'react';

export interface GlitchBarsProps {
  /**
   * Number of bars to render
   * @default 3
   */
  count?: number;

  /**
   * Minimum interval between glitches (ms)
   * @default 2000
   */
  minInterval?: number;

  /**
   * Maximum interval between glitches (ms)
   * @default 5000
   */
  maxInterval?: number;
}

/**
 * GlitchBars Component
 *
 * Renders decorative horizontal bars that randomly glitch/shift position.
 * Pure visual element for brutalist aesthetic.
 */
export function GlitchBars({
  count = 3,
  minInterval = 2000,
  maxInterval = 5000,
}: GlitchBarsProps): React.ReactElement {
  const [activeBar, setActiveBar] = useState<number | null>(null);

  useEffect(() => {
    const triggerGlitch = (): void => {
      const randomBar = Math.floor(Math.random() * count);
      setActiveBar(randomBar);

      // Reset after glitch animation completes
      setTimeout(() => {
        setActiveBar(null);
      }, 500);

      // Schedule next glitch
      const nextInterval = minInterval + Math.random() * (maxInterval - minInterval);
      setTimeout(triggerGlitch, nextInterval);
    };

    const initialDelay = Math.random() * 2000;
    const timeout = setTimeout(triggerGlitch, initialDelay);

    return () => {
      clearTimeout(timeout);
    };
  }, [count, minInterval, maxInterval]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const top = 20 + index * 25; // Distribute vertically
        const width = 100 + index * 50; // Varying widths
        const isLeft = index % 2 === 0;

        return (
          <div
            key={`glitch-bar-${index}`}
            className={`absolute h-1 ${
              index === 0 ? 'bg-brutalist-accent' : 'bg-foreground'
            } opacity-${index === 0 ? '80' : '20'} transition-transform duration-500 ease-in-out ${
              activeBar === index ? 'animate-glitch' : ''
            }`}
            style={{
              top: `${top}%`,
              width: `${width}px`,
              [isLeft ? 'left' : 'right']: 0,
            }}
          />
        );
      })}
    </div>
  );
}
