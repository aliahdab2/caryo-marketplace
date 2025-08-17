import { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { getCarListingCountsPublic } from '@/services/publicApi';

export type ListingCountFilters = {
  brands?: string[];
  models?: string[];
  locations?: string[];
};

export type UseListingCountResult = {
  count: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Debounced listing counter for public search filters.
 * Keeps calls minimal and returns a count suitable for UI badges/buttons.
 */
export function useListingCount(
  filters: ListingCountFilters,
  debounceMs: number = 300
): UseListingCountResult {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  // Tiny in-memory cache with short TTL to avoid spamming the API for quick toggles
  // Keyed by a stable string of filters
  const cacheRef = useRef<Map<string, { value: number; expiresAt: number }>>(new Map());
  const CACHE_TTL_MS = 30_000; // 30s

  const update = useMemo(
    () =>
      debounce(async (f: ListingCountFilters) => {
        try {
          setIsLoading(true);
          const key = `${(f.brands||[]).join('|')}::${(f.models||[]).join('|')}::${(f.locations||[]).join('|')}`;
          const cached = cacheRef.current.get(key);
          const now = Date.now();
          if (cached && cached.expiresAt > now) {
            setCount(cached.value);
            return;
          }

          // Abort any previous in-flight request
          if (abortRef.current) {
            abortRef.current.abort();
          }
          abortRef.current = new AbortController();

          const result = await getCarListingCountsPublic(f as never);
          cacheRef.current.set(key, { value: result, expiresAt: now + CACHE_TTL_MS });
          setCount(result);
        } catch {
          setCount(null);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs),
    [debounceMs]
  );

  // Stable dependency list to avoid infinite loops on object identity changes
  const brandsKey = (filters.brands || []).join('|');
  const modelsKey = (filters.models || []).join('|');
  const locationsKey = (filters.locations || []).join('|');

  useEffect(() => {
    update(filters);
    return () => update.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsKey, modelsKey, locationsKey, update]);

  const refresh = useMemo(
    () => async () => {
      // Cancel any pending debounced call to avoid stale overwrite
      update.cancel?.();
      setIsLoading(true);
      try {
        const key = `${(filters.brands||[]).join('|')}::${(filters.models||[]).join('|')}::${(filters.locations||[]).join('|')}`;
        const now = Date.now();
        // Abort any previous in-flight request
        if (abortRef.current) {
          abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        const result = await getCarListingCountsPublic(filters as never);
        cacheRef.current.set(key, { value: result, expiresAt: now + CACHE_TTL_MS });
        setCount(result);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandsKey, modelsKey, locationsKey]
  );

  return { count, isLoading, refresh };
}


