import React from 'react';
import { MdClose, MdDeleteSweep } from 'react-icons/md';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { getCarIcon } from '@/utils/carIcons';

interface FilterChipsProps {
  filters: AdvancedSearchFilters;
  isFilterActive: (filterType: FilterType) => boolean;
  filterCount: number;
  updateFiltersAndState: (
    filterUpdates: Partial<AdvancedSearchFilters>,
    stateUpdates?: { selectedMake?: number | null; selectedModel?: number | null }
  ) => void;
  getBrandDisplayNameFromSlug: (slug: string) => string;
  getModelDisplayNameFromSlug: (slug: string) => string;
  getFilterDisplayText: (filterType: FilterType) => string;
  getTransmissionDisplayName: (id: number) => string;
  getFuelTypeDisplayName: (id: number) => string;
  getBodyStyleDisplayName: (slug: string) => string;
  getSellerTypeDisplayName: (id: number) => string;
  selectedMake: number | null;
  selectedModel: number | null;
  t: (key: string, fallback?: string, options?: { brand?: string; model?: string }) => string;
}

export default function FilterChips({
  filters,
  isFilterActive,
  filterCount,
  updateFiltersAndState,
  getBrandDisplayNameFromSlug,
  getModelDisplayNameFromSlug,
  getFilterDisplayText,
  getTransmissionDisplayName,
  getFuelTypeDisplayName,
  getBodyStyleDisplayName,
  getSellerTypeDisplayName,
  selectedMake,
  selectedModel,
  t
}: FilterChipsProps) {


  // Show filter chips only when there are active filters
  const hasActiveFilters = isFilterActive('makeModel') || isFilterActive('price') || isFilterActive('year') || 
    isFilterActive('mileage') || isFilterActive('transmission') || isFilterActive('fuelType') || 
    isFilterActive('bodyStyle') || isFilterActive('sellerType');

  if (!hasActiveFilters) {
    return null;
  }

  return (
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
              bodyType: undefined,
              sellerTypeIds: undefined
            }, {
              selectedMake: null,
              selectedModel: null
            });
          }}
          className="group inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-md"
          aria-label={t('clearAllFilters', 'Clear all filters')}
        >
          <MdDeleteSweep className="w-4 h-4 mr-2 transition-transform group-hover:rotate-6" />
          {t('clear', 'Clear')} ({filterCount})
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
              aria-label={t('removeBrand', 'Remove {{brand}} brand', { brand: getBrandDisplayNameFromSlug(brandSlug) })}
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
              aria-label={t('removeModel', 'Remove {{model}} model', { model: getModelDisplayNameFromSlug(modelSlug) })}
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
              aria-label={t('removePriceFilter', 'Remove price filter')}
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
              aria-label={t('removeYearFilter', 'Remove year filter')}
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
              aria-label={t('removeMileageFilter', 'Remove mileage filter')}
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
              aria-label={t('removeTransmissionFilter', 'Remove transmission filter')}
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
              aria-label={t('removeFuelTypeFilter', 'Remove fuel type filter')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body Style Chips */}
        {filters.bodyType && filters.bodyType.map((bodyStyleSlug) => (
          <div
            key={`body-${bodyStyleSlug}`}
            className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <span className="mr-1">{getBodyStyleDisplayName(bodyStyleSlug)}</span>
            <div className="w-8 h-8 mr-1 flex-shrink-0">
              {getCarIcon(bodyStyleSlug, "w-8 h-8")}
            </div>
            <button
              onClick={() => {
                            const updatedBodyTypes = filters.bodyType?.filter(type => type !== bodyStyleSlug) || [];
            updateFiltersAndState({ 
              bodyType: updatedBodyTypes.length > 0 ? updatedBodyTypes : undefined
            });
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5"
              aria-label={t('removeBodyStyleFilter', 'Remove body style filter')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

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
              aria-label={t('removeSellerTypeFilter', 'Remove seller type filter')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

FilterChips.displayName = 'FilterChips';
