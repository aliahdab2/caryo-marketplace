"use client";

import React from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useDirection } from '@/utils/direction';
import StepHeader from '../shared/StepHeader';
import { SelectWithArrow } from '../../ui/SelectWithArrow';
import NumericInput from '@/components/ui/NumericInput';
import ErrorMessage from '../shared/ErrorMessage';

type ReferenceOption = {
  id: number;
  slug: string;
  displayNameAr: string;
  displayNameEn: string;
};

export interface Step2VehicleDetailsProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  transmissions: ReferenceOption[];
  fuelTypes: ReferenceOption[];
  isLoadingReferenceData?: boolean;
  onMileageChange: (value: string) => void;
  onEngineChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTransmissionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFuelTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Step2VehicleDetails: React.FC<Step2VehicleDetailsProps> = ({
  formData,
  formErrors,
  transmissions,
  fuelTypes,
  isLoadingReferenceData = false,
  onMileageChange,
  onEngineChange,
  onTransmissionChange,
  onColorChange,
  onFuelTypeChange,
}) => {
  const { t, i18n } = useLazyTranslation(['listings']);
  const { isRTL } = useDirection();

  return (
    <div className="space-y-8 animate-fadeIn">
      <StepHeader
        title={t('listings:vehicleDetailsTitle', 'Vehicle Details')}
        subtitle={t('listings:vehicleDetailsSubtitle', "Tell us more about your vehicle's condition and features")}
      />

      {/* Mileage */}
      <div className="space-y-3">
        <label 
          htmlFor="mileage" 
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {t('listings:newListingMileage', 'Mileage')}
        </label>
        <NumericInput
          id="mileage"
          name="mileage"
          value={formData.mileage}
          onChange={onMileageChange}
          data-testid="mileage"
          placeholder={t('listings:newListingMileagePlaceholder', '50000')}
          error={!!formErrors.mileage}
          aria-describedby="mileage-hint"
          className="w-full px-4 py-2 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        />
        {formErrors.mileage && <ErrorMessage error={formErrors.mileage} />}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="mileage-hint">
          {t('listings:newListingMileageHint', 'Total kilometers driven')}
        </p>
      </div>

      {/* Engine and Transmission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engine */}
        <div className="space-y-3">
          <label 
            htmlFor="engine" 
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {t('listings:newListingEngine', 'Engine')}
          </label>
          <input
            type="text"
            id="engine"
            name="engine"
            value={formData.engine}
            onChange={onEngineChange}
            data-testid="engine"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            placeholder={t('listings:newListingEnginePlaceholder', 'e.g., 2.0L Turbo, V6, Hybrid')}
            aria-describedby="engine-hint"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="engine-hint">
            {t('listings:newListingEngineHint', 'Engine type and size')}
          </p>
        </div>

        {/* Transmission */}
        <div className="space-y-3">
          <label 
            htmlFor="transmission" 
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {t('listings:newListingTransmission', 'Transmission')}
          </label>
          <SelectWithArrow
            id="transmission"
            name="transmission"
            value={formData.transmission}
            onChange={onTransmissionChange}
            data-testid="transmission"
            disabled={isLoadingReferenceData}
            isLoading={isLoadingReferenceData}
            isRTL={isRTL}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              formErrors.transmission ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            } ${isLoadingReferenceData ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-invalid={!!formErrors.transmission}
            aria-describedby={formErrors.transmission ? 'transmission-error' : 'transmission-hint'}
          >
            <option value="">
              {isLoadingReferenceData 
                ? t('listings:loadingTransmissions', 'Loading transmissions...') 
                : t('listings:newListingTransmissionSelect', 'Select transmission type')
              }
            </option>
            {transmissions.map((transmission) => (
              <option key={transmission.id} value={transmission.slug}>
                {i18n.language === 'ar' ? transmission.displayNameAr : transmission.displayNameEn}
              </option>
            ))}
          </SelectWithArrow>
          {formErrors.transmission && <ErrorMessage error={formErrors.transmission} />}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="transmission-hint">
            {t('listings:newListingTransmissionHint', 'Type of transmission')}
          </p>
        </div>
      </div>

      {/* Color and Fuel Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color */}
        <div className="space-y-3">
          <label 
            htmlFor="color" 
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {t('listings:newListingColor', 'Color')}
          </label>
          <input
            type="text"
            id="color"
            name="color"
            value={formData.color}
            onChange={onColorChange}
            data-testid="color"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            placeholder={t('listings:newListingColorPlaceholder', 'e.g., White, Black, Silver')}
            aria-describedby="color-hint"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="color-hint">
            {t('listings:newListingColorHint', 'Exterior color of the car')}
          </p>
        </div>

        {/* Fuel Type */}
        <div className="space-y-3">
          <label 
            htmlFor="fuelType" 
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {t('listings:newListingFuelType', 'Fuel Type')}
          </label>
          <SelectWithArrow
            id="fuelType"
            name="fuelType"
            value={formData.fuelType}
            onChange={onFuelTypeChange}
            data-testid="fuelType"
            disabled={isLoadingReferenceData}
            isLoading={isLoadingReferenceData}
            isRTL={isRTL}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              formErrors.fuelType ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            } ${isLoadingReferenceData ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-invalid={!!formErrors.fuelType}
            aria-describedby={formErrors.fuelType ? 'fuelType-error' : 'fuelType-hint'}
          >
            <option value="">
              {isLoadingReferenceData 
                ? t('listings:loadingFuelTypes', 'Loading fuel types...') 
                : t('listings:newListingFuelTypeSelect', 'Select fuel type')
              }
            </option>
            {fuelTypes.map((fuelType) => (
              <option key={fuelType.id} value={fuelType.slug}>
                {i18n.language === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn}
              </option>
            ))}
          </SelectWithArrow>
          {formErrors.fuelType && <ErrorMessage error={formErrors.fuelType} />}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="fuelType-hint">
            {t('listings:newListingFuelTypeHint', 'Type of fuel or power source')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step2VehicleDetails;

