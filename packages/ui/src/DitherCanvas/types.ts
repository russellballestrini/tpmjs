/**
 * Type definitions for DitherCanvas components
 */

export interface DitherCanvasProps {
  /** Text to render and dither */
  text: string;

  /** Animation mode */
  mode: 'reveal' | 'pulse' | 'static';

  /** Animation speed in milliseconds (default: 2000) */
  speed?: number;

  /** Dithering threshold 0-255 (default: 128) */
  threshold?: number;

  /** Font string (e.g., "bold 120px Space Grotesk") */
  font?: string;

  /** Text color (default: currentColor) */
  color?: string;

  /** Additional CSS classes */
  className?: string;

  /** Delay before animation starts (ms, default: 0) */
  delay?: number;

  /** Callback when animation completes (reveal mode only) */
  onComplete?: () => void;

  /** Use low-detail dithering for performance */
  lowDetail?: boolean;
}
