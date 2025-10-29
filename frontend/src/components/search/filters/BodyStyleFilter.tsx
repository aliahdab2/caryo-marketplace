import React from 'react';
import { CarReferenceData } from '@/services/api';
import { BodyStyleCounts } from '@/hooks/useBodyStyleCounts';
import { getCarIcon } from '@/utils/carIcons';

interface BodyStyleFilterProps {
  referenceData: CarReferenceData | null | undefined;
  currentLanguage: string;
  selectedBodyStyleSlugs?: string[];
  onBodyStyleChange: (bodyStyleSlugs: string[] | undefined) => void;
  variant?: 'dropdown' | 'cards';
  isLoading?: boolean;
  disableScroll?: boolean;
  bodyStyleCounts?: BodyStyleCounts;
  t: (key: string, fallback?: string) => string;
}

const BodyStyleFilter: React.FC<BodyStyleFilterProps> = ({
  referenceData,
  currentLanguage,
  selectedBodyStyleSlugs = [],
  onBodyStyleChange,
  variant = 'cards',
  isLoading = false,
  disableScroll = false,
  bodyStyleCounts = {},
  t
}) => {
  const handleBodyStyleToggle = (bodyStyleSlug: string) => {
    const isSelected = selectedBodyStyleSlugs.includes(bodyStyleSlug);
    const newBodyStyleSlugs = isSelected
      ? selectedBodyStyleSlugs.filter(slug => slug !== bodyStyleSlug)
      : [...selectedBodyStyleSlugs, bodyStyleSlug];

    onBodyStyleChange(newBodyStyleSlugs.length > 0 ? newBodyStyleSlugs : undefined);
  };

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === '') {
      onBodyStyleChange(undefined);
    } else {
      onBodyStyleChange([value]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!referenceData?.bodyStyles || referenceData.bodyStyles.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        {t('noBodyStylesAvailable', 'No body styles available')}
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('bodyStyle', 'Body Style')}
        </label>
        <select
          value={selectedBodyStyleSlugs.length > 0 ? selectedBodyStyleSlugs[0] : ''}
          onChange={handleDropdownChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{t('allBodyStyles', 'All Body Styles')}</option>
          {referenceData.bodyStyles.map(bodyStyle => {
            const displayName = currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn;
            const count = bodyStyleCounts[bodyStyle.name.toLowerCase()] || 0;
            return (
              <option key={bodyStyle.id} value={bodyStyle.slug}>
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
        {referenceData.bodyStyles.map(bodyStyle => {
          const isSelected = selectedBodyStyleSlugs.includes(bodyStyle.slug);
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
              onClick={() => handleBodyStyleToggle(bodyStyle.slug)}
            >
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="transition-transform group-hover:scale-105">
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
};

export default BodyStyleFilter;