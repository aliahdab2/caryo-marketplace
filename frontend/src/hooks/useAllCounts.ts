import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';
import { buildQueryParams, getStandardErrorMessage } from '@/utils/apiUtils';
import { cachedFetch } from '@/utils/cachedFetch';

export interface AllCounts {
  fuelTypes: { [fuelTypeName: string]: number };
  bodyStyles: { [bodyStyleName: string]: number };
  transmissions: { [transmissionName: string]: number };
  brands: { [brandSlug: string]: number };
  models: { [modelSlug: string]: number };
}

export const useAllCounts = (filters?: CarListingFilterParams) => {
  const [counts, setCounts] = useState<AllCounts>({
    fuelTypes: {},
    bodyStyles: {},
    transmissions: {},
    brands: {},
    models: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
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

        // Use the new consolidated endpoint
        const data = await cachedFetch<AllCounts>(`/api/listings/counts/all?${params.toString()}`, {
          ttl: 2 * 60 * 1000, // Cache for 2 minutes
          cacheKey: `all-counts-${params.toString()}`
        });

        // Validate the response data
        if (data && typeof data === 'object') {
          setCounts(data);
        } else {
          console.warn('Invalid all counts response:', data);
          setCounts({
            fuelTypes: {},
            bodyStyles: {},
            transmissions: {},
            brands: {},
            models: {}
          });
        }
      } catch (err) {
        console.error('Failed to fetch all counts:', err);
        setError(getStandardErrorMessage('counts'));
        setCounts({
          fuelTypes: {},
          bodyStyles: {},
          transmissions: {},
          brands: {},
          models: {}
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  return {
    counts,
    isLoading,
    error,
    fuelTypeCounts: counts.fuelTypes,
    bodyStyleCounts: counts.bodyStyles,
    transmissionCounts: counts.transmissions,
    brandCounts: counts.brands,
    modelCounts: counts.models
  };
}; 