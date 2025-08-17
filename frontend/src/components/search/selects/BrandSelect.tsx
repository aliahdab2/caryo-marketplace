import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CarMake } from '@/types/car';

interface BrandSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  options: CarMake[];
  isLoading: boolean;
  disabled?: boolean;
  currentLanguage: string;
}

const BrandSelect = memo<BrandSelectProps>(({
  value,
  onChange,
  options,
  isLoading,
  disabled = false,
  currentLanguage
}) => {
  const { t } = useTranslation('search');

  const getDisplayName = (item: { displayNameEn: string; displayNameAr: string }) => {
    return currentLanguage === 'ar' ? item.displayNameAr : item.displayNameEn;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value ? Number(e.target.value) : null;
    onChange(next);
  };

  return (
    <div className="h-12 flex items-center">
      <label htmlFor="brand" className="sr-only">
        {t('selectBrand', 'Brand')}
      </label>
      <div className="relative w-full h-12">
        <select
          id="brand"
          value={value ?? ''}
          onChange={handleChange}
          className="appearance-none block w-full h-12 pl-3 xs:pl-4 pr-8 xs:pr-10 py-2 xs:py-3 text-sm xs:text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 overflow-hidden text-ellipsis whitespace-nowrap"
          disabled={disabled || isLoading}
          aria-label={t('selectBrand', 'Select brand')}
        >
          <option value="">{t('selectBrand', 'Any Brand')}</option>
          {!isLoading && options.map((make) => (
            <option key={make.id} value={make.id}>
              {getDisplayName(make)}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 xs:pr-2 pointer-events-none">
          <svg className="w-4 xs:w-5 h-4 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isLoading && (
          <div className="absolute inset-y-0 right-6 xs:right-8 flex items-center pr-1 pointer-events-none" data-testid="brand-loading-spinner" role="status" aria-live="polite">
            <div className="animate-spin h-3 xs:h-4 w-3 xs:w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
});

BrandSelect.displayName = 'BrandSelect';

export default BrandSelect;
