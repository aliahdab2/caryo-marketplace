"use client";

import React from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useDirection } from '@/utils/direction';
import StepHeader from '../shared/StepHeader';
import { SelectWithArrow } from '../../ui/SelectWithArrow';
import ErrorMessage from '../shared/ErrorMessage';

type ReferenceOption = {
  id: number;
  slug: string;
  displayNameAr: string;
  displayNameEn: string;
};

export interface Step1VehicleIdentityProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  carMakes: ReferenceOption[];
  carModels: ReferenceOption[];
  isLoadingMakes?: boolean;
  isLoadingModels?: boolean;
  onMakeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Step1VehicleIdentity: React.FC<Step1VehicleIdentityProps> = ({
  formData,
  formErrors,
  carMakes,
  carModels,
  isLoadingMakes = false,
  isLoadingModels = false,
  onMakeChange,
  onModelChange,
  onYearChange,
}) => {
  const { t, i18n } = useLazyTranslation(['listings']);
  const { isRTL } = useDirection();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Live region for validation feedback (accessibility) */}
      <div className="sr-only" aria-live="polite" role="status">
        {Object.values(formErrors).filter(Boolean).join('. ')}
      </div>
      
      <StepHeader
        title={t('listings:vehicleIdentityTitle', 'Vehicle Identity')}
        subtitle={t('listings:vehicleIdentitySubtitle', "Start by telling us what vehicle you're selling")}
      />

      {/* Car Make */}
      <div className="space-y-3">
        <label 
          htmlFor="make" 
          className="block text-sm font-bold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingMake', 'Make')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <SelectWithArrow
            id="make"
            name="make"
            value={formData.make}
            onChange={onMakeChange}
            disabled={isLoadingMakes}
            isLoading={isLoadingMakes}
            isRTL={isRTL}
            className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              formErrors.make ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            } ${isLoadingMakes ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-invalid={!!formErrors.make}
            aria-describedby={formErrors.make ? 'make-error' : 'make-hint'}
          >
            <option value="">
              {isLoadingMakes 
                ? t('listings:newListingLoadingMakes', 'Loading makes...') 
                : t('listings:newListingSelectMake', 'Select a make')
              }
            </option>
            {carMakes.map((make) => (
              <option key={make.id} value={make.slug}>
                {i18n.language === 'ar' ? make.displayNameAr : make.displayNameEn}
              </option>
            ))}
          </SelectWithArrow>
          {/* No status icon for dropdown */}
        </div>
        {formErrors.make && <ErrorMessage error={formErrors.make} />}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="make-hint">
          {t('listings:newListingMakeHint', 'Select the manufacturer of your car')}
        </p>
      </div>

      {/* Car Model */}
      <div className="space-y-3">
        <label 
          htmlFor="model" 
          className="block text-sm font-bold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingModel', 'Model')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <SelectWithArrow
            id="model"
            name="model"
            value={formData.model}
            onChange={onModelChange}
            disabled={isLoadingModels || !formData.make}
            isLoading={isLoadingModels}
            isRTL={isRTL}
            className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              formErrors.model ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            } ${(isLoadingModels || !formData.make) ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-invalid={!!formErrors.model}
            aria-describedby={formErrors.model ? 'model-error' : 'model-hint'}
          >
            <option value="">
              {!formData.make 
                ? t('listings:newListingSelectMakeFirst', 'Select a make first')
                : isLoadingModels 
                ? t('listings:newListingLoadingModels', 'Loading models...') 
                : t('listings:newListingSelectModel', 'Select a model')
              }
            </option>
            {carModels.map((model) => (
              <option key={model.id} value={model.slug}>
                {i18n.language === 'ar' ? model.displayNameAr : model.displayNameEn}
              </option>
            ))}
          </SelectWithArrow>
          {/* No status icon for dropdown */}
        </div>
        {formErrors.model && <ErrorMessage error={formErrors.model} />}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="model-hint">
          {t('listings:newListingModelHint', 'Select the specific model of your car')}
        </p>
      </div>

      {/* Year */}
      <div className="space-y-3">
        <label
          htmlFor="year"
          className="block text-sm font-bold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingYear', 'Year')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <SelectWithArrow
            id="year"
            name="year"
            value={formData.year}
            onChange={onYearChange}
            required
            isRTL={isRTL}
            className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              formErrors.year ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            }`}
            aria-invalid={!!formErrors.year}
            aria-describedby={formErrors.year ? 'year-error' : 'year-hint'}
          >
            <option value="">{t('listings:selectYear', 'Select Year')}</option>
            {(() => {
              const currentYear = new Date().getFullYear();
              const years = [] as React.ReactNode[];
              for (let year = currentYear; year >= 1990; year--) {
                years.push(
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                );
              }
              return years;
            })()}
          </SelectWithArrow>
          {/* No status icon for dropdown */}
        </div>
        {formErrors.year && <ErrorMessage error={formErrors.year} />}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="year-hint">
          {t('listings:newListingYearHint', 'Enter manufacturing year (1990-{{currentYear}})', { currentYear: new Date().getFullYear() })}
        </p>
      </div>
      
      {/* Bottom spacing to separate from navigation buttons */}
      <div className="pb-8"></div>
    </div>
  );
};

export default Step1VehicleIdentity;


