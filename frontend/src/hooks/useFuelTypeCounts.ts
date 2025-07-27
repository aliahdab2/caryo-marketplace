import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';

export interface FuelTypeCounts {
  [fuelTypeName: string]: number;
}

export const useFuelTypeCounts = (filters?: CarListingFilterParams) => {
  const [fuelTypeCounts, setFuelTypeCounts] = useState<FuelTypeCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFuelTypeCounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string for the fuel type counts endpoint
        const params = new URLSearchParams();
        if (filters?.brands) filters.brands.forEach((slug: string) => params.append('brandSlugs', slug));
        if (filters?.models) filters.models.forEach((slug: string) => params.append('modelSlugs', slug));
        if (filters?.minYear) params.append('minYear', filters.minYear.toString());
        if (filters?.maxYear) params.append('maxYear', filters.maxYear.toString());
        if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.minMileage) params.append('minMileage', filters.minMileage.toString());
        if (filters?.maxMileage) params.append('maxMileage', filters.maxMileage.toString());
        if (filters?.locations) filters.locations.forEach((location: string) => params.append('location', location));

        const response = await fetch(`http://localhost:8080/api/listings/counts/fuel-types?${params.toString()}`);
        const data = await response.json();
        
        // The API returns a map of fuel type names to counts
        setFuelTypeCounts(data);
      } catch (err) {
        console.error('Failed to fetch fuel type counts:', err);
        setError('Failed to load fuel type counts');
        setFuelTypeCounts({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchFuelTypeCounts();
  }, [filters]);

  return { fuelTypeCounts, isLoading, error };
}; 