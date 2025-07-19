"use client";

import React, { useMemo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { EnhancedLoadingState } from '@/components/ui/EnhancedUX';
import { CarMake, CarModel } from '@/types/car';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';

interface MakeModelFilterProps {
  filters: AdvancedSearchFilters;
  carMakes: CarMake[];
  availableModels: CarModel[];
  selectedMake: number | null;
  onBrandToggle: (slug: string, id: number) => void;
  onModelToggle: (slug: string, id: number) => void;
  onSelectedMakeChange: (makeId: number | null) => void;
  isLoadingBrands?: boolean;
  isLoadingModels?: boolean;
}

const MakeModelFilter: React.FC<MakeModelFilterProps> = ({
  filters,
  carMakes,
  availableModels,
  selectedMake,
  onBrandToggle,
  onModelToggle,
  onSelectedMakeChange,
  isLoadingBrands = false,
  isLoadingModels = false
}) => {
  const { t } = useLazyTranslation(['common', 'search']);
  
  const filteredMakes = useMemo(() => 
    carMakes.filter(make => make.isActive), 
    [carMakes]
  );
  
  const filteredModels = useMemo(() => 
    availableModels.filter(model => model.isActive), 
    [availableModels]
  );

  return (
    <div className="space-y-6">
      {/* Make Selection Dropdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('search.make', 'Make')}
        </h3>
        <select
          value={selectedMake || ''}
          onChange={(e) => {
            const makeId = e.target.value ? Number(e.target.value) : null;
            
            if (selectedMake !== makeId) {
              if (makeId && carMakes) {
                const brand = carMakes.find(make => make.id === makeId);
                if (brand && brand.slug) {
                  onSelectedMakeChange(makeId);
                  onBrandToggle(brand.slug, makeId);
                }
              } else {
                onSelectedMakeChange(null);
              }
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          disabled={isLoadingBrands}
        >
          <option value="">{t('search.selectMake', 'Select a make')}</option>
          {filteredMakes.map(make => (
            <option key={make.id} value={make.id}>
              {make.displayNameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      {selectedMake && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('search.model', 'Model')}
          </h3>
          {isLoadingModels ? (
            <div className="text-center py-4">
              <EnhancedLoadingState type="spinner" size="sm" message={t('common.loading', 'Loading...')} />
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
};

MakeModelFilter.displayName = 'MakeModelFilter';

export default MakeModelFilter;
