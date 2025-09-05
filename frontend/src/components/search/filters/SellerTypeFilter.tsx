import React from 'react';
import { CarReferenceData } from '@/services/api';
import { SellerTypeCounts, SellerType } from '@/types/sellerTypes';
import { filterPublicSellerTypes } from '@/utils/sellerTypeUtils';

interface SellerTypeFilterProps {
  referenceData: CarReferenceData | null | undefined;
  currentLanguage: string;
  selectedSellerTypeIds?: number[];
  onSellerTypeChange: (sellerTypeIds: number[] | undefined) => void;
  variant?: 'dropdown' | 'cards';
  isLoading?: boolean;
  disableScroll?: boolean;
  sellerTypeCounts?: SellerTypeCounts;
  t: (key: string, fallback?: string) => string;
}

const SellerTypeFilter: React.FC<SellerTypeFilterProps> = ({
  referenceData,
  currentLanguage,
  selectedSellerTypeIds = [],
  onSellerTypeChange,
  variant = 'cards',
  isLoading = false,
  disableScroll = false,
  sellerTypeCounts = {},
  t
}) => {
  const handleSellerTypeToggle = (sellerTypeId: number) => {
    const currentSellerTypes = selectedSellerTypeIds || [];
    const newSellerTypes = currentSellerTypes.includes(sellerTypeId)
      ? currentSellerTypes.filter(id => id !== sellerTypeId)
      : [...currentSellerTypes, sellerTypeId];
    
    onSellerTypeChange(newSellerTypes.length > 0 ? newSellerTypes : undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!referenceData?.sellerTypes || referenceData.sellerTypes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {t('noSellerTypes', 'No seller types available')}
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className="space-y-4">
        <select
          value={selectedSellerTypeIds?.[0] || ''}
          onChange={(e) => {
            const value = e.target.value;
            onSellerTypeChange(value ? [parseInt(value)] : undefined);
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{t('selectSellerType', 'Select seller type')}</option>
          {filterPublicSellerTypes(referenceData.sellerTypes as SellerType[]).map(sellerType => {
            const typedSellerType = sellerType as { id: number; name: string; displayNameEn: string; displayNameAr: string };
            const displayName = currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
            const count = sellerTypeCounts[typedSellerType.name] || 0;
            return (
              <option key={typedSellerType.id} value={typedSellerType.id}>
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
        {filterPublicSellerTypes(referenceData.sellerTypes as SellerType[]).map(sellerType => {
          const typedSellerType = sellerType as { id: number; name: string; displayNameEn: string; displayNameAr: string };
          const isSelected = selectedSellerTypeIds.includes(typedSellerType.id);
          const displayName = currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
          const count = sellerTypeCounts[typedSellerType.name] || 0;
          
          return (
            <div
              key={typedSellerType.id}
              className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
              }`}
              onClick={() => handleSellerTypeToggle(typedSellerType.id)}
            >
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="transition-transform group-hover:scale-105">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
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

export default SellerTypeFilter; 