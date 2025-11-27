/**
 * Type definitions for DitherText components
 */

export interface DitherHeadlineProps {
  /** Text content (can include line breaks) */
  children: string;

  /** Delay before animation starts (ms) */
  delay?: number;

  /** Delay between each line stagger (ms) */
  stagger?: number;

  /** Animation speed (ms) */
  speed?: number;

  /** Font size (CSS value, e.g., "120px") */
  fontSize?: string;

  /** Font weight (CSS value, e.g., "800") */
  fontWeight?: string;

  /** Additional CSS classes */
  className?: string;

  /** Callback when all lines complete */
  onComplete?: () => void;
}

export interface DitherSectionHeaderProps {
  /** Header text */
  children: string;

  /** Pulse speed (ms for full cycle) */
  pulseSpeed?: number;

  /** Font size (CSS value, e.g., "56px") */
  fontSize?: string;

  /** Font weight (CSS value, e.g., "700") */
  fontWeight?: string;

  /** Additional CSS classes */
  className?: string;
}
