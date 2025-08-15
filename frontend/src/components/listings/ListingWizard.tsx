"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useListingData } from '@/hooks/useListingData';
import { ListingFormData } from "@/types/listings";

import { FormErrors, StepConfig } from "@/types/forms";
import { validateStep } from '@/utils/formUtils';
import SuccessAlert from '@/components/ui/SuccessAlert';
import { createLogger } from '@/utils/logger';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMemo } from 'react';
import { useDirection } from '@/utils/direction';
import { createRTLHelpers } from '@/utils/rtlHelpers';
import StepNavigation from './shared/StepNavigation';
import StepActions from './shared/StepActions';
import Step1VehicleIdentity from './steps/Step1VehicleIdentity';
import Step2VehicleDetails from './steps/Step2VehicleDetails';
import Step3ContentMedia from './steps/Step3ContentMedia';
import Step4PricingContact from './steps/Step4PricingContact';
import { useFormHandlers } from '@/hooks/form/useFormHandlers';
import { useListingDataLoader } from '@/hooks/form/useListingDataLoader';
import { useStepNavigation } from '@/hooks/form/useStepNavigation';
import { useKeyboardNavigation } from '@/hooks/form/useKeyboardNavigation';

import { ListingWizardProps } from '@/types/wizard';
import { useListingSubmission } from '@/hooks/useListingSubmission';

// Internal debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Constants
const TOTAL_STEPS = 4;
const DEFAULT_CURRENCY = "USD";
const wizardLogger = createLogger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_WIZARD === 'true',
  level: 'debug',
  prefix: 'LISTING_WIZARD'
});

export default function ListingWizard({ 
  mode, 
  listingId, 
  initialData = {}, 
  autoLoad = true,
  autoSave = true,
  showHeader = true,
  onSuccess
}: ListingWizardProps & { showHeader?: boolean }) {
  const { t, i18n, ready } = useLazyTranslation(['listings', 'common']);
  const { isRTL } = useDirection();
  const rtl = createRTLHelpers(isRTL);
  
  // Refs for keyboard navigation
  const formRef = useRef<HTMLFormElement>(null);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isLoadingData, setIsLoadingData] = useState(false);
  const [_loadError, setLoadError] = useState<string | null>(null);
  
  // Data loading hook
  const {
    governorates,
    locations,
    carMakes,
    carModels,
    transmissions,
    fuelTypes,
    isLoadingGovernorates,
    isLoadingLocations,
    isLoadingMakes,
    isLoadingModels,
    isLoadingReferenceData,
    loadCarModels,
    loadLocations,
  } = useListingData(t);
  
  // Video configuration
  const isVideoUploadEnabled = true;
  const isVideoUrlEnabled = true;
  const isAnyVideoFeatureEnabled = isVideoUploadEnabled || isVideoUrlEnabled;
  const [_error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Form data state with initial values
  const [formData, setFormData] = useState<ListingFormData>(() => ({
    id: initialData.id || "",
    title: initialData.title || "",
    description: initialData.description || "",
    make: initialData.make || "",
    model: initialData.model || "",
    year: initialData.year || "",
    price: initialData.price || "",
    currency: initialData.currency || DEFAULT_CURRENCY,
    condition: initialData.condition || "used",
    mileage: initialData.mileage || "",
    engine: initialData.engine || "",
    color: initialData.color || "",
    exteriorColor: initialData.exteriorColor || "",
    interiorColor: initialData.interiorColor || "",
    transmission: initialData.transmission || "",
    fuelType: initialData.fuelType || "",
    features: initialData.features || [],
    categoryId: initialData.categoryId || "",
    location: initialData.location || "",
    governorateSlug: initialData.governorateSlug || "",
    locationSlug: initialData.locationSlug || "",
    // Add ID fields for direct API usage
    governorateId: initialData.governorateId,
    locationId: initialData.locationId,
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
    contactName: initialData.contactName || "",
    contactPhone: initialData.contactPhone || "",
    contactEmail: initialData.contactEmail || "",
    contactPreference: initialData.contactPreference || "phone",
    images: initialData.images || [],
    videos: initialData.videos || [],
    videoUrls: initialData.videoUrls || [],
    existingImageUrls: initialData.existingImageUrls || [],
    existingVideoUrls: initialData.existingVideoUrls || [],
    status: initialData.status || 'active'
  }));

  // Auto-save functionality (only for create mode)
  const autoSaveHook = useAutoSave(formData, {
    enabled: autoSave && mode === 'create',
    mode,
    onSave: (draftId) => {
      wizardLogger.info('Auto-save completed ' + String(draftId));
    },
    onError: (autoSaveError) => {
      wizardLogger.error('Auto-save error', autoSaveError);
    }
  });

  // Step configuration
  const stepConfig = useMemo((): StepConfig[] => [
    { step: 1, title: t('listings:vehicleIdentityTitle', 'Vehicle Identity'), icon: '🚗', isComplete: currentStep > 1 },
    { step: 2, title: t('listings:vehicleDetailsTitle', 'Vehicle Details'), icon: '⚙️', isComplete: currentStep > 2 },
    { step: 3, title: t('listings:contentMediaTitle', 'Content & Media'), icon: '📝', isComplete: currentStep > 3 },
    { step: 4, title: t('listings:pricingContactTitle', 'Pricing & Contact'), icon: '💰', isComplete: currentStep > 4 }
  ], [currentStep, t]);

  // Debounced form data for expensive validations  
  const debouncedFormData = useDebounce(formData, 300);

  // Extracted field and dropdown handlers
  const { handleFieldChange, createDropdownHandler, handleMakeChange, handleGovernorateChange } = useFormHandlers({
    setFormData,
    setFormErrors,
    carMakes,
    governorates,
    locations,
    loadCarModels,
    loadLocations,
  });

  // Handler functions
  const { handleSubmit } = useListingSubmission({
    currentStep,
    totalSteps: TOTAL_STEPS,
    mode,
    listingId,
    formData,
    t,
    validateStep,
    setFormErrors,
    setCurrentStep,
    setError,
    setIsSubmitting,
    setShowSuccessAlert,
    onSuccess,
  });

  // Auto-load data and edit-mode loading
  useListingDataLoader({
    mode,
    listingId,
    autoLoad,
    ready,
    setFormData,
    setIsLoadingData,
    setLoadError,
    onAfterLoad: (data: Partial<ListingFormData>) => {
      if (data?.make && data.makeId) {
        loadCarModels(String(data.makeId)).catch(() => {});
      }
      if (data?.governorateSlug) {
        loadLocations(String(data.governorateSlug)).catch(() => {});
      }
    }
  });

  // Update form data when initialData changes (for manual data passing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && !autoLoad) {

      setFormData(prevFormData => ({
        ...prevFormData,
        ...initialData,

        images: initialData.images || prevFormData.images || [],
        videos: initialData.videos || prevFormData.videos || [],
        videoUrls: initialData.videoUrls || prevFormData.videoUrls || [],
        existingImageUrls: initialData.existingImageUrls || prevFormData.existingImageUrls || [],
        existingVideoUrls: initialData.existingVideoUrls || prevFormData.existingVideoUrls || [],
        features: initialData.features || prevFormData.features || []
      }));
    }
  }, [initialData, autoLoad]);

  // Progress calculation
  const progressPercentage = useMemo(() => {
    return (currentStep / TOTAL_STEPS) * 100;
  }, [currentStep]);

  // Step navigation and validation
  const { handleStepChange } = useStepNavigation({
    currentStep,
    totalSteps: TOTAL_STEPS,
    formData,
    debouncedFormData,
    t,
    language: i18n.language,
    validateStep,
    setFormErrors,
    setCurrentStep,
    setError,
    logger: wizardLogger,
  });

  // Keyboard navigation
  useKeyboardNavigation({ formRef });

  // Show loading if translations aren't ready
  if (!ready) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        {showHeader && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'create' ? t('listings:newListing') : t('listings:editListing')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'create' ? t('listings:newListingSubtitle') : t('listings:editListingSubtitle')}
          </p>
        </div>
        )}

        <StepNavigation
          items={stepConfig}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          progressPercentage={progressPercentage}
          showAutoSaveIndicator={mode === 'create' && autoSave}
          autoSaveStatus={autoSaveHook.autoSaveStatus}
                    lastSaved={autoSaveHook.lastSaved}
          stepCounterText={t('listings:newListingStepCounter', 'Step {{current}} of {{total}}', { current: currentStep, total: TOTAL_STEPS })}
          percentCompleteText={t('listings:progressComplete', '{{percent}}% Complete', { percent: progressPercentage })}
        />

        {/* Success Alert */}
        {showSuccessAlert && (
          <SuccessAlert
            message={mode === 'create' ? t('listings:listingCreatedMessage') : t('listings:listingUpdatedMessage')}
            visible={showSuccessAlert}
            onComplete={() => setShowSuccessAlert(false)}
          />
        )}

        {/* Form Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* Step 1: Vehicle Identity */}
            {currentStep === 1 && (
              <Step1VehicleIdentity
                formData={formData}
                formErrors={formErrors}
                carMakes={carMakes}
                carModels={carModels}
                isLoadingMakes={isLoadingMakes}
                isLoadingModels={isLoadingModels}
                onMakeChange={handleMakeChange}
                onModelChange={createDropdownHandler('model', 'modelId', carModels)}
                onYearChange={handleFieldChange('year') as unknown as (e: React.ChangeEvent<HTMLSelectElement>) => void}
              />
            )}

            {/* Step 2: Vehicle Details */}
            {currentStep === 2 && (
              <Step2VehicleDetails
                formData={formData}
                formErrors={formErrors}
                transmissions={transmissions}
                fuelTypes={fuelTypes}
                isLoadingReferenceData={isLoadingReferenceData}
                onMileageChange={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
                onEngineChange={handleFieldChange('engine') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
                onTransmissionChange={createDropdownHandler('transmission', 'transmissionId', transmissions) as unknown as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                onColorChange={handleFieldChange('color') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
                onFuelTypeChange={createDropdownHandler('fuelType', 'fuelTypeId', fuelTypes) as unknown as (e: React.ChangeEvent<HTMLSelectElement>) => void}
              />
            )}

            {/* Step 3: Content & Media */}
            {currentStep === 3 && (
              <Step3ContentMedia
                formData={formData}
                formErrors={formErrors}
                isRTL={isRTL}
                isAnyVideoFeatureEnabled={isAnyVideoFeatureEnabled}
                isVideoUploadEnabled={isVideoUploadEnabled}
                isVideoUrlEnabled={isVideoUrlEnabled}
                onTitleChange={handleFieldChange('title') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
                onDescriptionChange={handleFieldChange('description') as unknown as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              />
            )}

            {/* Step 4: Pricing & Contact */}
            {currentStep === 4 && (
              <Step4PricingContact
                formData={formData}
                formErrors={formErrors}
                governorates={governorates}
                locations={locations}
                isLoadingGovernorates={isLoadingGovernorates}
                isLoadingLocations={isLoadingLocations}
                isRTL={isRTL}
                onPriceChange={handleFieldChange('price') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
                onCurrencyChange={handleFieldChange('currency') as unknown as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                onGovernorateChange={handleGovernorateChange}
                onLocationChange={createDropdownHandler('locationSlug', 'locationId', locations) as unknown as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                onContactNameChange={handleFieldChange('contactName') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
                onContactPhoneChange={handleFieldChange('contactPhone') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
                onContactEmailChange={handleFieldChange('contactEmail') as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void}
              />
            )}

            {/* Form Navigation (sticky on mobile) */}
            <StepActions
              isFirstStep={currentStep === 1}
              isLastStep={currentStep === TOTAL_STEPS}
              isSubmitting={isSubmitting}
              onPrev={(e) => handleStepChange(currentStep - 1, e)}
              onNext={(e) => handleStepChange(currentStep + 1, e)}
              submitButtonText={mode === 'edit' ? t('listings:updateListing', 'Update Listing') : t('listings:createListing', 'Create Listing')}
              previousText={t('common:previous')}
              nextText={t('common:next')}
              leftArrowPath={rtl.arrows.leftArrow}
              rightArrowPath={rtl.arrows.rightArrow}
              rtlSpacing={rtl.spacing}
            />
          </form>
        </div>
      </div>
    </div>
  );
};
