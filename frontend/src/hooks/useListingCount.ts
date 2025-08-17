import { useEffect, useMemo, useState } from 'react';
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

  const update = useMemo(
    () =>
      debounce(async (f: ListingCountFilters) => {
        try {
          setIsLoading(true);
          const result = await getCarListingCountsPublic(f as never);
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
        const result = await getCarListingCountsPublic(filters as never);
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


