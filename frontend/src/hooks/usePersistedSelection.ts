import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface PersistedSearchPrefs {
  version: number;
  timestamp: number;
  selectedMakeId: number | null;
  selectedModelId: number | null;
  selectedGovernorateSlug: string;
}

export interface PersistedSelectionApi {
  beginRestore: (prefs?: PersistedSearchPrefs | null) => void;
  finishRestore: () => void;
  read: () => PersistedSearchPrefs | null;
  write: (prefs: PersistedSearchPrefs) => void;
  getIsRestoring: () => boolean;
}

const STORAGE_KEY = 'caryo.homeSearch.preferences.v1';
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function readPrefs(): PersistedSearchPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSearchPrefs;
    if (!parsed || typeof parsed.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePrefs(prefs: PersistedSearchPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function usePersistedSelection(): PersistedSelectionApi {
  const restoringRef = useRef(false);

  useEffect(() => {
    // just to ensure ref is defined client-side
  }, []);

  const beginRestore = useCallback(() => {
    restoringRef.current = true;
  }, []);

  const finishRestore = useCallback(() => {
    restoringRef.current = false;
  }, []);

  const read = useCallback(() => readPrefs(), []);
  const write = useCallback((prefs: PersistedSearchPrefs) => writePrefs(prefs), []);
  const getIsRestoring = useCallback(() => restoringRef.current, []);

  return useMemo(() => ({
    beginRestore,
    finishRestore,
    read,
    write,
    getIsRestoring,
  }), [beginRestore, finishRestore, read, write, getIsRestoring]);
}


