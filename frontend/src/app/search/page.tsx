"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  MdClear, 
  MdTune,
  MdAdd,
  MdClose,
  MdDirectionsCar,
  MdFavoriteBorder,
  MdSearch
} from 'react-icons/md';
import { CarMake, CarModel } from '@/types/car';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { 
  fetchCarBrandsWithRealCounts,
  fetchCarModelsWithRealCounts,
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
  // Basic filters matching backend ListingFilterRequest
  brand?: string;
  model?: string | string[]; // Support both single model and multiple models
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  
  // Location filters
  location?: string;
  locationId?: number;
  
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

type FilterType = 'makeModel' | 'price' | 'year' | 'mileage' | 'transmission' | 'condition' | 'fuelType' | 'bodyStyle' | 'location' | 'sellerType' | 'exteriorColor' | 'doors' | 'cylinders' | 'allFilters';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

export default function AdvancedSearchPage() {
  const { t, i18n } = useTranslation(['common', 'search']);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [selectedMake, setSelectedMake] = useState<number | null>(null);
  const [activeFilterModal, setActiveFilterModal] = useState<FilterType | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // Add search state

  // Car listings state
  const [carListings, setCarListings] = useState<PageResponse<CarListing> | null>(null);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // API data hooks
  const {
    data: carMakes = [],
    isLoading: _isLoadingBrands,
    error: brandsError
  } = useApiData<CarMake[]>(
    fetchCarBrandsWithRealCounts, // Use real counts from actual listings
    '/api/reference-data/brands-with-counts',
    [t]
  );

  const {
    data: availableModels = [],
    isLoading: _isLoadingModels,
    error: modelsError
  } = useApiData<CarModel[]>(
    () => selectedMake ? fetchCarModelsWithRealCounts(selectedMake) : Promise.resolve([]), // Use real counts from actual listings
    selectedMake ? `/api/reference-data/brands/${selectedMake}/models-with-counts` : '',
    [selectedMake, t],
    selectedMake ? { makeId: selectedMake } : undefined
  );

  const {
    data: referenceData,
    isLoading: isLoadingReferenceData,
    error: referenceDataError
  } = useApiData<CarReferenceData>(
    fetchCarReferenceData,
    '/api/reference-data',
    [t]
  );

  const {
    data: governorates = [],
    isLoading: isLoadingGovernorates,
    error: _governoratesError
  } = useApiData<Governorate[]>(
    fetchGovernorates,
    '/api/reference-data/governorates',
    [t]
  );

  // Get display name based on current language
  const getDisplayName = useCallback((item: { displayNameEn: string; displayNameAr: string }) => {
    return i18n.language === 'ar' ? item.displayNameAr : item.displayNameEn;
  }, [i18n.language]);

  // Helper functions to get display names for reference data
  const getConditionDisplayName = useCallback((id: number): string => {
    const condition = referenceData?.carConditions?.find(c => c.id === id);
    return condition ? getDisplayName(condition) : '';
  }, [referenceData, getDisplayName]);

  const getTransmissionDisplayName = useCallback((id: number): string => {
    const transmission = referenceData?.transmissions?.find(t => t.id === id);
    return transmission ? getDisplayName(transmission) : '';
  }, [referenceData, getDisplayName]);

  const getFuelTypeDisplayName = useCallback((id: number): string => {
    const fuelType = referenceData?.fuelTypes?.find(f => f.id === id);
    return fuelType ? getDisplayName(fuelType) : '';
  }, [referenceData, getDisplayName]);

  const getBodyStyleDisplayName = useCallback((id: number): string => {
    const bodyStyle = referenceData?.bodyStyles?.find(b => b.id === id);
    return bodyStyle ? getDisplayName(bodyStyle) : '';
  }, [referenceData, getDisplayName]);

  const getSellerTypeDisplayName = useCallback((id: number): string => {
    const sellerType = referenceData?.sellerTypes?.find(s => s.id === id);
    if (sellerType && typeof sellerType === 'object' && 'displayNameEn' in sellerType && 'displayNameAr' in sellerType) {
      return getDisplayName(sellerType as { displayNameEn: string; displayNameAr: string });
    }
    return '';
  }, [referenceData, getDisplayName]);

  const getLocationDisplayName = useCallback((locationId: number): string => {
    const governorate = governorates?.find(g => g.id === locationId);
    return governorate ? getDisplayName(governorate) : '';
  }, [governorates, getDisplayName]);

  // Initialize form from URL params (only on initial load)
  useEffect(() => {
    console.log('Initializing filters from URL params:', searchParams?.toString());
    const initialFilters: AdvancedSearchFilters = {};
    
    // Basic filters
    if (searchParams?.get('brand')) initialFilters.brand = searchParams.get('brand')!;
    if (searchParams?.get('model')) {
      const modelParam = searchParams.get('model')!;
      // Handle comma-separated models
      if (modelParam.includes(',')) {
        initialFilters.model = modelParam.split(',').map(m => m.trim());
      } else {
        initialFilters.model = modelParam;
      }
    }
    if (searchParams?.get('minYear')) initialFilters.minYear = parseInt(searchParams.get('minYear')!);
    if (searchParams?.get('maxYear')) initialFilters.maxYear = parseInt(searchParams.get('maxYear')!);
    if (searchParams?.get('minPrice')) initialFilters.minPrice = parseFloat(searchParams.get('minPrice')!);
    if (searchParams?.get('maxPrice')) initialFilters.maxPrice = parseFloat(searchParams.get('maxPrice')!);
    if (searchParams?.get('minMileage')) initialFilters.minMileage = parseInt(searchParams.get('minMileage')!);
    if (searchParams?.get('maxMileage')) initialFilters.maxMileage = parseInt(searchParams.get('maxMileage')!);
    
    // Location filters
    if (searchParams?.get('location')) initialFilters.location = searchParams.get('location')!;
    if (searchParams?.get('locationId')) initialFilters.locationId = parseInt(searchParams.get('locationId')!);
    
    // Entity ID filters
    if (searchParams?.get('conditionId')) initialFilters.conditionId = parseInt(searchParams.get('conditionId')!);
    if (searchParams?.get('transmissionId')) initialFilters.transmissionId = parseInt(searchParams.get('transmissionId')!);
    if (searchParams?.get('fuelTypeId')) initialFilters.fuelTypeId = parseInt(searchParams.get('fuelTypeId')!);
    if (searchParams?.get('bodyStyleId')) initialFilters.bodyStyleId = parseInt(searchParams.get('bodyStyleId')!);
    if (searchParams?.get('sellerTypeId')) initialFilters.sellerTypeId = parseInt(searchParams.get('sellerTypeId')!);
    if (searchParams?.get('exteriorColor')) initialFilters.exteriorColor = searchParams.get('exteriorColor')!;
    if (searchParams?.get('doors')) initialFilters.doors = parseInt(searchParams.get('doors')!);
    if (searchParams?.get('cylinders')) initialFilters.cylinders = parseInt(searchParams.get('cylinders')!);

    console.log('Setting initial filters:', initialFilters);
    setFilters(initialFilters);
  }, [searchParams]); // Remove carMakes and getDisplayName dependencies

  // Set selected make when carMakes loads and we have a brand filter
  // useEffect(() => {
  //   if (filters.brand && carMakes && carMakes.length > 0) {
  //     const brand = carMakes.find(make => 
  //       getDisplayName(make).toLowerCase() === filters.brand?.toLowerCase()
  //     );
  //     if (brand) {
  //       console.log('Setting selected make:', brand);
  //       setSelectedMake(brand.id);
  //     }
  //   }
  // }, [filters.brand, carMakes, getDisplayName]);

  // Debug effect to monitor available models and selectedMake
  useEffect(() => {
    console.log('State changed:', {
      selectedMake,
      modelsCount: availableModels?.length || 0,
      isLoadingModels: _isLoadingModels,
      models: availableModels?.map(m => ({ id: m.id, name: getDisplayName(m) }))
    });
  }, [availableModels, selectedMake, _isLoadingModels, getDisplayName]);

  // Filter car makes based on search term
  const filteredCarMakes = useMemo(() => {
    if (!searchTerm.trim() || !carMakes) {
      return carMakes || [];
    }
    
    return carMakes.filter(make => 
      getDisplayName(make).toLowerCase().includes(searchTerm.toLowerCase()) ||
      make.displayNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      make.displayNameAr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [carMakes, searchTerm, getDisplayName]);

  // Handle input changes with better state management
  const handleInputChange = useCallback((field: keyof AdvancedSearchFilters, value: string | number | string[] | undefined, keepModels = false) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [field]: value || undefined
      };

      // Reset model when brand changes (but only if not setting multiple models)
      // Don't reset models if we're just auto-selecting a brand for existing models
      if (field === 'brand' && !keepModels && !Array.isArray(prev.model)) {
        newFilters.model = undefined;
      }

      return newFilters;
    });

    // Update selected make when brand changes
    if (field === 'brand') {
      const brand = carMakes?.find(make => 
        getDisplayName(make).toLowerCase() === value?.toString().toLowerCase()
      );
      setSelectedMake(brand ? brand.id : null);
    }
  }, [carMakes, getDisplayName]);

  // Helper functions for multiple model handling
  const getSelectedModels = useCallback((): string[] => {
    if (!filters.model) return [];
    return Array.isArray(filters.model) ? filters.model : [filters.model];
  }, [filters.model]);

  const isModelSelected = useCallback((modelName: string): boolean => {
    const selectedModels = getSelectedModels();
    return selectedModels.includes(modelName);
  }, [getSelectedModels]);

  const addModel = useCallback((modelName: string) => {
    const selectedModels = getSelectedModels();
    if (!selectedModels.includes(modelName)) {
      const newModels = [...selectedModels, modelName];
      const newModelValue = newModels.length === 1 ? newModels[0] : newModels;
      console.log('Adding model:', modelName);
      console.log('Previous models:', selectedModels);
      console.log('New models:', newModels);
      console.log('New model value for filter:', newModelValue);
      
      handleInputChange('model', newModelValue);
      
      // Auto-select the brand if not already selected
      if (!filters.brand && selectedMake) {
        const make = carMakes?.find(m => m.id === selectedMake);
        if (make) {
          handleInputChange('brand', getDisplayName(make), true); // Keep models when auto-selecting brand
        }
      }
    }
  }, [getSelectedModels, handleInputChange, filters.brand, selectedMake, carMakes, getDisplayName]);

  const removeModel = useCallback((modelName: string) => {
    const selectedModels = getSelectedModels();
    const newModels = selectedModels.filter(m => m !== modelName);
    const newModelValue = newModels.length === 0 ? undefined : (newModels.length === 1 ? newModels[0] : newModels);
    console.log('Removing model:', modelName);
    console.log('Previous models:', selectedModels);
    console.log('New models:', newModels);
    console.log('New model value for filter:', newModelValue);
    
    handleInputChange('model', newModelValue);
  }, [getSelectedModels, handleInputChange]);

  // Clear all filters with URL update
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSelectedMake(null);
    // Clear URL parameters as well
    router.replace('/search');
  }, [router]);

  // Clear filter with immediate URL update
  const clearSpecificFilter = useCallback((filterType: FilterType) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      switch (filterType) {
        case 'makeModel':
          delete newFilters.brand;
          delete newFilters.model;
          setSelectedMake(null);
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
        case 'location':
          delete newFilters.location;
          delete newFilters.locationId;
          break;
        case 'sellerType':
          delete newFilters.sellerTypeId;
          break;
        case 'exteriorColor':
          delete newFilters.exteriorColor;
          break;
        case 'doors':
          delete newFilters.doors;
          break;
        case 'cylinders':
          delete newFilters.cylinders;
          break;
      }
      
      return newFilters;
    });
  }, []);

  // Handle search submission with debounced URL updates
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add all non-empty filters to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Convert array to comma-separated string for URL
          params.set(key, value.join(','));
        } else {
          params.set(key, value.toString());
        }
      }
    });

    // Update current page URL instead of navigating away
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newUrl);
  }, [filters, router]);

  // Count active filters with memoization
  const activeFiltersCount = useMemo(() => 
    Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length,
    [filters]
  );

  // Get filter display text
  const getFilterDisplayText = (filterType: FilterType): string => {
    switch (filterType) {
      case 'makeModel':
        if (filters.brand && filters.model) {
          const modelText = Array.isArray(filters.model) 
            ? (filters.model.length > 1 ? `${filters.model.length} models` : filters.model[0])
            : filters.model;
          return `${filters.brand} ${modelText}`;
        }
        if (filters.brand) return filters.brand;
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
      case 'location':
        return filters.locationId ? getLocationDisplayName(filters.locationId) : t('search.location', 'Location');
      case 'sellerType':
        return filters.sellerTypeId ? getSellerTypeDisplayName(filters.sellerTypeId) : t('search.sellerType', 'Seller type');
      case 'exteriorColor':
        return filters.exteriorColor || t('search.exteriorColor', 'Exterior color');
      case 'doors':
        return filters.doors ? `${filters.doors} ${t('search.doors', 'doors')}` : t('search.doors', 'Doors');
      case 'cylinders':
        return filters.cylinders ? `${filters.cylinders} ${t('search.cylinders', 'cylinders')}` : t('search.cylinders', 'Cylinders');
      default:
        return '';
    }
  };

  // Check if filter has active values
  const isFilterActive = (filterType: FilterType): boolean => {
    switch (filterType) {
      case 'makeModel':
        return !!(filters.brand || filters.model);
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
      case 'location':
        return !!filters.locationId;
      case 'sellerType':
        return !!filters.sellerTypeId;
      case 'exteriorColor':
        return !!filters.exteriorColor;
      case 'doors':
        return !!filters.doors;
      case 'cylinders':
        return !!filters.cylinders;
      default:
        return false;
    }
  };

  // Individual model pill component for Blocket-style display
  const ModelPill = React.memo(({ modelName, onRemove }: { modelName: string; onRemove: () => void }) => {
    return (
      <div className="inline-flex items-center px-4 py-2.5 rounded-full border bg-blue-600 border-blue-600 text-white text-sm font-medium transition-all duration-200 hover:bg-blue-700 shadow-md">
        <span>{modelName}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 h-4 w-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
          aria-label={`Remove ${modelName} filter`}
        >
          <MdClose className="h-3 w-3 text-white" />
        </button>
      </div>
    );
  });
  ModelPill.displayName = 'ModelPill';

  // Brand pill component for Blocket-style display
  const BrandPill = React.memo(({ brandName, onClick, onRemove }: { brandName: string; onClick: () => void; onRemove: () => void }) => {
    return (
      <div
        onClick={onClick}
        className="inline-flex items-center px-4 py-2.5 rounded-full border bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md text-sm font-medium transition-all duration-200 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`Filter by ${brandName}`}
      >
        <div className="mr-2 h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white"></div>
        </div>
        {brandName}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 h-4 w-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
          aria-label={`Remove ${brandName} filter`}
        >
          <MdClose className="h-3 w-3 text-white" />
        </button>
      </div>
    );
  });
  BrandPill.displayName = 'BrandPill';

  // Filter pill component with memo for performance - 90% Original Size
  const FilterPill = React.memo(({ filterType, onClick }: { filterType: FilterType; onClick: () => void }) => {
    const isActive = isFilterActive(filterType);
    const displayText = getFilterDisplayText(filterType);
    
    // Slightly shorten some text for better fit, but keep most readable
    const getOptimizedDisplayText = (text: string) => {
      const optimizedMappings: Record<string, string> = {
        'Make and model': 'Make & Model',
        'Transmission': 'Gearbox'
      };
      return optimizedMappings[text] || text;
    };
    
    const optimizedText = getOptimizedDisplayText(displayText);
    
    return (
      <button
        onClick={onClick}
        className={`flex-shrink-0 inline-flex items-center px-3 py-2 rounded-full border text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        }`}
        aria-label={`Filter by ${displayText}`}
      >
        {!isActive && <MdAdd className="mr-1.5 h-4 w-4" />}
        {isActive && (
          <div className="mr-1.5 h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
          </div>
        )}
        <span className="truncate max-w-[100px]">{optimizedText}</span>
        {isActive && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              clearSpecificFilter(filterType);
            }}
            className="ml-1.5 h-4 w-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                clearSpecificFilter(filterType);
              }
            }}
          >
            <MdClose className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </button>
    );
  });
  FilterPill.displayName = 'FilterPill';

  // Modal component
  const FilterModal = ({ filterType, onClose }: { filterType: FilterType; onClose: () => void }) => {
    // Reset search when modal closes
    const handleClose = () => {
      setSearchTerm('');
      onClose();
    };
    
    const renderModalContent = () => {
      switch (filterType) {
        case 'makeModel':
          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('search.makeAndModel', 'Make & Model')}</h2>
              </div>

              {/* Search bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('search.searchPlaceholder', 'Search for brands...')}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <MdClose className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Selected Filters Pills Section */}
              {(filters.brand || getSelectedModels().length > 0) && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">{t('search.selectedFilters', 'Selected filters')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Brand pill */}
                    {filters.brand && (
                      <BrandPill 
                        brandName={filters.brand}
                        onClick={() => {
                          // When clicking on brand pill in modal, find and expand the brand
                          const brand = carMakes?.find(make => 
                            getDisplayName(make).toLowerCase() === filters.brand?.toLowerCase()
                          );
                          if (brand) {
                            setSelectedMake(brand.id);
                          }
                        }}
                        onRemove={() => {
                          handleInputChange('brand', undefined);
                          handleInputChange('model', undefined);
                          setSelectedMake(null);
                        }}
                      />
                    )}
                    
                    {/* Model pills */}
                    {getSelectedModels().map(modelName => (
                      <ModelPill 
                        key={modelName}
                        modelName={modelName}
                        onRemove={() => removeModel(modelName)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Brands section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {searchTerm 
                    ? `${t('search.searchResults', 'Search results')} (${filteredCarMakes.length})` 
                    : t('search.popularBrands', 'Vanligaste märkena')
                  }
                </h3>
                
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredCarMakes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="mb-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-3v3m-2.5 6.5h5"></path>
                        </svg>
                      </div>
                      <p>{t('search.noSearchResults', 'No brands found')}</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {t('search.clearSearch', 'Clear search')}
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredCarMakes?.slice(0, 15).map(make => (
                    <div key={make.id} className="space-y-2">
                      {/* Brand row */}
                      <div 
                        className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2"
                        onClick={(e) => e.stopPropagation()} // Prevent modal from closing
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id={`make-${make.id}`}
                            checked={filters.brand === getDisplayName(make)}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent modal from closing
                              console.log('Brand checkbox clicked:', getDisplayName(make), 'checked:', e.target.checked);
                              if (e.target.checked) {
                                // Select the brand and expand to show models
                                handleInputChange('brand', getDisplayName(make));
                                setSelectedMake(make.id);
                                console.log('Expanding brand:', make.id);
                              } else {
                                // Unselect the brand and clear models when unchecking
                                handleInputChange('brand', undefined);
                                handleInputChange('model', undefined);
                                if (selectedMake === make.id) {
                                  setSelectedMake(null);
                                  console.log('Collapsing brand:', make.id);
                                }
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor={`make-${make.id}`}
                            className="text-gray-900 cursor-pointer flex-1 font-medium"
                            onClick={(e) => e.stopPropagation()} // Prevent modal from closing
                          >
                            {getDisplayName(make)}
                          </label>
                          <span className="text-gray-500 text-sm">
                            ({make.listingCount || 0})
                          </span>
                        </div>
                        
                        {/* Expandable arrow for models */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent modal from closing
                            console.log('Expand/collapse button clicked for brand:', getDisplayName(make), 'current selectedMake:', selectedMake);
                            if (selectedMake === make.id) {
                              // If currently expanded, collapse it
                              setSelectedMake(null);
                              console.log('Collapsing brand:', make.id);
                            } else {
                              // If collapsed or different brand selected, expand this one
                              setSelectedMake(make.id);
                              console.log('Expanding brand:', make.id);
                              // Don't auto-select the brand when just expanding to view models
                            }
                          }}
                          className="ml-2 p-1 hover:bg-gray-100 rounded"
                        >
                          <svg 
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              selectedMake === make.id ? 'rotate-90' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Models section - shown under the brand when expanded */}
                      {selectedMake === make.id && (
                        <div 
                          className="ml-8 border-l-2 border-blue-200 pl-4 space-y-1 bg-blue-50/30 py-2 rounded-r-md"
                          onClick={(e) => e.stopPropagation()} // Prevent modal from closing
                        >
                          {_isLoadingModels ? (
                            <div className="text-xs text-gray-500 italic">
                              {t('search.loadingModels', 'Loading models...')}
                            </div>
                          ) : availableModels && availableModels.length > 0 ? (
                            <>
                              <div className="text-xs text-blue-600 font-medium mb-2 uppercase tracking-wider">
                                {availableModels.length} {t('search.models', 'models')}
                              </div>
                              {availableModels.map(model => (
                                <div 
                                  key={model.id} 
                                  className="flex items-center justify-between py-1 hover:bg-blue-50 rounded-md px-2"
                                  onClick={(e) => e.stopPropagation()} // Prevent modal from closing
                                >
                                  <div className="flex items-center space-x-3 flex-1">
                                    <input
                                      type="checkbox"
                                      id={`model-${model.id}`}
                                      checked={isModelSelected(getDisplayName(model))}
                                      onChange={(e) => {
                                        e.stopPropagation(); // Prevent modal from closing
                                        if (e.target.checked) {
                                          addModel(getDisplayName(model));
                                        } else {
                                          removeModel(getDisplayName(model));
                                        }
                                      }}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label 
                                      htmlFor={`model-${model.id}`}
                                      className="text-gray-700 cursor-pointer text-sm"
                                      onClick={(e) => e.stopPropagation()} // Prevent modal from closing
                                    >
                                      {getDisplayName(model)}
                                    </label>                                <span className="text-gray-400 text-xs">
                                  ({model.listingCount || 0})
                                </span>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              {t('search.noModels', 'No models available')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Bottom action buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleInputChange('brand', undefined);
                    handleInputChange('model', undefined);
                    setSelectedMake(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {t('search.reset', 'Rensa')}
                </button>
                
                <button
                  onClick={() => {
                    handleSearch();
                    handleClose();
                  }}
                  className="px-8 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-sm"
                >
                  {t('search.showResults', 'Visa annonser')}
                </button>
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
                      {getDisplayName(transmission)}
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
                      {getDisplayName(condition)}
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
                      {getDisplayName(fuelType)}
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
                      {getDisplayName(bodyStyle)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'location':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.location', 'Location')}</h3>
                <select
                  value={filters.locationId || ''}
                  onChange={(e) => {
                    const locationId = e.target.value ? parseInt(e.target.value) : undefined;
                    const selectedGovernorate = governorates?.find(gov => gov.id === locationId);
                    handleInputChange('locationId', locationId);
                    // Send the slug to the backend for location filtering (backend searches by slug)
                    handleInputChange('location', selectedGovernorate?.slug || undefined);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingGovernorates}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {governorates?.map(governorate => (
                    <option key={governorate.id} value={governorate.id}>
                      {getDisplayName(governorate)}
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
                    return (
                      <option key={id} value={id}>
                        {getDisplayName(sellerType as { displayNameEn: string; displayNameAr: string })}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          );

        case 'exteriorColor':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.exteriorColor', 'Exterior color')}</h3>
                <input
                  type="text"
                  value={filters.exteriorColor || ''}
                  onChange={(e) => handleInputChange('exteriorColor', e.target.value)}
                  placeholder={t('search.enterColor', 'Enter color')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          );

        case 'doors':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.doors', 'Number of doors')}</h3>
                <select
                  value={filters.doors || ''}
                  onChange={(e) => handleInputChange('doors', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
            </div>
          );

        case 'cylinders':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.cylinders', 'Number of cylinders')}</h3>
                <select
                  value={filters.cylinders || ''}
                  onChange={(e) => handleInputChange('cylinders', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                  <option value="12">12</option>
                </select>
              </div>
            </div>
          );

        case 'allFilters':
          return (
            <div className="space-y-8 max-h-96 overflow-y-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('search.allFilters', 'Alla filter')}</h2>
                <button
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t('search.cancel', 'Avbryt')}
                </button>
              </div>

              {/* Exterior Color */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.exteriorColor', 'Exterior color')}</h3>
                <input
                  type="text"
                  value={filters.exteriorColor || ''}
                  onChange={(e) => handleInputChange('exteriorColor', e.target.value)}
                  placeholder={t('search.enterColor', 'Enter color')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Number of Doors */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.doors', 'Number of doors')}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 3, 4, 5, 6].map(doorCount => (
                    <label key={doorCount} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.doors === doorCount}
                        onChange={(e) => handleInputChange('doors', e.target.checked ? doorCount : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{doorCount}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Number of Cylinders */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.cylinders', 'Number of cylinders')}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 4, 6, 8, 10, 12].map(cylinderCount => (
                    <label key={cylinderCount} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.cylinders === cylinderCount}
                        onChange={(e) => handleInputChange('cylinders', e.target.checked ? cylinderCount : undefined)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{cylinderCount}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Clear only the filters shown in this modal
                    clearSpecificFilter('exteriorColor');
                    clearSpecificFilter('doors');
                    clearSpecificFilter('cylinders');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {t('search.reset', 'Rensa')}
                </button>
                
                <button
                  onClick={() => {
                    handleSearch();
                    onClose();
                  }}
                  className="px-8 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-sm"
                >
                  {t('search.showResults', 'Visa 19 114 annonser')}
                </button>
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
            className={`relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full border border-gray-100 pointer-events-auto ${
              filterType === 'allFilters' 
                ? 'sm:max-w-2xl sm:p-8' // Wider modal for all filters
                : 'sm:max-w-lg sm:p-6'  // Regular size for individual filters
            }`}
            onKeyDown={(e) => handleModalKeyDown(e, onClose)}
            tabIndex={-1}
          >
            {filterType !== 'allFilters' && (
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                >
                  <MdClose className="h-6 w-6" />
                </button>
              </div>
            )}

            <div className="mt-3">
              {renderModalContent()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch car listings with improved error handling
  const fetchListings = useCallback(async () => {
    setIsLoadingListings(true);
    setListingsError(null);
    
    try {
      // Convert filters to backend format
      const listingFilters: CarListingFilterParams = {
        brand: filters.brand,
        model: Array.isArray(filters.model) ? filters.model.join(',') : filters.model, // Convert array to comma-separated string
        minYear: filters.minYear,
        maxYear: filters.maxYear,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minMileage: filters.minMileage,
        maxMileage: filters.maxMileage,
        location: filters.location,
        locationId: filters.locationId,
        sellerTypeId: filters.sellerTypeId,
        conditionId: filters.conditionId,
        transmissionId: filters.transmissionId,
        fuelTypeId: filters.fuelTypeId,
        bodyStyleId: filters.bodyStyleId,
        exteriorColor: filters.exteriorColor,
        doors: filters.doors,
        cylinders: filters.cylinders,
        size: 20, // Default page size
        page: 0, // Default to first page
        sort: 'createdAt,desc' // Default sort
      };

      console.log('Sending search filters:', listingFilters);
      console.log('Selected models array:', filters.model);
      console.log('Model string being sent:', listingFilters.model);
      const response = await fetchCarListings(listingFilters);
      console.log('API response:', response);
      setCarListings(response);
    } catch (error) {
      console.error('Error fetching car listings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch car listings';
      setListingsError(errorMessage);
      // Set empty results on error to show proper no-results state
      setCarListings({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        last: true
      });
    } finally {
      setIsLoadingListings(false);
    }
  }, [filters]);

  // Fetch listings when filters change, language changes, or on component mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Loading skeleton component for better UX
  const LoadingSkeleton = () => (
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
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('search.carsForSale', 'Cars for sale in Skåne')}</h1>
        </div>

        {/* Optimized Filter Pills Row - 90% Original Size */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* "Alla filter" button - first position like Blocket */}
            <button
              onClick={() => setActiveFilterModal('allFilters')}
              className="flex-shrink-0 inline-flex items-center px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <MdTune className="mr-1.5 h-4 w-4" />
              {t('search.allFilters', 'Alla filter')}
            </button>
            
            {/* Essential filters only - most commonly used */}
            <div className="flex items-center gap-2 flex-shrink min-w-0">
              <FilterPill filterType="makeModel" onClick={() => setActiveFilterModal('makeModel')} />
              <FilterPill filterType="price" onClick={() => setActiveFilterModal('price')} />
              <FilterPill filterType="year" onClick={() => setActiveFilterModal('year')} />
              <FilterPill filterType="fuelType" onClick={() => setActiveFilterModal('fuelType')} />
              <FilterPill filterType="transmission" onClick={() => setActiveFilterModal('transmission')} />
              <FilterPill filterType="location" onClick={() => setActiveFilterModal('location')} />
            </div>
            
            {/* Show active secondary filters only when applied */}
            {(isFilterActive('bodyStyle') || isFilterActive('mileage') || isFilterActive('condition') || isFilterActive('sellerType')) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isFilterActive('bodyStyle') && <FilterPill filterType="bodyStyle" onClick={() => setActiveFilterModal('bodyStyle')} />}
                {isFilterActive('mileage') && <FilterPill filterType="mileage" onClick={() => setActiveFilterModal('mileage')} />}
                {isFilterActive('condition') && <FilterPill filterType="condition" onClick={() => setActiveFilterModal('condition')} />}
                {isFilterActive('sellerType') && <FilterPill filterType="sellerType" onClick={() => setActiveFilterModal('sellerType')} />}
              </div>
            )}
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

        {/* Car Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoadingListings ? (
            // Loading state
            Array.from({ length: 8 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : carListings && carListings.content.length > 0 ? (
            // Real car listings using reusable component
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
                  onFavoriteToggle={(isFavorite) => {
                    // Handle favorite toggle if needed
                    console.log(`Car ${listing.id} favorite toggled:`, isFavorite);
                  }}
                  initialFavorite={false}
                />
              );
            })
          ) : (
            // No results state
            <div className="col-span-full text-center py-12">
              <MdDirectionsCar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
              <p className="text-gray-600">Try adjusting your search filters to see more results.</p>
            </div>
          )}
        </div>

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
