import React from 'react';
import { CarReferenceData } from '@/services/api';
import { FuelTypeCounts } from '@/hooks/useFuelTypeCounts';
import { getFuelTypeIcon } from '@/utils/fuelTypeIcons';

interface FuelTypeFilterProps {
  referenceData: CarReferenceData | null | undefined;
  currentLanguage: string;
  selectedFuelTypeSlugs?: string[];
  onFuelTypeChange: (fuelTypeSlugs: string[] | undefined) => void;
  variant?: 'dropdown' | 'cards';
  isLoading?: boolean;
  disableScroll?: boolean;
  fuelTypeCounts?: FuelTypeCounts;
  t: (key: string, fallback?: string) => string;
}

const FuelTypeFilter: React.FC<FuelTypeFilterProps> = ({
  referenceData,
  currentLanguage,
  selectedFuelTypeSlugs = [],
  onFuelTypeChange,
  variant = 'cards',
  isLoading = false,
  disableScroll = false,
  fuelTypeCounts = {},
  t
}) => {
  const handleFuelTypeToggle = (fuelTypeSlug: string) => {
    const currentFuelTypes = selectedFuelTypeSlugs || [];
    const newFuelTypes = currentFuelTypes.includes(fuelTypeSlug)
      ? currentFuelTypes.filter(slug => slug !== fuelTypeSlug)
      : [...currentFuelTypes, fuelTypeSlug];
    
    onFuelTypeChange(newFuelTypes.length > 0 ? newFuelTypes : undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!referenceData?.fuelTypes || referenceData.fuelTypes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {t('noFuelTypes', 'No fuel types available')}
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className="space-y-4">
        <select
          value={selectedFuelTypeSlugs?.[0] || ''}
          onChange={(e) => {
            const value = e.target.value;
            onFuelTypeChange(value ? [value] : undefined);
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{t('selectFuelType', 'Select fuel type')}</option>
          {referenceData.fuelTypes.map(fuelType => {
            const displayName = currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn;
            const count = fuelTypeCounts[fuelType.name.toLowerCase()] || 0;
            return (
              <option key={fuelType.id} value={fuelType.slug}>
                {displayName} ({count})
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  // Cards variant (default)
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${disableScroll ? '' : 'max-h-96 overflow-y-auto pr-2 rtl:pr-0 rtl:pl-2'}`}>
        {referenceData.fuelTypes.map(fuelType => {
          const isSelected = selectedFuelTypeSlugs.includes(fuelType.slug);
          const displayName = currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn;
          const count = fuelTypeCounts[fuelType.name.toLowerCase()] || 0;
          
          return (
            <div
              key={fuelType.id}
              className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
              }`}
              onClick={() => handleFuelTypeToggle(fuelType.slug)}
            >
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="transition-transform group-hover:scale-105">
                  {getFuelTypeIcon(fuelType.name.toLowerCase())}
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
};

export default FuelTypeFilter; 