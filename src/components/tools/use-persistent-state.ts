"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * useState that is mirrored to localStorage under `key`. The first render uses
 * `initial` (matching the server render); the stored value is applied once the
 * component mounts. Storage errors (private mode, quota) are ignored so the
 * tool keeps working, just without persistence.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  /** Fields applied on top of the stored value once loaded (e.g. URL presets). */
  override?: Partial<T>,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>({ ...initial, ...override });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // Syncing from an external store on mount; this cannot happen during render
      // without a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...initial, ...JSON.parse(raw), ...override } as T);
    } catch {
      /* ignore unreadable storage */
    }
    setLoaded(true);
    // `initial`/`override` are intentionally excluded: they only apply on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota / private mode */
    }
  }, [key, state, loaded]);

  return [state, setState, loaded];
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
