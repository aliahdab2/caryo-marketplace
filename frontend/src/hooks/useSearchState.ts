// Custom hook for managing search state and filters
// Extracts complex state management logic from the main component

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { DEFAULT_SORT } from '@/utils/sortUtils';

export interface UseSearchStateReturn {
  // Core state
  filters: AdvancedSearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedSearchFilters>>;
  selectedMake: number | null;
  setSelectedMake: React.Dispatch<React.SetStateAction<number | null>>;
  selectedModel: number | null;
  setSelectedModel: React.Dispatch<React.SetStateAction<number | null>>;
  selectedSort: string;
  setSelectedSort: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  
  // UI state
  activeFilterModal: FilterType | null;
  setActiveFilterModal: React.Dispatch<React.SetStateAction<FilterType | null>>;
  showLocationDropdown: boolean;
  setShowLocationDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Computed values
  filterCount: number;
  hasInitialized: boolean;
  
  // Actions
  updateFiltersAndState: (
    updates: Partial<AdvancedSearchFilters>,
    stateUpdates?: {
      selectedMake?: number | null;
      selectedModel?: number | null;
    }
  ) => void;
  handleInputChange: (field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => void;
  clearSpecificFilter: (filterType: FilterType) => void;
  updateUrlFromFilters: (newFilters: AdvancedSearchFilters) => void;
}

export function useSearchState(): UseSearchStateReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Core state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [selectedMake, setSelectedMake] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState(DEFAULT_SORT);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI state
  const [activeFilterModal, setActiveFilterModal] = useState<FilterType | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // Initialization state
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoized filter count for UI display
  const filterCount = useMemo(() => {
    return (
      (filters.brands?.length || 0) + 
      (filters.models?.length || 0) + 
      (filters.minPrice || filters.maxPrice ? 1 : 0) +
      (filters.minYear || filters.maxYear ? 1 : 0) +
      (filters.minMileage || filters.maxMileage ? 1 : 0) +
      (filters.transmissionId ? 1 : 0) +
      (filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0 ? 1 : 0) +
      (filters.bodyType?.length || 0) +
      (filters.sellerTypeIds?.length || 0)
    );
  }, [
    filters.brands,
    filters.models,
    filters.minPrice,
    filters.maxPrice,
    filters.minYear,
    filters.maxYear,
    filters.minMileage,
    filters.maxMileage,
    filters.transmissionId,
    filters.fuelTypeSlugs,
    filters.bodyType,
    filters.sellerTypeIds
  ]);

  // Initialize form from URL params (only once on mount)
  useEffect(() => {
    if (hasInitialized || !searchParams) return;

    const initialFilters: AdvancedSearchFilters = {};
    
    // Handle URL parameters with clean singular form
    const brands = searchParams.getAll('brand');
    const models = searchParams.getAll('model');
    
    if (brands.length > 0) {
      initialFilters.brands = brands;
    }
    
    if (models.length > 0) {
      initialFilters.models = models;
    }
    
    // Handle location parameters - support comma-separated values
    const locationParams = searchParams.getAll('location'); // Legacy support
    const locationsParam = searchParams.get('locations'); // New format
    
    if (locationsParam) {
      // Parse dash-separated locations (maximum SEO-friendly format)
      initialFilters.locations = locationsParam.split('-').map(loc => loc.trim()).filter(loc => loc);
    } else if (locationParams.length > 0) {
      // Backward compatibility for old multiple location parameters
      initialFilters.locations = locationParams;
    }
    
    // Other simple filters
    const minYear = searchParams.get('minYear');
    if (minYear) initialFilters.minYear = parseInt(minYear);
    
    const maxYear = searchParams.get('maxYear');  
    if (maxYear) initialFilters.maxYear = parseInt(maxYear);
    
    const minPrice = searchParams.get('minPrice');
    if (minPrice) initialFilters.minPrice = parseFloat(minPrice);
    
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) initialFilters.maxPrice = parseFloat(maxPrice);

    // Handle seller type IDs - support multiple values
    const sellerTypeIds = searchParams.getAll('sellerTypeId');
    if (sellerTypeIds.length > 0) {
      initialFilters.sellerTypeIds = sellerTypeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    // Handle body type - support hyphen-separated values
    const bodyTypeParam = searchParams.get('bodyType');
    if (bodyTypeParam) {
      initialFilters.bodyType = bodyTypeParam.split('-').map(type => type.trim()).filter(type => type.length > 0);
    }

    // Handle fuel type slugs - support multiple values
    const fuelTypeSlugs = searchParams.getAll('fuelType');
    if (fuelTypeSlugs.length > 0) {
      initialFilters.fuelTypeSlugs = fuelTypeSlugs.filter(slug => slug.trim());
    }

    setFilters(initialFilters);
    setHasInitialized(true);
  }, [hasInitialized, searchParams]);

  // Function to update URL when filters change
  const updateUrlFromFilters = useCallback((newFilters: AdvancedSearchFilters) => {
    const params = new URLSearchParams();
    
    // Location first for SEO - local relevance is primary
    if (newFilters.locations && newFilters.locations.length > 0) {
      // Use dash-separated values for maximum SEO-friendliness (no encoding ever)
      params.set('locations', newFilters.locations.join('-'));
    }
    
    // Add brand slugs - use singular form for clean URLs
    if (newFilters.brands && newFilters.brands.length > 0) {
      newFilters.brands.forEach(brand => {
        params.append('brand', brand);
      });
    }
    
    // Add model slugs - use singular form for clean URLs
    if (newFilters.models && newFilters.models.length > 0) {
      newFilters.models.forEach(model => {
        params.append('model', model);
      });
    }
    if (newFilters.minYear) params.append('minYear', newFilters.minYear.toString());
    if (newFilters.maxYear) params.append('maxYear', newFilters.maxYear.toString());
    if (newFilters.minPrice) params.append('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.append('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.minMileage) params.append('minMileage', newFilters.minMileage.toString());
    if (newFilters.maxMileage) params.append('maxMileage', newFilters.maxMileage.toString());

    if (newFilters.transmissionId) params.append('transmissionId', newFilters.transmissionId.toString());
    if (newFilters.fuelTypeSlugs && newFilters.fuelTypeSlugs.length > 0) {
      newFilters.fuelTypeSlugs.forEach(slug => params.append('fuelType', slug));
    }
    if (newFilters.bodyType && newFilters.bodyType.length > 0) {
      params.append('bodyType', newFilters.bodyType.join('-'));
    }
    if (newFilters.sellerTypeIds && newFilters.sellerTypeIds.length > 0) {
      newFilters.sellerTypeIds.forEach(id => params.append('sellerTypeId', id.toString()));
    }
    
    // Update URL without causing a page reload
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Consolidated filter update function to prevent race conditions
  const updateFiltersAndState = useCallback((
    updates: Partial<AdvancedSearchFilters>,
    stateUpdates?: {
      selectedMake?: number | null;
      selectedModel?: number | null;
    }
  ) => {
    // Update all states in a single batch to prevent race conditions
    if (stateUpdates?.selectedMake !== undefined) {
      setSelectedMake(stateUpdates.selectedMake);
    }
    if (stateUpdates?.selectedModel !== undefined) {
      setSelectedModel(stateUpdates.selectedModel);
    }
    
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      return newFilters;
    });
  }, []);

  // Handle input changes - simplified for slug-based filtering only
  const handleInputChange = useCallback((field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [field]: value || undefined
      };

      // Range validation: ensure max values are not less than min values
      if (field === 'minYear' && newFilters.maxYear && value && (value as number) > newFilters.maxYear) {
        newFilters.maxYear = undefined;
      }
      if (field === 'maxYear' && newFilters.minYear && value && (value as number) < newFilters.minYear) {
        newFilters.minYear = undefined;
      }
      if (field === 'minPrice' && newFilters.maxPrice && value && (value as number) > newFilters.maxPrice) {
        newFilters.maxPrice = undefined;
      }
      if (field === 'maxPrice' && newFilters.minPrice && value && (value as number) < newFilters.minPrice) {
        newFilters.minPrice = undefined;
      }
      if (field === 'minMileage' && newFilters.maxMileage && value && (value as number) > newFilters.maxMileage) {
        newFilters.maxMileage = undefined;
      }
      if (field === 'maxMileage' && newFilters.minMileage && value && (value as number) < newFilters.minMileage) {
        newFilters.minMileage = undefined;
      }
      
      return newFilters;
    });
  }, []);

  // Clear filter - simplified to prevent loops  
  const clearSpecificFilter = useCallback((filterType: FilterType) => {
    switch (filterType) {
      case 'makeModel':
        updateFiltersAndState(
          { brands: undefined, models: undefined },
          { selectedMake: null, selectedModel: null }
        );
        break;
      case 'price':
        updateFiltersAndState({ minPrice: undefined, maxPrice: undefined });
        break;
      case 'year':
        updateFiltersAndState({ minYear: undefined, maxYear: undefined });
        break;
      case 'mileage':
        updateFiltersAndState({ minMileage: undefined, maxMileage: undefined });
        break;
      case 'transmission':
        updateFiltersAndState({ transmissionId: undefined });
        break;
      case 'fuelType':
        updateFiltersAndState({ fuelTypeSlugs: undefined });
        break;
      case 'bodyStyle':
        updateFiltersAndState({ bodyType: undefined });
        break;
      case 'sellerType':
        updateFiltersAndState({ sellerTypeIds: undefined });
        break;
    }
  }, [updateFiltersAndState]);

  return {
    // Core state
    filters,
    setFilters,
    selectedMake,
    setSelectedMake,
    selectedModel,
    setSelectedModel,
    selectedSort,
    setSelectedSort,
    searchQuery,
    setSearchQuery,
    
    // UI state
    activeFilterModal,
    setActiveFilterModal,
    showLocationDropdown,
    setShowLocationDropdown,
    
    // Computed values
    filterCount,
    hasInitialized,
    
    // Actions
    updateFiltersAndState,
    handleInputChange,
    clearSpecificFilter,
    updateUrlFromFilters,
  };
}
