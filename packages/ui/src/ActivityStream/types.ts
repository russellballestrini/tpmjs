/**
 * Type definitions for ActivityStream component
 */

export interface ActivityItem {
  /** Activity type */
  type: 'invoked' | 'published' | 'updated';

  /** Tool name */
  tool: string;

  /** Time ago string (e.g., "2s ago") */
  time: string;
}

export interface ActivityStreamProps {
  /** Initial activity items */
  activities?: ActivityItem[];

  /** Update interval in milliseconds (default: 6000) */
  updateInterval?: number;

  /** Maximum number of items to display (default: 5) */
  maxItems?: number;

  /** Additional CSS classes */
  className?: string;
}
