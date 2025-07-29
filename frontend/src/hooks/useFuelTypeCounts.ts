import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';
import { API_BASE_URL, buildQueryParams, getStandardErrorMessage } from '@/utils/apiUtils';

export interface FuelTypeCounts {
  [fuelTypeName: string]: number;
}

export const useFuelTypeCounts = (filters?: CarListingFilterParams) => {
  const [fuelTypeCounts, setFuelTypeCounts] = useState<FuelTypeCounts>({});
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce the API calls to prevent excessive requests
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string for the fuel type counts endpoint
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
        });

        const response = await fetch(`${API_BASE_URL}/api/listings/counts/fuel-types?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The API returns a map of fuel type names to counts
        setFuelTypeCounts(data);
      } catch (err) {
        console.error('Failed to fetch fuel type counts:', err);
        setError(getStandardErrorMessage('fuel type counts'));
        setFuelTypeCounts({});
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  return { fuelTypeCounts, isLoading, error };
}; 