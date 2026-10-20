'use client';

import { useEffect } from 'react';

/** Keeps the screen on while `active` (Screen Wake Lock API, when supported); re-acquires after tab switches. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) s.release();
        else sentinel = s;
      } catch {
        // Denied (battery saver, hidden tab) — nothing to do.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release();
    };
  }, [active]);
}
