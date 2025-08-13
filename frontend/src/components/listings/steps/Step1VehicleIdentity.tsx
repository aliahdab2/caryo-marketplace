"use client";

import React, { memo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { CarBrand, CarModel } from '@/types/referenceData';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import ErrorMessage from '../shared/ErrorMessage';

interface Step1Props {
  formData: ListingFormData;
  formErrors: FormErrors;
  carMakes: CarBrand[];
  carModels: CarModel[];
  isLoadingMakes: boolean;
  isLoadingModels: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const Step1VehicleIdentity = memo(function Step1VehicleIdentity({
  formData,
  formErrors,
  carMakes,
  carModels,
  isLoadingMakes,
  isLoadingModels,
  handleChange
}: Step1Props) {
  const { i18n, t } = useLazyTranslation(['listings']);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('listings:vehicleIdentityTitle', 'Vehicle Identity')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t('listings:vehicleIdentitySubtitle', 'Start by telling us what vehicle you\'re selling')}
        </p>
      </div>

      {/* Car Make */}
      <div className="space-y-3">
        <label 
          htmlFor="make" 
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingMake', 'Make')} <span className="text-red-500">*</span>
        </label>
        <select
          id="make"
          name="make"
          value={formData.make}
          onChange={handleChange}
          disabled={isLoadingMakes}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
            <option key={make.id} value={make.id.toString()}>
              {i18n.language === 'ar' ? make.displayNameAr : make.displayNameEn}
            </option>
          ))}
        </select>
        {formErrors.make && <ErrorMessage error={formErrors.make} />}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="make-hint">
          {t('listings:newListingMakeHint', 'Select the manufacturer of your car')}
        </p>
      </div>

      {/* Car Model */}
      <div className="space-y-3">
        <label 
          htmlFor="model" 
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingModel', 'Model')} <span className="text-red-500">*</span>
        </label>
        <select
          id="model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          disabled={isLoadingModels || !formData.make}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
            <option key={model.id} value={model.id.toString()}>
              {i18n.language === 'ar' ? model.displayNameAr : model.displayNameEn}
            </option>
          ))}
        </select>
        {formErrors.model && <ErrorMessage error={formErrors.model} />}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="model-hint">
          {t('listings:newListingModelHint', 'Select the specific model of your car')}
        </p>
      </div>

      {/* Year */}
      <div className="space-y-3">
        <label
          htmlFor="year"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingYear', 'Year')} <span className="text-red-500">*</span>
        </label>
        <select
          id="year"
          name="year"
          value={formData.year}
          onChange={handleChange}
          required
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            formErrors.year ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
          }`}
          aria-invalid={!!formErrors.year}
          aria-describedby={formErrors.year ? 'year-error' : 'year-hint'}
        >
          <option value="">{t('listings:selectYear', 'Select Year')}</option>
          {(() => {
            const currentYear = new Date().getFullYear();
            const years = [];
            // From current year down to 1990 (no future years)
            for (let year = currentYear; year >= 1990; year--) {
              years.push(
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              );
            }
            return years;
          })()}
        </select>
        {formErrors.year && <ErrorMessage error={formErrors.year} />}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="year-hint">
          {t('listings:newListingYearHint', 'Enter manufacturing year (1990-{{currentYear}})', { currentYear: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
});

export default Step1VehicleIdentity;
