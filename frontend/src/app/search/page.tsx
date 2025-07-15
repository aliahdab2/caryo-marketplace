"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useOptimizedFiltering } from '@/hooks/useOptimizedFiltering';
import SmoothTransition from '@/components/ui/SmoothTransition';
import { 
  MdClear, 
  MdTune,
  MdAdd,
  MdClose,
  MdDirectionsCar,
  MdFavoriteBorder,
  MdSearch,
  MdKeyboardArrowDown
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
  sellerTypeId?: number;
  
  // Direct field filters
  exteriorColor?: string;
  doors?: number;
  cylinders?: number;
}

type FilterType = 'makeModel' | 'price' | 'year' | 'mileage' | 'transmission' | 'condition' | 'fuelType' | 'bodyStyle' | 'sellerType';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

// Move namespaces outside component to prevent recreation on every render
const SEARCH_NAMESPACES = ['common', 'search'];

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
      sellerTypeId: filters.sellerTypeId,
      searchQuery: searchQuery.trim() || undefined, // Include search query
      size: 20, // Default page size
      page: 0, // Default to first page
      sort: 'createdAt,desc' // Default sort
    };

    // Slug-based filtering
    if (filters.brands && filters.brands.length > 0) {
      params.brands = filters.brands;
    }
    
    if (filters.models && filters.models.length > 0) {
      params.models = filters.models;
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
  const getConditionDisplayName = useMemo(() => 
    (id: number): string => {
      const condition = referenceData?.carConditions?.find(c => c.id === id);
      return condition ? (currentLanguage === 'ar' ? condition.displayNameAr : condition.displayNameEn) : '';
    }, [referenceData?.carConditions, currentLanguage]
  );

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
    
    // Handle location parameters - support multiple locations
    const locationParams = searchParams.getAll('location');
    const locationsParams = searchParams.getAll('locations'); // Backward compatibility
    if (locationParams.length > 0) {
      initialFilters.locations = locationParams;
    } else if (locationsParams.length > 0) {
      initialFilters.locations = locationsParams;
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

    setFilters(initialFilters);
    setHasInitialized(true);
  }, [hasInitialized, searchParams]);

  // Trigger search after filters are initialized - always search to show results
  useEffect(() => {
    if (hasInitialized) {
      // Delay search slightly to ensure all state is updated
      const timeoutId = setTimeout(() => {
        executeSearch(false);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasInitialized, listingFilters, executeSearch]);

  // Convert brand slugs to selectedMake ID when carMakes loads
  useEffect(() => {
    if (filters.brands && filters.brands.length > 0 && carMakes && carMakes.length > 0) {
      const firstBrandSlug = filters.brands[0];
      const brand = carMakes.find(make => make.slug === firstBrandSlug);
      if (brand) {
        setSelectedMake(prevSelectedMake => {
          // Only update if the value actually changed
          return prevSelectedMake !== brand.id ? brand.id : prevSelectedMake;
        });
      }
    } else if (!filters.brands?.length) {
      // Clear selection when no brand filters
      setSelectedMake(prevSelectedMake => {
        // Only update if there was a previous selection
        return prevSelectedMake !== null ? null : prevSelectedMake;
      });
    }
  }, [filters.brands, carMakes]); // Removed selectedMake from dependencies

  // Convert model slugs to selectedModel ID when availableModels loads
  useEffect(() => {
    if (filters.models && filters.models.length > 0 && availableModels && availableModels.length > 0) {
      const firstModelSlug = filters.models[0];
      const model = availableModels.find(m => m.slug === firstModelSlug);
      if (model) {
        setSelectedModel(prevSelectedModel => {
          // Only update if the value actually changed
          return prevSelectedModel !== model.id ? model.id : prevSelectedModel;
        });
      }
    } else if (!filters.models?.length) {
      // Clear selection when no model filters
      setSelectedModel(prevSelectedModel => {
        // Only update if there was a previous selection
        return prevSelectedModel !== null ? null : prevSelectedModel;
      });
    }
  }, [filters.models, availableModels]); // Removed selectedModel from dependencies

  // Function to update URL when filters change
  // URLs use clean singular form (brand/model) for SEO and UX
  // Backend API expects plural form (brandSlugs/modelSlugs)
  const updateUrlFromFilters = useCallback((newFilters: AdvancedSearchFilters) => {
    console.log('updateUrlFromFilters called with:', newFilters);
    const params = new URLSearchParams();
    
    // Location first for SEO - local relevance is primary
    if (newFilters.locations && newFilters.locations.length > 0) {
      console.log('Adding locations to URL:', newFilters.locations);
      newFilters.locations.forEach(location => {
        params.append('location', location);
      });
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
    if (newFilters.conditionId) params.append('conditionId', newFilters.conditionId.toString());
    if (newFilters.transmissionId) params.append('transmissionId', newFilters.transmissionId.toString());
    if (newFilters.fuelTypeId) params.append('fuelTypeId', newFilters.fuelTypeId.toString());
    if (newFilters.bodyStyleId) params.append('bodyStyleId', newFilters.bodyStyleId.toString());
    if (newFilters.sellerTypeId) params.append('sellerTypeId', newFilters.sellerTypeId.toString());
    
    // Update URL without causing a page reload
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Handle input changes - simplified for slug-based filtering only
  const handleInputChange = useCallback((field: keyof AdvancedSearchFilters, value: string | number | undefined) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [field]: value || undefined
      };

      // Update URL with the new filters after state update
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => updateUrlFromFilters(newFilters));
      
      return newFilters;
    });
  }, [updateUrlFromFilters]);

  // Clear all filters - simplified to prevent loops (excludes locations)
  const clearAllFilters = useCallback(() => {
    const emptyFilters: Partial<AdvancedSearchFilters> = {};
    // Preserve locations when clearing other filters
    if (filters.locations) {
      emptyFilters.locations = filters.locations;
    }
    setFilters(emptyFilters);
    setSelectedMake(null);
    setSelectedModel(null);
    setSearchQuery('');
    updateUrlFromFilters(emptyFilters);
  }, [updateUrlFromFilters, filters.locations]);

  // Clear filter - simplified to prevent loops  
  const clearSpecificFilter = useCallback((filterType: FilterType) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      switch (filterType) {
        case 'makeModel':
          // Clear slug-based filters only
          delete newFilters.brands;
          delete newFilters.models;
          setSelectedMake(null);
          setSelectedModel(null);
          break;
        case 'price':
          delete newFilters.minPrice;
          delete newFilters.maxPrice;
          break;
        case 'year':
          delete newFilters.minYear;
          delete newFilters.maxYear;
          break;
        case 'mileage':
          delete newFilters.minMileage;
          delete newFilters.maxMileage;
          break;
        case 'transmission':
          delete newFilters.transmissionId;
          break;
        case 'condition':
          delete newFilters.conditionId;
          break;
        case 'fuelType':
          delete newFilters.fuelTypeId;
          break;
        case 'bodyStyle':
          delete newFilters.bodyStyleId;
          break;
        case 'sellerType':
          delete newFilters.sellerTypeId;
          break;
      }
      
      // Update URL with cleared filters - use requestAnimationFrame for better performance
      requestAnimationFrame(() => updateUrlFromFilters(newFilters));
      
      return newFilters;
    });
  }, [updateUrlFromFilters]);

  // Count active filters with memoization
  const activeFiltersCount = useMemo(() => {
    // Count filters excluding locations (locations have their own clear button)
    const filtersToCount = { ...filters };
    delete filtersToCount.locations; // Don't count locations in main filter count
    
    return Object.values(filtersToCount).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  }, [filters]);

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
        return filters.transmissionId ? getTransmissionDisplayName(filters.transmissionId) : t('search.gearbox', 'Gearbox');
      case 'condition':
        return filters.conditionId ? getConditionDisplayName(filters.conditionId) : t('search.condition', 'Condition');
      case 'fuelType':
        return filters.fuelTypeId ? getFuelTypeDisplayName(filters.fuelTypeId) : t('search.fuelType', 'Fuel type');
      case 'bodyStyle':
        return filters.bodyStyleId ? getBodyStyleDisplayName(filters.bodyStyleId) : t('search.bodyStyle', 'Body style');
      case 'sellerType':
        return filters.sellerTypeId ? getSellerTypeDisplayName(filters.sellerTypeId) : t('search.sellerType', 'Seller type');
      default:
        return '';
    }
  }, [filters, t, getBrandDisplayNameFromSlug, getModelDisplayNameFromSlug, getTransmissionDisplayName, getConditionDisplayName, getFuelTypeDisplayName, getBodyStyleDisplayName, getSellerTypeDisplayName]);

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
      case 'condition':
        return !!filters.conditionId;
      case 'fuelType':
        return !!filters.fuelTypeId;
      case 'bodyStyle':
        return !!filters.bodyStyleId;
      case 'sellerType':
        return !!filters.sellerTypeId;
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
        className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        aria-label={`Filter by ${displayText}`}
      >
        <MdAdd className="mr-2 h-4 w-4" />
        {displayText}
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
                      setSelectedMake(makeId);
                      setSelectedModel(null); // Reset model when brand changes
                      
                      // Find the brand and update filters with slug
                      if (makeId && carMakes) {
                        const brand = carMakes.find(make => make.id === makeId);
                        if (brand) {
                          const newFilters = {
                            ...filters,
                            brands: [brand.slug],
                            models: []
                          };
                          setFilters(newFilters);
                          // Use requestAnimationFrame for better performance
                          requestAnimationFrame(() => updateUrlFromFilters(newFilters));
                        }
                      } else {
                        const newFilters = {
                          ...filters,
                          brands: [],
                          models: []
                        };
                        setFilters(newFilters);
                        requestAnimationFrame(() => updateUrlFromFilters(newFilters));
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
                      setSelectedModel(modelId);
                      
                      // Find the model and update filters with slug
                      if (modelId && availableModels) {
                        const model = availableModels.find(m => m.id === modelId);
                        if (model) {
                          const newFilters = {
                            ...filters,
                            models: [model.slug]
                          };
                          setFilters(newFilters);
                          // Use requestAnimationFrame for better performance
                          requestAnimationFrame(() => updateUrlFromFilters(newFilters));
                        }
                      } else {
                        const newFilters = {
                          ...filters,
                          models: []
                        };
                        setFilters(newFilters);
                        requestAnimationFrame(() => updateUrlFromFilters(newFilters));
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
                    <label className="block text-sm text-gray-600 mb-2">From</label>
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
                      {YEARS.map(year => (
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
                    <label className="block text-sm text-gray-600 mb-2">From</label>
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

        case 'condition':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.condition', 'Condition')}</h3>
                <select
                  value={filters.conditionId || ''}
                  onChange={(e) => handleInputChange('conditionId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.carConditions?.map(condition => (
                    <option key={condition.id} value={condition.id}>
                      {currentLanguage === 'ar' ? condition.displayNameAr : condition.displayNameEn}
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
                <select
                  value={filters.bodyStyleId || ''}
                  onChange={(e) => handleInputChange('bodyStyleId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.bodyStyles?.map(bodyStyle => (
                    <option key={bodyStyle.id} value={bodyStyle.id}>
                      {currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'sellerType':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.sellerType', 'Seller type')}</h3>
                <select
                  value={filters.sellerTypeId || ''}
                  onChange={(e) => handleInputChange('sellerTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.sellerTypes?.map(sellerType => {
                    const id = sellerType.id as number;
                    const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string };
                    return (
                      <option key={id} value={id}>
                        {currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn}
                      </option>
                    );
                  })}
                </select>
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
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-3">
              {renderModalContent()}
              
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => clearSpecificFilter(filterType)}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  {t('search.clearFilter', 'Clear filter')}
                </button>
                
                <button
                  onClick={() => {
                    // Close the modal since filters apply automatically
                    onClose();
                  }}
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('search.done', 'Done')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle done button - close any open modals since filters apply automatically
  const handleCloseFilters = useCallback(() => {
    // Close any open filter modals
    setActiveFilterModal(null);
  }, []);

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
    // Don't search if the search query is empty
    if (!searchQuery.trim()) {
      return;
    }
    
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
        {/* Main Search Bar - Blocket Style */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Text Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('search.placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className={`w-full py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      currentLanguage === 'ar' ? 'text-right dir-rtl pr-4 pl-12' : 'text-left pl-4 pr-12'
                    }`}
                    dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleSearch();
                      }}
                      className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
                        currentLanguage === 'ar' ? 'left-3' : 'right-3'
                      }`}
                    >
                      <MdClose className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Multi-Location Filter */}
              <div className="md:w-64 relative location-dropdown-container">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
                  >
                    <span>
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
                        : t('search.allLocations', 'All Locations')
                      }
                    </span>
                    <MdKeyboardArrowDown className={`h-5 w-5 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown */}
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 flex flex-col">
                      {/* Scrollable location list */}
                      <div className="flex-1 overflow-y-auto p-2 max-h-60">
                        {/* Location Options */}
                        {locationDropdownOptions.map((gov) => {
                          const isSelected = filters.locations?.includes(gov.slug) || false;
                          const locationValue = gov.slug;
                          
                          return (
                            <label
                              key={gov.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const updatedFilters = { ...filters };
                                  
                                  if (e.target.checked) {
                                    // Add location
                                    updatedFilters.locations = [...(filters.locations || []), locationValue];
                                    console.log('Added location:', locationValue, 'New locations:', updatedFilters.locations);
                                  } else {
                                    // Remove location
                                    updatedFilters.locations = filters.locations?.filter(loc => loc !== locationValue) || [];
                                    if (updatedFilters.locations.length === 0) {
                                      delete updatedFilters.locations;
                                    }
                                    console.log('Removed location:', locationValue, 'New locations:', updatedFilters.locations);
                                  }
                                  
                                  setFilters(updatedFilters);
                                  // Don't update URL or search immediately - wait for "Show" button
                                }}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm">
                                {currentLanguage === 'ar' ? gov.displayNameAr : gov.displayNameEn}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      
                      {/* Bottom buttons - Blocket style */}
                      <div className="border-t border-gray-200 dark:border-gray-600 p-3 flex gap-2">
                        <button
                          onClick={() => {
                            const updatedFilters = { ...filters };
                            delete updatedFilters.locations;
                            setFilters(updatedFilters);
                          }}
                          className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          {t('search.clear', 'Clear')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Show button clicked, current filters:', filters);
                            
                            // Apply the current filter selections
                            updateUrlFromFilters(filters);
                            
                            // Trigger search after a short delay to ensure URL is updated
                            setTimeout(() => {
                              console.log('Executing search after URL update');
                              executeSearch(false);
                            }, 100);
                            
                            // Close the dropdown
                            setShowLocationDropdown(false);
                          }}
                          className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          {filters.locations && filters.locations.length > 0 
                            ? `${t('search.show', 'Show')} ${filters.locations.length} ${t('search.results', 'results')}`
                            : t('search.showAll', 'Show all')
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || searchLoading}
                className={`px-8 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center ${
                  !searchQuery.trim() || searchLoading
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {searchLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <MdSearch className="mr-2 h-5 w-5" />
                    {t('search.search', 'Search')}
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>

        {/* Filter Pills Row - AutoTrader UK Style */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterPill filterType="makeModel" onClick={() => setActiveFilterModal('makeModel')} />
            <FilterPill filterType="price" onClick={() => setActiveFilterModal('price')} />
            <FilterPill filterType="year" onClick={() => setActiveFilterModal('year')} />
            <FilterPill filterType="mileage" onClick={() => setActiveFilterModal('mileage')} />
            <FilterPill filterType="transmission" onClick={() => setActiveFilterModal('transmission')} />
            <FilterPill filterType="condition" onClick={() => setActiveFilterModal('condition')} />
            <FilterPill filterType="fuelType" onClick={() => setActiveFilterModal('fuelType')} />
            <FilterPill filterType="bodyStyle" onClick={() => setActiveFilterModal('bodyStyle')} />
            <FilterPill filterType="sellerType" onClick={() => setActiveFilterModal('sellerType')} />
            
            {/* Filter and Sort Button */}
            <button
              onClick={() => {
                // Simply close any open modals since filters apply automatically
                handleCloseFilters();
              }}
              className="inline-flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
            >
              <MdTune className="mr-2 h-4 w-4" />
              {t('search.filterAndSort', 'Filters')}
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {carListings?.totalElements ? `${carListings.totalElements.toLocaleString()} ${t('search.results', 'results')}` : t('search.loading', 'Loading...')}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <MdClear className="mr-1 h-4 w-4" />
                {t('search.clearAll', 'Clear all filters')}
              </button>
            )}
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
                <CarListingCard
                  key={listing.id}
                  listing={cardData}
                  onFavoriteToggle={(_isFavorite) => {
                    // Handle favorite toggle if needed
                  }}
                  initialFavorite={false}
                />
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
