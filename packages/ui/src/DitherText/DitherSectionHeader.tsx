/**
 * DitherSectionHeader Component
 *
 * Section header with subtle pulsing dither effect.
 * Continuously animates for a "living" feel without being distracting.
 */

'use client';

import { DitherCanvas } from '../DitherCanvas/DitherCanvas';
import type { DitherSectionHeaderProps } from './types';

export function DitherSectionHeader({
  children,
  pulseSpeed = 3000,
  fontSize = '56px',
  fontWeight = '700',
  className = '',
}: DitherSectionHeaderProps): React.ReactElement {
  return (
    <div className={className}>
      <DitherCanvas
        text={children}
        mode="pulse"
        speed={pulseSpeed}
        font={`${fontWeight} ${fontSize} Space Grotesk, sans-serif`}
        threshold={128}
        className="leading-tight"
      />
    </div>
  );
}
