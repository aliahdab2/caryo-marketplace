import { useState, useCallback, useEffect } from 'react';
import { getTransmissionCounts } from '@/services/api';

export interface TransmissionCounts {
  [key: string]: number;
}

interface UseTransmissionCountsParams {
  filters: {
    brands?: string[];
    models?: string[];
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    minMileage?: number;
    maxMileage?: number;
    locations?: string[];
    locationId?: number;
    sellerTypeIds?: number[];
    fuelTypeSlugs?: string[];
    bodyType?: string[];
  };
}

interface UseTransmissionCountsReturn {
  transmissionCounts: TransmissionCounts;
  isLoadingCounts: boolean;
  error: string | null;
  refetchCounts: () => Promise<void>;
}

export const useTransmissionCounts = (params: UseTransmissionCountsParams): UseTransmissionCountsReturn => {
  const [transmissionCounts, setTransmissionCounts] = useState<TransmissionCounts>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    console.log('🔄 Fetching transmission counts with filters:', params.filters);
    setIsLoadingCounts(true);
    setError(null);
    
    try {
      // Convert filters to API format for count endpoint
      const apiFilters = {
        brandSlugs: params.filters.brands,
        modelSlugs: params.filters.models,
        minYear: params.filters.minYear?.toString(),
        maxYear: params.filters.maxYear?.toString(),
        minPrice: params.filters.minPrice?.toString(),
        maxPrice: params.filters.maxPrice?.toString(),
        minMileage: params.filters.minMileage?.toString(),
        maxMileage: params.filters.maxMileage?.toString(),
        location: params.filters.locations,
        locationId: params.filters.locationId?.toString(),
        sellerTypeIds: params.filters.sellerTypeIds?.map(id => id.toString()),
        fuelTypeSlugs: params.filters.fuelTypeSlugs,
        bodyType: params.filters.bodyType,
      };
      
      console.log('📡 API filters:', apiFilters);
      const counts = await getTransmissionCounts(apiFilters);
      console.log('✅ Received transmission counts:', counts);
      setTransmissionCounts(counts);
    } catch (err) {
      console.error('❌ Error fetching transmission counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transmission counts');
      setTransmissionCounts({}); // Reset to empty on error
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
    params.filters.maxMileage,
    params.filters.locations,
    params.filters.locationId,
    params.filters.sellerTypeIds,
    params.filters.fuelTypeSlugs,
    params.filters.bodyType,
  ]);

  // Call fetchCounts when the component mounts or when filters change
  useEffect(() => {
    console.log('🚀 useTransmissionCounts useEffect triggered');
    fetchCounts();
  }, [fetchCounts]);

  console.log('📊 Current transmission counts state:', transmissionCounts);

  return {
    transmissionCounts,
    isLoadingCounts,
    error,
    refetchCounts: fetchCounts,
  };
}; 