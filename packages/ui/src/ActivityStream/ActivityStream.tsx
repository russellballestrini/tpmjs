/**
 * ActivityStream Component
 *
 * Live ticker showing recent tool activity (invocations, publications, updates).
 * Uses mock data to simulate a live ecosystem.
 */

'use client';

import { useEffect, useState } from 'react';
import type { ActivityItem, ActivityStreamProps } from './types';

// Mock data generator
const mockTools = [
  'web-scraper',
  'sql-query',
  'email-sender',
  'github-manager',
  'image-processor',
  'pdf-generator',
  'slack-bot',
  'calendar-sync',
  'data-validator',
  'file-converter',
];

const activityTypes: ActivityItem['type'][] = ['invoked', 'published', 'updated'];

function generateMockActivity(): ActivityItem {
  const type = activityTypes[Math.floor(Math.random() * activityTypes.length)] || 'invoked';
  const tool = mockTools[Math.floor(Math.random() * mockTools.length)] || 'unknown-tool';
  const seconds = Math.floor(Math.random() * 30) + 1;

  return {
    type,
    tool,
    time: `${seconds}s ago`,
  };
}

function getActivityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'invoked':
      return '▸';
    case 'published':
      return '+';
    case 'updated':
      return '↻';
    default:
      return '•';
  }
}

function getActivityColor(type: ActivityItem['type']): string {
  switch (type) {
    case 'invoked':
      return 'text-brutalist-accent';
    case 'published':
      return 'text-green-500';
    case 'updated':
      return 'text-yellow-500';
    default:
      return 'text-foreground-secondary';
  }
}

export function ActivityStream({
  activities: initialActivities,
  updateInterval = 6000,
  maxItems = 5,
  className = '',
}: ActivityStreamProps): React.ReactElement {
  // Initialize with provided activities or generate mock data
  const [activities, setActivities] = useState<ActivityItem[]>(
    initialActivities || Array.from({ length: maxItems }, generateMockActivity)
  );

  // Auto-update with new activities
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = generateMockActivity();

      setActivities((prev) => {
        const updated = [newActivity, ...prev];
        return updated.slice(0, maxItems);
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, maxItems]);

  return (
    <div
      className={`bg-surface border-2 border-foreground p-6 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground-secondary mb-4">
        Recent Activity
      </h3>

      <div className="space-y-2 font-mono text-sm">
        {activities.map((activity, index) => (
          <div
            key={`${activity.tool}-${activity.time}-${index}`}
            className="flex items-center gap-3 animate-slide-down"
            style={{
              animationDuration: '300ms',
              animationFillMode: 'backwards',
            }}
          >
            <span className={`${getActivityColor(activity.type)} font-bold w-4`}>
              {getActivityIcon(activity.type)}
            </span>

            <span className="text-foreground flex-1">
              <span className="font-bold">{activity.tool}</span>
              <span className="text-foreground-secondary"> {activity.type}</span>
            </span>

            <span className="text-foreground-tertiary text-xs">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
