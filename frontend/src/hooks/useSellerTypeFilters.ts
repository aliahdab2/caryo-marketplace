import { useState, useEffect, useCallback } from 'react';
import { getSellerTypeCounts } from '@/services/sellerTypes';
import { SellerTypeCounts } from '@/types/sellerTypes';

interface UseSellerTypeFiltersParams {
  filters: {
    brands?: string[];
    models?: string[];
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    minMileage?: number;
    maxMileage?: number;
    transmissionId?: number;
    fuelTypeId?: number;
    bodyStyleId?: number;
  };
}

interface UseSellerTypeFiltersReturn {
  sellerTypeCounts: SellerTypeCounts;
  isLoadingCounts: boolean;
  error: string | null;
  refetchCounts: () => Promise<void>;
}

export const useSellerTypeFilters = (params: UseSellerTypeFiltersParams): UseSellerTypeFiltersReturn => {
  const [sellerTypeCounts, setSellerTypeCounts] = useState<SellerTypeCounts>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    setError(null);
    
    try {
      // Convert filters to API format for count endpoint
      // Note: Seller type counts endpoint doesn't support transmission/fuel type filtering
      const apiFilters = {
        brandSlugs: params.filters.brands,
        modelSlugs: params.filters.models,
        minYear: params.filters.minYear?.toString(),
        maxYear: params.filters.maxYear?.toString(),
        minPrice: params.filters.minPrice?.toString(),
        maxPrice: params.filters.maxPrice?.toString(),
        minMileage: params.filters.minMileage?.toString(),
        maxMileage: params.filters.maxMileage?.toString(),
        // Don't include transmissionId, fuelTypeId, or bodyStyleId as they're not supported by this endpoint
        // Don't include sellerTypeId in count queries
      };
      
      const counts = await getSellerTypeCounts(apiFilters);
      setSellerTypeCounts(counts);
    } catch (err) {
      console.error('Error fetching seller type counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch seller type counts');
      setSellerTypeCounts({}); // Reset to empty on error
    } finally {
      setIsLoadingCounts(false);
    }
  }, [
    params.filters.brands,
    params.filters.models,
    params.filters.minYear,
    params.filters.maxYear,
    params.filters.minPrice,
    params.filters.maxPrice,
    params.filters.minMileage,
    params.filters.maxMileage
    // Removed transmissionId, fuelTypeId, and bodyStyleId as they're not supported by the seller type counts endpoint
  ]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    sellerTypeCounts,
    isLoadingCounts,
    error,
    refetchCounts: fetchCounts
  };
};
