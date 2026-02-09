'use client';

import { useEffect, useRef } from 'react';

export function useTrackView(entityType: string, entityId: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !entityId) return;
    tracked.current = true;

    fetch('/api/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId }),
    }).catch(() => {});
  }, [entityType, entityId]);
}
