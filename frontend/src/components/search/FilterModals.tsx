"use client";

import React, { useCallback, useMemo } from 'react';
import { MdClose } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
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

  // Handle keyboard navigation for modals
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent, onCloseModal: () => void) => {
    if (e.key === 'Escape') {
      onCloseModal();
    }
  }, []);

  const renderModalContent = () => {
    if (!activeFilterModal) return null;

    switch (activeFilterModal) {
      case 'makeModel':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.make', 'Make')}</h3>
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
                        if (!isSelected) {
                          setTimeout(() => {
                            onClose();
                          }, 100);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-12 h-8 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
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
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-1">{t('search.sellerType', 'Seller Type')}</h3>
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
              {activeFilterModal === 'sellerType' ? t('search:cancel', 'Cancel') : <MdClose className="h-6 w-6" />}
            </button>
          </div>

          <div className="mt-3">
            {renderModalContent()}
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => onClearFilter(activeFilterModal)}
                className="rounded-md bg-white px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                {t('search.clearFilter', 'Clear filter')}
              </button>
              
              <button
                onClick={onClose}
                className="rounded-md bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {activeFilterModal === 'sellerType' 
                  ? t('search:showResults', 'Show {{count}} results', { count: carListingsCount })
                  : t('search:done', 'Done')
                }
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
