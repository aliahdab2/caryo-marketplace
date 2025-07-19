import { useMemo, useCallback } from 'react';
import { CarListing, CarListingFilterParams } from '@/services/api';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';

interface UseSearchOptimizationsProps {
  filters: AdvancedSearchFilters;
  searchQuery: string;
  carListings?: CarListing[];
}

interface UseSearchOptimizationsReturn {
  // Memoized filter params for API calls
  memoizedListingFilters: CarListingFilterParams;
  
  // Memoized search data transformations
  memoizedCarListingData: Array<{
    id: string;
    title: string;
    price: number;
    location: string;
    imageUrl?: string;
    year?: number;
    mileage?: number;
    transmission?: string;
    fuelType?: string;
    description?: string;
    isFeatured?: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  
  // Optimized filter checking functions
  hasActiveFilters: boolean;
  filterCount: number;
  
  // Memoized sorting and filtering functions
  sortListings: (sortBy: string) => CarListing[];
  searchWithinResults: (query: string) => CarListing[];
}

export function useSearchOptimizations({
  filters,
  searchQuery,
  carListings = []
}: UseSearchOptimizationsProps): UseSearchOptimizationsReturn {
  
  // Memoize API filter parameters to prevent unnecessary API calls
  const memoizedListingFilters = useMemo<CarListingFilterParams>(() => {
    const params: CarListingFilterParams = {
      minYear: filters.minYear,
      maxYear: filters.maxYear,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minMileage: filters.minMileage,
      maxMileage: filters.maxMileage,
      locations: filters.locations,
      sellerTypeIds: filters.sellerTypeIds,
      searchQuery: searchQuery.trim() || undefined,
      size: 20,
      page: 0,
      sort: 'createdAt,desc',
      transmissionId: filters.transmissionId,
      fuelTypeId: filters.fuelTypeId,
      bodyStyleId: filters.bodyStyleId,
      conditionId: filters.conditionId
    };

    // Slug-based filtering - ensure we have valid arrays
    if (filters.brands && filters.brands.length > 0) {
      params.brands = filters.brands.filter(brand => brand && brand.trim());
    }
    
    if (filters.models && filters.models.length > 0) {
      params.models = filters.models.filter(model => model && model.trim());
    }

    return params;
  }, [
    filters.minYear,
    filters.maxYear,
    filters.minPrice,
    filters.maxPrice,
    filters.minMileage,
    filters.maxMileage,
    filters.locations,
    filters.sellerTypeIds,
    filters.transmissionId,
    filters.fuelTypeId,
    filters.bodyStyleId,
    filters.conditionId,
    filters.brands,
    filters.models,
    searchQuery
  ]);

  // Memoize transformed car listing data for display components
  const memoizedCarListingData = useMemo(() => {
    return carListings.map(listing => ({
      id: listing.id.toString(),
      title: listing.title || `${listing.modelYear || ''} ${listing.brandNameEn || ''} ${listing.modelNameEn || ''}`.trim() || 'Car Listing',
      price: listing.price || 0,
      location: listing.governorateNameEn || 'Location not specified',
      imageUrl: listing.media && listing.media.length > 0 ? listing.media[0].url : undefined,
      year: listing.modelYear,
      mileage: listing.mileage,
      transmission: listing.transmission || undefined,
      fuelType: listing.fuelType || undefined,
      description: listing.description || undefined,
      isFeatured: false, // This property doesn't exist in CarListing interface
      createdAt: listing.createdAt || new Date().toISOString(),
      updatedAt: listing.createdAt || new Date().toISOString() // Use createdAt as fallback
    }));
  }, [carListings]);

  // Memoize filter state calculations
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.brands?.length ||
      filters.models?.length ||
      filters.minYear ||
      filters.maxYear ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minMileage ||
      filters.maxMileage ||
      filters.locations?.length ||
      filters.transmissionId ||
      filters.fuelTypeId ||
      filters.bodyStyleId ||
      filters.conditionId ||
      filters.sellerTypeIds?.length
    );
  }, [filters]);

  const filterCount = useMemo(() => {
    let count = 0;
    if (filters.brands?.length) count++;
    if (filters.models?.length) count++;
    if (filters.minYear || filters.maxYear) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minMileage || filters.maxMileage) count++;
    if (filters.locations?.length) count++;
    if (filters.transmissionId) count++;
    if (filters.fuelTypeId) count++;
    if (filters.bodyStyleId) count++;
    if (filters.conditionId) count++;
    if (filters.sellerTypeIds?.length) count++;
    return count;
  }, [filters]);

  // Memoized sorting function to prevent recreation on every render
  const sortListings = useCallback((sortBy: string) => {
    const sorted = [...carListings];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'year-desc':
        return sorted.sort((a, b) => (b.modelYear || 0) - (a.modelYear || 0));
      case 'year-asc':
        return sorted.sort((a, b) => (a.modelYear || 0) - (b.modelYear || 0));
      case 'mileage-asc':
        return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case 'mileage-desc':
        return sorted.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
      case 'created-desc':
      default:
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }
  }, [carListings]);

  // Memoized search-within-results function for client-side filtering
  const searchWithinResults = useCallback((query: string) => {
    if (!query.trim()) return carListings;
    
    const lowerQuery = query.toLowerCase();
    return carListings.filter(listing => 
      listing.brandNameEn?.toLowerCase().includes(lowerQuery) ||
      listing.modelNameEn?.toLowerCase().includes(lowerQuery) ||
      listing.description?.toLowerCase().includes(lowerQuery) ||
      listing.governorateNameEn?.toLowerCase().includes(lowerQuery) ||
      listing.title?.toLowerCase().includes(lowerQuery)
    );
  }, [carListings]);

  return {
    memoizedListingFilters,
    memoizedCarListingData,
    hasActiveFilters,
    filterCount,
    sortListings,
    searchWithinResults
  };
}
