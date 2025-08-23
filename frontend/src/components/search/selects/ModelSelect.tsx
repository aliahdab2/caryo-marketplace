import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CarModel } from '@/types/car';

interface ModelSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  options: CarModel[];
  isLoading: boolean;
  disabled?: boolean;
  currentLanguage: string;
  selectedMake: number | null;
}

const ModelSelect = memo<ModelSelectProps>(({
  value,
  onChange,
  options,
  isLoading,
  disabled = false,
  currentLanguage,
  selectedMake
}) => {
  const { t } = useTranslation('search');

  const getDisplayName = (item: { displayNameEn: string; displayNameAr: string }) => {
    return currentLanguage === 'ar' ? item.displayNameAr : item.displayNameEn;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value ? Number(e.target.value) : null;
    onChange(next);
  };

  const isDisabled = disabled || !selectedMake || isLoading;

  return (
    <div className="h-12 flex items-center">
      <label htmlFor="model" className="sr-only">
        {t('selectModel', 'Model')}
      </label>
      <div className="relative w-full h-12">
        <select
          id="model"
          value={value ?? ''}
          onChange={handleChange}
          className="appearance-none block w-full h-12 pl-3 pr-8 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 overflow-hidden text-ellipsis whitespace-nowrap no-anim-select"
          disabled={isDisabled}
          aria-label={t('selectModel', 'Select model')}
        >
          <option value="">
            {t('selectModel', 'Any Model')}
          </option>
          {selectedMake && !isLoading && options.map((model) => (
            <option key={model.id} value={model.id}>
              {getDisplayName(model)}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 xs:pr-2 pointer-events-none w-5 xs:w-6 justify-center">
          <svg className="w-4 xs:w-5 h-4 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Keep spinner node mounted to avoid layout/paint shifts; toggle only opacity */}
        <div
          className={`absolute inset-y-0 right-6 xs:right-8 flex items-center pr-1 pointer-events-none transition-opacity ${isDisabled ? 'opacity-0' : (isLoading ? 'opacity-100' : 'opacity-0')}`}
          data-testid="model-loading-spinner"
          role="status"
          aria-live="polite"
        >
          <div className="animate-spin h-3 xs:h-4 w-3 xs:w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
});

ModelSelect.displayName = 'ModelSelect';

export default ModelSelect;
