"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useOptimizedFiltering } from '@/hooks/useOptimizedFiltering';
import SmoothTransition from '@/components/ui/SmoothTransition';
import { 
  MdClose,
  MdDirectionsCar,
  MdSearch,
  MdFavoriteBorder,
  MdFilterList
} from 'react-icons/md';
import { CarMake, CarModel } from '@/types/car';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { 
  fetchCarBrands, 
  fetchCarModels,
  fetchCarReferenceData,
  fetchCarListings,
  fetchGovernorates,
  CarReferenceData,
  CarListing,
  PageResponse,
  CarListingFilterParams,
  Governorate
} from '@/services/api';
import { getSellerTypeCounts } from '@/services/sellerTypes';
import { SellerTypeCounts } from '@/types/sellerTypes';
import { useApiData } from '@/hooks/useApiData';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { DEFAULT_CURRENCY } from '@/utils/currency';
import { formatNumber } from '@/utils/localization';
import { useLanguageDirection } from '@/utils/languageDirection';
import CarListingSkeleton from '@/components/ui/CarListingSkeleton';
import FilterModal from '@/components/search/FilterModal';
import LocationDropdown from '@/components/search/LocationDropdown';
import FilterChips from '@/components/search/FilterChips';

// Move namespaces outside component to prevent recreation on every render
const SEARCH_NAMESPACES = ['common', 'search'];

export default function AdvancedSearchPage() {
  const { t, i18n } = useLazyTranslation(SEARCH_NAMESPACES);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dirClass, isRTL } = useLanguageDirection();
  
  // Extract language to prevent i18n object recreation causing re-renders
  const currentLanguage = i18n.language;

  // Form state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [selectedMake, setSelectedMake] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [activeFilterModal, setActiveFilterModal] = useState<FilterType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [sellerTypeCounts, setSellerTypeCounts] = useState<SellerTypeCounts>({});
  
  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = document.querySelector('.location-dropdown-container');
      
      // Only close if clicking outside the entire dropdown container
      // Don't close immediately to allow for checkbox interactions
      if (dropdown && !dropdown.contains(target)) {
        setShowLocationDropdown(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLocationDropdown(false);
      }
    };

    if (showLocationDropdown) {
      // Use a slight delay to register the click handler
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showLocationDropdown]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Memoize listing filters to prevent unnecessary re-creation
  const listingFilters = useMemo<CarListingFilterParams>(() => {
    const params: CarListingFilterParams = {
      minYear: filters.minYear,
      maxYear: filters.maxYear,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minMileage: filters.minMileage,
      maxMileage: filters.maxMileage,
      locations: filters.locations,
      sellerTypeIds: filters.sellerTypeIds,
      searchQuery: searchQuery.trim() || undefined, // Include search query
      size: 20, // Default page size
      page: 0, // Default to first page
      sort: 'createdAt,desc', // Default sort
      
      // Add missing filter fields that are defined in CarListingFilterParams
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
    filters,
    searchQuery
  ]);

  // Car listings state using optimized filtering
  const {
    data: carListings,
    isLoading: isLoadingListings,
    isManualSearch,
    error: listingsError,
    search: executeSearch
  } = useOptimizedFiltering<CarListingFilterParams, PageResponse<CarListing>>(
    listingFilters,
    fetchCarListings,
    {
      debounceMs: 300,
      minLoadingDelayMs: 150,
      immediate: false
    }
  );

  // API data hooks - with stable dependencies to prevent loops
  const {
    data: carMakes = [],
    isLoading: isLoadingBrands,
    error: brandsError
  } = useApiData<CarMake[]>(
    fetchCarBrands,
    '/api/reference-data/brands',
    [] // No dependencies needed - brands don't change
  );

  // Stable dependency for models to prevent loops
  const modelsFetchKey = useMemo(() => 
    selectedMake ? `/api/reference-data/brands/${selectedMake}/models` : '', 
    [selectedMake]
  );

  // Stable fetch function to prevent recreation on every render
  const fetchModelsFunction = useMemo(() => 
    () => selectedMake ? fetchCarModels(selectedMake) : Promise.resolve([]),
    [selectedMake]
  );

  const {
    data: availableModels = [],
    isLoading: isLoadingModels,
    error: modelsError
  } = useApiData<CarModel[]>(
    fetchModelsFunction,
    modelsFetchKey,
    [] // Empty dependencies - the key change will trigger the refetch
  );

  const {
    data: referenceData,
    isLoading: isLoadingReferenceData,
    error: referenceDataError
  } = useApiData<CarReferenceData>(
    fetchCarReferenceData,
    '/api/reference-data',
    [] // No dependencies needed - reference data doesn't change
  );

  const {
    data: governorates = [],
    isLoading: _isLoadingGovernorates,
    error: _governoratesError
  } = useApiData<Governorate[]>(
    fetchGovernorates,
    '/api/reference-data/governorates',
    [] // No dependencies needed - governorates don't change
  );

  // Helper functions to get display names for reference data - memoized to prevent re-renders
  const getTransmissionDisplayName = useMemo(() => 
    (id: number): string => {
      const transmission = referenceData?.transmissions?.find(t => t.id === id);
      return transmission ? (currentLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn) : '';
    }, [referenceData?.transmissions, currentLanguage]
  );

  const getFuelTypeDisplayName = useMemo(() => 
    (id: number): string => {
      const fuelType = referenceData?.fuelTypes?.find(f => f.id === id);
      return fuelType ? (currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn) : '';
    }, [referenceData?.fuelTypes, currentLanguage]
  );

  const getBodyStyleDisplayName = useMemo(() => 
    (id: number): string => {
      const bodyStyle = referenceData?.bodyStyles?.find(b => b.id === id);
      return bodyStyle ? (currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn) : '';
    }, [referenceData?.bodyStyles, currentLanguage]
  );

  const getSellerTypeDisplayName = useMemo(() => 
    (id: number): string => {
      const sellerType = referenceData?.sellerTypes?.find(s => s.id === id);
      if (sellerType && typeof sellerType === 'object' && 'displayNameEn' in sellerType && 'displayNameAr' in sellerType) {
        const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string };
        return currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
      }
      return '';
    }, [referenceData?.sellerTypes, currentLanguage]
  );

  // Memoized filter count for UI display
  const filterCount = useMemo(() => {
    return (
      (filters.brands?.length || 0) + 
      (filters.models?.length || 0) + 
      (filters.minPrice || filters.maxPrice ? 1 : 0) +
      (filters.minYear || filters.maxYear ? 1 : 0) +
      (filters.minMileage || filters.maxMileage ? 1 : 0) +
      (filters.transmissionId ? 1 : 0) +
      (filters.fuelTypeId ? 1 : 0) +
      (filters.bodyStyleId ? 1 : 0) +
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
    filters.fuelTypeId,
    filters.bodyStyleId,
    filters.sellerTypeIds
  ]);

  // Helper functions to convert slugs to display names
  const getBrandDisplayNameFromSlug = useCallback((slug: string): string => {
    const brand = carMakes?.find(make => make.slug === slug);
    return brand ? (currentLanguage === 'ar' ? brand.displayNameAr : brand.displayNameEn) : slug;
  }, [carMakes, currentLanguage]);

  const getModelDisplayNameFromSlug = useCallback((slug: string): string => {
    // First try to find in current availableModels
    const model = availableModels?.find(model => model.slug === slug);
    if (model) {
      return currentLanguage === 'ar' ? model.displayNameAr : model.displayNameEn;
    }
    
    // If not found, try to extract display name from slug
    // Convert slug like "honda-civic" to "Honda Civic"
    const words = slug.split('-');
    const displayName = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return displayName;
  }, [availableModels, currentLanguage]);

  // Simplified form state initialization to prevent loops
  const [hasInitialized, setHasInitialized] = useState(false);

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

    setFilters(initialFilters);
    setHasInitialized(true);
  }, [hasInitialized, searchParams]);

  // Function to update URL when filters change
  // URLs use clean singular form (brand/model) for SEO and UX
  // Backend API expects plural form (brandSlugs/modelSlugs)
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
    if (newFilters.fuelTypeId) params.append('fuelTypeId', newFilters.fuelTypeId.toString());
    if (newFilters.bodyStyleId) params.append('bodyStyleId', newFilters.bodyStyleId.toString());
    if (newFilters.sellerTypeIds && newFilters.sellerTypeIds.length > 0) {
      newFilters.sellerTypeIds.forEach(id => params.append('sellerTypeId', id.toString()));
    }
    
    // Update URL without causing a page reload
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Trigger search after filters are initialized - always search to show results
  useEffect(() => {
    if (hasInitialized) {
      executeSearch(false);
    }
  }, [hasInitialized, listingFilters, executeSearch]);

  // Update URL when filters change (but not during initial load)
  useEffect(() => {
    if (hasInitialized) {
      updateUrlFromFilters(filters);
    }
  }, [filters, hasInitialized, updateUrlFromFilters]);

  // Convert brand/model slugs to selected IDs when data loads (optimized)
  useEffect(() => {
    if (!carMakes || carMakes.length === 0) return;
    
    if (filters.brands && filters.brands.length > 0) {
      const firstBrandSlug = filters.brands[0];
      const brand = carMakes.find(make => make.slug === firstBrandSlug);
      if (brand && selectedMake !== brand.id) {
        setSelectedMake(brand.id);
      }
    } else if (filters.brands?.length === 0 && selectedMake !== null) {
      setSelectedMake(null);
    }
  }, [filters.brands, carMakes, selectedMake]);

  useEffect(() => {
    if (!availableModels || availableModels.length === 0) return;
    
    if (filters.models && filters.models.length > 0) {
      const firstModelSlug = filters.models[0];
      const model = availableModels.find(m => m.slug === firstModelSlug);
      if (model && selectedModel !== model.id) {
        setSelectedModel(model.id);
      }
    } else if (filters.models?.length === 0 && selectedModel !== null) {
      setSelectedModel(null);
    }
  }, [filters.models, availableModels, selectedModel]);

  // Memoize seller type fetch dependencies to prevent unnecessary API calls
  const sellerTypeCountDependencies = useMemo(() => ({
    brands: filters.brands,
    models: filters.models,
    minYear: filters.minYear,
    maxYear: filters.maxYear,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minMileage: filters.minMileage,
    maxMileage: filters.maxMileage,
    transmissionId: filters.transmissionId,
    fuelTypeId: filters.fuelTypeId,
    bodyStyleId: filters.bodyStyleId
  }), [filters.brands, filters.models, filters.minYear, filters.maxYear, filters.minPrice, filters.maxPrice, filters.minMileage, filters.maxMileage, filters.transmissionId, filters.fuelTypeId, filters.bodyStyleId]);

  // Fetch seller type counts when filters change (Swedish marketplace style)
  useEffect(() => {
    const fetchSellerTypeCounts = async () => {
      try {
        // Convert filters to API format for count endpoint
        const apiFilters = {
          brandSlugs: sellerTypeCountDependencies.brands,
          modelSlugs: sellerTypeCountDependencies.models,
          minYear: sellerTypeCountDependencies.minYear?.toString(),
          maxYear: sellerTypeCountDependencies.maxYear?.toString(),
          minPrice: sellerTypeCountDependencies.minPrice?.toString(),
          maxPrice: sellerTypeCountDependencies.maxPrice?.toString(),
          minMileage: sellerTypeCountDependencies.minMileage?.toString(),
          maxMileage: sellerTypeCountDependencies.maxMileage?.toString(),
          transmissionId: sellerTypeCountDependencies.transmissionId,
          fuelTypeId: sellerTypeCountDependencies.fuelTypeId,
          bodyStyleId: sellerTypeCountDependencies.bodyStyleId,
          // Don't include sellerTypeId in count queries
        };
        
        const counts = await getSellerTypeCounts(apiFilters);
        setSellerTypeCounts(counts);
      } catch (error) {
        console.error('Error fetching seller type counts:', error);
        setSellerTypeCounts({}); // Reset to empty on error
      }
    };

    fetchSellerTypeCounts();
  }, [sellerTypeCountDependencies]);

  // ESC key handler to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveFilterModal(null);
      }
    };

    // Only add listener if a modal is open
    if (activeFilterModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [activeFilterModal]);

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
        // If new minYear is greater than current maxYear, clear maxYear
        newFilters.maxYear = undefined;
      }
      if (field === 'maxYear' && newFilters.minYear && value && (value as number) < newFilters.minYear) {
        // If new maxYear is less than current minYear, clear minYear
        newFilters.minYear = undefined;
      }
      if (field === 'minPrice' && newFilters.maxPrice && value && (value as number) > newFilters.maxPrice) {
        // If new minPrice is greater than current maxPrice, clear maxPrice
        newFilters.maxPrice = undefined;
      }
      if (field === 'maxPrice' && newFilters.minPrice && value && (value as number) < newFilters.minPrice) {
        // If new maxPrice is less than current minPrice, clear minPrice
        newFilters.minPrice = undefined;
      }
      if (field === 'minMileage' && newFilters.maxMileage && value && (value as number) > newFilters.maxMileage) {
        // If new minMileage is greater than current maxMileage, clear maxMileage
        newFilters.maxMileage = undefined;
      }
      if (field === 'maxMileage' && newFilters.minMileage && value && (value as number) < newFilters.minMileage) {
        // If new maxMileage is less than current minMileage, clear minMileage
        newFilters.minMileage = undefined;
      }
      
      return newFilters;
    });
  }, []);

  // Clear filter - simplified to prevent loops  
  const clearSpecificFilter = useCallback((filterType: FilterType) => {
    switch (filterType) {
      case 'makeModel':
        // Clear slug-based filters only
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
        updateFiltersAndState({ fuelTypeId: undefined });
        break;
      case 'bodyStyle':
        updateFiltersAndState({ bodyStyleId: undefined });
        break;
      case 'sellerType':
        updateFiltersAndState({ sellerTypeIds: undefined });
        break;
    }
  }, [updateFiltersAndState]);

  // Get filter display text - memoized to prevent re-renders
  const getFilterDisplayText = useCallback((filterType: FilterType): string => {
    switch (filterType) {
      case 'makeModel':
        // Display slug-based selections with proper localized names
        if (filters.brands && filters.brands.length > 0) {
          const brandNames = filters.brands.map(slug => getBrandDisplayNameFromSlug(slug));
          let display = brandNames.join(', ');
          
          if (filters.models && filters.models.length > 0) {
            const modelNames = filters.models.map(slug => getModelDisplayNameFromSlug(slug));
            display += ` - ${modelNames.join(', ')}`;
          }
          return display;
        }
        return t('makeAndModel', 'Make and model');
      case 'price':
        if (filters.minPrice && filters.maxPrice) return `${formatNumber(filters.minPrice, currentLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${formatNumber(filters.maxPrice, currentLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        if (filters.minPrice) return `${t('from', 'From')} ${formatNumber(filters.minPrice, currentLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        if (filters.maxPrice) return `${t('upTo', 'Up to')} ${formatNumber(filters.maxPrice, currentLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        return t('price', 'Price');
      case 'year':
        if (filters.minYear && filters.maxYear) return `${filters.minYear} - ${filters.maxYear}`;
        if (filters.minYear) return `${t('from', 'From')} ${filters.minYear}`;
        if (filters.maxYear) return `${t('upTo', 'Up to')} ${filters.maxYear}`;
        return t('year', 'Year');
      case 'mileage':
        if (filters.minMileage && filters.maxMileage) return `${filters.minMileage} - ${filters.maxMileage}`;
        if (filters.minMileage) return `${t('from', 'From')} ${filters.minMileage}`;
        if (filters.maxMileage) return `${t('upTo', 'Up to')} ${filters.maxMileage}`;
        return t('mileage', 'Mileage');
      case 'transmission':
        return filters.transmissionId ? getTransmissionDisplayName(filters.transmissionId) : t('transmission', 'Transmission');

      case 'fuelType':
        return filters.fuelTypeId ? getFuelTypeDisplayName(filters.fuelTypeId) : t('fuelType', 'Fuel type');
      case 'bodyStyle':
        return filters.bodyStyleId ? getBodyStyleDisplayName(filters.bodyStyleId) : t('bodyStyle', 'Body style');
      case 'sellerType':
        return filters.sellerTypeIds && filters.sellerTypeIds.length > 0 
          ? filters.sellerTypeIds.length === 1 
            ? getSellerTypeDisplayName(filters.sellerTypeIds[0])
            : `${filters.sellerTypeIds.length} ${t('sellerType', 'Seller types')}`
          : t('sellerType', 'Seller type');
      default:
        return '';
    }
  }, [filters, t, getBrandDisplayNameFromSlug, getModelDisplayNameFromSlug, getTransmissionDisplayName, getFuelTypeDisplayName, getBodyStyleDisplayName, getSellerTypeDisplayName, currentLanguage]);

  // Check if filter has active values - memoized to prevent re-renders
  const isFilterActive = useCallback((filterType: FilterType): boolean => {
    switch (filterType) {
      case 'makeModel':
        return !!(
          (filters.brands && filters.brands.length > 0) ||
          (filters.models && filters.models.length > 0)
        );
      case 'price':
        return !!(filters.minPrice || filters.maxPrice);
      case 'year':
        return !!(filters.minYear || filters.maxYear);
      case 'mileage':
        return !!(filters.minMileage || filters.maxMileage);
      case 'transmission':
        return !!filters.transmissionId;

      case 'fuelType':
        return !!filters.fuelTypeId;
      case 'bodyStyle':
        return !!filters.bodyStyleId;
      case 'sellerType':
        return !!(filters.sellerTypeIds && filters.sellerTypeIds.length > 0);
      default:
        return false;
    }
  }, [filters]);

  // Filter pill component with memo for performance
  const FilterPill = React.memo(({ filterType, onClick }: { filterType: FilterType; onClick: () => void }) => {
    const isActive = isFilterActive(filterType);
    const displayText = getFilterDisplayText(filterType);
    
    return (
      <button
        onClick={onClick}
        className={`group relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-blue-800'
            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
        aria-label={`Filter by ${displayText}`}
      >
        <span className="relative z-10 flex items-center">
          {displayText}
        </span>

        {/* Animated background for active state */}
        {isActive && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        )}
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </div>
      </button>
    );
  });
  FilterPill.displayName = 'FilterPill';

  const handleSearch = () => {
    setSearchLoading(true);
    
    // Close location dropdown if open
    setShowLocationDropdown(false);
    
    // The URL is already updated by the filters, so just execute search
    // The search query will be sent to the backend which will handle both English and Arabic text search
    // No need to manually parse brands/models here - the backend will search in all relevant fields
    
    // Simply trigger a search with the current search query
    // The listingFilters already includes the searchQuery, so executeSearch will use it
    executeSearch(false);
    
    setTimeout(() => {
      setSearchLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Compact Search Bar */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            {/* Mobile-first layout */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3">
              {/* Text Search Input */}
              <div className="flex-1">
                <label htmlFor="car-search-input" className="sr-only">
                  {t('searchLabel', 'Search for cars by make, model, or location')}
                </label>
                <div className="flex gap-2 sm:relative">
                  <div className="flex-1 relative">
                    <input
                      id="car-search-input"
                      type="text"
                      placeholder={t('placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      className={`w-full py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                        currentLanguage === 'ar' ? 'text-right dir-rtl pr-3 pl-3 sm:pl-28' : 'text-left pl-3 pr-3 sm:pr-28'
                      }`}
                      dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                      aria-label={t('searchLabel', 'Search for cars by make, model, or location')}
                      aria-describedby="search-help"
                    />
                    
                    {/* Clear button when there's text */}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                        }}
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1 z-10 ${
                          currentLanguage === 'ar' ? 'left-2 sm:left-20' : 'right-2 sm:right-20'
                        }`}
                        aria-label={t('clearSearch', 'Clear search')}
                      >
                        <MdClose className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  
                  {/* Search Button - separate on mobile, inside on desktop */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // Only execute search if there's actual content to search for
                      if (searchQuery.trim()) {
                        handleSearch();
                      }
                    }}
                    className={`
                      px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                      text-white rounded text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02]
                      min-w-[80px] touch-manipulation
                      sm:absolute sm:top-1 sm:bottom-1 sm:px-4 sm:text-xs sm:min-w-0 sm:hover:scale-100
                      ${currentLanguage === 'ar' ? 'sm:left-1 sm:rounded-md' : 'sm:right-1 sm:rounded-md'}
                    `}
                    aria-label={t('searchButton', 'Search for cars')}
                  >
                    {searchLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span className="sr-only">{t('searching', 'Searching...')}</span>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <MdSearch className="mr-1.5 h-4 w-4" />
                        <span className="whitespace-nowrap">{t('search', 'Search')}</span>
                      </div>
                    )}
                  </button>
                  
                  <div id="search-help" className="sr-only">
                    {t('searchHelp', 'Enter car make, model, or location and press Enter or click Search button')}
                  </div>
                </div>
              </div>
              
              {/* Multi-Location Filter */}
              <LocationDropdown
                filters={filters}
                setFilters={setFilters}
                showLocationDropdown={showLocationDropdown}
                setShowLocationDropdown={setShowLocationDropdown}
                governorates={governorates || undefined}
                currentLanguage={currentLanguage}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                t={t as any}
              />
            </div>
            
          </div>
        </div>

        {/* Enhanced Filter Bar */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
          <div className="flex flex-col space-y-2">
            {/* Filter Pills Section */}
            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap gap-2">
                {/* Show All Filters Button */}
                <button
                  onClick={() => setActiveFilterModal('allFilters')}
                  className="group relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="Show all filters"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <MdFilterList className="w-4 h-4" />
                    <span>{t('showAllFilters', 'Show all filters')}</span>
                  </span>

                  {/* Ripple effect */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  </div>
                </button>
                
                <FilterPill filterType="makeModel" onClick={() => setActiveFilterModal('makeModel')} />
                <FilterPill filterType="price" onClick={() => setActiveFilterModal('price')} />
                <FilterPill filterType="year" onClick={() => setActiveFilterModal('year')} />
                <FilterPill filterType="mileage" onClick={() => setActiveFilterModal('mileage')} />
                <FilterPill filterType="transmission" onClick={() => setActiveFilterModal('transmission')} />
                <FilterPill filterType="fuelType" onClick={() => setActiveFilterModal('fuelType')} />
                <FilterPill filterType="bodyStyle" onClick={() => setActiveFilterModal('bodyStyle')} />
                <FilterPill filterType="sellerType" onClick={() => setActiveFilterModal('sellerType')} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          isFilterActive={isFilterActive}
          filterCount={filterCount}
          updateFiltersAndState={updateFiltersAndState}
          getBrandDisplayNameFromSlug={getBrandDisplayNameFromSlug}
          getModelDisplayNameFromSlug={getModelDisplayNameFromSlug}
          getFilterDisplayText={getFilterDisplayText}
          getTransmissionDisplayName={getTransmissionDisplayName}
          getFuelTypeDisplayName={getFuelTypeDisplayName}
          getBodyStyleDisplayName={getBodyStyleDisplayName}
          getSellerTypeDisplayName={getSellerTypeDisplayName}
          selectedMake={selectedMake}
          selectedModel={selectedModel}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t={t as any}
        />

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {carListings?.totalElements ? `${carListings.totalElements.toLocaleString()} ${t('results', 'results')}` : t('loading', 'Loading...')}
            </p>
          </div>
          
          <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
            <MdFavoriteBorder className="mr-2 h-4 w-4" />
            {t('saveSearch', 'Save search')}
          </button>
        </div>

        {/* Car Listings Grid with Smooth Transitions */}
        <SmoothTransition
          isLoading={isLoadingListings}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          loadingType={isManualSearch ? 'overlay' : 'full'}
          minimumLoadingTime={isManualSearch ? 100 : 200}
          loadingComponent={
            isManualSearch ? (
              // Subtle spinner for manual searches
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              // Full skeleton loading for automatic changes
              <>
                {Array.from({ length: 8 }).map((_, index) => (
                  <CarListingSkeleton key={index} />
                ))}
              </>
            )
          }
        >
          {listingsError ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">
                  {t('errorLoadingResults', 'Error loading results')}
                </div>
                <div className="text-gray-600 text-sm">
                  {typeof listingsError === 'string' ? listingsError : 'An error occurred'}
                </div>
                <button
                  onClick={() => executeSearch(false)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('tryAgain', 'Try again')}
                </button>
              </div>
            </div>
          ) : carListings && carListings.content.length > 0 ? (
            carListings.content.map((listing) => {
              // Transform backend CarListing to CarListingCardData format
              const cardData: CarListingCardData = {
                id: listing.id,
                title: listing.title,
                price: listing.price,
                year: listing.modelYear,
                mileage: listing.mileage,
                transmission: listing.transmission,
                fuelType: listing.fuelType,
                createdAt: listing.createdAt,
                sellerUsername: listing.sellerUsername,
                governorateNameEn: listing.governorateNameEn,
                governorateNameAr: listing.governorateNameAr,
                media: listing.media?.map(m => ({
                  url: m.url,
                  isPrimary: m.isPrimary,
                  contentType: m.contentType
                }))
              };

              return (
                <div key={listing.id} className="animate-fadeIn">
                  <CarListingCard
                    listing={cardData}
                    onFavoriteToggle={(_isFavorite) => {
                      // Handle favorite toggle if needed
                    }}
                    initialFavorite={false}
                  />
                </div>
              );
            })
          ) : (
            // No results state
            <div className="col-span-full text-center py-12">
              <MdDirectionsCar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noResultsFound', 'No cars found')}</h3>
              <p className="text-gray-600">{t('tryDifferentFilters', 'Try adjusting your search filters to see more results.')}</p>
            </div>
          )}
        </SmoothTransition>

        {/* Pagination */}
        {carListings && carListings.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                disabled={carListings.page === 0}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {carListings.page + 1} of {carListings.totalPages}
              </span>
              <button
                disabled={carListings.last}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {carListings && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {carListings.content.length} of {carListings.totalElements} cars
          </div>
        )}

        {/* Modal */}
        {activeFilterModal && (
          <FilterModal 
            filterType={activeFilterModal}
            onClose={() => setActiveFilterModal(null)}
            filters={filters}
            setFilters={setFilters}
            selectedMake={selectedMake}
            selectedModel={selectedModel}
            carMakes={carMakes}
            availableModels={availableModels}
            isLoadingBrands={isLoadingBrands}
            isLoadingModels={isLoadingModels}
            referenceData={referenceData}
            isLoadingReferenceData={isLoadingReferenceData}
            sellerTypeCounts={sellerTypeCounts}
            carListings={carListings}
            currentLanguage={currentLanguage}
            isRTL={isRTL}
            dirClass={dirClass}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t={t as any}
            updateFiltersAndState={updateFiltersAndState}
            handleInputChange={handleInputChange}
            clearSpecificFilter={clearSpecificFilter}
          />
        )}

        {/* Error States with better styling */}
        {(brandsError || modelsError || referenceDataError || listingsError) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  {t('errorTitle', 'Something went wrong')}
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {listingsError || t('loadingError', 'Error loading filter options. Please refresh the page.')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
