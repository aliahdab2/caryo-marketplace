"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useOptimizedFiltering } from '@/hooks/useOptimizedFiltering';
import SmoothTransition from '@/components/ui/SmoothTransition';
import { 
  MdClose,
  MdDirectionsCar,
  MdKeyboardArrowDown,
  MdSearch,
  MdFavoriteBorder,
  MdDeleteSweep,
  MdFilterList
} from 'react-icons/md';
import { 
  ConvertibleIcon,
  CoupeIcon,
  EstateIcon,
  HatchbackIcon,
  MPVIcon,
  PickupIcon,
  SedanIcon,
  SUVIcon,
  VanIcon,
  MotorcycleIcon
} from '@/components/icons/CarIcons';
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

interface AdvancedSearchFilters {
  // Slug-based filters (AutoTrader UK pattern)
  brands?: string[];
  models?: string[];
  
  // Basic filters
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  
  // Location filters - support multiple locations
  locations?: string[];
  
  // Entity ID filters (for dropdown selections)
  conditionId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  bodyStyleId?: number;
  sellerTypeIds?: number[];
  
  // Direct field filters
  exteriorColor?: string;
  doors?: number;
  cylinders?: number;
}

type FilterType = 'makeModel' | 'price' | 'year' | 'mileage' | 'transmission' | 'fuelType' | 'bodyStyle' | 'sellerType';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

// Move namespaces outside component to prevent recreation on every render
const SEARCH_NAMESPACES = ['common', 'search'];

// Function to get appropriate car icon based on body style
const getCarIcon = (bodyStyleName: string) => {
  const normalizedName = bodyStyleName.toLowerCase();
  const iconMap: Record<string, React.ReactNode> = {
    'sedan': <SedanIcon className="w-8 h-6 text-gray-600" />,
    'saloon': <SedanIcon className="w-8 h-6 text-gray-600" />,
    'hatchback': <HatchbackIcon className="w-8 h-6 text-gray-600" />,
    'suv': <SUVIcon className="w-8 h-6 text-gray-600" />,
    'coupe': <CoupeIcon className="w-8 h-6 text-gray-600" />,
    'convertible': <ConvertibleIcon className="w-8 h-6 text-gray-600" />,
    'wagon': <EstateIcon className="w-8 h-6 text-gray-600" />,
    'estate': <EstateIcon className="w-8 h-6 text-gray-600" />,
    'truck': <PickupIcon className="w-8 h-6 text-gray-600" />,
    'pickup': <PickupIcon className="w-8 h-6 text-gray-600" />,
    'van': <VanIcon className="w-8 h-6 text-gray-600" />,
    'minivan': <MPVIcon className="w-8 h-6 text-gray-600" />,
    'mpv': <MPVIcon className="w-8 h-6 text-gray-600" />,
    'motorcycle': <MotorcycleIcon className="w-8 h-6 text-gray-600" />,
    'crossover': <SUVIcon className="w-8 h-6 text-gray-600" />,
    'taxi': <SedanIcon className="w-8 h-6 text-gray-600" />,
    'ambulance': <VanIcon className="w-8 h-6 text-gray-600" />,
    'rv': <VanIcon className="w-8 h-6 text-gray-600" />,
    'camper': <VanIcon className="w-8 h-6 text-gray-600" />,
    'other': <SedanIcon className="w-8 h-6 text-gray-600" />
  };

  return iconMap[normalizedName] || <SedanIcon className="w-8 h-6 text-gray-600" />;
};

export default function AdvancedSearchPage() {
  const { t, i18n } = useLazyTranslation(SEARCH_NAMESPACES);
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  const [_filtersExpanded, setFiltersExpanded] = useState(false);
  
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

    console.log('API Filter params:', params); // Debug log
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

  // Memoized location dropdown options
  const locationDropdownOptions = useMemo(() => {
    return governorates?.map(gov => ({
      id: gov.id,
      slug: gov.slug || gov.displayNameEn.toLowerCase().replace(/\s+/g, '-'),
      displayNameEn: gov.displayNameEn,
      displayNameAr: gov.displayNameAr
    })) || [];
  }, [governorates]);

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
        return t('search.makeAndModel', 'Make and model');
      case 'price':
        if (filters.minPrice && filters.maxPrice) return `£${filters.minPrice} - £${filters.maxPrice}`;
        if (filters.minPrice) return `${t('search.from', 'From')} £${filters.minPrice}`;
        if (filters.maxPrice) return `${t('search.upTo', 'Up to')} £${filters.maxPrice}`;
        return t('search.price', 'Price');
      case 'year':
        if (filters.minYear && filters.maxYear) return `${filters.minYear} - ${filters.maxYear}`;
        if (filters.minYear) return `${t('search.from', 'From')} ${filters.minYear}`;
        if (filters.maxYear) return `${t('search.upTo', 'Up to')} ${filters.maxYear}`;
        return t('search.year', 'Year');
      case 'mileage':
        if (filters.minMileage && filters.maxMileage) return `${filters.minMileage} - ${filters.maxMileage}`;
        if (filters.minMileage) return `${t('search.from', 'From')} ${filters.minMileage}`;
        if (filters.maxMileage) return `${t('search.upTo', 'Up to')} ${filters.maxMileage}`;
        return t('search.mileage', 'Mileage');
      case 'transmission':
        return filters.transmissionId ? getTransmissionDisplayName(filters.transmissionId) : t('search.transmission', 'Transmission');

      case 'fuelType':
        return filters.fuelTypeId ? getFuelTypeDisplayName(filters.fuelTypeId) : t('search.fuelType', 'Fuel type');
      case 'bodyStyle':
        return filters.bodyStyleId ? getBodyStyleDisplayName(filters.bodyStyleId) : t('search.bodyStyle', 'Body style');
      case 'sellerType':
        return filters.sellerTypeIds && filters.sellerTypeIds.length > 0 
          ? filters.sellerTypeIds.length === 1 
            ? getSellerTypeDisplayName(filters.sellerTypeIds[0])
            : `${filters.sellerTypeIds.length} ${t('search.sellerType', 'Seller types')}`
          : t('search.sellerType', 'Seller type');
      default:
        return '';
    }
  }, [filters, t, getBrandDisplayNameFromSlug, getModelDisplayNameFromSlug, getTransmissionDisplayName, getFuelTypeDisplayName, getBodyStyleDisplayName, getSellerTypeDisplayName]);

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

  // Modal component
  const FilterModal = ({ filterType, onClose }: { filterType: FilterType; onClose: () => void }) => {
    const renderModalContent = () => {
      switch (filterType) {
        case 'makeModel':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.make', 'Make')}</h3>
                <select
                  value={selectedMake || ''}
                  onChange={(e) => {
                    const makeId = e.target.value ? Number(e.target.value) : null;
                    
                    // Only update if the value actually changed
                    if (selectedMake !== makeId) {
                      if (makeId && carMakes) {
                        const brand = carMakes.find(make => make.id === makeId);
                        if (brand && brand.slug) {
                          updateFiltersAndState(
                            { brands: [brand.slug], models: [] },
                            { selectedMake: makeId, selectedModel: null }
                          );
                        } else {
                          console.warn('Brand not found or missing slug for ID:', makeId);
                        }
                      } else {
                        updateFiltersAndState(
                          { brands: [], models: [] },
                          { selectedMake: null, selectedModel: null }
                        );
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingBrands}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {carMakes?.map(make => (
                    <option key={make.id} value={make.id}>
                      {currentLanguage === 'ar' ? make.displayNameAr : make.displayNameEn}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.model', 'Model')}</h3>
                <select
                  value={selectedModel || ''}
                  onChange={(e) => {
                    const modelId = e.target.value ? Number(e.target.value) : null;
                    
                    // Only update if the value actually changed
                    if (selectedModel !== modelId) {
                      if (modelId && availableModels) {
                        const model = availableModels.find(m => m.id === modelId);
                        if (model && model.slug) {
                          updateFiltersAndState(
                            { models: [model.slug] },
                            { selectedModel: modelId }
                          );
                        } else {
                          console.warn('Model not found or missing slug for ID:', modelId);
                        }
                      } else {
                        updateFiltersAndState(
                          { models: [] },
                          { selectedModel: null }
                        );
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!selectedMake || isLoadingModels}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {availableModels?.map(model => (
                    <option key={model.id} value={model.id}>
                      {currentLanguage === 'ar' ? model.displayNameAr : model.displayNameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'price':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.priceRange', 'Price range')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.from', 'From')}</label>
                    <input
                      type="number"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleInputChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.to', 'To')}</label>
                    <input
                      type="number"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );

        case 'year':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.yearRange', 'Year range')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.from', 'From')}</label>
                    <select
                      value={filters.minYear || ''}
                      onChange={(e) => handleInputChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('search.any', 'Any')}</option>
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.to', 'To')}</label>
                    <select
                      value={filters.maxYear || ''}
                      onChange={(e) => handleInputChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('search.any', 'Any')}</option>
                      {YEARS.filter(year => !filters.minYear || year >= filters.minYear).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'mileage':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.mileageRange', 'Mileage range')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.from', 'From')}</label>
                    <input
                      type="number"
                      value={filters.minMileage || ''}
                      onChange={(e) => handleInputChange('minMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.to', 'To')}</label>
                    <input
                      type="number"
                      value={filters.maxMileage || ''}
                      onChange={(e) => handleInputChange('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );

        case 'transmission':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.gearbox', 'Gearbox')}</h3>
                <select
                  value={filters.transmissionId || ''}
                  onChange={(e) => handleInputChange('transmissionId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.transmissions?.map(transmission => (
                    <option key={transmission.id} value={transmission.id}>
                      {currentLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );



        case 'fuelType':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.fuelType', 'Fuel type')}</h3>
                <select
                  value={filters.fuelTypeId || ''}
                  onChange={(e) => handleInputChange('fuelTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.fuelTypes?.map(fuelType => (
                    <option key={fuelType.id} value={fuelType.id}>
                      {currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'bodyStyle':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.bodyStyle', 'Body style')}</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {referenceData?.bodyStyles?.map(bodyStyle => {
                    const isSelected = filters.bodyStyleId === bodyStyle.id;
                    const displayName = currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn;
                    
                    return (
                      <div
                        key={bodyStyle.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => {
                          handleInputChange('bodyStyleId', isSelected ? undefined : bodyStyle.id);
                          // Auto-close modal after selection for better UX
                          if (!isSelected) {
                            setTimeout(() => {
                              setActiveFilterModal(null);
                            }, 100);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-12 h-8 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                            {/* Professional car silhouette icon */}
                            {getCarIcon(bodyStyle.name.toLowerCase())}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{displayName}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-5 h-5 border-2 rounded transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300 hover:border-blue-400'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );

        case 'sellerType':
          return (
            <div className="space-y-6">
              {/* Header - Blocket style but in English/Arabic */}
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-1">{t('search.sellerType', 'Seller Type')}</h3>
              </div>
              
              {/* Blocket Style Filter with Checkboxes */}
              <div className="space-y-2">
                {/* Individual Seller Type Checkboxes - Blocket styling with English/Arabic content */}
                {referenceData?.sellerTypes?.map(sellerType => {
                  const id = sellerType.id as number;
                  const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string; name: string };
                  const isSelected = filters.sellerTypeIds?.includes(id) || false;
                  
                  // Use proper English and Arabic display names from the database
                  const displayName = currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
                  
                  // Get count for this seller type from our counts data
                  const count = sellerTypeCounts[typedSellerType.name] || 0;
                  
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 rounded-md px-2"
                      onClick={() => {
                        const currentSellerTypes = filters.sellerTypeIds || [];
                        const newSellerTypes = isSelected 
                          ? currentSellerTypes.filter(sellerTypeId => sellerTypeId !== id)
                          : [...currentSellerTypes, id];
                        
                        handleInputChange('sellerTypeIds', newSellerTypes.length > 0 ? newSellerTypes : undefined);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Blocket-style Checkbox */}
                        <div className={`w-5 h-5 border-2 rounded transition-all ${
                          isSelected 
                            ? 'border-gray-400 bg-gray-400' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                        
                        {/* Label with Count - Blocket Style with English/Arabic */}
                        <label className="text-gray-900 cursor-pointer text-base font-normal">
                          {displayName} <span className="text-gray-500 font-normal">({count.toLocaleString()})</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    // Handle keyboard navigation for modals
    const handleModalKeyDown = useCallback((e: React.KeyboardEvent, onClose: () => void) => {
      if (e.key === 'Escape') {
        onClose();
      }
    }, []);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
        <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center sm:items-start sm:pt-20 sm:p-0">
          {/* Extremely subtle overlay that barely affects background visibility */}
          <div className="fixed inset-0 bg-black/3 transition-opacity pointer-events-auto" onClick={onClose} />
          
          <div 
            className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-100 pointer-events-auto"
            onKeyDown={(e) => handleModalKeyDown(e, onClose)}
            tabIndex={-1}
          >
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-500 hover:text-gray-700 focus:outline-none text-sm font-medium"
                onClick={onClose}
              >
                {filterType === 'sellerType' ? t('search:cancel', 'Cancel') : <MdClose className="h-6 w-6" />}
              </button>
            </div>

            <div className="mt-3">
              {renderModalContent()}
              
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => clearSpecificFilter(filterType)}
                  className="rounded-md bg-white px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  {t('search.clearFilter', 'Clear filter')}
                </button>
                
                <button
                  onClick={() => {
                    // Close the modal since filters apply automatically
                    onClose();
                  }}
                  className="rounded-md bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {filterType === 'sellerType' 
                    ? t('search:showResults', 'Show {{count}} results', { count: carListings?.totalElements || 0 })
                    : t('search:done', 'Done')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Loading skeleton component for better UX
  const LoadingSkeleton = React.memo(() => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-w-16 aspect-h-12 bg-gray-300 h-48"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        <div className="h-5 bg-gray-300 rounded w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  ));
  LoadingSkeleton.displayName = 'LoadingSkeleton';

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
                  {t('search.searchLabel', 'Search for cars by make, model, or location')}
                </label>
                <div className="flex gap-2 sm:relative">
                  <div className="flex-1 relative">
                    <input
                      id="car-search-input"
                      type="text"
                      placeholder={t('search:placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")')}
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
                      aria-label={t('search.searchLabel', 'Search for cars by make, model, or location')}
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
                        aria-label={t('search.clearSearch', 'Clear search')}
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
                    aria-label={t('search.searchButton', 'Search for cars')}
                  >
                    {searchLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span className="sr-only">{t('search.searching', 'Searching...')}</span>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <MdSearch className="mr-1.5 h-4 w-4" />
                        <span className="whitespace-nowrap">{t('search.search', 'Search')}</span>
                      </div>
                    )}
                  </button>
                  
                  <div id="search-help" className="sr-only">
                    {t('search.searchHelp', 'Enter car make, model, or location and press Enter or click Search button')}
                  </div>
                </div>
              </div>
              
              {/* Multi-Location Filter */}
              <div className="w-full sm:w-auto sm:min-w-[200px] md:w-56 relative location-dropdown-container">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className={`group w-full px-4 py-3 text-base border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-left flex items-center justify-between font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                      showLocationDropdown
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/10'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
                    }`}
                    aria-label={t('search.locationFilterLabel', 'Filter by location')}
                    aria-expanded={showLocationDropdown}
                    aria-haspopup="listbox"
                    id="location-filter-button"
                  >
                    <span className="truncate">
                      {filters.locations && filters.locations.length > 0
                        ? filters.locations.length === 1
                          ? (() => {
                              // Find the governorate that matches the selected location
                              const selectedLocationSlug = filters.locations[0];
                              const selectedGov = governorates?.find(gov => 
                                (gov.slug || gov.displayNameEn.toLowerCase().replace(/\s+/g, '-')) === selectedLocationSlug
                              );
                              return selectedGov 
                                ? (currentLanguage === 'ar' ? selectedGov.displayNameAr : selectedGov.displayNameEn)
                                : selectedLocationSlug;
                            })()
                          : t('search.locationsSelected', { count: filters.locations.length })
                        : t('search:allLocations', 'All Governorates')
                      }
                    </span>
                    <MdKeyboardArrowDown 
                      className={`h-5 w-5 transition-all duration-300 group-hover:scale-105 ${
                        showLocationDropdown ? 'rotate-180 text-blue-500' : 'text-gray-400 group-hover:text-blue-500'
                      }`} 
                      aria-hidden="true"
                    />
                  </button>
                  
                  {/* Dropdown */}
                  {showLocationDropdown && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 max-h-72 flex flex-col backdrop-blur-sm animate-in slide-in-from-top-2 duration-300"
                      role="listbox"
                      aria-labelledby="location-filter-button"
                    >
                      {/* Scrollable location list */}
                      <div className="flex-1 overflow-y-auto p-2 max-h-56" role="group" aria-label={t('search.locationOptions', 'Location options')}>
                        {/* Location Options */}
                        {locationDropdownOptions.map((gov) => {
                          const isSelected = filters.locations?.includes(gov.slug) || false;
                          const locationValue = gov.slug;
                          const locationDisplayName = currentLanguage === 'ar' ? gov.displayNameAr : gov.displayNameEn;
                          
                          return (
                            <label
                              key={gov.id}
                              className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                                isSelected 
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const updatedFilters = { ...filters };
                                  
                                  if (e.target.checked) {
                                    // Add location
                                    updatedFilters.locations = [...(filters.locations || []), locationValue];

                                  } else {
                                    // Remove location
                                    updatedFilters.locations = filters.locations?.filter(loc => loc !== locationValue) || [];
                                    if (updatedFilters.locations.length === 0) {
                                      delete updatedFilters.locations;
                                    }

                                  }
                                  
                                  setFilters(updatedFilters);
                                  // Don't update URL or search immediately - wait for "Show" button
                                }}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-2 border-2 border-gray-300 rounded-md transition-all duration-200 group-hover:scale-105"
                                aria-describedby={`location-${gov.id}-label`}
                              />
                              <span 
                                className={`text-sm font-medium transition-colors ${
                                  isSelected ? 'text-blue-700 dark:text-blue-300' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                }`}
                                id={`location-${gov.id}-label`}
                              >
                                {locationDisplayName}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      
                      {/* Bottom buttons - Enhanced */}
                      <div className="border-t-2 border-gray-100 dark:border-gray-700 p-3 flex gap-2 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                        <button
                          onClick={() => {
                            const updatedFilters = { ...filters };
                            delete updatedFilters.locations;
                            setFilters(updatedFilters);
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99]"
                        >
                          {t('search.clear', 'Clear')}
                        </button>
                        <button
                          onClick={() => {
                            // Close the dropdown
                            setShowLocationDropdown(false);
                            
                            // The filters are already set by the checkboxes above
                            // The useEffect will handle updating the URL and triggering the search
                          }}
                          className="flex-1 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99]"
                        >
                          {t('search:show', 'Show')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                  onClick={() => setFiltersExpanded(true)}
                  className="group relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="Show all filters"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <MdFilterList className="w-4 h-4" />
                    <span>{t('search:showAllFilters', 'Show all filters')}</span>
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

        {/* All Filter Chips */}
        {(isFilterActive('makeModel') || isFilterActive('price') || isFilterActive('year') || isFilterActive('mileage') || isFilterActive('transmission') || isFilterActive('fuelType') || isFilterActive('bodyStyle') || isFilterActive('sellerType')) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Clear All Button - positioned first */}
              <button
                onClick={() => {
                  // Clear all filters
                  updateFiltersAndState({ 
                    brands: undefined,
                    models: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    minYear: undefined,
                    maxYear: undefined,
                    minMileage: undefined,
                    maxMileage: undefined,
                    transmissionId: undefined,
                    fuelTypeId: undefined,
                    bodyStyleId: undefined,
                    sellerTypeIds: undefined
                  }, {
                    selectedMake: null,
                    selectedModel: null
                  });
                }}
                className="group inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-md"
                aria-label={t('search.clearAllFilters', 'Clear all filters')}
              >
                <MdDeleteSweep className="w-4 h-4 mr-2 transition-transform group-hover:rotate-6" />
                {t('search:clear', 'Clear')} ({
                  (filters.brands?.length || 0) + 
                  (filters.models?.length || 0) + 
                  (filters.minPrice || filters.maxPrice ? 1 : 0) +
                  (filters.minYear || filters.maxYear ? 1 : 0) +
                  (filters.minMileage || filters.maxMileage ? 1 : 0) +
                  (filters.transmissionId ? 1 : 0) +
                  (filters.fuelTypeId ? 1 : 0) +
                  (filters.bodyStyleId ? 1 : 0) +
                  (filters.sellerTypeIds?.length || 0)
                })
              </button>

              {/* Brand Chips */}
              {filters.brands && filters.brands.map((brandSlug) => (
                <div
                  key={`brand-${brandSlug}`}
                  className="group inline-flex items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-md"
                >
                  <span>{getBrandDisplayNameFromSlug(brandSlug)}</span>
                  <button
                    onClick={() => {
                      const updatedBrands = filters.brands?.filter(b => b !== brandSlug) || [];
                      updateFiltersAndState({ 
                        brands: updatedBrands.length > 0 ? updatedBrands : undefined,
                        models: updatedBrands.length === 0 ? undefined : filters.models
                      }, {
                        selectedMake: updatedBrands.length === 0 ? null : selectedMake,
                        selectedModel: updatedBrands.length === 0 ? null : selectedModel
                      });
                    }}
                    className="ml-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-800/50 transform hover:scale-105 active:scale-95"
                    aria-label={t('search.removeBrand', 'Remove {{brand}} brand', { brand: getBrandDisplayNameFromSlug(brandSlug) })}
                  >
                    <MdClose className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Model Chips */}
              {filters.models && filters.models.map((modelSlug) => (
                <div
                  key={`model-${modelSlug}`}
                  className="group inline-flex items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-md"
                >
                  <span>{getModelDisplayNameFromSlug(modelSlug)}</span>
                  <button
                    onClick={() => {
                      const updatedModels = filters.models?.filter(m => m !== modelSlug) || [];
                      updateFiltersAndState({ 
                        models: updatedModels.length > 0 ? updatedModels : undefined
                      }, {
                        selectedModel: updatedModels.length === 0 ? null : selectedModel
                      });
                    }}
                    className="ml-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-800/50 transform hover:scale-105 active:scale-95"
                    aria-label={t('search.removeModel', 'Remove {{model}} model', { model: getModelDisplayNameFromSlug(modelSlug) })}
                  >
                    <MdClose className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Price Chip */}
              {(filters.minPrice || filters.maxPrice) && (
                <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <span>{getFilterDisplayText('price')}</span>
                  <button
                    onClick={() => updateFiltersAndState({ minPrice: undefined, maxPrice: undefined })}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removePriceFilter', 'Remove price filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Year Chip */}
              {(filters.minYear || filters.maxYear) && (
                <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <span>{getFilterDisplayText('year')}</span>
                  <button
                    onClick={() => updateFiltersAndState({ minYear: undefined, maxYear: undefined })}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removeYearFilter', 'Remove year filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Mileage Chip */}
              {(filters.minMileage || filters.maxMileage) && (
                <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <span>{getFilterDisplayText('mileage')}</span>
                  <button
                    onClick={() => updateFiltersAndState({ minMileage: undefined, maxMileage: undefined })}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removeMileageFilter', 'Remove mileage filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Transmission Chip */}
              {filters.transmissionId && (
                <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <span>{getTransmissionDisplayName(filters.transmissionId)}</span>
                  <button
                    onClick={() => updateFiltersAndState({ transmissionId: undefined })}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removeTransmissionFilter', 'Remove transmission filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Fuel Type Chip */}
              {filters.fuelTypeId && (
                <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <span>{getFuelTypeDisplayName(filters.fuelTypeId)}</span>
                  <button
                    onClick={() => updateFiltersAndState({ fuelTypeId: undefined })}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removeFuelTypeFilter', 'Remove fuel type filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Body Style Chip */}
              {filters.bodyStyleId && (
                <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <span>{getBodyStyleDisplayName(filters.bodyStyleId)}</span>
                  <button
                    onClick={() => updateFiltersAndState({ bodyStyleId: undefined })}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removeBodyStyleFilter', 'Remove body style filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Seller Type Chips */}
              {filters.sellerTypeIds && filters.sellerTypeIds.map((sellerTypeId) => (
                <div
                  key={`seller-${sellerTypeId}`}
                  className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <span>{getSellerTypeDisplayName(sellerTypeId)}</span>
                  <button
                    onClick={() => {
                      const updatedSellerTypes = filters.sellerTypeIds?.filter(id => id !== sellerTypeId) || [];
                      updateFiltersAndState({ 
                        sellerTypeIds: updatedSellerTypes.length > 0 ? updatedSellerTypes : undefined
                      });
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
                    aria-label={t('search.removeSellerTypeFilter', 'Remove seller type filter')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {carListings?.totalElements ? `${carListings.totalElements.toLocaleString()} ${t('search.results', 'results')}` : t('search.loading', 'Loading...')}
            </p>
          </div>
          
          <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
            <MdFavoriteBorder className="mr-2 h-4 w-4" />
            {t('search.saveSearch', 'Save search')}
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
                  <LoadingSkeleton key={index} />
                ))}
              </>
            )
          }
        >
          {listingsError ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">
                  {t('search.errorLoadingResults', 'Error loading results')}
                </div>
                <div className="text-gray-600 text-sm">
                  {typeof listingsError === 'string' ? listingsError : 'An error occurred'}
                </div>
                <button
                  onClick={() => executeSearch(false)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('search.tryAgain', 'Try again')}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search.noResultsFound', 'No cars found')}</h3>
              <p className="text-gray-600">{t('search.tryDifferentFilters', 'Try adjusting your search filters to see more results.')}</p>
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
                  {t('search.errorTitle', 'Something went wrong')}
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {listingsError || t('search.loadingError', 'Error loading filter options. Please refresh the page.')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
