import React from 'react';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import FilterChipsDisplay from './FilterChipsDisplay';

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
  getFuelTypeDisplayNameFromSlug: (slug: string) => string;
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
  getFuelTypeDisplayNameFromSlug,
  getBodyStyleDisplayName,
  getSellerTypeDisplayName,
  selectedMake,
  selectedModel,
  referenceData,
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
      <FilterChipsDisplay
        filters={filters}
        updateFiltersAndState={updateFiltersAndState}
        getBrandDisplayNameFromSlug={getBrandDisplayNameFromSlug}
        getModelDisplayNameFromSlug={getModelDisplayNameFromSlug}
        getFilterDisplayText={getFilterDisplayText}
        getTransmissionDisplayName={getTransmissionDisplayName}
        getFuelTypeDisplayNameFromSlug={getFuelTypeDisplayNameFromSlug}
        getBodyStyleDisplayName={getBodyStyleDisplayName}
        getSellerTypeDisplayName={getSellerTypeDisplayName}
        selectedMake={selectedMake}
        selectedModel={selectedModel}
        referenceData={referenceData}
        currentLanguage="en" // This will be overridden by the t function
        t={t}
        showClearAllButton={true}
        filterCount={filterCount}
      />
    </div>
  );
}
