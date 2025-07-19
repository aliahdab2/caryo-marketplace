import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { CarMake, CarModel } from '@/types/car';
import { CarReferenceData } from '@/services/api';
import { SellerTypeCounts } from '@/types/sellerTypes';

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
  
  // Core state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [selectedMake, setSelectedMake] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
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

  // Complex state update function
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
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (updateType === 'brands') {
        newFilters.brands = data.brands;
        if (data.makeId !== undefined) {
          setSelectedMake(data.makeId);
        }
      } else if (updateType === 'models') {
        newFilters.models = data.models;
        if (data.modelId !== undefined) {
          setSelectedModel(data.modelId);
        }
      } else if (updateType === 'filters' && data.filters) {
        Object.assign(newFilters, data.filters);
      }

      return newFilters;
    });
  }, []);

  // Simple input change handler
  const handleInputChange = useCallback((field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[field];
      } else {
        // Safe assignment with proper type handling
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
      
      return newFilters;
    });
  }, []);

  // Clear specific filter
  const clearSpecificFilter = useCallback((filterType: FilterType) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      switch (filterType) {
        case 'makeModel':
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
          return {};
      }
      
      return newFilters;
    });
  }, []);

  // Filter display text generator
  const getFilterDisplayText = useCallback((filterType: FilterType): string => {
    switch (filterType) {
      case 'makeModel':
        const parts = [];
        if (filters.brands && filters.brands.length > 0) {
          parts.push(filters.brands.map(getBrandDisplayNameFromSlug).join(', '));
        }
        if (filters.models && filters.models.length > 0) {
          parts.push(filters.models.map(getModelDisplayNameFromSlug).join(', '));
        }
        return parts.join(' - ') || t('search.filters.makeModel', 'Make & Model');

      case 'price':
        const minPrice = filters.minPrice;
        const maxPrice = filters.maxPrice;
        if (minPrice && maxPrice) {
          return `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
        } else if (minPrice) {
          return `${t('search.filters.from', 'From')} $${minPrice.toLocaleString()}`;
        } else if (maxPrice) {
          return `${t('search.filters.upTo', 'Up to')} $${maxPrice.toLocaleString()}`;
        }
        return t('search.filters.price', 'Price');

      case 'year':
        const minYear = filters.minYear;
        const maxYear = filters.maxYear;
        if (minYear && maxYear) {
          return `${minYear} - ${maxYear}`;
        } else if (minYear) {
          return `${t('search.filters.from', 'From')} ${minYear}`;
        } else if (maxYear) {
          return `${t('search.filters.upTo', 'Up to')} ${maxYear}`;
        }
        return t('search.filters.year', 'Year');

      case 'mileage':
        const minMileage = filters.minMileage;
        const maxMileage = filters.maxMileage;
        if (minMileage && maxMileage) {
          return `${minMileage.toLocaleString()} - ${maxMileage.toLocaleString()} km`;
        } else if (minMileage) {
          return `${t('search.filters.from', 'From')} ${minMileage.toLocaleString()} km`;
        } else if (maxMileage) {
          return `${t('search.filters.upTo', 'Up to')} ${maxMileage.toLocaleString()} km`;
        }
        return t('search.filters.mileage', 'Mileage');

      case 'transmission':
        return filters.transmissionId ? getTransmissionDisplayName(filters.transmissionId) : t('search.filters.transmission', 'Transmission');

      case 'fuelType':
        return filters.fuelTypeId ? getFuelTypeDisplayName(filters.fuelTypeId) : t('search.filters.fuelType', 'Fuel Type');

      case 'bodyStyle':
        return filters.bodyStyleId ? getBodyStyleDisplayName(filters.bodyStyleId) : t('search.filters.bodyStyle', 'Body Style');

      case 'sellerType':
        return filters.sellerTypeIds && filters.sellerTypeIds.length > 0 
          ? getSellerTypeDisplayName(filters.sellerTypeIds)
          : t('search.filters.sellerType', 'Seller Type');

      default:
        return '';
    }
  }, [filters, t, getBrandDisplayNameFromSlug, getModelDisplayNameFromSlug, getTransmissionDisplayName, getFuelTypeDisplayName, getBodyStyleDisplayName, getSellerTypeDisplayName]);

  // Check if filter is active
  const isFilterActive = useCallback((filterType: FilterType): boolean => {
    switch (filterType) {
      case 'makeModel':
        return Boolean((filters.brands && filters.brands.length > 0) || (filters.models && filters.models.length > 0));
      case 'price':
        return filters.minPrice !== undefined || filters.maxPrice !== undefined;
      case 'year':
        return filters.minYear !== undefined || filters.maxYear !== undefined;
      case 'mileage':
        return filters.minMileage !== undefined || filters.maxMileage !== undefined;
      case 'transmission':
        return filters.transmissionId !== undefined;
      case 'fuelType':
        return filters.fuelTypeId !== undefined;
      case 'bodyStyle':
        return filters.bodyStyleId !== undefined;
      case 'sellerType':
        return filters.sellerTypeIds !== undefined && filters.sellerTypeIds.length > 0;
      default:
        return false;
    }
  }, [filters]);

  // Update selectedMake when brands change
  useEffect(() => {
    if (filters.brands && filters.brands.length === 1) {
      const brand = carMakes.find(b => b.slug === filters.brands![0]);
      if (brand && brand.id !== selectedMake) {
        setSelectedMake(brand.id);
      }
    } else if (!filters.brands || filters.brands.length === 0) {
      setSelectedMake(null);
    }
  }, [filters.brands, carMakes, selectedMake]);

  // Update selectedModel when models change
  useEffect(() => {
    if (filters.models && filters.models.length === 1) {
      const model = availableModels.find(m => m.slug === filters.models![0]);
      if (model && model.id !== selectedModel) {
        setSelectedModel(model.id);
      }
    } else if (!filters.models || filters.models.length === 0) {
      setSelectedModel(null);
    }
  }, [filters.models, availableModels, selectedModel]);

  // Call external filter change handler
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  return {
    // State
    filters,
    selectedMake,
    selectedModel,
    activeFilterModal,
    
    // Setters
    setFilters,
    setSelectedMake,
    setSelectedModel,
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
