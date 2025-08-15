"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useListingData } from '@/hooks/useListingData';
import { ListingFormData } from "@/types/listings";

import { FormErrors, StepConfig } from "@/types/forms";
import { ListingDataService as _ListingDataService } from '@/services/ListingDataService';
// SUPPORTED_CURRENCIES removed - not used in this component
import { validateStep } from '@/utils/formUtils';
import SuccessAlert from '@/components/ui/SuccessAlert';
import { createLogger } from '@/utils/logger';
// NumericInput now used inside Step2VehicleDetails
// AutoSaveIndicator used via StepNavigation
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMemo as useMemoPerf } from 'react';
import { useDirection } from '@/utils/direction';
import { createRTLHelpers } from '@/utils/rtlHelpers';
// Media utils are now handled within media components
// Media sections are used inside Step3ContentMedia
// import { SelectWithArrow } from '../ui/SelectWithArrow';
// import StepHeader from './shared/StepHeader';
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

// Performance optimized debounce hook
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

// Optimized throttle hook for frequent operations
// useThrottle utility not used in this component anymore
import { ListingWizardProps } from '@/types/wizard';
// import ErrorMessage from './shared/ErrorMessage';
import { useListingSubmission } from '@/hooks/useListingSubmission';

// Constants
const TOTAL_STEPS = 4;
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
const wizardLogger = createLogger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_WIZARD === 'true',
  level: 'debug',
  prefix: 'LISTING_WIZARD'
});
const DEFAULT_CURRENCY = "USD";

// ErrorMessage moved to shared component

// Image preview moved into ImageUploadSection

// Loading fallback component for lazy-loaded steps
const _StepLoadingFallback = memo(function StepLoadingFallback() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
});

// Note: Lazy step components removed for now to fix build issues
// Will be implemented in future code splitting phase when step components are created

// Virtualized select removed from this component (out of scope here)

// Upload Progress Component removed - not used in current implementation

export default function ListingWizard({ 
  mode, 
  listingId, 
  initialData = {}, 
  autoLoad = true,
  autoSave = true,
  showHeader = true,
  onSuccess, 
  onCancel: _onCancel 
}: ListingWizardProps & { showHeader?: boolean }) {
  const _router = useRouter();
  const { t, i18n, ready } = useLazyTranslation(['listings', 'common']);
  const { isRTL } = useDirection();
  const rtl = createRTLHelpers(isRTL);
  
  // Refs for keyboard navigation
  const formRef = useRef<HTMLFormElement>(null);
  const _previousButtonRef = useRef<HTMLButtonElement>(null);
  const _nextButtonRef = useRef<HTMLButtonElement>(null);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isLoadingData, setIsLoadingData] = useState(false);
  const [_loadError, setLoadError] = useState<string | null>(null);
  const [_showVideoUpload, _setShowVideoUpload] = useState(false);
  const [_showVideoUrl, _setShowVideoUrl] = useState(false);
  
  // Use the extracted data loading hook
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
    clearModels: _clearModels,
    clearLocations: _clearLocations
  } = useListingData(t);
  

  
  // Media-related UI state is fully handled by ImageUploadSection/VideoUploadSection
  
  // Video configuration - can be moved to environment variables later
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
    onError: (_error) => {
      wizardLogger.error('Auto-save error');
    }
  });

  // Car features removed - not used in current implementation

  // Optimized step configuration with stable references
  const stepConfig = useMemoPerf((): StepConfig[] => [
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

  // Auto-load data and edit-mode loading extracted
  useListingDataLoader({
    mode,
    listingId,
    autoLoad,
    ready,
    setFormData,
    setIsLoadingData,
    setLoadError,
    onAfterLoad: (data: Partial<ListingFormData>) => {
      // After setting form data in edit mode, trigger dependent loads
      if (data && data.make && data.makeId && loadCarModels) {
        loadCarModels(String(data.makeId)).catch(() => {});
      }
      if (data && data.governorateSlug && loadLocations) {
        loadLocations(String(data.governorateSlug)).catch(() => {});
      }
    }
  });

  // V2: Complex conversion logic removed! 
  // The enhanced backend now provides complete objects with IDs and slugs directly
  // No more complex useEffect for display name to slug/ID conversion needed ✅

  // Update form data when initialData changes (for manual data passing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && !autoLoad) {
      wizardLogger.debug('Updating form data with manual initialData');
      setFormData(prevFormData => ({
        ...prevFormData,
        ...initialData,
        // Ensure arrays are properly handled
        images: initialData.images || prevFormData.images || [],
        videos: initialData.videos || prevFormData.videos || [],
        videoUrls: initialData.videoUrls || prevFormData.videoUrls || [],
        existingImageUrls: initialData.existingImageUrls || prevFormData.existingImageUrls || [],
        existingVideoUrls: initialData.existingVideoUrls || prevFormData.existingVideoUrls || [],
        features: initialData.features || prevFormData.features || []
      }));
    }
  }, [initialData, autoLoad]);

  // Data loading is now handled by useListingData hook



  // handleCancel removed - not used in current implementation

  // Enhanced handler for location changes - slug-based approach
  const _handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlug = e.target.value;
    wizardLogger.debug('Location dropdown changed to slug ' + selectedSlug);
    
    // Find the location object to get all its properties
    const selectedLocation = locations.find(loc => loc.slug === selectedSlug);
    
    if (selectedLocation) {
      const locationDisplayName = i18n.language === 'ar' 
        ? selectedLocation.displayNameAr 
        : selectedLocation.displayNameEn;
        
      wizardLogger.debug('Updating location via slug');
      
      setFormData(prev => ({
        ...prev,
        locationId: selectedLocation.id,       // Primary ID for API calls
        locationSlug: selectedLocation.slug,   // For URL generation
        location: locationDisplayName          // For display
      }));
      
      // Clear any existing errors
      if (formErrors.locationSlug) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.locationSlug;
          return newErrors;
        });
      }
    } else if (selectedSlug === '') {
      wizardLogger.debug('Location cleared');
      // Handle empty selection
      setFormData(prev => ({
        ...prev,
        locationId: undefined,
        locationSlug: '',
        location: ''
      }));
    } else {
      wizardLogger.warn('Location not found for slug');
    }
  }, [locations, i18n.language, formErrors.locationSlug]);



  // Optimized progress calculation with memoization
  const progressPercentage = useMemoPerf(() => {
    return (currentStep / TOTAL_STEPS) * 100;
  }, [currentStep]);





  // Edit-mode data load is handled in useListingDataLoader

  // Duplicate models loading removed - now handled by extracted hook above

  // Existing media previews are handled inside media components now

  // Optimized step accessibility check with debounced validation
  const { isStepAccessible: _isStepAccessible, handleValidationErrors: _handleValidationErrors, handleStepChange } = useStepNavigation({
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

  // handlePreviousStep removed - not used in current implementation

  // Image upload handled inside ImageUploadSection

  // Image remove/reorder handled inside ImageUploadSection

  // DnD upload handled inside ImageUploadSection

  // Image reorder handled inside ImageUploadSection

  // Video upload handled inside VideoUploadSection

  // Video removal handled inside VideoUploadSection

  // addVideoUrl removed - not used in current implementation

  // Video URL removal handled inside VideoUploadSection

  // Video URL change handled inside VideoUploadSection

  // Video embed handled inside VideoUploadSection

  // Object URL lifecycle handled inside media components

  // Keyboard tab-trap
  useKeyboardNavigation({ formRef, focusableSelector: FOCUSABLE_SELECTOR });

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
