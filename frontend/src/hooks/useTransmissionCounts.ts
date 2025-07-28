import { useState, useEffect } from 'react';
import { CarListingFilterParams } from '@/services/api';

export interface TransmissionCounts {
  [transmissionName: string]: number;
}

export const useTransmissionCounts = (filters?: CarListingFilterParams) => {
  const [transmissionCounts, setTransmissionCounts] = useState<TransmissionCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransmissionCounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query string for the transmission counts endpoint
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
        if (filters?.fuelTypeSlugs) filters.fuelTypeSlugs.forEach((slug: string) => params.append('fuelTypeSlugs', slug));
        if (filters?.bodyStyleIds) filters.bodyStyleIds.forEach((id: number) => params.append('bodyStyleIds', id.toString()));

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/counts/transmissions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The API returns a map of transmission names to counts
        setTransmissionCounts(data);
      } catch (err) {
        console.error('Failed to fetch transmission counts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transmission counts');
        setTransmissionCounts({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransmissionCounts();
  }, [filters]);

  return { transmissionCounts, isLoading, error };
}; 