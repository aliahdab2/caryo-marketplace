"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  MdClear, 
  MdTune,
  MdAdd,
  MdClose,
  MdDelete,
  MdDirectionsCar,
  MdFavoriteBorder,
  MdSearch,
  MdError
} from 'react-icons/md';
import { CarMake, CarModel } from '@/types/car';
import { buildHierarchicalBrandFilter } from '@/utils/brandFilters';
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

// Move interface outside component for better performance
interface AdvancedSearchFilters {
  // Basic filters matching backend ListingFilterRequest
  /**
   * Brand filter with hierarchical syntax support.
   * Examples: "Toyota", "Toyota:Camry", "Toyota:Camry;Corolla", "Toyota:Camry,Honda"
   */
  brand?: string | string[]; // Support both single brand and multiple brands for internal use
  
  /**
   * Model filter for hierarchical brand:model combinations.
   * Used internally to build the hierarchical brand filter.
   */
  model?: string | string[];
  
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

// Constants moved outside component
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

// Error boundary component for better error handling
const SearchErrorBoundary: React.FC<{
  children: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
}> = ({ children, error, onRetry }) => {
  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 bg-red-50 rounded-lg border border-red-200">
        <MdError className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Search Error</h3>
        <p className="text-red-600 text-center mb-4 max-w-md">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  return <>{children}</>;
};

// Wrap the main component with Suspense for better loading states
function AdvancedSearchPageContent() {
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
    'brands-with-real-counts', // Custom cache key for composite operation
    [t]
  );

  // Fetch models for selected make with real counts
  const {
    data: availableModels = [],
    isLoading: _isLoadingModels,
    error: _modelsError
  } = useApiData<CarModel[]>(
    () => selectedMake ? fetchCarModelsWithRealCounts(selectedMake) : Promise.resolve([]),
    selectedMake ? `models-with-real-counts-${selectedMake}` : 'no-models',
    [selectedMake, t]
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

  // Simplified helper function for better performance
  const getDisplayName = useCallback((item: { displayNameEn: string; displayNameAr: string }) => {
    return i18n.language === 'ar' ? item.displayNameAr : item.displayNameEn;
  }, [i18n.language]);

  // Simple helper functions - these are fast enough without memoization
  const getConditionDisplayName = useCallback((id: number): string => {
    const condition = referenceData?.carConditions?.find(c => c.id === id);
    return condition ? getDisplayName(condition) : '';
  }, [referenceData?.carConditions, getDisplayName]);

  const getTransmissionDisplayName = useCallback((id: number): string => {
    const transmission = referenceData?.transmissions?.find(t => t.id === id);
    return transmission ? getDisplayName(transmission) : '';
  }, [referenceData?.transmissions, getDisplayName]);

  const getFuelTypeDisplayName = useCallback((id: number): string => {
    const fuelType = referenceData?.fuelTypes?.find(f => f.id === id);
    return fuelType ? getDisplayName(fuelType) : '';
  }, [referenceData?.fuelTypes, getDisplayName]);

  const getBodyStyleDisplayName = useCallback((id: number): string => {
    const bodyStyle = referenceData?.bodyStyles?.find(b => b.id === id);
    return bodyStyle ? getDisplayName(bodyStyle) : '';
  }, [referenceData?.bodyStyles, getDisplayName]);

  const getSellerTypeDisplayName = useCallback((id: number): string => {
    const sellerType = referenceData?.sellerTypes?.find(s => s.id === id);
    if (sellerType && typeof sellerType === 'object' && 'displayNameEn' in sellerType && 'displayNameAr' in sellerType) {
      return getDisplayName(sellerType as { displayNameEn: string; displayNameAr: string });
    }
    return '';
  }, [referenceData?.sellerTypes, getDisplayName]);

  const getLocationDisplayName = useCallback((locationId: number): string => {
    const governorate = governorates?.find(g => g.id === locationId);
    return governorate ? getDisplayName(governorate) : '';
  }, [governorates, getDisplayName]);

  // Initialize form from URL params (only on initial load)
  // Initialize filters from URL params only once on mount
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Only initialize from URL params once when component first mounts
    if (isInitialized || !searchParams) return;
    
    const initialFilters: AdvancedSearchFilters = {};
    
    try {
      // Basic filters with error handling
      if (searchParams?.get('brand')) {
        const brandParam = searchParams.get('brand')!;
        // Handle comma-separated brands
        if (brandParam.includes(',')) {
          initialFilters.brand = brandParam.split(',').map(b => b.trim()).filter(Boolean);
        } else {
          initialFilters.brand = brandParam;
        }
      }
      
      // Handle model parameter for hierarchical filtering
      if (searchParams?.get('model')) {
        const modelParam = searchParams.get('model')!;
        if (modelParam.includes(',')) {
          initialFilters.model = modelParam.split(',').map(m => m.trim()).filter(Boolean);
        } else {
          initialFilters.model = modelParam;
        }
      }
      
      // Numeric filters with validation
      const minYear = searchParams?.get('minYear');
      if (minYear && !isNaN(parseInt(minYear))) {
        initialFilters.minYear = parseInt(minYear);
      }
      
      const maxYear = searchParams?.get('maxYear');
      if (maxYear && !isNaN(parseInt(maxYear))) {
        initialFilters.maxYear = parseInt(maxYear);
      }
      
      const minPrice = searchParams?.get('minPrice');
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        initialFilters.minPrice = parseFloat(minPrice);
      }
      
      const maxPrice = searchParams?.get('maxPrice');
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        initialFilters.maxPrice = parseFloat(maxPrice);
      }
      
      const minMileage = searchParams?.get('minMileage');
      if (minMileage && !isNaN(parseInt(minMileage))) {
        initialFilters.minMileage = parseInt(minMileage);
      }
      
      const maxMileage = searchParams?.get('maxMileage');
      if (maxMileage && !isNaN(parseInt(maxMileage))) {
        initialFilters.maxMileage = parseInt(maxMileage);
      }
    
      // Location filters
      if (searchParams?.get('location')) initialFilters.location = searchParams.get('location')!;
      
      const locationId = searchParams?.get('locationId');
      if (locationId && !isNaN(parseInt(locationId))) {
        initialFilters.locationId = parseInt(locationId);
      }
      
      // Entity ID filters with validation
      const conditionId = searchParams?.get('conditionId');
      if (conditionId && !isNaN(parseInt(conditionId))) {
        initialFilters.conditionId = parseInt(conditionId);
      }
      
      const transmissionId = searchParams?.get('transmissionId');
      if (transmissionId && !isNaN(parseInt(transmissionId))) {
        initialFilters.transmissionId = parseInt(transmissionId);
      }
      
      const fuelTypeId = searchParams?.get('fuelTypeId');
      if (fuelTypeId && !isNaN(parseInt(fuelTypeId))) {
        initialFilters.fuelTypeId = parseInt(fuelTypeId);
      }
      
      const bodyStyleId = searchParams?.get('bodyStyleId');
      if (bodyStyleId && !isNaN(parseInt(bodyStyleId))) {
        initialFilters.bodyStyleId = parseInt(bodyStyleId);
      }
      
      const sellerTypeId = searchParams?.get('sellerTypeId');
      if (sellerTypeId && !isNaN(parseInt(sellerTypeId))) {
        initialFilters.sellerTypeId = parseInt(sellerTypeId);
      }
      
      if (searchParams?.get('exteriorColor')) {
        initialFilters.exteriorColor = searchParams.get('exteriorColor')!;
      }
      
      const doors = searchParams?.get('doors');
      if (doors && !isNaN(parseInt(doors))) {
        initialFilters.doors = parseInt(doors);
      }
      
      const cylinders = searchParams?.get('cylinders');
      if (cylinders && !isNaN(parseInt(cylinders))) {
        initialFilters.cylinders = parseInt(cylinders);
      }
    } catch (error) {
      console.warn('Error parsing URL parameters:', error);
    }

    setFilters(initialFilters);
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

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

  // Debug effect removed to prevent infinite re-renders

  // Filter car makes based on search term with error handling
  const filteredCarMakes = useMemo(() => {
    if (!searchTerm.trim() || !carMakes) {
      return carMakes || [];
    }
    
    try {
      return carMakes.filter(make => {
        const displayName = getDisplayName(make);
        const searchTermLower = searchTerm.toLowerCase();
        
        return displayName.toLowerCase().includes(searchTermLower) ||
               make.displayNameEn.toLowerCase().includes(searchTermLower) ||
               make.displayNameAr.toLowerCase().includes(searchTermLower);
      });
    } catch (error) {
      console.warn('Error filtering car makes:', error);
      return carMakes || [];
    }
  }, [carMakes, searchTerm, getDisplayName]);

  // Handle input changes with better state management
  const handleInputChange = useCallback((field: keyof AdvancedSearchFilters, value: string | number | string[] | undefined) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [field]: value || undefined
      };

      return newFilters;
    });

    // Update selected make when brand changes
    if (field === 'brand') {
      if (!value) {
        // No brand selected, close any expanded make
        setSelectedMake(null);
      } else {
        // Find the brand and set selected make
        const brandName = Array.isArray(value) ? value[0] : value.toString();
        const brand = carMakes?.find(make => 
          getDisplayName(make).toLowerCase() === brandName.toLowerCase()
        );
        setSelectedMake(brand ? brand.id : null);
      }
    }
  }, [carMakes, getDisplayName]);

  // Helper functions for multiple brand handling
  const getSelectedBrands = useCallback((): string[] => {
    if (!filters.brand) return [];
    return Array.isArray(filters.brand) ? filters.brand : [filters.brand];
  }, [filters.brand]);

  const isBrandSelected = useCallback((brandName: string): boolean => {
    const selectedBrands = getSelectedBrands();
    return selectedBrands.includes(brandName);
  }, [getSelectedBrands]);

  const toggleBrand = useCallback((brandName: string) => {
    const selectedBrands = getSelectedBrands();
    let newBrands: string[];
    
    if (selectedBrands.includes(brandName)) {
      // Remove brand
      newBrands = selectedBrands.filter(b => b !== brandName);
    } else {
      // Add brand
      newBrands = [...selectedBrands, brandName];
    }
    
    const newBrandValue = newBrands.length === 0 ? undefined : 
                         newBrands.length === 1 ? newBrands[0] : newBrands;
    
    handleInputChange('brand', newBrandValue);
    
    // Clear models when removing brand or when no brands are selected
    if (newBrands.length === 0) {
      handleInputChange('model', undefined);
    }
  }, [getSelectedBrands, handleInputChange]);

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
      handleInputChange('model', newModelValue);
    }
  }, [getSelectedModels, handleInputChange]);

  const removeModel = useCallback((modelName: string) => {
    const selectedModels = getSelectedModels();
    const newModels = selectedModels.filter(m => m !== modelName);
    const newModelValue = newModels.length === 0 ? undefined : 
                         newModels.length === 1 ? newModels[0] : newModels;
    handleInputChange('model', newModelValue);
  }, [getSelectedModels, handleInputChange]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);

  // Clear all filters with URL update
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSelectedMake(null);
    setCurrentPage(0);
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
    
    // Use push instead of replace to avoid potential re-render issues
    router.push(newUrl);
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
        if (filters.brand || filters.model) {
          const brands = Array.isArray(filters.brand) ? filters.brand : (filters.brand ? [filters.brand] : []);
          const models = Array.isArray(filters.model) ? filters.model : (filters.model ? [filters.model] : []);
          
          if (brands.length > 1) {
            // Multiple brands - use proper translation
            return t('multipleBrands', '{{count}} brands', { count: brands.length, ns: 'search' });
          } else if (brands.length === 1) {
            // Single brand
            if (models.length > 1) {
              // Single brand with multiple models
              return `${brands[0]} (${models.length} ${t('models', 'models', { ns: 'search' })})`;
            } else if (models.length === 1) {
              // Single brand with single model
              return `${brands[0]} ${models[0]}`;
            } else {
              // Single brand with no models
              return brands[0];
            }
          } else if (models.length > 0) {
            // Models without brand (shouldn't happen but handle gracefully)
            return models.join(', ');
          }
        }
        return t('makeAndModel', 'Make and model', { ns: 'search' });
      case 'price':
        if (filters.minPrice && filters.maxPrice) return `£${filters.minPrice} - £${filters.maxPrice}`;
        if (filters.minPrice) return `${t('from', 'From', { ns: 'search' })} £${filters.minPrice}`;
        if (filters.maxPrice) return `${t('upTo', 'Up to', { ns: 'search' })} £${filters.maxPrice}`;
        return t('price', 'Price', { ns: 'search' });
      case 'year':
        if (filters.minYear && filters.maxYear) return `${filters.minYear} - ${filters.maxYear}`;
        if (filters.minYear) return `${t('from', 'From', { ns: 'search' })} ${filters.minYear}`;
        if (filters.maxYear) return `${t('upTo', 'Up to', { ns: 'search' })} ${filters.maxYear}`;
        return t('year', 'Year', { ns: 'search' });
      case 'mileage':
        if (filters.minMileage && filters.maxMileage) return `${filters.minMileage} - ${filters.maxMileage}`;
        if (filters.minMileage) return `${t('from', 'From', { ns: 'search' })} ${filters.minMileage}`;
        if (filters.maxMileage) return `${t('upTo', 'Up to', { ns: 'search' })} ${filters.maxMileage}`;
        return t('mileage', 'Mileage', { ns: 'search' });
      case 'transmission':
        return filters.transmissionId ? getTransmissionDisplayName(filters.transmissionId) : t('gearbox', 'Gearbox', { ns: 'search' });
      case 'condition':
        return filters.conditionId ? getConditionDisplayName(filters.conditionId) : t('condition', 'Condition', { ns: 'search' });
      case 'fuelType':
        return filters.fuelTypeId ? getFuelTypeDisplayName(filters.fuelTypeId) : t('fuelType', 'Fuel type', { ns: 'search' });
      case 'bodyStyle':
        return filters.bodyStyleId ? getBodyStyleDisplayName(filters.bodyStyleId) : t('bodyStyle', 'Body style', { ns: 'search' });
      case 'location':
        return filters.locationId ? getLocationDisplayName(filters.locationId) : t('location', 'Location', { ns: 'search' });
      case 'sellerType':
        return filters.sellerTypeId ? getSellerTypeDisplayName(filters.sellerTypeId) : t('sellerType', 'Seller type', { ns: 'search' });
      case 'exteriorColor':
        return filters.exteriorColor || t('exteriorColor', 'Exterior color', { ns: 'search' });
      case 'doors':
        return filters.doors ? `${filters.doors} ${t('doors', 'doors', { ns: 'search' })}` : t('doors', 'Doors', { ns: 'search' });
      case 'cylinders':
        return filters.cylinders ? `${filters.cylinders} ${t('cylinders', 'cylinders', { ns: 'search' })}` : t('cylinders', 'Cylinders', { ns: 'search' });
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
        {!isActive && i18n.language === 'ar' ? (
          <>
            <span className="truncate max-w-[100px]">{optimizedText}</span>
            <MdAdd className="ml-1.5 h-4 w-4" />
          </>
        ) : (
          <>
            {!isActive && <MdAdd className="mr-1.5 h-4 w-4" />}
            {isActive && (
              <div className="mr-1.5 h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
            )}
            <span className="truncate max-w-[100px]">{optimizedText}</span>
          </>
        )}
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
            <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                {i18n.language === 'ar' ? (
                  <>
                    <div className="w-12" aria-hidden="true"></div>
                    <h2 className="text-xl font-extrabold text-gray-900 text-center flex-1 select-none tracking-tight">
                      {t('makeAndModel', 'الماركة والموديل', { ns: 'search' })}
                    </h2>
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-blue-600 p-2 text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full transition"
                      tabIndex={0}
                      aria-label={t('abort', 'إلغاء', { ns: 'search' })}
                    >
                      {t('abort', 'إلغاء', { ns: 'search' })}
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-extrabold text-gray-900 select-none tracking-tight">
                      {t('makeAndModel', 'Make & Model', { ns: 'search' })}
                    </h2>
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-blue-600 p-2 text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full transition"
                      tabIndex={0}
                      aria-label={t('abort', 'Cancel', { ns: 'search' })}
                    >
                      {t('abort', 'Cancel', { ns: 'search' })}
                    </button>
                  </>
                )}
              </div>

              {/* Search bar */}
              <div className="px-7 py-4 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                  <div className={`absolute inset-y-0 ${i18n.language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <MdSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchFilterPlaceholder', 'Search for make or model', { ns: 'search' })}
                    className={`w-full ${i18n.language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 transition-shadow shadow focus:shadow-lg`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Selected Filters Pills - Only show if we have selections */}
              {(filters.brand || filters.model) && (
                <div className="p-4 bg-blue-50 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {/* Brand pills */}
                    {filters.brand && (
                      <>
                        {(Array.isArray(filters.brand) ? filters.brand : [filters.brand]).map(brandName => (
                          <BrandPill 
                            key={brandName}
                            brandName={brandName}
                            onClick={() => {
                              const brand = carMakes?.find(make => 
                                getDisplayName(make).toLowerCase() === brandName.toLowerCase()
                              );
                              if (brand) {
                                setSelectedMake(brand.id);
                              }
                            }}
                            onRemove={() => {
                              if (Array.isArray(filters.brand) && filters.brand.length > 1) {
                                // Remove just this brand
                                const newBrands = filters.brand.filter(b => b !== brandName);
                                handleInputChange('brand', newBrands.length === 1 ? newBrands[0] : newBrands);
                              } else {
                                // Remove all brands
                                handleInputChange('brand', undefined);
                                setSelectedMake(null);
                              }
                            }}
                          />
                        ))}
                      </>
                    )}
                    
                    {/* Model pills */}
                    {filters.model && (
                      <>
                        {(Array.isArray(filters.model) ? filters.model : [filters.model]).map(modelName => (
                          <ModelPill
                            key={modelName}
                            modelName={modelName}
                            onRemove={() => removeModel(modelName)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Brands section title */}
              <div className="p-4 pb-2">
                <h3 className={`text-base font-medium text-gray-900 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {searchTerm 
                    ? `${t('search:searchResults', 'Search results')}` 
                    : t('search:popularBrands', 'Most popular brands')
                  }
                </h3>
              </div>

              {/* Brands list - Scrollable area */}
              <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                {filteredCarMakes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('noSearchResults', 'No brands found', { ns: 'search' })}</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {t('clearSearch', 'Clear search', { ns: 'search' })}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCarMakes?.slice(0, 15).map(make => (
                      <div key={make.id} className="space-y-1">
                        {/* Brand row with checkbox, name, count and arrow */}
                        <div 
                          className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-md px-2 cursor-pointer"
                          onClick={(e) => {
                            // Only toggle expansion if not clicking on checkbox or label
                            const target = e.target as HTMLInputElement;
                            if (target.type === 'checkbox' || target.tagName === 'LABEL') {
                              return;
                            }
                            
                            e.stopPropagation();
                            // Toggle expansion when clicking anywhere on the row (except checkbox)
                            if (selectedMake === make.id) {
                              setSelectedMake(null);
                            } else {
                              setSelectedMake(make.id);
                            }
                          }}
                        >
                          <div 
                            className={`flex items-center flex-1 ${i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              id={`make-${make.id}`}
                              checked={isBrandSelected(getDisplayName(make))}
                              onChange={(e) => {
                                e.stopPropagation();
                                const brandName = getDisplayName(make);
                                toggleBrand(brandName);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                            />
                            <label 
                              htmlFor={`make-${make.id}`}
                              className={`text-gray-900 cursor-pointer flex-1 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const brandName = getDisplayName(make);
                                toggleBrand(brandName);
                              }}
                            >
                              {getDisplayName(make)}
                            </label>
                          </div>
                          
                          <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                            <span className="text-gray-500 text-sm">
                              ({make.listingCount || 0})
                            </span>
                            {/* Expandable arrow for models */}
                            <svg 
                              className={`h-5 w-5 text-gray-400 transition-transform ${
                                selectedMake === make.id ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Models section - Expandable under each brand */}
                        {selectedMake === make.id && availableModels && availableModels.length > 0 && (
                          <div className="ml-8 mr-4 border-l-2 border-blue-100 pl-4 py-2">
                            <div className="space-y-2">
                              {availableModels.map(model => (
                                <div key={model.id} className="flex items-center justify-between py-2">
                                  <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                                    <input
                                      type="checkbox"
                                      id={`model-${model.id}`}
                                      checked={isModelSelected(getDisplayName(model))}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const modelName = getDisplayName(model);
                                        if (e.target.checked) {
                                          addModel(modelName);
                                        } else {
                                          removeModel(modelName);
                                        }
                                      }}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <label 
                                      htmlFor={`model-${model.id}`}
                                      className={`text-gray-700 cursor-pointer flex-1 text-sm ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                      {getDisplayName(model)}
                                    </label>
                                  </div>
                                  <span className="text-gray-400 text-xs">
                                    ({model.listingCount || 0})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom action buttons */}
              <div className={`flex justify-between p-4 border-t border-gray-200 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => {
                    handleInputChange('brand', undefined);
                    handleInputChange('model', undefined);
                    setSelectedMake(null);
                  }}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('search:clear', 'Clear')}
                </button>
                
                <button
                  onClick={() => {
                    // Close modal first, then perform search to avoid state conflicts
                    handleClose();
                    // Use setTimeout to ensure modal is closed before URL update
                    setTimeout(() => {
                      handleSearch();
                    }, 0);
                  }}
                  className="px-8 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-sm"
                >
                  {carListings?.totalElements 
                    ? `${t('search:showAdsText', 'Show')} ${carListings.totalElements.toLocaleString()} ${t('search:adsText', 'ads')}`
                    : t('search:showResults', 'Show results')
                  }
                </button>
              </div>
            </div>
          );

        case 'price':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('priceRange', 'Price range', { ns: 'search' })}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('from', 'From', { ns: 'search' })}</label>
                    <input
                      type="number"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleInputChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={t('any', 'Any', { ns: 'search' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('to', 'To', { ns: 'search' })}</label>
                    <input
                      type="number"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={t('any', 'Any', { ns: 'search' })}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('yearRange', 'Year range', { ns: 'search' })}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">From</label>
                    <select
                      value={filters.minYear || ''}
                      onChange={(e) => handleInputChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('any', 'Any', { ns: 'search' })}</option>
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('to', 'To', { ns: 'search' })}</label>
                    <select
                      value={filters.maxYear || ''}
                      onChange={(e) => handleInputChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('mileageRange', 'Mileage range', { ns: 'search' })}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">From</label>
                    <input
                      type="number"
                      value={filters.minMileage || ''}
                      onChange={(e) => handleInputChange('minMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={t('any', 'Any', { ns: 'search' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('to', 'To', { ns: 'search' })}</label>
                    <input
                      type="number"
                      value={filters.maxMileage || ''}
                      onChange={(e) => handleInputChange('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={t('any', 'Any', { ns: 'search' })}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('gearbox', 'Gearbox', { ns: 'search' })}</h3>
                <select
                  value={filters.transmissionId || ''}
                  onChange={(e) => handleInputChange('transmissionId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('condition', 'Condition', { ns: 'search' })}</h3>
                <select
                  value={filters.conditionId || ''}
                  onChange={(e) => handleInputChange('conditionId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('fuelType', 'Fuel type', { ns: 'search' })}</h3>
                <select
                  value={filters.fuelTypeId || ''}
                  onChange={(e) => handleInputChange('fuelTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('bodyStyle', 'Body style', { ns: 'search' })}</h3>
                <select
                  value={filters.bodyStyleId || ''}
                  onChange={(e) => handleInputChange('bodyStyleId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('location', 'Location', { ns: 'search' })}</h3>
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
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('sellerType', 'Seller type', { ns: 'search' })}</h3>
                <select
                  value={filters.sellerTypeId || ''}
                  onChange={(e) => handleInputChange('sellerTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('exteriorColor', 'Exterior color', { ns: 'search' })}</h3>
                <input
                  type="text"
                  value={filters.exteriorColor || ''}
                  onChange={(e) => handleInputChange('exteriorColor', e.target.value)}
                  placeholder={t('enterColor', 'Enter color', { ns: 'search' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          );

        case 'doors':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('doors', 'Number of doors', { ns: 'search' })}</h3>
                <select
                  value={filters.doors || ''}
                  onChange={(e) => handleInputChange('doors', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('cylinders', 'Number of cylinders', { ns: 'search' })}</h3>
                <select
                  value={filters.cylinders || ''}
                  onChange={(e) => handleInputChange('cylinders', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t('any', 'Any', { ns: 'search' })}</option>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('allFilters', 'All filters', { ns: 'search' })}</h2>
                <button
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t('cancel', 'Cancel', { ns: 'search' })}
                </button>
              </div>

              {/* Exterior Color */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('exteriorColor', 'Exterior color', { ns: 'search' })}</h3>
                <input
                  type="text"
                  value={filters.exteriorColor || ''}
                  onChange={(e) => handleInputChange('exteriorColor', e.target.value)}
                  placeholder={t('enterColor', 'Enter color', { ns: 'search' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Number of Doors */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('doors', 'Number of doors', { ns: 'search' })}</h3>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('cylinders', 'Number of cylinders', { ns: 'search' })}</h3>
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
                  {t('reset', 'Reset', { ns: 'search' })}
                </button>
                
                <button
                  onClick={() => {
                    handleSearch();
                    onClose();
                  }}
                  className="px-8 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-sm"
                >
                  {carListings?.totalElements 
                    ? `${t('search:showAdsText', 'Show')} ${carListings.totalElements.toLocaleString()} ${t('search:adsText', 'ads')}`
                    : t('search:showResults', 'Show results')
                  }
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
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />
          
          {/* Modal content - smaller size like in the image */}
          <div 
            className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all w-full max-w-sm"
            onKeyDown={(e) => handleModalKeyDown(e, onClose)}
            tabIndex={-1}
          >
            {renderModalContent()}
          </div>
        </div>
      </div>
    );
  };

  // Pagination state and handlers
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Handle pagination with better UX
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Optimized fetchListings without complex memoization
  const fetchListings = useCallback(async () => {
    setIsLoadingListings(true);
    setListingsError(null);
    
    try {
      // Helper function to convert internal filters to hierarchical brand syntax
      const buildHierarchicalBrandFromFilters = (filters: AdvancedSearchFilters): string | undefined => {
        const brands = Array.isArray(filters.brand) ? filters.brand : (filters.brand ? [filters.brand] : []);
        const models = Array.isArray(filters.model) ? filters.model : (filters.model ? [filters.model] : []);
        
        if (brands.length === 0) {
          return undefined;
        }
        
        // If no models selected, return simple brand list
        if (models.length === 0) {
          return brands.join(',');
        }
        
        // Build hierarchical brand:model syntax
        if (brands.length === 1) {
          // Single brand with models
          return buildHierarchicalBrandFilter(brands[0], models.join(';'));
        } else {
          // Multiple brands - for now, just use the first brand with models
          // TODO: Enhance to support different models for different brands
          return buildHierarchicalBrandFilter(brands[0], models.join(';')) + 
                 (brands.length > 1 ? ',' + brands.slice(1).join(',') : '');
        }
      };
      
      // Convert filters to backend format using hierarchical brand syntax
      const listingFilters: CarListingFilterParams = {
        brand: buildHierarchicalBrandFromFilters(filters),
        // Note: model parameter is no longer sent to API - it's included in hierarchical brand
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
        size: pageSize,
        page: currentPage,
        sort: 'createdAt,desc' // Default sort
      };

      const response = await fetchCarListings(listingFilters);
      setCarListings(response);
    } catch (error) {
      // Avoid excessive logging here
      // if (process.env.NODE_ENV === 'development') {
      //   console.error('Error fetching car listings:', error);
      // }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch car listings. Please try again.';
      setListingsError(errorMessage);
      // Set empty results on error to show proper no-results state
      setCarListings({
        content: [],
        page: 0,
        size: pageSize,
        totalElements: 0,
        totalPages: 0,
        last: true
      });
    } finally {
      setIsLoadingListings(false);
    }
  }, [filters, currentPage]);

  // Retry function for better UX
  const retrySearch = useCallback(() => {
    setListingsError(null);
    fetchListings();
  }, [fetchListings]);

  // Immediate fetch listings without debouncing for better responsiveness
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Optimized loading skeleton component with accessibility
  const LoadingSkeleton = React.memo(() => (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse"
      role="status"
      aria-label="Loading car listing"
    >
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
      <span className="sr-only">Loading...</span>
    </div>
  ));
  LoadingSkeleton.displayName = 'LoadingSkeleton';

  // Memoized car listing component for better performance
  const MemoizedCarListingCard = React.memo(CarListingCard);
  MemoizedCarListingCard.displayName = 'MemoizedCarListingCard';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('carsForSale', 'Cars for sale', { ns: 'search' })}</h1>
        </div>

        {/* Optimized Filter Pills Row - 90% Original Size */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* "Alla filter" button - first position like Blocket */}
            <button
              onClick={() => setActiveFilterModal('allFilters')}
              className="flex-shrink-0 inline-flex items-center px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {i18n.language === 'ar' ? (
                <>
                  {t('allFilters', 'All filters', { ns: 'search' })}
                  <MdTune className="ml-1.5 h-4 w-4" />
                </>
              ) : (
                <>
                  <MdTune className="mr-1.5 h-4 w-4" />
                  {t('allFilters', 'All filters', { ns: 'search' })}
                </>
              )}
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

        {/* Active Filter Pills - Blocket Style */}
        {activeFiltersCount > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {/* Clear All Button */}
              <button
                onClick={clearAllFilters}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <MdDelete className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t('clearAll', `Clear (${activeFiltersCount})`, { ns: 'search' })}
              </button>

              {/* Brand Pills */}
              {getSelectedBrands().map((brandName) => (
                <BrandPill
                  key={brandName}
                  brandName={brandName}
                  onClick={() => {
                    const brand = carMakes?.find(make => 
                      getDisplayName(make).toLowerCase() === brandName.toLowerCase()
                    );
                    if (brand) {
                      setSelectedMake(brand.id);
                      setActiveFilterModal('makeModel');
                    }
                  }}
                  onRemove={() => toggleBrand(brandName)}
                />
              ))}

              {/* Model Pills */}
              {getSelectedModels().map((modelName) => (
                <ModelPill
                  key={modelName}
                  modelName={modelName}
                  onRemove={() => removeModel(modelName)}
                />
              ))}

              {/* Price Range Pill */}
              {(filters.minPrice || filters.maxPrice) && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>
                    {filters.minPrice && filters.maxPrice 
                      ? `${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()} ${t('currency', 'KD', { ns: 'search' })}`
                      : filters.minPrice 
                        ? `${t('from', 'From', { ns: 'search' })} ${filters.minPrice.toLocaleString()} ${t('currency', 'KD', { ns: 'search' })}`
                        : `${t('upTo', 'Up to', { ns: 'search' })} ${filters.maxPrice?.toLocaleString()} ${t('currency', 'KD', { ns: 'search' })}`
                    }
                  </span>
                  <button
                    onClick={() => {
                      handleInputChange('minPrice', undefined);
                      handleInputChange('maxPrice', undefined);
                    }}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Year Range Pill */}
              {(filters.minYear || filters.maxYear) && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>
                    {filters.minYear && filters.maxYear 
                      ? `${filters.minYear} - ${filters.maxYear}`
                      : filters.minYear 
                        ? `${t('from', 'From', { ns: 'search' })} ${filters.minYear}`
                        : `${t('upTo', 'Up to', { ns: 'search' })} ${filters.maxYear}`
                    }
                  </span>
                  <button
                    onClick={() => {
                      handleInputChange('minYear', undefined);
                      handleInputChange('maxYear', undefined);
                    }}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Mileage Range Pill */}
              {(filters.minMileage || filters.maxMileage) && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>
                    {filters.minMileage && filters.maxMileage 
                      ? `${filters.minMileage.toLocaleString()} - ${filters.maxMileage.toLocaleString()} ${t('km', 'km', { ns: 'search' })}`
                      : filters.minMileage 
                        ? `${t('from', 'From', { ns: 'search' })} ${filters.minMileage.toLocaleString()} ${t('km', 'km', { ns: 'search' })}`
                        : `${t('upTo', 'Up to', { ns: 'search' })} ${filters.maxMileage?.toLocaleString()} ${t('km', 'km', { ns: 'search' })}`
                    }
                  </span>
                  <button
                    onClick={() => {
                      handleInputChange('minMileage', undefined);
                      handleInputChange('maxMileage', undefined);
                    }}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Location Pill */}
              {filters.locationId && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{getLocationDisplayName(filters.locationId)}</span>
                  <button
                    onClick={() => {
                      handleInputChange('locationId', undefined);
                      handleInputChange('location', undefined);
                    }}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Condition Pill */}
              {filters.conditionId && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{getConditionDisplayName(filters.conditionId)}</span>
                  <button
                    onClick={() => handleInputChange('conditionId', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Transmission Pill */}
              {filters.transmissionId && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{getTransmissionDisplayName(filters.transmissionId)}</span>
                  <button
                    onClick={() => handleInputChange('transmissionId', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Fuel Type Pill */}
              {filters.fuelTypeId && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{getFuelTypeDisplayName(filters.fuelTypeId)}</span>
                  <button
                    onClick={() => handleInputChange('fuelTypeId', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Body Style Pill */}
              {filters.bodyStyleId && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{getBodyStyleDisplayName(filters.bodyStyleId)}</span>
                  <button
                    onClick={() => handleInputChange('bodyStyleId', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Exterior Color Pill */}
              {filters.exteriorColor && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{filters.exteriorColor}</span>
                  <button
                    onClick={() => handleInputChange('exteriorColor', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Doors Pill */}
              {filters.doors && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{filters.doors} {t('doors', 'doors', { ns: 'search' })}</span>
                  <button
                    onClick={() => handleInputChange('doors', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Cylinders Pill */}
              {filters.cylinders && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
                  <span>{filters.cylinders} {t('cylinders', 'cylinders', { ns: 'search' })}</span>
                  <button
                    onClick={() => handleInputChange('cylinders', undefined)}
                    className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-gray-500 hover:text-gray-700`}
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">              <p className="text-lg font-medium text-gray-900 dark:text-white">
              {carListings?.totalElements ? `${carListings.totalElements.toLocaleString()} ${t('results', 'results', { ns: 'search' })}` : t('loading', 'Loading...', { ns: 'search' })}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                {i18n.language === 'ar' ? (
                  <>
                    {t('clearAll', 'Clear all filters', { ns: 'search' })}
                    <MdClear className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <MdClear className="mr-1 h-4 w-4" />
                    {t('clearAll', 'Clear all filters', { ns: 'search' })}
                  </>
                )}
              </button>
            )}
          </div>
          
          <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
            {i18n.language === 'ar' ? (
              <>
                {t('search.saveSearch', 'Save search')}
                <MdFavoriteBorder className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <MdFavoriteBorder className="mr-2 h-4 w-4" />
                {t('search.saveSearch', 'Save search')}
              </>
            )}
          </button>
        </div>

        {/* Car Listings Grid with Error Boundary */}
        <SearchErrorBoundary error={listingsError} onRetry={retrySearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoadingListings ? (
              // Loading state with improved skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <LoadingSkeleton key={`skeleton-${index}`} />
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
                  <MemoizedCarListingCard
                    key={`listing-${listing.id}`}
                    listing={cardData}
                    onFavoriteToggle={(_isFavorite) => {
                      // Handle favorite toggle if needed
                    }}
                    initialFavorite={false}
                  />
                );
              })
            ) : (
              // No results state with better messaging
              <div className="col-span-full text-center py-12">
                <MdDirectionsCar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCarsFound', 'No cars found', { ns: 'search' })}</h3>
                <p className="text-gray-600 mb-4">{t('adjustFilters', 'Try adjusting your search filters to see more results.', { ns: 'search' })}</p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MdClear className="mr-2 h-4 w-4" />
                    {t('clearAllFilters', 'Clear all filters', { ns: 'search' })}
                  </button>
                )}
              </div>
            )}
          </div>
        </SearchErrorBoundary>

        {/* Improved Pagination */}
        {carListings && carListings.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                disabled={carListings.page === 0 || isLoadingListings}
                onClick={() => handlePageChange(carListings.page - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('previous', 'Previous', { ns: 'search' })}
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, carListings.totalPages) }, (_, i) => {
                  // Ensure the pagination starts at a reasonable point, even when the current page is near the beginning.
                  // Math.max(0, carListings.page - 2) centers the current page with 2 pages before it when possible
                  const page = i + Math.max(0, carListings.page - 2);
                  if (page >= carListings.totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={isLoadingListings}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        page === carListings.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
              </div>
              
              <button
                disabled={carListings.last || isLoadingListings}
                onClick={() => handlePageChange(carListings.page + 1)}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('next', 'Next', { ns: 'search' })}
              </button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {carListings && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {t('showingResults', 'Showing {{count}} of {{total}} cars', { 
              count: carListings.content.length, 
              total: carListings.totalElements,
              ns: 'search'
            })}
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
        {(brandsError || referenceDataError || listingsError) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  {t('errorTitle', 'Something went wrong', { ns: 'search' })}
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {listingsError || t('loadingError', 'Error loading filter options. Please refresh the page.', { ns: 'search' })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <AdvancedSearchPageContent />
    </Suspense>
  );
}
