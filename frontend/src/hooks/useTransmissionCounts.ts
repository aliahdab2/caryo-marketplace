import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';
import { buildQueryParams, getStandardErrorMessage } from '@/utils/apiUtils';
import { cachedFetch } from '@/utils/cachedFetch';

export interface TransmissionCounts {
  [transmissionName: string]: number;
}

export const useTransmissionCounts = (filters?: CarListingFilterParams) => {
  const [transmissionCounts, setTransmissionCounts] = useState<TransmissionCounts>({});
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce the API calls to prevent excessive requests
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string for the transmission counts endpoint
        const params = buildQueryParams({
          brandSlugs: filters?.brands,
          modelSlugs: filters?.models,
          minYear: filters?.minYear,
          maxYear: filters?.maxYear,
          minPrice: filters?.minPrice,
          maxPrice: filters?.maxPrice,
          minMileage: filters?.minMileage,
          maxMileage: filters?.maxMileage,
          location: filters?.locations,
          fuelTypeSlugs: filters?.fuelTypeSlugs,
          bodyStyleIds: filters?.bodyStyleIds,
        });

        const data = await cachedFetch<TransmissionCounts>(`/api/listings/counts/transmissions?${params.toString()}`, {
          ttl: 2 * 60 * 1000, // Cache for 2 minutes
          cacheKey: `transmissions-${params.toString()}`
        });
        
        // The API returns a map of transmission names to counts
        setTransmissionCounts(data);
      } catch (err) {
        console.error('Failed to fetch transmission counts:', err);
        setError(getStandardErrorMessage('transmission counts'));
        setTransmissionCounts({});
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  return { transmissionCounts, isLoading, error };
}; 