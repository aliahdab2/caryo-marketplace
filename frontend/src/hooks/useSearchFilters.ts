import { useState, useCallback, useMemo, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { CarMake, CarModel } from '@/types/car';
import { CarReferenceData } from '@/services/api';
import { SellerTypeCounts } from '@/types/sellerTypes';

/**
 * Enhanced search filters hook with improved state management
 * 
 * Key improvements:
 * - Uses useReducer for complex state management instead of nested useState calls
 * - Simplified update functions with clear action types
 * - Better separation of concerns between filter types
 * - Type-safe state updates with focused action handlers
 * - Maintains backward compatibility with existing API
 */

export interface AdvancedSearchFilters {
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

export type FilterType = 'makeModel' | 'price' | 'year' | 'mileage' | 'transmission' | 'fuelType' | 'bodyStyle' | 'sellerType' | 'allFilters';

// Reducer action types for better state management
type FilterAction = 
  | { type: 'UPDATE_BRANDS'; payload: { brands?: string[]; makeId?: number | null } }
  | { type: 'UPDATE_MODELS'; payload: { models?: string[]; modelId?: number | null } }
  | { type: 'UPDATE_FILTERS'; payload: Partial<AdvancedSearchFilters> }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof AdvancedSearchFilters; value: string | number | string[] | number[] | undefined } }
  | { type: 'CLEAR_FILTER'; payload: FilterType }
  | { type: 'RESET_FILTERS' };

interface FilterState {
  filters: AdvancedSearchFilters;
  selectedMake: number | null;
  selectedModel: number | null;
}

// Reducer for complex filter state management
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'UPDATE_BRANDS':
      return {
        ...state,
        filters: { ...state.filters, brands: action.payload.brands },
        selectedMake: action.payload.makeId ?? state.selectedMake
      };
      
    case 'UPDATE_MODELS':
      return {
        ...state,
        filters: { ...state.filters, models: action.payload.models },
        selectedModel: action.payload.modelId ?? state.selectedModel
      };
      
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
      
    case 'UPDATE_FIELD': {
      const { field, value } = action.payload;
      const newFilters = { ...state.filters };
      
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[field];
      } else {
        // Type-safe assignment using field-specific logic
        switch (field) {
          case 'brands':
          case 'models':
          case 'locations':
            newFilters[field] = value as string[];
            break;
          case 'sellerTypeIds':
            newFilters[field] = value as number[];
            break;
          case 'minYear':
          case 'maxYear':
          case 'minPrice':
          case 'maxPrice':
          case 'minMileage':
          case 'maxMileage':
          case 'conditionId':
          case 'transmissionId':
          case 'fuelTypeId':
          case 'bodyStyleId':
          case 'doors':
          case 'cylinders':
            newFilters[field] = value as number;
            break;
          case 'exteriorColor':
            newFilters[field] = value as string;
            break;
        }
      }
      
      return { ...state, filters: newFilters };
    }
    
    case 'CLEAR_FILTER': {
      const newState = { ...state };
      const newFilters = { ...state.filters };
      
      switch (action.payload) {
        case 'makeModel':
          delete newFilters.brands;
          delete newFilters.models;
          newState.selectedMake = null;
          newState.selectedModel = null;
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
        case 'fuelType':
          delete newFilters.fuelTypeId;
          break;
        case 'bodyStyle':
          delete newFilters.bodyStyleId;
          break;
        case 'sellerType':
          delete newFilters.sellerTypeIds;
          break;
        case 'allFilters':
          return {
            filters: {},
            selectedMake: null,
            selectedModel: null
          };
      }
      
      newState.filters = newFilters;
      return newState;
    }
    
    case 'RESET_FILTERS':
      return {
        filters: {},
        selectedMake: null,
        selectedModel: null
      };
      
    default:
      return state;
  }
}

interface UseSearchFiltersProps {
  carMakes?: CarMake[];
  availableModels?: CarModel[];
  carReferenceData?: CarReferenceData;
  sellerTypeCounts?: SellerTypeCounts;
  onFiltersChange?: (filters: AdvancedSearchFilters) => void;
}

interface UseSearchFiltersReturn {
  // State
  filters: AdvancedSearchFilters;
  selectedMake: number | null;
  selectedModel: number | null;
  activeFilterModal: FilterType | null;
  
  // Setters
  setFilters: React.Dispatch<React.SetStateAction<AdvancedSearchFilters>>;
  setSelectedMake: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedModel: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveFilterModal: React.Dispatch<React.SetStateAction<FilterType | null>>;
  
  // Callbacks
  updateFiltersAndState: (
    updateType: 'brands' | 'models' | 'filters',
    data: {
      brands?: string[];
      models?: string[];
      filters?: Partial<AdvancedSearchFilters>;
      makeId?: number | null;
      modelId?: number | null;
    }
  ) => void;
  handleInputChange: (field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => void;
  clearSpecificFilter: (filterType: FilterType) => void;
  updateUrlFromFilters: (newFilters: AdvancedSearchFilters) => void;
  
  // Computed values
  getFilterDisplayText: (filterType: FilterType) => string;
  isFilterActive: (filterType: FilterType) => boolean;
  getBrandDisplayNameFromSlug: (slug: string) => string;
  getModelDisplayNameFromSlug: (slug: string) => string;
  getTransmissionDisplayName: (id: number) => string;
  getFuelTypeDisplayName: (id: number) => string;
  getBodyStyleDisplayName: (id: number) => string;
  getSellerTypeDisplayName: (ids: number[]) => string;
}

export function useSearchFilters({
  carMakes = [],
  availableModels = [],
  carReferenceData,
  sellerTypeCounts = {},
  onFiltersChange
}: UseSearchFiltersProps = {}): UseSearchFiltersReturn {
  const { t } = useLazyTranslation(['common', 'search']);
  const router = useRouter();
  
  // Core state with reducer for complex filter management
  const [state, dispatch] = useReducer(filterReducer, {
    filters: {},
    selectedMake: null,
    selectedModel: null
  });
  
  const [activeFilterModal, setActiveFilterModal] = useState<FilterType | null>(null);

  // Memoized display name functions
  const getBrandDisplayNameFromSlug = useCallback((slug: string): string => {
    const brand = carMakes.find(brand => brand.slug === slug);
    return brand ? brand.displayNameEn : slug.charAt(0).toUpperCase() + slug.slice(1);
  }, [carMakes]);

  const getModelDisplayNameFromSlug = useCallback((slug: string): string => {
    const model = availableModels.find(model => model.slug === slug);
    return model ? model.displayNameEn : slug.charAt(0).toUpperCase() + slug.slice(1);
  }, [availableModels]);

  const getTransmissionDisplayName = useMemo(() => 
    (id: number): string => {
      const transmission = carReferenceData?.transmissions.find(t => t.id === id);
      return transmission ? transmission.displayNameEn : '';
    }, [carReferenceData?.transmissions]
  );

  const getFuelTypeDisplayName = useMemo(() => 
    (id: number): string => {
      const fuelType = carReferenceData?.fuelTypes.find(f => f.id === id);
      return fuelType ? fuelType.displayNameEn : '';
    }, [carReferenceData?.fuelTypes]
  );

  const getBodyStyleDisplayName = useMemo(() => 
    (id: number): string => {
      const bodyStyle = carReferenceData?.bodyStyles.find(b => b.id === id);
      return bodyStyle ? bodyStyle.displayNameEn : '';
    }, [carReferenceData?.bodyStyles]
  );

  const getSellerTypeDisplayName = useCallback((ids: number[]): string => {
    if (!carReferenceData?.sellerTypes || ids.length === 0) return '';
    
    const names = ids.map(id => {
      const sellerType = carReferenceData.sellerTypes.find(s => s.id === id);
      const count = sellerTypeCounts[id] || 0;
      return sellerType ? `${sellerType.nameEn} (${count})` : '';
    }).filter(Boolean);
    
    return names.join(', ');
  }, [carReferenceData?.sellerTypes, sellerTypeCounts]);

  // URL synchronization
  const updateUrlFromFilters = useCallback((newFilters: AdvancedSearchFilters) => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // Clear existing filters
    searchParams.delete('brands');
    searchParams.delete('models');
    searchParams.delete('minYear');
    searchParams.delete('maxYear');
    searchParams.delete('minPrice');
    searchParams.delete('maxPrice');
    searchParams.delete('minMileage');
    searchParams.delete('maxMileage');
    searchParams.delete('locations');
    searchParams.delete('transmission');
    searchParams.delete('fuelType');
    searchParams.delete('bodyStyle');
    searchParams.delete('sellerTypes');
    searchParams.delete('condition');

    // Apply new filters
    if (newFilters.brands && newFilters.brands.length > 0) {
      searchParams.set('brands', newFilters.brands.join(','));
    }
    if (newFilters.models && newFilters.models.length > 0) {
      searchParams.set('models', newFilters.models.join(','));
    }
    if (newFilters.minYear) {
      searchParams.set('minYear', newFilters.minYear.toString());
    }
    if (newFilters.maxYear) {
      searchParams.set('maxYear', newFilters.maxYear.toString());
    }
    if (newFilters.minPrice) {
      searchParams.set('minPrice', newFilters.minPrice.toString());
    }
    if (newFilters.maxPrice) {
      searchParams.set('maxPrice', newFilters.maxPrice.toString());
    }
    if (newFilters.minMileage) {
      searchParams.set('minMileage', newFilters.minMileage.toString());
    }
    if (newFilters.maxMileage) {
      searchParams.set('maxMileage', newFilters.maxMileage.toString());
    }
    if (newFilters.locations && newFilters.locations.length > 0) {
      searchParams.set('locations', newFilters.locations.join(','));
    }
    if (newFilters.transmissionId) {
      searchParams.set('transmission', newFilters.transmissionId.toString());
    }
    if (newFilters.fuelTypeId) {
      searchParams.set('fuelType', newFilters.fuelTypeId.toString());
    }
    if (newFilters.bodyStyleId) {
      searchParams.set('bodyStyle', newFilters.bodyStyleId.toString());
    }
    if (newFilters.sellerTypeIds && newFilters.sellerTypeIds.length > 0) {
      searchParams.set('sellerTypes', newFilters.sellerTypeIds.join(','));
    }
    if (newFilters.conditionId) {
      searchParams.set('condition', newFilters.conditionId.toString());
    }

    router.push(`${url.pathname}?${searchParams.toString()}`, { scroll: false });
  }, [router]);

  // Simplified update functions using dispatch
  const updateFiltersAndState = useCallback((
    updateType: 'brands' | 'models' | 'filters',
    data: {
      brands?: string[];
      models?: string[];
      filters?: Partial<AdvancedSearchFilters>;
      makeId?: number | null;
      modelId?: number | null;
    }
  ) => {
    switch (updateType) {
      case 'brands':
        dispatch({ 
          type: 'UPDATE_BRANDS', 
          payload: { brands: data.brands, makeId: data.makeId } 
        });
        break;
      case 'models':
        dispatch({ 
          type: 'UPDATE_MODELS', 
          payload: { models: data.models, modelId: data.modelId } 
        });
        break;
      case 'filters':
        if (data.filters) {
          dispatch({ type: 'UPDATE_FILTERS', payload: data.filters });
        }
        break;
    }
  }, []);

  // Simplified input change handler
  const handleInputChange = useCallback((
    field: keyof AdvancedSearchFilters, 
    value: string | number | string[] | number[] | undefined
  ) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  }, []);

  // Simplified clear filter function
  const clearSpecificFilter = useCallback((filterType: FilterType) => {
    dispatch({ type: 'CLEAR_FILTER', payload: filterType });
  }, []);

  // Filter display text generator
  const getFilterDisplayText = useCallback((filterType: FilterType): string => {
    switch (filterType) {
      case 'makeModel':
        const parts = [];
        if (state.filters.brands && state.filters.brands.length > 0) {
          parts.push(state.filters.brands.map(getBrandDisplayNameFromSlug).join(', '));
        }
        if (state.filters.models && state.filters.models.length > 0) {
          parts.push(state.filters.models.map(getModelDisplayNameFromSlug).join(', '));
        }
        return parts.join(' - ') || t('search.filters.makeModel', 'Make & Model');

      case 'price':
        const minPrice = state.filters.minPrice;
        const maxPrice = state.filters.maxPrice;
        if (minPrice && maxPrice) {
          return `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
        } else if (minPrice) {
          return `${t('search.filters.from', 'From')} $${minPrice.toLocaleString()}`;
        } else if (maxPrice) {
          return `${t('search.filters.upTo', 'Up to')} $${maxPrice.toLocaleString()}`;
        }
        return t('search.filters.price', 'Price');

      case 'year':
        const minYear = state.filters.minYear;
        const maxYear = state.filters.maxYear;
        if (minYear && maxYear) {
          return `${minYear} - ${maxYear}`;
        } else if (minYear) {
          return `${t('search.filters.from', 'From')} ${minYear}`;
        } else if (maxYear) {
          return `${t('search.filters.upTo', 'Up to')} ${maxYear}`;
        }
        return t('search.filters.year', 'Year');

      case 'mileage':
        const minMileage = state.filters.minMileage;
        const maxMileage = state.filters.maxMileage;
        if (minMileage && maxMileage) {
          return `${minMileage.toLocaleString()} - ${maxMileage.toLocaleString()} km`;
        } else if (minMileage) {
          return `${t('search.filters.from', 'From')} ${minMileage.toLocaleString()} km`;
        } else if (maxMileage) {
          return `${t('search.filters.upTo', 'Up to')} ${maxMileage.toLocaleString()} km`;
        }
        return t('search.filters.mileage', 'Mileage');

      case 'transmission':
        return state.filters.transmissionId ? getTransmissionDisplayName(state.filters.transmissionId) : t('search.filters.transmission', 'Transmission');

      case 'fuelType':
        return state.filters.fuelTypeId ? getFuelTypeDisplayName(state.filters.fuelTypeId) : t('search.filters.fuelType', 'Fuel Type');

      case 'bodyStyle':
        return state.filters.bodyStyleId ? getBodyStyleDisplayName(state.filters.bodyStyleId) : t('search.filters.bodyStyle', 'Body Style');

      case 'sellerType':
        return state.filters.sellerTypeIds && state.filters.sellerTypeIds.length > 0 
          ? getSellerTypeDisplayName(state.filters.sellerTypeIds)
          : t('search.filters.sellerType', 'Seller Type');

      default:
        return '';
    }
  }, [state.filters, t, getBrandDisplayNameFromSlug, getModelDisplayNameFromSlug, getTransmissionDisplayName, getFuelTypeDisplayName, getBodyStyleDisplayName, getSellerTypeDisplayName]);

  // Check if filter is active
  const isFilterActive = useCallback((filterType: FilterType): boolean => {
    switch (filterType) {
      case 'makeModel':
        return Boolean((state.filters.brands && state.filters.brands.length > 0) || (state.filters.models && state.filters.models.length > 0));
      case 'price':
        return state.filters.minPrice !== undefined || state.filters.maxPrice !== undefined;
      case 'year':
        return state.filters.minYear !== undefined || state.filters.maxYear !== undefined;
      case 'mileage':
        return state.filters.minMileage !== undefined || state.filters.maxMileage !== undefined;
      case 'transmission':
        return state.filters.transmissionId !== undefined;
      case 'fuelType':
        return state.filters.fuelTypeId !== undefined;
      case 'bodyStyle':
        return state.filters.bodyStyleId !== undefined;
      case 'sellerType':
        return state.filters.sellerTypeIds !== undefined && state.filters.sellerTypeIds.length > 0;
      default:
        return false;
    }
  }, [state.filters]);

  // Update selectedMake when brands change
  useEffect(() => {
    if (state.filters.brands && state.filters.brands.length === 1) {
      const brand = carMakes.find(b => b.slug === state.filters.brands![0]);
      if (brand && brand.id !== state.selectedMake) {
        dispatch({ type: 'UPDATE_BRANDS', payload: { brands: state.filters.brands, makeId: brand.id } });
      }
    } else if (!state.filters.brands || state.filters.brands.length === 0) {
      if (state.selectedMake !== null) {
        dispatch({ type: 'UPDATE_BRANDS', payload: { brands: undefined, makeId: null } });
      }
    }
  }, [state.filters.brands, carMakes, state.selectedMake]);

  // Update selectedModel when models change
  useEffect(() => {
    if (state.filters.models && state.filters.models.length === 1) {
      const model = availableModels.find(m => m.slug === state.filters.models![0]);
      if (model && model.id !== state.selectedModel) {
        dispatch({ type: 'UPDATE_MODELS', payload: { models: state.filters.models, modelId: model.id } });
      }
    } else if (!state.filters.models || state.filters.models.length === 0) {
      if (state.selectedModel !== null) {
        dispatch({ type: 'UPDATE_MODELS', payload: { models: undefined, modelId: null } });
      }
    }
  }, [state.filters.models, availableModels, state.selectedModel]);

  // Call external filter change handler
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(state.filters);
    }
  }, [state.filters, onFiltersChange]);

  return {
    // State
    filters: state.filters,
    selectedMake: state.selectedMake,
    selectedModel: state.selectedModel,
    activeFilterModal,
    
    // Setters - legacy compatibility
    setFilters: (newFilters: React.SetStateAction<AdvancedSearchFilters>) => {
      if (typeof newFilters === 'function') {
        // For function updates, get current state and apply function
        dispatch({ type: 'UPDATE_FILTERS', payload: newFilters(state.filters) });
      } else {
        // For direct updates
        dispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
      }
    },
    setSelectedMake: (makeId: React.SetStateAction<number | null>) => {
      const newMakeId = typeof makeId === 'function' ? makeId(state.selectedMake) : makeId;
      dispatch({ type: 'UPDATE_BRANDS', payload: { brands: state.filters.brands, makeId: newMakeId } });
    },
    setSelectedModel: (modelId: React.SetStateAction<number | null>) => {
      const newModelId = typeof modelId === 'function' ? modelId(state.selectedModel) : modelId;
      dispatch({ type: 'UPDATE_MODELS', payload: { models: state.filters.models, modelId: newModelId } });
    },
    setActiveFilterModal,
    
    // Callbacks
    updateFiltersAndState,
    handleInputChange,
    clearSpecificFilter,
    updateUrlFromFilters,
    
    // Computed values
    getFilterDisplayText,
    isFilterActive,
    getBrandDisplayNameFromSlug,
    getModelDisplayNameFromSlug,
    getTransmissionDisplayName,
    getFuelTypeDisplayName,
    getBodyStyleDisplayName,
    getSellerTypeDisplayName
  };
}
