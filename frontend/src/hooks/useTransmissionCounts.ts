import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';
import { API_BASE_URL, buildQueryParams, getStandardErrorMessage } from '@/utils/apiUtils';

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

        const response = await fetch(`${API_BASE_URL}/api/listings/counts/transmissions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
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