import React from 'react';
import { MdDeleteSweep } from 'react-icons/md';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { getCarIcon } from '@/utils/carIcons';
import { getFuelTypeIcon } from '@/utils/fuelTypeIcons';
import FilterChip from './FilterChip';

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
  referenceData?: { fuelTypes?: Array<{ id: number; name: string; displayNameEn: string; displayNameAr: string }> } | null;
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
  referenceData,
  t
}: FilterChipsProps) {
  // Helper function to get fuel type name from ID for icon
  const getFuelTypeNameFromId = (id: number): string => {
    if (referenceData?.fuelTypes) {
      const fuelType = referenceData.fuelTypes.find(f => f.id === id);
      if (fuelType) {
        return fuelType.name.toLowerCase();
      }
    }
    // Fallback to gasoline if not found
    return 'gasoline';
  };


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
          <FilterChip
            key={`brand-${brandSlug}`}
            label={getBrandDisplayNameFromSlug(brandSlug)}
            onRemove={() => {
              const updatedBrands = filters.brands?.filter(b => b !== brandSlug) || [];
              updateFiltersAndState({ 
                brands: updatedBrands.length > 0 ? updatedBrands : undefined,
                models: updatedBrands.length === 0 ? undefined : filters.models
              }, {
                selectedMake: updatedBrands.length === 0 ? null : selectedMake,
                selectedModel: updatedBrands.length === 0 ? null : selectedModel
              });
            }}
            removeButtonLabel={t('removeBrand', 'Remove {{brand}} brand', { brand: getBrandDisplayNameFromSlug(brandSlug) })}
            variant="brand"
          />
        ))}
        
        {/* Model Chips */}
        {filters.models && filters.models.map((modelSlug) => (
          <FilterChip
            key={`model-${modelSlug}`}
            label={getModelDisplayNameFromSlug(modelSlug)}
            onRemove={() => {
              const updatedModels = filters.models?.filter(m => m !== modelSlug) || [];
              updateFiltersAndState({ 
                models: updatedModels.length > 0 ? updatedModels : undefined
              }, {
                selectedModel: updatedModels.length === 0 ? null : selectedModel
              });
            }}
            removeButtonLabel={t('removeModel', 'Remove {{model}} model', { model: getModelDisplayNameFromSlug(modelSlug) })}
          />
        ))}

        {/* Price Chip */}
        {(filters.minPrice || filters.maxPrice) && (
          <FilterChip
            label={getFilterDisplayText('price')}
            onRemove={() => updateFiltersAndState({ minPrice: undefined, maxPrice: undefined })}
            removeButtonLabel={t('removePriceFilter', 'Remove price filter')}
          />
        )}

        {/* Year Chip */}
        {(filters.minYear || filters.maxYear) && (
          <FilterChip
            label={getFilterDisplayText('year')}
            onRemove={() => updateFiltersAndState({ minYear: undefined, maxYear: undefined })}
            removeButtonLabel={t('removeYearFilter', 'Remove year filter')}
          />
        )}

        {/* Mileage Chip */}
        {(filters.minMileage || filters.maxMileage) && (
          <FilterChip
            label={getFilterDisplayText('mileage')}
            onRemove={() => updateFiltersAndState({ minMileage: undefined, maxMileage: undefined })}
            removeButtonLabel={t('removeMileageFilter', 'Remove mileage filter')}
          />
        )}

        {/* Transmission Chip */}
        {filters.transmissionId && (
          <FilterChip
            label={getTransmissionDisplayName(filters.transmissionId)}
            onRemove={() => updateFiltersAndState({ transmissionId: undefined })}
            removeButtonLabel={t('removeTransmissionFilter', 'Remove transmission filter')}
          />
        )}

        {/* Fuel Type Chip */}
        {filters.fuelTypeId && (
          <FilterChip
            label={getFuelTypeDisplayName(filters.fuelTypeId)}
            onRemove={() => updateFiltersAndState({ fuelTypeId: undefined })}
            icon={getFuelTypeIcon(getFuelTypeNameFromId(filters.fuelTypeId), "w-6 h-5")}
            removeButtonLabel={t('removeFuelTypeFilter', 'Remove fuel type filter')}
          />
        )}

        {/* Body Style Chips */}
        {filters.bodyType && filters.bodyType.map((bodyStyleSlug) => (
          <FilterChip
            key={`body-${bodyStyleSlug}`}
            label={getBodyStyleDisplayName(bodyStyleSlug)}
            onRemove={() => {
              const updatedBodyTypes = filters.bodyType?.filter(type => type !== bodyStyleSlug) || [];
              updateFiltersAndState({ 
                bodyType: updatedBodyTypes.length > 0 ? updatedBodyTypes : undefined
              });
            }}
            icon={getCarIcon(bodyStyleSlug, "w-8 h-8")}
            removeButtonLabel={t('removeBodyStyleFilter', 'Remove body style filter')}
          />
        ))}

        {/* Seller Type Chips */}
        {filters.sellerTypeIds && filters.sellerTypeIds.map((sellerTypeId) => (
          <FilterChip
            key={`seller-${sellerTypeId}`}
            label={getSellerTypeDisplayName(sellerTypeId)}
            onRemove={() => {
              const updatedSellerTypes = filters.sellerTypeIds?.filter(id => id !== sellerTypeId) || [];
              updateFiltersAndState({ 
                sellerTypeIds: updatedSellerTypes.length > 0 ? updatedSellerTypes : undefined
              });
            }}
            removeButtonLabel={t('removeSellerTypeFilter', 'Remove seller type filter')}
          />
        ))}
      </div>
    </div>
  );
}

FilterChips.displayName = 'FilterChips';
