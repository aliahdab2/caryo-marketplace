"use client";

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { MdClose, MdFilterList } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useAnnouncements } from '@/hooks/useAccessibility';
import { CarMake, CarModel } from '@/types/car';
import { CarReferenceData } from '@/services/api';
import { SellerTypeCounts } from '@/types/sellerTypes';
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

// Move constants outside component to prevent recreation
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);
const SEARCH_NAMESPACES = ['common', 'search'];

/**
 * Enhanced FilterModals component with performance optimizations
 * 
 * Key performance improvements:
 * - Replaced React.createElement in render loop with direct JSX for car icons
 * - Memoized car icon mapping for O(1) lookup performance
 * - Optimized icon component with proper memoization
 * - Reduced render overhead by moving icon logic outside render cycle
 */

// Memoized car icon mapping with direct JSX for better performance
const carIconMap = {
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
} as const;

// Optimized function to get car icon with memoization
const getCarIconElement = (bodyStyleName: string): React.ReactNode => {
  const normalizedName = bodyStyleName.toLowerCase() as keyof typeof carIconMap;
  return carIconMap[normalizedName] || carIconMap['other'];
};

// Memoized car icon component that returns JSX directly
const CarIconDisplay = React.memo<{ bodyStyleName: string }>(({ bodyStyleName }) => {
  const icon = useMemo(() => getCarIconElement(bodyStyleName), [bodyStyleName]);
  return <>{icon}</>;
});
CarIconDisplay.displayName = 'CarIconDisplay';

// Memoized sub-components for expensive operations
const MakeModelSelector = React.memo<{
  carMakes: CarMake[];
  availableModels: CarModel[];
  filters: AdvancedSearchFilters;
  selectedMake: number | null;
  onBrandToggle: (slug: string, makeId: number) => void;
  onModelToggle: (slug: string, modelId: number) => void;
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  t: (key: string, fallback?: string) => string;
}>(({ 
  carMakes, 
  availableModels, 
  filters, 
  selectedMake, 
  onBrandToggle, 
  onModelToggle, 
  isLoadingBrands, 
  isLoadingModels, 
  t 
}) => {
  const filteredMakes = useMemo(() => carMakes.filter(make => make.isActive), [carMakes]);
  const filteredModels = useMemo(() => availableModels.filter(model => model.isActive), [availableModels]);

  return (
    <div className="space-y-6">
      {/* Brands Section */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          {t('search:brands', 'Brands')}
        </h4>
        {isLoadingBrands ? (
          <div className="text-center py-4">
            <div className="text-gray-500">{t('common.loading', 'Loading...')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {filteredMakes.map((make) => (
              <button
                key={make.id}
                onClick={() => onBrandToggle(make.slug, make.id)}
                className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                  filters.brands?.includes(make.slug)
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {make.displayNameEn}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Models Section */}
      {selectedMake && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {t('search:models', 'Models')}
          </h4>
          {isLoadingModels ? (
            <div className="text-center py-4">
              <div className="text-gray-500">{t('common.loading', 'Loading...')}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelToggle(model.slug, model.id)}
                  className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                    filters.models?.includes(model.slug)
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {model.displayNameEn}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
MakeModelSelector.displayName = 'MakeModelSelector';

// Memoized year selector with expensive computation
const YearSelector = React.memo<{
  filters: AdvancedSearchFilters;
  onMinYearChange: (year: number | undefined) => void;
  onMaxYearChange: (year: number | undefined) => void;
  t: (key: string, fallback?: string) => string;
}>(({ filters, onMinYearChange, onMaxYearChange, t }) => {
  const years = useMemo(() => YEARS, []); // Already computed, but ensures it's memoized

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('search:minYear', 'Min Year')}
          </label>
          <select
            value={filters.minYear || ''}
            onChange={(e) => onMinYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('search:any', 'Any')}</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('search:maxYear', 'Max Year')}
          </label>
          <select
            value={filters.maxYear || ''}
            onChange={(e) => onMaxYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('search:any', 'Any')}</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});
YearSelector.displayName = 'YearSelector';

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

interface FilterModalsProps {
  activeFilterModal: FilterType | null;
  filters: AdvancedSearchFilters;
  onFiltersChange: (updates: Partial<AdvancedSearchFilters>) => void;
  onClose: () => void;
  onClearFilter: (filterType: FilterType) => void;
  
  // Data props
  carMakes?: CarMake[];
  availableModels?: CarModel[];
  referenceData?: CarReferenceData;
  sellerTypeCounts: SellerTypeCounts;
  
  // Loading states
  isLoadingBrands?: boolean;
  isLoadingModels?: boolean;
  isLoadingReferenceData?: boolean;
  
  // Selection states
  selectedMake: number | null;
  selectedModel: number | null;
  onSelectedMakeChange: (makeId: number | null) => void;
  onSelectedModelChange: (modelId: number | null) => void;
  
  // UI state
  carListingsCount?: number;
}

const FilterModals = React.memo<FilterModalsProps>(({
  activeFilterModal,
  filters,
  onFiltersChange,
  onClose,
  onClearFilter,
  carMakes = [],
  availableModels = [],
  referenceData,
  sellerTypeCounts,
  isLoadingBrands = false,
  isLoadingModels = false,
  isLoadingReferenceData = false,
  selectedMake,
  selectedModel,
  onSelectedMakeChange,
  onSelectedModelChange,
  carListingsCount = 0
}) => {
  const { t, i18n } = useLazyTranslation(SEARCH_NAMESPACES);
  const currentLanguage = i18n.language;
  
  // 🚀 UX Enhancement: Accessibility and feedback
  const { announce } = useAnnouncements();
  const modalRef = useRef<HTMLDivElement>(null);

  // Helper function to get modal title
  const getModalTitle = useCallback((filterType: FilterType): string => {
    switch (filterType) {
      case 'makeModel': return t('search:makeModel', 'Make & Model');
      case 'price': return t('search:priceRange', 'Price Range');
      case 'year': return t('search:yearRange', 'Year Range');
      case 'mileage': return t('search:mileageRange', 'Mileage Range');
      case 'transmission': return t('search:gearbox', 'Gearbox');
      case 'fuelType': return t('search:fuelType', 'Fuel Type');
      case 'bodyStyle': return t('search:bodyStyle', 'Body Style');
      case 'sellerType': return t('search:sellerType', 'Seller Type');
      default: return '';
    }
  }, [t]);

  // 🚀 UX Enhancement: Focus management when modal opens
  useEffect(() => {
    if (activeFilterModal && modalRef.current) {
      modalRef.current.focus();
      announce(t('filters.modalOpened', `${getModalTitle(activeFilterModal)} filter opened`));
    }
  }, [activeFilterModal, announce, t, getModalTitle]);

  // 🚀 UX Enhancement: Enhanced close function with feedback
  const handleEnhancedClose = useCallback(() => {
    announce(t('filters.modalClosed', 'Filter modal closed'));
    onClose();
  }, [onClose, announce, t]);

  // 🚀 UX Enhancement: Enhanced clear filter with feedback
  const handleEnhancedClearFilter = useCallback((filterType: FilterType) => {
    onClearFilter(filterType);
    announce(t('filters.filterCleared', `${getModalTitle(filterType)} filter cleared`));
  }, [onClearFilter, announce, t, getModalTitle]);

  // Helper functions to get display names for reference data - memoized to prevent re-renders
  const _getTransmissionDisplayName = useMemo(() => 
    (id: number): string => {
      const transmission = referenceData?.transmissions?.find(t => t.id === id);
      return transmission ? (currentLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn) : '';
    }, [referenceData?.transmissions, currentLanguage]
  );

  const _getFuelTypeDisplayName = useMemo(() => 
    (id: number): string => {
      const fuelType = referenceData?.fuelTypes?.find(f => f.id === id);
      return fuelType ? (currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn) : '';
    }, [referenceData?.fuelTypes, currentLanguage]
  );

  const _getBodyStyleDisplayName = useMemo(() => 
    (id: number): string => {
      const bodyStyle = referenceData?.bodyStyles?.find(b => b.id === id);
      return bodyStyle ? (currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn) : '';
    }, [referenceData?.bodyStyles, currentLanguage]
  );

  const _getSellerTypeDisplayName = useMemo(() => 
    (id: number): string => {
      const sellerType = referenceData?.sellerTypes?.find(s => s.id === id);
      if (sellerType && typeof sellerType === 'object' && 'displayNameEn' in sellerType && 'displayNameAr' in sellerType) {
        const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string };
        return currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
      }
      return '';
    }, [referenceData?.sellerTypes, currentLanguage]
  );

  // Handle input changes
  const handleInputChange = useCallback((field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => {
    const newFilters = {
      ...filters,
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
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const renderModalContent = () => {
    if (!activeFilterModal) return null;

    switch (activeFilterModal) {
      case 'makeModel':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:make', 'Make')}</h3>
              <select
                value={selectedMake || ''}
                onChange={(e) => {
                  const makeId = e.target.value ? Number(e.target.value) : null;
                  
                  if (selectedMake !== makeId) {
                    if (makeId && carMakes) {
                      const brand = carMakes.find(make => make.id === makeId);
                      if (brand && brand.slug) {
                        onSelectedMakeChange(makeId);
                        onSelectedModelChange(null);
                        onFiltersChange({ brands: [brand.slug], models: [] });
                      }
                    } else {
                      onSelectedMakeChange(null);
                      onSelectedModelChange(null);
                      onFiltersChange({ brands: [], models: [] });
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingBrands}
              >
                <option value="">{t('search:any', 'Any')}</option>
                {carMakes?.map(make => (
                  <option key={make.id} value={make.id}>
                    {currentLanguage === 'ar' ? make.displayNameAr : make.displayNameEn}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:model', 'Model')}</h3>
              <select
                value={selectedModel || ''}
                onChange={(e) => {
                  const modelId = e.target.value ? Number(e.target.value) : null;
                  
                  if (selectedModel !== modelId) {
                    if (modelId && availableModels) {
                      const model = availableModels.find(m => m.id === modelId);
                      if (model && model.slug) {
                        onSelectedModelChange(modelId);
                        onFiltersChange({ models: [model.slug] });
                      }
                    } else {
                      onSelectedModelChange(null);
                      onFiltersChange({ models: [] });
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={!selectedMake || isLoadingModels}
              >
                <option value="">{t('search:any', 'Any')}</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:priceRange', 'Price range')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('search:from', 'From')}</label>
                  <input
                    type="number"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleInputChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder={t('search:any', 'Any')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('search:to', 'To')}</label>
                  <input
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder={t('search:any', 'Any')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:yearRange', 'Year range')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('search:from', 'From')}</label>
                  <select
                    value={filters.minYear || ''}
                    onChange={(e) => handleInputChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('search:any', 'Any')}</option>
                    {YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('search:to', 'To')}</label>
                  <select
                    value={filters.maxYear || ''}
                    onChange={(e) => handleInputChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('search:any', 'Any')}</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:mileageRange', 'Mileage range')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('search:from', 'From')}</label>
                  <input
                    type="number"
                    value={filters.minMileage || ''}
                    onChange={(e) => handleInputChange('minMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={t('search:any', 'Any')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('search:to', 'To')}</label>
                  <input
                    type="number"
                    value={filters.maxMileage || ''}
                    onChange={(e) => handleInputChange('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={t('search:any', 'Any')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:gearbox', 'Gearbox')}</h3>
              <select
                value={filters.transmissionId || ''}
                onChange={(e) => handleInputChange('transmissionId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingReferenceData}
              >
                <option value="">{t('search:any', 'Any')}</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:fuelType', 'Fuel type')}</h3>
              <select
                value={filters.fuelTypeId || ''}
                onChange={(e) => handleInputChange('fuelTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingReferenceData}
              >
                <option value="">{t('search:any', 'Any')}</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:bodyStyle', 'Body style')}</h3>
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
                        if (!isSelected) {
                          setTimeout(() => {
                            handleEnhancedClose();
                          }, 100);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-12 h-8 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                          <CarIconDisplay bodyStyleName={bodyStyle.name.toLowerCase()} />
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
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-1">{t('search:sellerType', 'Seller Type')}</h3>
            </div>
            
            <div className="space-y-2">
              {referenceData?.sellerTypes?.map(sellerType => {
                const id = sellerType.id as number;
                const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string; name: string };
                const isSelected = filters.sellerTypeIds?.includes(id) || false;
                const displayName = currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
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

  if (!activeFilterModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
      <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center sm:items-start sm:pt-20 sm:p-0">
        <div className="fixed inset-0 bg-black/3 transition-opacity pointer-events-auto" onClick={handleEnhancedClose} />
        
        <div 
          ref={modalRef}
          className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-100 pointer-events-auto"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleEnhancedClose();
            }
          }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
        >
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-500 hover:text-gray-700 focus:outline-none text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleEnhancedClose}
              aria-label={t('filters.closeModal', 'Close filter modal')}
            >
              {activeFilterModal === 'sellerType' ? t('search:cancel', 'Cancel') : <MdClose className="h-6 w-6" />}
            </button>
          </div>

          {/* Enhanced Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <MdFilterList className="h-5 w-5 text-blue-600" />
              <h2 id="filter-modal-title" className="text-lg font-semibold text-gray-900">
                {getModalTitle(activeFilterModal)}
              </h2>
            </div>
          </div>

          <div className="mt-3">
            {renderModalContent()}
            
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => handleEnhancedClearFilter(activeFilterModal)}
                className="w-1/4 rounded-lg bg-white px-4 py-4 text-base font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 whitespace-nowrap"
                aria-label={t('filters.clearFilterLabel', `Clear ${getModalTitle(activeFilterModal)} filter`)}
              >
                {t('search:clearFilter', 'Clear filter')}
              </button>
              
              <button
                onClick={handleEnhancedClose}
                className="w-3/4 rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                {t('search:showResults', 'Show {{count}} results', { count: carListingsCount || 0 })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FilterModals.displayName = 'FilterModals';

export default FilterModals;
