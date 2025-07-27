import { useState, useEffect } from 'react';
import { fetchCarReferenceData } from '@/services/api';
import { CarListingFilterParams } from '@/services/api';

export interface BodyStyleCounts {
  [bodyStyleName: string]: number;
}

export const useBodyStyleCounts = (filters?: CarListingFilterParams) => {
  const [bodyStyleCounts, setBodyStyleCounts] = useState<BodyStyleCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBodyStyleCounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get all body styles from reference data
        const referenceData = await fetchCarReferenceData();
        
        // Add null check to prevent TypeError in test environments
        if (!referenceData || !referenceData.bodyStyles) {
          console.warn('Reference data or body styles not available');
          setBodyStyleCounts({});
          return;
        }
        
        const bodyStyles = referenceData.bodyStyles;

        // First, get the total count without body style filter
        const totalCountResponse = await fetch(`http://localhost:8080/api/listings/count/filter`);
        const totalCountData = await totalCountResponse.json();
        const totalCount = totalCountData.count || 0;

        // Fetch counts for each body style
        const counts: BodyStyleCounts = {};
        
        for (const bodyStyle of bodyStyles) {
          try {
            // Create filter params excluding bodyStyleId to avoid circular dependency
            const countFilters: CarListingFilterParams = {
              ...(filters?.brands && { brands: filters.brands }),
              ...(filters?.models && { models: filters.models }),
              ...(filters?.minYear && { minYear: filters.minYear }),
              ...(filters?.maxYear && { maxYear: filters.maxYear }),
              ...(filters?.minPrice && { minPrice: filters.minPrice }),
              ...(filters?.maxPrice && { maxPrice: filters.maxPrice }),
              ...(filters?.minMileage && { minMileage: filters.minMileage }),
              ...(filters?.maxMileage && { maxMileage: filters.maxMileage }),
              ...(filters?.locations && { locations: filters.locations }),
              ...(filters?.sellerTypeIds && { sellerTypeIds: filters.sellerTypeIds }),
              ...(filters?.searchQuery && { searchQuery: filters.searchQuery }),
              bodyStyleIds: [bodyStyle.id],
            };

            // Build query string for the count endpoint
            const params = new URLSearchParams();
            if (countFilters.bodyStyleIds && countFilters.bodyStyleIds.length > 0) {
              countFilters.bodyStyleIds.forEach(id => params.append('bodyStyleIds', id.toString()));
            }
            if (countFilters.brands) countFilters.brands.forEach((slug: string) => params.append('brandSlugs', slug));
            if (countFilters.models) countFilters.models.forEach((slug: string) => params.append('modelSlugs', slug));
            if (countFilters.minYear) params.append('minYear', countFilters.minYear.toString());
            if (countFilters.maxYear) params.append('maxYear', countFilters.maxYear.toString());
            if (countFilters.minPrice) params.append('minPrice', countFilters.minPrice.toString());
            if (countFilters.maxPrice) params.append('maxPrice', countFilters.maxPrice.toString());
            if (countFilters.minMileage) params.append('minMileage', countFilters.minMileage.toString());
            if (countFilters.maxMileage) params.append('maxMileage', countFilters.maxMileage.toString());
            if (countFilters.locations) countFilters.locations.forEach((location: string) => params.append('location', location));
            if (countFilters.sellerTypeIds) countFilters.sellerTypeIds.forEach((id: number) => params.append('sellerTypeIds', id.toString()));
            if (countFilters.searchQuery) params.append('searchQuery', countFilters.searchQuery);

            const response = await fetch(`http://localhost:8080/api/listings/count/filter?${params.toString()}`);
            const data = await response.json();
            
            const bodyStyleCount = data.count || 0;
            
            // If the body style count equals the total count, it means the filter isn't working
            // (likely because listings don't have body styles assigned)
            // In this case, show 0 to indicate no specific body style matches
            if (bodyStyleCount === totalCount && totalCount > 0) {
              counts[bodyStyle.name] = 0;
            } else {
              counts[bodyStyle.name] = bodyStyleCount;
            }
          } catch (countError) {
            console.warn(`Failed to fetch count for body style ${bodyStyle.name}:`, countError);
            counts[bodyStyle.name] = 0;
          }
        }

        setBodyStyleCounts(counts);
      } catch (err) {
        console.error('Failed to fetch body style counts:', err);
        setError('Failed to load body style counts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBodyStyleCounts();
  }, [filters]);

  return { bodyStyleCounts, isLoading, error };
}; 