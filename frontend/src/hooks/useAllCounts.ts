import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';
import { API_BASE_URL, buildQueryParams, getStandardErrorMessage } from '@/utils/apiUtils';

export interface AllCounts {
  fuelTypes: { [fuelTypeName: string]: number };
  bodyStyles: { [bodyStyleName: string]: number };
  transmissions: { [transmissionName: string]: number };
}

export const useAllCounts = (filters?: CarListingFilterParams) => {
  const [counts, setCounts] = useState<AllCounts>({
    fuelTypes: {},
    bodyStyles: {},
    transmissions: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce the API calls to prevent excessive requests
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string for the consolidated counts endpoint
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

        const response = await fetch(`${API_BASE_URL}/api/listings/counts/all?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The API returns an object with fuelTypes, bodyStyles, and transmissions
        setCounts(data);
      } catch (err) {
        console.error('Failed to fetch all counts:', err);
        setError(getStandardErrorMessage('counts'));
        setCounts({
          fuelTypes: {},
          bodyStyles: {},
          transmissions: {}
        });
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  return { 
    counts, 
    isLoading, 
    error,
    fuelTypeCounts: counts.fuelTypes,
    bodyStyleCounts: counts.bodyStyles,
    transmissionCounts: counts.transmissions
  };
}; 