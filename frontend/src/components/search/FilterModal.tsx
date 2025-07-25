import React, { useCallback, useRef } from 'react';
import { CarMake, CarModel } from '@/types/car';
import { CarReferenceData, CarListing, PageResponse } from '@/services/api';
import { SellerTypeCounts } from '@/types/sellerTypes';
import { BodyStyleCounts } from '@/hooks/useBodyStyleCounts';
import PriceSlider from '@/components/ui/PriceSlider';
import MileageSlider from '@/components/ui/MileageSlider';
import YearSlider from '@/components/ui/YearSlider';
import { getCarIcon } from '@/utils/carIcons';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { FilterModalContainer } from '@/components/ui/FilterModalContainer';
import { DEFAULT_CURRENCY } from '@/utils/currency';

interface FilterModalProps {
  filterType: FilterType;
  onClose: () => void;
  filters: AdvancedSearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedSearchFilters>>;
  selectedMake: number | null;
  selectedModel: number | null;
  carMakes: CarMake[] | null;
  availableModels: CarModel[] | null;
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  referenceData: CarReferenceData | null;
  isLoadingReferenceData: boolean;
  sellerTypeCounts: SellerTypeCounts;
  bodyStyleCounts: BodyStyleCounts;
  carListings: PageResponse<CarListing> | null;
  currentLanguage: string;
  isRTL: boolean;
  dirClass: string;
  t: (key: string, fallback?: string, options?: Record<string, unknown>) => string;
  updateFiltersAndState: (
    filterUpdates: Partial<AdvancedSearchFilters>,
    stateUpdates?: { selectedMake?: number | null; selectedModel?: number | null }
  ) => void;
  handleInputChange: (field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => void;
  clearSpecificFilter: (filterType: FilterType) => void;
}

const MODAL_CLASSES = {
  OVERLAY: "fixed inset-0 z-50 overflow-y-auto pointer-events-none",
  CONTAINER: "flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-6",
  BACKDROP: "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity pointer-events-auto",
  MODAL: "relative transform overflow-hidden rounded-2xl bg-white px-6 py-6 text-left shadow-2xl transition-all w-full max-w-lg border border-gray-100 pointer-events-auto",
  CLOSE_BUTTON: "rounded-full p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all",
  SEPARATOR: "border-t border-gray-200",
  BUTTON_CONTAINER: "flex gap-3 mt-6"
} as const;

const BUTTON_CLASSES = {
  CLEAR: "flex-none px-4 py-3 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium",
  PRIMARY: "flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold shadow-sm"
} as const;

const FilterModal: React.FC<FilterModalProps> = ({
  filterType,
  onClose,
  filters,
  setFilters,
  selectedMake,
  selectedModel,
  carMakes,
  availableModels,
  isLoadingBrands,
  isLoadingModels,
  referenceData,
  isLoadingReferenceData,
  sellerTypeCounts,
  bodyStyleCounts,
  currentLanguage,
  dirClass,
  t,
  updateFiltersAndState,
  handleInputChange,
  clearSpecificFilter
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const getModalTitle = (filterType: FilterType) => {
    switch (filterType) {
      case 'makeModel':
        return t('make', 'Make');
      case 'price':
        return t('search:priceRange', 'Price Range');
      case 'year':
        return t('search:yearRange', 'Year range');
      case 'mileage':
        return t('search:mileageRange', 'Mileage range');
      case 'transmission':
        return t('gearbox', 'Gearbox');
      case 'fuelType':
        return t('fuelType', 'Fuel type');
      case 'bodyStyle':
        return t('bodyStyle', 'Body style');
      case 'sellerType':
        return t('sellerType', 'Seller Type');
      case 'allFilters':
        return t('allFilters', 'All Filters');
      default:
        return '';
    }
  };

  // Stable price change handler to prevent infinite loops
  const handlePriceChange = useCallback((minPrice: number | undefined, maxPrice: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined
    }));
  }, [setFilters]);

  const renderModalContent = () => {
    switch (filterType) {
      case 'makeModel':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('make', 'Make')}</h3>
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
                <option value="">{t('any', 'Any')}</option>
                {carMakes?.map(make => (
                  <option key={make.id} value={make.id}>
                    {currentLanguage === 'ar' ? make.displayNameAr : make.displayNameEn}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('model', 'Model')}</h3>
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
                <option value="">{t('any', 'Any')}</option>
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
          <FilterModalContainer 
            title={t('search:priceRange', 'Price Range')}
            dirClass={dirClass}
            showSeparator={true}
          >
            <PriceSlider
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              currency={DEFAULT_CURRENCY}
              onChange={handlePriceChange}
              t={t}
              locale={currentLanguage}
              className="mb-2"
            />
          </FilterModalContainer>
        );

      case 'year':
        return (
          <FilterModalContainer 
            title={t('search:yearRange', 'Year range')}
            dirClass={dirClass}
          >
            <YearSlider
              minYear={filters.minYear}
              maxYear={filters.maxYear}
              onChange={(min, max) => {
                updateFiltersAndState({
                  minYear: min,
                  maxYear: max
                });
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t={t as any}
              locale={currentLanguage}
              className="w-full"
            />
          </FilterModalContainer>
        );

      case 'mileage':
        return (
          <FilterModalContainer 
            title={t('search:mileageRange', 'Mileage range')}
            dirClass={dirClass}
          >
            <MileageSlider
              minMileage={filters.minMileage}
              maxMileage={filters.maxMileage}
              onChange={(min, max) => {
                updateFiltersAndState({
                  minMileage: min,
                  maxMileage: max
                });
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t={t as any}
              locale={currentLanguage}
              className="w-full"
            />
          </FilterModalContainer>
        );

      case 'transmission':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('gearbox', 'Gearbox')}</h3>
              <select
                value={filters.transmissionId || ''}
                onChange={(e) => handleInputChange('transmissionId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingReferenceData}
              >
                <option value="">{t('any', 'Any')}</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{t('fuelType', 'Fuel type')}</h3>
              <select
                value={filters.fuelTypeId || ''}
                onChange={(e) => handleInputChange('fuelTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingReferenceData}
              >
                <option value="">{t('any', 'Any')}</option>
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
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('bodyStyle', 'Body style')}</h3>
            </div>
            
            <div className="grid gap-3 max-h-80 overflow-y-auto pr-2 rtl:pr-0 rtl:pl-2">
              {referenceData?.bodyStyles?.map(bodyStyle => {
                const isSelected = filters.bodyStyleId === bodyStyle.id;
                const displayName = currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn;
                const count = bodyStyleCounts[bodyStyle.name.toLowerCase()] || 0;
                
                return (
                  <div
                    key={bodyStyle.id}
                    className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      handleInputChange('bodyStyleId', isSelected ? undefined : bodyStyle.id);
                      // Auto-close modal after selection for better UX
                      if (!isSelected) {
                        setTimeout(() => {
                          onClose();
                        }, 300);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="transition-transform group-hover:scale-105">
                        {/* Professional car silhouette icon - now self-centering */}
                        {getCarIcon(bodyStyle.name.toLowerCase())}
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="text-gray-900 font-medium">{displayName}</span>
                        <span className="text-gray-500 text-sm">({count.toLocaleString()})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500 scale-110' 
                          : 'border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'sellerType':
        return (
          <div className="space-y-6">
            {/* Header - Blocket style but in English/Arabic */}
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-1">{t('sellerType', 'Seller Type')}</h3>
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
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
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

      case 'allFilters':
        return (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-4">{t('allFilters', 'All Filters')}</h3>
            </div>
            
            {/* Make and Model */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3 text-center">{t('makeAndModel', 'Make and Model')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('make', 'Make')}</label>
                  <select
                    value={selectedMake || ''}
                    onChange={(e) => {
                      const makeId = e.target.value ? Number(e.target.value) : null;
                      if (selectedMake !== makeId) {
                        if (makeId && carMakes) {
                          const brand = carMakes.find(make => make.id === makeId);
                          if (brand && brand.slug) {
                            updateFiltersAndState(
                              { brands: [brand.slug], models: [] },
                              { selectedMake: makeId, selectedModel: null }
                            );
                          }
                        } else {
                          updateFiltersAndState(
                            { brands: [], models: [] },
                            { selectedMake: null, selectedModel: null }
                          );
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    disabled={isLoadingBrands}
                  >
                    <option value="">{t('any', 'Any')}</option>
                    {carMakes?.map(make => (
                      <option key={make.id} value={make.id}>
                        {currentLanguage === 'ar' ? make.displayNameAr : make.displayNameEn}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('model', 'Model')}</label>
                  <select
                    value={selectedModel || ''}
                    onChange={(e) => {
                      const modelId = e.target.value ? Number(e.target.value) : null;
                      if (selectedModel !== modelId) {
                        if (modelId && availableModels) {
                          const model = availableModels.find(m => m.id === modelId);
                          if (model && model.slug) {
                            updateFiltersAndState(
                              { models: [model.slug] },
                              { selectedModel: modelId }
                            );
                          }
                        } else {
                          updateFiltersAndState(
                            { models: [] },
                            { selectedModel: null }
                          );
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    disabled={!selectedMake || isLoadingModels}
                  >
                    <option value="">{t('any', 'Any')}</option>
                    {availableModels?.map(model => (
                      <option key={model.id} value={model.id}>
                        {currentLanguage === 'ar' ? model.displayNameAr : model.displayNameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Price Range */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">{t('priceRange', 'Price Range')}</h4>
              <PriceSlider
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                currency={DEFAULT_CURRENCY}
                onChange={handlePriceChange}
                t={t}
                locale={currentLanguage}
                className="mb-2"
              />
            </div>
            
            {/* Year Range */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">{t('yearRange', 'Year Range')}</h4>
              <YearSlider
                minYear={filters.minYear}
                maxYear={filters.maxYear}
                onChange={(min, max) => {
                  updateFiltersAndState({
                    minYear: min,
                    maxYear: max
                  });
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                t={t as any}
                locale={currentLanguage}
                className="w-full"
              />
            </div>
            
            {/* Mileage Range */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">{t('mileageRange', 'Mileage Range')}</h4>
              <MileageSlider
                minMileage={filters.minMileage}
                maxMileage={filters.maxMileage}
                onChange={(min, max) => {
                  updateFiltersAndState({
                    minMileage: min,
                    maxMileage: max
                  });
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                t={t as any}
                locale={currentLanguage}
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={MODAL_CLASSES.OVERLAY}>
      <div className={MODAL_CLASSES.CONTAINER}>
        <div className={MODAL_CLASSES.BACKDROP} onClick={onClose} />
        
        <div 
          ref={modalRef}
          className={MODAL_CLASSES.MODAL}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
          dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <div>
                <h2 id="filter-modal-title" className="text-xl font-semibold text-gray-900">
                  {currentLanguage === 'ar' ? 'تصفية وترتيب' : 'Filter and sort'}
                </h2>
              </div>
            </div>
            
            <button
              type="button"
              className={MODAL_CLASSES.CLOSE_BUTTON}
              onClick={onClose}
              aria-label={currentLanguage === 'ar' ? 'إغلاق نافذة التصفية' : 'Close filter modal'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Content */}
          <div className="space-y-6">
            {renderModalContent()}
          </div>

          {/* Enhanced Footer */}
          <div className={MODAL_CLASSES.SEPARATOR} />
          <div className={MODAL_CLASSES.BUTTON_CONTAINER}>
            <button
              type="button"
              className={BUTTON_CLASSES.CLEAR}
              onClick={() => clearSpecificFilter(filterType)}
              aria-label={currentLanguage === 'ar' ? `مسح تصفية ${getModalTitle(filterType)}` : `Clear ${getModalTitle(filterType)} filter`}
            >
              {currentLanguage === 'ar' ? 'مسح الكل' : 'Clear all'}
            </button>
            <button
              type="button"
              className={BUTTON_CLASSES.PRIMARY}
              onClick={onClose}
            >
              {currentLanguage === 'ar' ? 'البحث عن السيارات' : 'Search cars'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

FilterModal.displayName = 'FilterModal';

export default FilterModal;
