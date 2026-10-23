'use client';

import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const memory = new Map<string, number>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A per-device number in localStorage (in memory when storage is blocked); `null` until set. */
export function useStoredNumber(key: string): [number | null, (value: number) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null && Number.isFinite(Number(raw))) return Number(raw);
      } catch {}
      return memory.get(key) ?? null;
    },
    () => null
  );
  const set = useCallback(
    (v: number) => {
      memory.set(key, v);
      try {
        localStorage.setItem(key, String(v));
      } catch {}
      listeners.forEach((l) => l());
    },
    [key]
  );
  return [value, set];
}
