"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MdNotificationsNone, MdNotifications } from 'react-icons/md';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOptimizedUser } from '@/hooks/useOptimizedSession';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useOptimizedFiltering } from '@/hooks/useOptimizedFiltering';

import { CarMake, CarModel } from '@/types/car';
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

// Import public API functions
import { fetchCarListingsPublic } from '@/services/publicApi';

import { getSellerTypeCounts } from '@/services/sellerTypes';
import { SellerTypeCounts } from '@/types/sellerTypes';
import { useBodyStyleCounts } from '@/hooks/useBodyStyleCounts';
import { useFuelTypeCounts } from '@/hooks/useFuelTypeCounts';
import { useTransmissionCounts } from '@/hooks/useTransmissionCounts';
import { useApiData } from '@/hooks/useApiData';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { DEFAULT_CURRENCY } from '@/utils/currency';
import { formatNumber } from '@/utils/localization';
import { useLanguageDirection } from '@/utils/languageDirection';
import { getSortValue, DEFAULT_SORT } from '@/utils/sortUtils';
import FilterModal from '@/components/search/FilterModal';
import FilterChips from '@/components/search/FilterChips';
import SearchBar from '@/components/search/SearchBar';
import FilterPills from '@/components/search/FilterPills';
import CarListingsGrid from '@/components/search/CarListingsGrid';
import SortDropdown from '@/components/search/SortDropdown';
import ViewModeToggle from '@/components/search/ViewModeToggle';
import { ViewMode } from '@/components/search/ViewModeToggle';
import { createSavedSearch, deleteSavedSearch, SavedSearchRequest } from '@/services/savedSearches';
import Pagination from '@/components/ui/Pagination';


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
  const [selectedSort, setSelectedSort] = useState(DEFAULT_SORT);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [savedSearchId, setSavedSearchId] = useState<string | null>(null);
  const prevFiltersRef = useRef<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const shouldScrollAfterPageChange = useRef(false);
  
  // New state for all models (for makeModel filter modal)
  const [allModels, setAllModels] = useState<CarModel[]>([]);
  const [isLoadingAllModels, setIsLoadingAllModels] = useState(false);

  // Handle clicking outside the location dropdown to close it
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
      page: currentPage, // Use current page state
      sort: getSortValue(selectedSort), // Use selectedSort state
      
      // Add missing filter fields that are defined in CarListingFilterParams
      transmissionId: filters.transmissionId,
      fuelTypeSlugs: filters.fuelTypeSlugs,
              bodyType: filters.bodyType,
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
    searchQuery,
    selectedSort,
    currentPage
  ]);

  // Car listings state using optimized filtering with dynamic API selection
  const user = useOptimizedUser();
  const isAuthenticated = !!user;

  // Choose API function based on authentication status with proper type casting
  const fetchListingsFunction = useMemo(() => {
    if (isAuthenticated) {
      return fetchCarListings;
    } else {
      // Wrap public API to match expected interface
      return async (filters?: CarListingFilterParams): Promise<PageResponse<CarListing>> => {
        const result = await fetchCarListingsPublic(filters);
        // Cast the result to the expected type since the interfaces are compatible
        return result as unknown as PageResponse<CarListing>;
      };
    }
  }, [isAuthenticated]);

  const {
    data: carListings,
    isLoading: isLoadingListings,
    isManualSearch,
    error: listingsError,
    search: executeSearch
  } = useOptimizedFiltering<CarListingFilterParams, PageResponse<CarListing>>(
    listingFilters,
    fetchListingsFunction,
    {
      debounceMs: 300,
      minLoadingDelayMs: 150,
      immediate: false
    }
  );

  // Body style counts hook
  const { bodyStyleCounts } = useBodyStyleCounts(listingFilters);

  // Fuel type counts hook
  const { fuelTypeCounts } = useFuelTypeCounts(listingFilters);

  // Transmission counts hook
  const { transmissionCounts } = useTransmissionCounts(listingFilters);

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

  // Fetch all models when makeModel filter modal is opened
  useEffect(() => {
    if (activeFilterModal === 'makeModel' && carMakes && carMakes.length > 0) {
      const fetchAllModels = async () => {
        setIsLoadingAllModels(true);
        try {
          const allModelsPromises = carMakes.map(async (make) => {
            const models = await fetchCarModels(make.id);
            // Add the brand relationship to each model
            return models.map(model => ({
              ...model,
              brand: make
            }));
          });
          const allModelsArrays = await Promise.all(allModelsPromises);
          const flatAllModels = allModelsArrays.flat();
          setAllModels(flatAllModels);
        } catch (error) {
          console.error('Error fetching all models:', error);
          setAllModels([]);
        } finally {
          setIsLoadingAllModels(false);
        }
      };
      
      fetchAllModels();
    }
  }, [activeFilterModal, carMakes]);

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

  const getFuelTypeDisplayNameFromSlug = useMemo(() =>
    (slug: string): string => {
      const fuelType = referenceData?.fuelTypes?.find(f => f.slug === slug);
      return fuelType ? (currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn) : '';
    }, [referenceData?.fuelTypes, currentLanguage]
  );

  const getBodyStyleDisplayName = useMemo(() => 
    (slug: string): string => {
      const bodyStyle = referenceData?.bodyStyles?.find(b => b.slug === slug);
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

  const _getConditionDisplayName = useMemo(() => 
    (id: number): string => {
      const condition = referenceData?.carConditions?.find(c => c.id === id);
      return condition ? (currentLanguage === 'ar' ? condition.displayNameAr : condition.displayNameEn) : '';
    }, [referenceData?.carConditions, currentLanguage]
  );

  // Car listings are now enhanced directly by the backend with bilingual fields
  const enhancedCarListings = carListings;

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

    // Handle page parameter
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNumber = parseInt(pageParam);
      if (!isNaN(pageNumber) && pageNumber >= 0) {
        setCurrentPage(pageNumber);
      }
    }

    setFilters(initialFilters);
    setHasInitialized(true);
  }, [hasInitialized, searchParams]);

  // Reset monitoring state when filters actually change (not when isMonitoring changes)
  useEffect(() => {
    if (!hasInitialized) return;
    
    const currentFiltersString = JSON.stringify({ filters, searchQuery });
    
    // Only reset if filters actually changed (not on first render or isMonitoring change)
    if (prevFiltersRef.current && prevFiltersRef.current !== currentFiltersString && isMonitoring) {
      console.log('🔄 Filters changed, resetting monitoring state');
      setIsMonitoring(false);
    }
    
    prevFiltersRef.current = currentFiltersString;
  }, [filters, searchQuery, hasInitialized, isMonitoring]);



  // Function to update URL when filters change
  // URLs use clean singular form (brand/model) for SEO and UX
  // Backend API expects plural form (brandSlugs/modelSlugs)
  const updateUrlFromFilters = useCallback((newFilters: AdvancedSearchFilters, page?: number) => {

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
    
    // Add page parameter (only if not first page)
    const pageToUse = page !== undefined ? page : currentPage;
    if (pageToUse > 0) {
      params.append('page', pageToUse.toString());
    }
    
    // Update URL without causing a page reload
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [router, currentPage]);

  // Trigger search after filters are initialized - always search to show results
  useEffect(() => {
    if (hasInitialized) {
      executeSearch(false);
    }
  }, [hasInitialized, listingFilters, executeSearch]);

  // After listings load following a page change, scroll to filter bar (best practice: content-driven scroll)
  useEffect(() => {
    if (!hasInitialized) return;
    if (!shouldScrollAfterPageChange.current) return;

    // When new content present, focus and scroll into view for accessibility and stability
    const target = document.getElementById('filters-top');
    if (target) {
      // Focus for a11y
      target.focus({ preventScroll: true } as unknown as FocusOptions);
      // Scroll with margin offset handled via scroll-mt classes
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    shouldScrollAfterPageChange.current = false;
  }, [enhancedCarListings, hasInitialized]);

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
  // Note: Seller type counts endpoint doesn't support transmission/fuel type filtering
  const sellerTypeCountDependencies = useMemo(() => ({
    brands: filters.brands,
    models: filters.models,
    minYear: filters.minYear,
    maxYear: filters.maxYear,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minMileage: filters.minMileage,
    maxMileage: filters.maxMileage
    // Removed transmissionId, fuelTypeSlugs, and bodyStyleIds as they're not supported by the seller type counts endpoint
  }), [filters.brands, filters.models, filters.minYear, filters.maxYear, filters.minPrice, filters.maxPrice, filters.minMileage, filters.maxMileage]);

  // Fetch seller type counts when filters change (Swedish marketplace style)
  useEffect(() => {
    const fetchSellerTypeCounts = async () => {
      try {
        // Convert filters to API format for count endpoint
        // Note: Seller type counts endpoint doesn't support transmission/fuel type filtering
        const apiFilters = {
          brandSlugs: sellerTypeCountDependencies.brands,
          modelSlugs: sellerTypeCountDependencies.models,
          minYear: sellerTypeCountDependencies.minYear?.toString(),
          maxYear: sellerTypeCountDependencies.maxYear?.toString(),
          minPrice: sellerTypeCountDependencies.minPrice?.toString(),
          maxPrice: sellerTypeCountDependencies.maxPrice?.toString(),
          minMileage: sellerTypeCountDependencies.minMileage?.toString(),
          maxMileage: sellerTypeCountDependencies.maxMileage?.toString(),
          // Don't include transmissionId, fuelTypeSlugs, or bodyStyleIds as they're not supported by this endpoint
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
        return filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0 
          ? filters.fuelTypeSlugs.map(slug => getFuelTypeDisplayNameFromSlug(slug)).join(', ') 
          : t('fuelType', 'Fuel type');
      case 'bodyStyle':
                return filters.bodyType && filters.bodyType.length > 0
          ? filters.bodyType.length === 1
            ? getBodyStyleDisplayName(filters.bodyType[0])
            : `${filters.bodyType.length} ${t('bodyStyles', 'Body types')}`
          : t('bodyStyle', 'Body style');
      case 'sellerType':
        return filters.sellerTypeIds && filters.sellerTypeIds.length > 0 
          ? filters.sellerTypeIds.length === 1 
            ? getSellerTypeDisplayName(filters.sellerTypeIds[0])
            : `${filters.sellerTypeIds.length} ${t('sellerType', 'Seller types')}`
          : t('sellerType', 'Seller type');
      default:
        return '';
    }
  }, [filters, t, getBrandDisplayNameFromSlug, getModelDisplayNameFromSlug, getTransmissionDisplayName, getFuelTypeDisplayNameFromSlug, getBodyStyleDisplayName, getSellerTypeDisplayName, currentLanguage]);

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
        return !!(filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0);
      case 'bodyStyle':
        return !!(filters.bodyType && filters.bodyType.length > 0);
      case 'sellerType':
        return !!(filters.sellerTypeIds && filters.sellerTypeIds.length > 0);
      default:
        return false;
    }
  }, [filters]);

  // Check if there are any active filters
  const hasActiveFilters = useMemo(() => {
    // Check if there's a search query
    if (searchQuery && searchQuery.trim()) {
      return true;
    }
    
    // Check if there are any filter values
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== null && v !== undefined && v !== '');
      }
      return value !== null && value !== undefined && value !== '';
    });
  }, [filters, searchQuery]);

  // Helper function to extract clean model name from brand-model format
  const extractModelName = useCallback((modelSlug: string, brandSlug?: string) => {
    if (!modelSlug) return modelSlug;
    
    // If brand is provided and model starts with brand-, remove the brand prefix
    if (brandSlug && modelSlug.toLowerCase().startsWith(brandSlug.toLowerCase() + '-')) {
      const modelPart = modelSlug.substring(brandSlug.length + 1);
      return modelPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // For compound model slugs like "honda-accord", try to extract just the model part
    // by checking against actual brand slugs from the database
    if (carMakes && carMakes.length > 0) {
      for (const brand of carMakes) {
        if (modelSlug.toLowerCase().startsWith(brand.slug + '-')) {
          const modelPart = modelSlug.substring(brand.slug.length + 1);
          return modelPart
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
    }
    
    // Otherwise, just format the model name nicely (capitalize each word)
    return modelSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [carMakes]);

  // Helper function to get brand display name from slug
  const _getBrandDisplayName = useCallback((brandSlug: string, isArabic: boolean) => {
    const brand = carMakes?.find(b => b.slug === brandSlug);
    if (brand) {
      return isArabic ? brand.displayNameAr : brand.displayNameEn;
    }
    // Fallback to formatted slug
    return brandSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [carMakes]);

  // Helper function to get model display name from slug
  const _getModelDisplayName = useCallback((modelSlug: string, isArabic: boolean) => {
    // First try to find by exact slug match in allModels
    let model = allModels?.find(m => m.slug === modelSlug);
    
    // If not found and slug contains a dash, try to find by just the model part
    if (!model && modelSlug.includes('-') && carMakes && carMakes.length > 0) {
      // Extract the model part from compound slugs like "honda-accord" -> "accord"
      // Use actual brand slugs from the database instead of hardcoded array
      for (const brand of carMakes) {
        if (modelSlug.toLowerCase().startsWith(brand.slug + '-')) {
          const modelPart = modelSlug.substring(brand.slug.length + 1);
          model = allModels?.find(m => m.slug === modelPart);
          if (model) break;
        }
      }
    }
    
    // If still not found and allModels is empty/insufficient, try availableModels as fallback
    if (!model && availableModels && availableModels.length > 0) {
      model = availableModels.find(m => m.slug === modelSlug);
      
      // Also try extracting model part from compound slugs for availableModels
      if (!model && modelSlug.includes('-') && carMakes && carMakes.length > 0) {
        for (const brand of carMakes) {
          if (modelSlug.toLowerCase().startsWith(brand.slug + '-')) {
            const modelPart = modelSlug.substring(brand.slug.length + 1);
            model = availableModels.find(m => m.slug === modelPart);
            if (model) break;
          }
        }
      }
    }
    
    if (model) {
      return isArabic ? model.displayNameAr : model.displayNameEn;
    }
    
    // If still no model found, try comprehensive fallback with popular models
    // This handles cases where both allModels and availableModels are empty
    const popularModels: Record<string, { en: string; ar: string }> = {
      'camry': { en: 'Camry', ar: 'كامري' },
      'corolla': { en: 'Corolla', ar: 'كورولا' },
      'rav4': { en: 'RAV4', ar: 'رافـ4' },
      'prius': { en: 'Prius', ar: 'بريوس' },
      'highlander': { en: 'Highlander', ar: 'هايلاندر' },
      'accord': { en: 'Accord', ar: 'أكورد' },
      'civic': { en: 'Civic', ar: 'سيفيك' },
      'cr-v': { en: 'CR-V', ar: 'سي آر-في' },
      'pilot': { en: 'Pilot', ar: 'بايلوت' },
      'odyssey': { en: 'Odyssey', ar: 'أوديسي' },
      'f-150': { en: 'F-150', ar: 'إف-150' },
      'escape': { en: 'Escape', ar: 'إسكيب' },
      'mustang': { en: 'Mustang', ar: 'موستانغ' },
      'explorer': { en: 'Explorer', ar: 'إكسبلورر' },
      'altima': { en: 'Altima', ar: 'ألتيما' },
      'sentra': { en: 'Sentra', ar: 'سينترا' },
      'maxima': { en: 'Maxima', ar: 'ماكسيما' },
      'rogue': { en: 'Rogue', ar: 'روغ' },
      'x3': { en: 'X3', ar: 'X3' },
      'x5': { en: 'X5', ar: 'X5' },
      '3-series': { en: '3 Series', ar: 'الفئة الثالثة' },
      '5-series': { en: '5 Series', ar: 'الفئة الخامسة' },
      'c-class': { en: 'C-Class', ar: 'فئة سي' },
      'e-class': { en: 'E-Class', ar: 'فئة إي' },
      's-class': { en: 'S-Class', ar: 'فئة إس' },
      'glc': { en: 'GLC', ar: 'جي إل سي' },
      'a4': { en: 'A4', ar: 'إيه 4' },
      'a6': { en: 'A6', ar: 'إيه 6' },
      'q5': { en: 'Q5', ar: 'كيو 5' },
      'q7': { en: 'Q7', ar: 'كيو 7' },
      'elantra': { en: 'Elantra', ar: 'إلانترا' },
      'sonata': { en: 'Sonata', ar: 'سوناتا' },
      'tucson': { en: 'Tucson', ar: 'توكسون' },
      'santa-fe': { en: 'Santa Fe', ar: 'سانتا في' },
      'optima': { en: 'Optima', ar: 'أوبتيما' },
      'sorento': { en: 'Sorento', ar: 'سورينتو' },
      'sportage': { en: 'Sportage', ar: 'سبورتاج' },
      'forte': { en: 'Forte', ar: 'فورتي' }
    };
    
    // Try direct lookup first
    const directMatch = popularModels[modelSlug];
    if (directMatch) {
      return isArabic ? directMatch.ar : directMatch.en;
    }
    
    // If compound slug, extract model part and try popular models lookup
    if (modelSlug.includes('-') && carMakes && carMakes.length > 0) {
      for (const brand of carMakes) {
        if (modelSlug.toLowerCase().startsWith(brand.slug + '-')) {
          const modelPart = modelSlug.substring(brand.slug.length + 1);
          const extractedMatch = popularModels[modelPart];
          if (extractedMatch) {
            return isArabic ? extractedMatch.ar : extractedMatch.en;
          }
          break;
        }
      }
    }
    
    // Final fallback to extracted model name
    return extractModelName(modelSlug);
  }, [allModels, availableModels, extractModelName, carMakes]);

  // Generate a descriptive name for the alert based on filters
  // This function creates alert names by using the exact same text that appears in filter chips
  const generateAlertName = useCallback((filters: AdvancedSearchFilters, searchQuery: string) => {
    
    // Helper function to get filter display text in any language (like chips do)
    const getFilterDisplayTextInLanguage = (filterType: FilterType, targetLanguage: string): string => {
      switch (filterType) {
        case 'makeModel':
          // Display slug-based selections with proper localized names
          if (filters.brands && filters.brands.length > 0) {
            const brandNames = filters.brands.map(slug => {
              const brand = carMakes?.find(make => make.slug === slug);
              return brand ? (targetLanguage === 'ar' ? brand.displayNameAr : brand.displayNameEn) : slug;
            });
            let display = brandNames.join(', ');
            
            if (filters.models && filters.models.length > 0) {
              const modelNames = filters.models.map(slug => {
                // First try to find in current availableModels
                const model = availableModels?.find(model => model.slug === slug);
                if (model) {
                  return targetLanguage === 'ar' ? model.displayNameAr : model.displayNameEn;
                }
                
                // If not found, try to extract display name from slug
                const words = slug.split('-');
                const displayName = words
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                return displayName;
              });
              display += ` - ${modelNames.join(', ')}`;
            }
            return display;
          }
          break;
        case 'price':
          if (filters.minPrice && filters.maxPrice) return `${formatNumber(filters.minPrice, targetLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${formatNumber(filters.maxPrice, targetLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          if (filters.minPrice) return `${targetLanguage === 'ar' ? 'من' : 'From'} ${formatNumber(filters.minPrice, targetLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          if (filters.maxPrice) return `${targetLanguage === 'ar' ? 'حتى' : 'Up to'} ${formatNumber(filters.maxPrice, targetLanguage, { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          break;
        case 'year':
          if (filters.minYear && filters.maxYear) return `${filters.minYear} - ${filters.maxYear}`;
          if (filters.minYear) return `${targetLanguage === 'ar' ? 'من' : 'From'} ${filters.minYear}`;
          if (filters.maxYear) return `${targetLanguage === 'ar' ? 'حتى' : 'Up to'} ${filters.maxYear}`;
          break;
        case 'mileage':
          if (filters.minMileage && filters.maxMileage) return `${filters.minMileage} - ${filters.maxMileage}`;
          if (filters.minMileage) return `${targetLanguage === 'ar' ? 'من' : 'From'} ${filters.minMileage}`;
          if (filters.maxMileage) return `${targetLanguage === 'ar' ? 'حتى' : 'Up to'} ${filters.maxMileage}`;
          break;
        case 'transmission':
          if (filters.transmissionId) {
            const transmission = referenceData?.transmissions?.find(t => t.id === filters.transmissionId);
            return transmission ? (targetLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn) : '';
          }
          break;
        case 'fuelType':
          if (filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0) {
            return filters.fuelTypeSlugs.map(slug => {
              const fuelType = referenceData?.fuelTypes?.find(f => f.slug === slug);
              return fuelType ? (targetLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn) : '';
            }).join(', ');
          }
          break;
        case 'bodyStyle':
          if (filters.bodyType && filters.bodyType.length > 0) {
            if (filters.bodyType.length === 1) {
              const bodyStyle = referenceData?.bodyStyles?.find(b => b.slug === filters.bodyType![0]);
              return bodyStyle ? (targetLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn) : '';
            } else {
              return `${filters.bodyType.length} ${targetLanguage === 'ar' ? 'أنواع هيكل' : 'Body types'}`;
            }
          }
          break;
        case 'sellerType':
          if (filters.sellerTypeIds && filters.sellerTypeIds.length > 0) {
            if (filters.sellerTypeIds.length === 1) {
              const sellerType = referenceData?.sellerTypes?.find(s => s.id === filters.sellerTypeIds![0]);
              if (sellerType && typeof sellerType === 'object' && 'displayNameEn' in sellerType && 'displayNameAr' in sellerType) {
                const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string };
                return targetLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
              }
            } else {
              return `${filters.sellerTypeIds.length} ${targetLanguage === 'ar' ? 'أنواع بائع' : 'Seller types'}`;
            }
          }
          break;
      }
      return '';
    };

    // Helper function to generate chip texts for a specific language
    const generateChipTextsForLanguage = (targetLanguage: string): string[] => {
      const chipTexts: string[] = [];

      // Add search query if present
      if (searchQuery && searchQuery.trim()) {
        chipTexts.push(`"${searchQuery.trim()}"`);
      }

      // Get the exact text from each active filter chip
      const filterTypes: FilterType[] = ['makeModel', 'price', 'year', 'mileage', 'transmission', 'fuelType', 'bodyStyle', 'sellerType'];
      
      for (const filterType of filterTypes) {
        if (isFilterActive(filterType)) {
          const chipText = getFilterDisplayTextInLanguage(filterType, targetLanguage);
          if (chipText) {
            chipTexts.push(chipText);
          }
        }
      }

      // Add location if specified (this is not in filter chips, so handle separately)
      if (filters.locations && filters.locations.length > 0) {
        if (filters.locations.length === 1) {
          chipTexts.push(`${targetLanguage === 'ar' ? 'في' : 'in'} ${filters.locations[0]}`);
        } else if (filters.locations.length <= 3) {
          chipTexts.push(`${targetLanguage === 'ar' ? 'في' : 'in'} ${filters.locations.join(targetLanguage === 'ar' ? '، ' : ', ')}`);
        } else {
          chipTexts.push(`${targetLanguage === 'ar' ? 'في' : 'in'} ${filters.locations.length} ${targetLanguage === 'ar' ? 'مناطق' : 'areas'}`);
        }
      }

      return chipTexts;
    };

    // Generate chip texts for both languages
    const englishChipTexts = generateChipTextsForLanguage('en');
    const arabicChipTexts = generateChipTextsForLanguage('ar');

    // Create alert names by joining chip texts with commas
    const nameEn = englishChipTexts.length === 0 
      ? 'Car Search' 
      : englishChipTexts.join(', ');

    const nameAr = arabicChipTexts.length === 0 
      ? 'بحث سيارات' 
      : arabicChipTexts.join('، ');

    return { nameEn, nameAr };
  }, [isFilterActive, carMakes, availableModels, referenceData]);

  // Toggle alert: create if not monitoring, delete if monitoring
  const handleToggleAlert = useCallback(async () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/auth/signin');
      return;
    }

    // Don't allow creating alert without filters
    if (!hasActiveFilters) {
      return;
    }

    // If already monitoring, delete the alert
    if (isMonitoring && savedSearchId) {
      try {
        setIsSavingAlert(true);
        const token = user?.accessToken;
        await deleteSavedSearch(savedSearchId, token);
        setIsMonitoring(false);
        setSavedSearchId(null);
      } catch (error) {
        console.error('Error deleting alert:', error);
      } finally {
        setIsSavingAlert(false);
      }
      return;
    }

    setIsSavingAlert(true);
    
    try {
      const token = user?.accessToken;
      
      // Transform frontend filters to backend format (same as CreateAlertModal)
      const backendFilters: Record<string, unknown> = {};
      
      if (filters.brands) backendFilters.brandSlugs = filters.brands;
      if (filters.models) backendFilters.modelSlugs = filters.models;
      if (filters.locations) backendFilters.location = filters.locations;
      if (filters.minPrice) backendFilters.minPrice = filters.minPrice;
      if (filters.maxPrice) backendFilters.maxPrice = filters.maxPrice;
      if (filters.minYear) backendFilters.minYear = filters.minYear;
      if (filters.maxYear) backendFilters.maxYear = filters.maxYear;
      if (filters.minMileage) backendFilters.minMileage = filters.minMileage;
      if (filters.maxMileage) backendFilters.maxMileage = filters.maxMileage;
      if (filters.transmissionId) backendFilters.transmissionId = filters.transmissionId;
      if (filters.fuelTypeSlugs) backendFilters.fuelTypeSlugs = filters.fuelTypeSlugs;
      if (filters.bodyType) backendFilters.bodyType = filters.bodyType;
      if (filters.sellerTypeIds) backendFilters.sellerTypeIds = filters.sellerTypeIds;
      if (searchQuery) backendFilters.searchQuery = searchQuery;
      
      const { nameEn, nameAr } = generateAlertName(filters, searchQuery);
      
      const savedSearchRequest: SavedSearchRequest = {
        nameEn,
        nameAr,
        filters: backendFilters,
        notificationPreferences: {
          email: true,
          frequency: 'immediate' as const
        },
        isActive: true
      };

      const response = await createSavedSearch(savedSearchRequest, token);
      
      // Simple feedback and set monitoring state
      setIsMonitoring(true); // Now monitoring these criteria
      if (response?.id) setSavedSearchId(response.id);
      
      if (response.wasUpdated) {
        console.log('✅ Alert updated with new criteria!');
      } else {
        console.log('✅ New alert created successfully!');
      }
      
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsSavingAlert(false);
    }
  }, [user, filters, searchQuery, router, hasActiveFilters, generateAlertName, isMonitoring, savedSearchId]);

  // Scroll behavior is now handled directly in onPageChange

  // Pagination is now handled by the Pagination component

  // Reset to first page when filters change (but not when page itself changes)
  useEffect(() => {
    if (hasInitialized && currentPage > 0) {
      setCurrentPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, hasInitialized]); // Intentionally exclude currentPage to avoid infinite loop

  // Filter pill component with memo for performance
  const handleSearch = () => {
    setSearchLoading(true);
    
    // Close location dropdown if open
    setShowLocationDropdown(false);
    
    // Reset to first page on new search
    setCurrentPage(0);
    
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
    <div className={`min-h-screen bg-gray-50 ${dirClass}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6">
        {/* Compact Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          handleSearch={handleSearch}
          filters={filters}
          setFilters={setFilters}
          showLocationDropdown={showLocationDropdown}
          setShowLocationDropdown={setShowLocationDropdown}
          governorates={governorates || undefined}
          currentLanguage={currentLanguage}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t={t as any}
        />

        {/* Enhanced Filter Bar */}
        <div id="filters-top" data-filter-section className="scroll-mt-24 md:scroll-mt-28">
          <FilterPills
            setActiveFilterModal={setActiveFilterModal}
            isFilterActive={isFilterActive}
            getFilterDisplayText={getFilterDisplayText}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t={t as any}
            isRTL={isRTL}
          />

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
          getFuelTypeDisplayNameFromSlug={getFuelTypeDisplayNameFromSlug}
          getBodyStyleDisplayName={getBodyStyleDisplayName}
          getSellerTypeDisplayName={getSellerTypeDisplayName}
          selectedMake={selectedMake}
          selectedModel={selectedModel}
          referenceData={referenceData}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t={t as any}
          isRTL={isRTL}
        />
        </div>

        {/* Results Info */}
        <div tabIndex={-1} className="flex items-center justify-between mb-6" data-results-section>
          <div className="flex flex-col gap-3">
            {/* Sort Dropdown - Top row, left aligned */}
            <SortDropdown
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
              onSearchTrigger={() => executeSearch(false)}
            />
            
            {/* View Mode Toggle - Bottom row, under sort */}
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t={t as any}
              isRTL={isRTL}
            />
          </div>
          
          {/* Save Search Button - Simple with monitoring state */}
          {hasActiveFilters && (
            <button 
              onClick={handleToggleAlert}
              disabled={isSavingAlert}
              className={`
                flex items-center text-sm font-medium 
                px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isRTL ? 'flex-row-reverse' : ''}
                ${isSavingAlert ? 'opacity-50 cursor-not-allowed' : ''}
                ${isMonitoring 
                  ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700 shadow-md' 
                  : 'text-gray-700 hover:text-gray-900 border-gray-300 bg-white hover:bg-gray-50'
                }
              `}
              aria-label={isMonitoring ? t('search:monitoring', 'Monitoring') : t('search:createWatch', 'Create Alert')}
            >
              {isMonitoring ? (
                <MdNotifications size={20} className={`${isRTL ? "ml-2" : "mr-2"} text-white`} />
              ) : (
                <MdNotificationsNone size={20} className={isRTL ? "ml-2" : "mr-2"} />
              )}
              {/* Fixed-width label to prevent jitter when text changes */}
              <span className="inline-block w-[11ch] xs:w-[12ch] text-center whitespace-nowrap">
                {isSavingAlert 
                  ? t('search:savingAlert', 'Saving...') 
                  : isMonitoring
                    ? t('search:monitoring', 'Monitoring')
                    : t('search:createWatch', 'Create Alert')
                }
              </span>
            </button>
          )}
        </div>

        {/* Car Listings Grid with Smooth Transitions */}
        <div data-listings-grid>
          <CarListingsGrid
          carListings={enhancedCarListings}
          isLoadingListings={isLoadingListings}
          isManualSearch={isManualSearch}
          listingsError={listingsError}
          executeSearch={executeSearch}
          viewMode={viewMode}
          isRTL={isRTL}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t={t as any}
          user={user}
        />
        </div>

        {/* Modern Pagination */}
        {enhancedCarListings && enhancedCarListings.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={enhancedCarListings.page + 1} // Convert from 0-based to 1-based
              totalPages={enhancedCarListings.totalPages}
              totalItems={enhancedCarListings.totalElements}
              itemsPerPage={20}
              onPageChange={(page) => {
                const newPage = page - 1; // Convert from 1-based to 0-based
                shouldScrollAfterPageChange.current = true;
                setCurrentPage(newPage);
                updateUrlFromFilters(filters, newPage);
              }}
              showInfo={true}
              isRTL={isRTL}
              className="w-full"
              autoScroll={false}
            />
          </div>
        )}

        {/* Subtle Registration CTA for Unauthenticated Users - Only if there are results */}
        {!isAuthenticated && enhancedCarListings && enhancedCarListings.content && enhancedCarListings.content.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg">
              <span>Want to contact sellers?</span>
              <a 
                href="/auth/signup" 
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Sign up free
              </a>
              <span>•</span>
              <a 
                href="/auth/signin" 
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Sign in
              </a>
            </div>
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
            _isLoadingReferenceData={isLoadingReferenceData}
            sellerTypeCounts={sellerTypeCounts}
            bodyStyleCounts={bodyStyleCounts}
            fuelTypeCounts={fuelTypeCounts}
            transmissionCounts={transmissionCounts}
            carListings={enhancedCarListings}
            currentLanguage={currentLanguage}
            isRTL={isRTL}
            dirClass={dirClass}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t={t as any}
            updateFiltersAndState={updateFiltersAndState}
            handleInputChange={handleInputChange}
            clearSpecificFilter={clearSpecificFilter}
            allModels={allModels} // Pass allModels to the modal
            isLoadingAllModels={isLoadingAllModels} // Pass isLoadingAllModels to the modal
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
