"use client";

import React, { memo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { Governorate } from '@/services/api';
import { Location } from '@/services/locations';
import ErrorMessage from '../shared/ErrorMessage';
import StepHeader from '../shared/StepHeader';
import { SelectWithArrow } from '../../ui/SelectWithArrow';

interface Step4Props {
  formData: ListingFormData;
  formErrors: FormErrors;
  governorates: Governorate[];
  locations: Location[];
  isLoadingGovernorates: boolean;
  isLoadingLocations: boolean;
  isRTL: boolean;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCurrencyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onGovernorateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onLocationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onContactNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContactPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContactEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Step4PricingContact = memo(function Step4PricingContact({
  formData,
  formErrors,
  governorates,
  locations,
  isLoadingGovernorates,
  isLoadingLocations,
  isRTL,
  onPriceChange,
  onCurrencyChange,
  onGovernorateChange,
  onLocationChange,
  onContactNameChange,
  onContactPhoneChange,
  onContactEmailChange
}: Step4Props) {
  const { i18n, t } = useLazyTranslation(['listings']);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Live region for validation feedback (accessibility) */}
      <div className="sr-only" aria-live="polite" role="status">
        {Object.values(formErrors).filter(Boolean).join('. ')}
      </div>
      
      <StepHeader
        title={t('listings:pricingContactTitle', 'Pricing & Contact')}
        subtitle={t('listings:pricingContactSubtitle', 'Set your price and contact information')}
      />

      {/* Pricing Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          {t('listings:newListingPricing', 'Pricing Information')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price */}
          <div className="space-y-3">
            <label 
              htmlFor="price" 
              className="block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {t('listings:newListingPrice', 'Price')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={onPriceChange}
                data-testid="price"
                className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  formErrors.price ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder={t('listings:newListingPricePlaceholder', '25000')}
                aria-invalid={!!formErrors.price}
                aria-describedby={formErrors.price ? 'price-error' : 'price-hint'}
              />
              {/* Status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {formErrors.price ? (
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : formData.price ? (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            <ErrorMessage error={formErrors.price} id="price-error" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="price-hint">
              {t('listings:newListingPriceHint', 'Enter the asking price for your vehicle')}
            </p>
          </div>

          {/* Currency */}
          <div className="space-y-3">
            <label 
              htmlFor="currency" 
              className="block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {t('listings:newListingCurrency', 'Currency')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <SelectWithArrow
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={onCurrencyChange}
                isRTL={isRTL}
                data-testid="currency"
                className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  formErrors.currency ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                }`}
                aria-invalid={!!formErrors.currency}
                aria-describedby={formErrors.currency ? 'currency-error' : 'currency-hint'}
              >
                <option value="SYP">{t('listings:currencySYP', 'Syrian Pound (SYP)')}</option>
                <option value="USD">{t('listings:currencyUSD', 'US Dollar (USD)')}</option>
              </SelectWithArrow>
              {/* Status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {formErrors.currency ? (
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : formData.currency ? (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            <ErrorMessage error={formErrors.currency} id="currency-error" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="currency-hint">
              {t('listings:newListingCurrencyHint', 'Select the currency for your price')}
            </p>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          {t('listings:newListingLocationInfo', 'Location Information')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Governorate */}
          <div className="space-y-3">
            <label 
              htmlFor="governorateSlug" 
              className="block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {t('listings:newListingGovernorate', 'Governorate')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <SelectWithArrow
                id="governorateSlug"
                name="governorateSlug"
                value={formData.governorateSlug}
                onChange={onGovernorateChange}
                disabled={isLoadingGovernorates}
                isLoading={isLoadingGovernorates}
                isRTL={isRTL}
                data-testid="governorateSlug"
                className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  formErrors.governorateSlug ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                } ${isLoadingGovernorates ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-invalid={!!formErrors.governorateSlug}
                aria-describedby={formErrors.governorateSlug ? 'governorateSlug-error' : 'governorateSlug-hint'}
              >
                <option value="">
                  {isLoadingGovernorates 
                    ? t('listings:newListingLoadingGovernorates', 'Loading governorates...') 
                    : t('listings:newListingSelectGovernorate', 'Select a governorate')
                  }
                </option>
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.slug}>
                    {i18n.language === 'ar' ? gov.displayNameAr : gov.displayNameEn}
                  </option>
                ))}
              </SelectWithArrow>
              {/* Status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {formErrors.governorateSlug ? (
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : formData.governorateSlug ? (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            <ErrorMessage error={formErrors.governorateSlug} id="governorateSlug-error" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="governorateSlug-hint">
              {t('listings:newListingGovernorateHint', 'Select the governorate where the car is located')}
            </p>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label 
              htmlFor="locationSlug" 
              className="block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {t('listings:newListingLocation', 'Location')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <SelectWithArrow
                id="locationSlug"
                name="locationSlug"
                value={formData.locationSlug}
                onChange={onLocationChange}
                disabled={isLoadingLocations || !formData.governorateSlug || formData.governorateSlug.trim() === ''}
                isLoading={isLoadingLocations}
                isRTL={isRTL}
                data-testid="locationSlug"
                className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  formErrors.locationSlug ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                } ${(isLoadingLocations || !formData.governorateSlug || formData.governorateSlug.trim() === '') ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-invalid={!!formErrors.locationSlug}
                aria-describedby={formErrors.locationSlug ? 'locationSlug-error' : 'locationSlug-hint'}
              >
                <option value="">
                  {!formData.governorateSlug || formData.governorateSlug.trim() === ''
                    ? t('listings:newListingSelectGovernorateFirst', 'Select governorate first')
                    : isLoadingLocations 
                      ? t('listings:newListingLoadingLocations', 'Loading locations...')
                      : t('listings:newListingSelectLocation', 'Select a location')
                  }
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.slug}>
                    {i18n.language === 'ar' ? loc.displayNameAr : loc.displayNameEn}
                  </option>
                ))}
              </SelectWithArrow>
              {/* Status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {formErrors.locationSlug ? (
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : formData.locationSlug ? (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : !formData.governorateSlug ? (
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            <ErrorMessage error={formErrors.locationSlug} id="locationSlug-error" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="locationSlug-hint">
              {t('listings:newListingLocationHint', 'Select the specific location within the governorate')}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          {t('listings:newListingContactInfo', 'Contact Information')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Name */}
          <div className="space-y-3">
            <label 
              htmlFor="contactName" 
              className="block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {t('listings:newListingContactName', 'Contact Name')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={onContactNameChange}
                data-testid="contactName"
                className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  formErrors.contactName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder={t('listings:newListingContactNamePlaceholder', 'Your full name')}
                aria-invalid={!!formErrors.contactName}
                aria-describedby={formErrors.contactName ? 'contactName-error' : 'contactName-hint'}
              />
              {/* Status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {formErrors.contactName ? (
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : formData.contactName ? (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            <ErrorMessage error={formErrors.contactName} id="contactName-error" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="contactName-hint">
              {t('listings:newListingContactNameHint', 'Name for potential buyers to contact')}
            </p>
          </div>

          {/* Contact Phone */}
          <div className="space-y-3">
            <label 
              htmlFor="contactPhone" 
              className="block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {t('listings:newListingContactPhone', 'Contact Phone')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={onContactPhoneChange}
                data-testid="contactPhone"
                inputMode="numeric"
                autoComplete="tel"
                pattern="^[0-9]{6,15}$"
                minLength={6}
                maxLength={15}
                className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  formErrors.contactPhone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder={t('listings:newListingContactPhonePlaceholder', 'e.g., 96512345678')}
                aria-invalid={!!formErrors.contactPhone}
                aria-describedby={formErrors.contactPhone ? 'contactPhone-error' : 'contactPhone-hint'}
              />
              {/* Status icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {formErrors.contactPhone ? (
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                ) : formData.contactPhone ? (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            </div>
            <ErrorMessage error={formErrors.contactPhone} id="contactPhone-error" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="contactPhone-hint">
              {t('listings:newListingContactPhoneHint', 'Phone number for inquiries')}
            </p>
          </div>
        </div>

        {/* Contact Email */}
        <div className="space-y-3">
          <label 
            htmlFor="contactEmail" 
            className="block text-sm font-bold text-gray-700 dark:text-gray-300"
          >
            {t('listings:newListingContactEmail', 'Contact Email')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={onContactEmailChange}
              data-testid="contactEmail"
              required
              className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                formErrors.contactEmail ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
              }`}
              placeholder={t('listings:newListingContactEmailPlaceholder', 'your.email@example.com')}
              aria-invalid={!!formErrors.contactEmail}
              aria-describedby={formErrors.contactEmail ? 'contactEmail-error' : 'contactEmail-hint'}
            />
            {/* Status icon */}
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              {formErrors.contactEmail ? (
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              ) : formData.contactEmail ? (
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              ) : null}
            </div>
          </div>
          <ErrorMessage error={formErrors.contactEmail} id="contactEmail-error" />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="contactEmail-hint">
            {t('listings:newListingContactEmailHint', 'Email address for inquiries')}
          </p>
        </div>
      </div>

      {/* Bottom spacing to separate from navigation buttons */}
      <div className="pb-8"></div>
    </div>
  );
});

export default Step4PricingContact;
