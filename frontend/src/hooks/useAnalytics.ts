import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { trackAction, type TrackActionPayload } from '../api/analytics';

const BATCH_INTERVAL_MS = 5000;

export function useAnalytics() {
  const { isAuthenticated } = useAuth();
  const queue = useRef<TrackActionPayload[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (!isAuthenticated || queue.current.length === 0) return;
    const batch = queue.current.splice(0);
    batch.forEach((payload) => trackAction(payload));
  }, [isAuthenticated]);

  const track = useCallback(
    (action: string, entityType?: string, entityId?: string, metadata?: string) => {
      if (!isAuthenticated) return;
      queue.current.push({ action, entityType, entityId, metadata });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, BATCH_INTERVAL_MS);
    },
    [isAuthenticated, flush]
  );

  // Flush on page unload via sendBeacon
  useEffect(() => {
    const handleUnload = () => {
      if (!isAuthenticated || queue.current.length === 0) return;
      const apiBase = import.meta.env.VITE_API_URL ?? '';
      queue.current.forEach((payload) => {
        navigator.sendBeacon(
          `${apiBase}/api/analytics/track`,
          new Blob(
            [JSON.stringify(payload)],
            { type: 'application/json' }
          )
        );
      });
      queue.current = [];
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload();
    });
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isAuthenticated]);

  return { track };
}
