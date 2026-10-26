import { useEffect, useRef } from 'react';

// Broadcasts aren't stored, so anything sent while a page was asleep or disconnected is lost.
// These helpers tell a page when to refetch to catch up.

/** Calls `refetch` whenever the tab comes back into view */
export function useRefetchOnReturn(enabled: boolean, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetchRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled]);
}

/**
 * A `channel.subscribe()` callback that calls `refetch` each time the channel rejoins
 * after a dropped connection (the first join is the initial load, so it's skipped).
 */
export function refetchOnRejoin(refetch: () => void) {
  let joined = false;
  return (status: string) => {
    if (status !== 'SUBSCRIBED') return;
    if (joined) refetch();
    joined = true;
  };
}
