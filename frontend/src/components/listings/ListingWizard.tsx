"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useListingData } from '@/hooks/useListingData';
import { createListing, updateListing, uploadListingImage } from '@/services/listings';
import { ListingFormData, UpdateListingData } from "@/types/listings";

import { FormErrors, StepConfig } from "@/types/forms";
import { ListingDataService } from '@/services/ListingDataService';
// SUPPORTED_CURRENCIES removed - not used in this component
import { validateStep } from '@/utils/formUtils';
import SuccessAlert from '@/components/ui/SuccessAlert';
import { createLogger } from '@/utils/logger';
// NumericInput now used inside Step2VehicleDetails
// AutoSaveIndicator used via StepNavigation
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMemo as useMemoPerf, useCallback as useCallbackPerf } from 'react';
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

  // Simple unified handler for text fields
  const handleFieldChange = useCallback((field: keyof ListingFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };
  }, []);

  // Reusable dropdown factory for slug+ID pattern
  const createDropdownHandler = useCallback((
    slugField: keyof ListingFormData,
    idField: keyof ListingFormData,
    dataArray: Array<{ id: number; slug: string }>
  ) => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const selectedItem = value ? dataArray.find(item => item.slug === value) : null;
      
      setFormData(prev => ({
        ...prev,
        [slugField]: value,
        [idField]: selectedItem?.id
      }));
    };
  }, []);

  // Special handlers for fields that need additional logic
  const handleMakeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedMake = value ? carMakes.find(make => make.slug === value) : null;
    
    setFormData(prev => ({ 
      ...prev, 
      make: value,
      makeId: selectedMake?.id,
      // Clear model when make changes
      ...(value !== prev.make ? { model: '', modelId: undefined } : {})
    }));
    
    // Load models when make changes - use prev value instead of formData to avoid stale closure
    if (selectedMake && loadCarModels) {
      loadCarModels(selectedMake.id.toString()).catch(error => {
        wizardLogger.error('Failed to load car models:', error);
        // Set error state to show user-friendly message
        setFormErrors(prev => ({ ...prev, model: 'Failed to load car models. Please try again.' }));
      });
    }
  }, [carMakes, loadCarModels]); // Remove formData.make dependency

  const handleGovernorateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedGovernorate = value ? governorates.find(gov => gov.slug === value) : null;
    
    setFormData(prev => ({ 
      ...prev, 
      governorateSlug: value,
      governorateId: selectedGovernorate?.id,
      // Clear location when governorate changes
      ...(value !== prev.governorateSlug ? { locationSlug: '', locationId: undefined } : {})
    }));
    
    // Load locations when governorate changes - use value directly to avoid stale closure
    if (value && loadLocations) {
      loadLocations(value).catch(error => {
        wizardLogger.error('Failed to load locations:', error);
        // Set error state to show user-friendly message
        setFormErrors(prev => ({ ...prev, locationSlug: 'Failed to load locations. Please try again.' }));
      });
    }
  }, [governorates, loadLocations]); // Remove formData.governorateSlug dependency

  // Handler functions
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    wizardLogger.debug('Form submit triggered ' + JSON.stringify({ currentStep, mode }));
    wizardLogger.debug('TOTAL_STEPS constant ' + String(TOTAL_STEPS));
    wizardLogger.debug('currentStep === TOTAL_STEPS? ' + String(currentStep === TOTAL_STEPS));

    // IMPORTANT: Only process actual final submissions, not navigation
    // The submit event should only fire when clicking the Submit button on step 4
    if (currentStep !== TOTAL_STEPS) {
      wizardLogger.debug('Ignoring submit - not final step ' + JSON.stringify({ currentStep, TOTAL_STEPS }));
      return;
    }

    wizardLogger.info('Processing final submission (step 4)');

    // For final submission (step 4), validate ALL steps
    if (currentStep === TOTAL_STEPS) {
      wizardLogger.debug('Final submission - validating ALL steps');
      
      // Validate all steps for final submission
      let allErrors: FormErrors = {};
      for (let step = 1; step <= TOTAL_STEPS; step++) {
        const stepErrors = validateStep(step, formData, t);
        allErrors = { ...allErrors, ...stepErrors };
        wizardLogger.debug(`Step ${step} validation errors ${JSON.stringify(stepErrors)}`);
      }
      
      wizardLogger.debug('All validation errors ' + JSON.stringify(allErrors));
      if (Object.keys(allErrors).length > 0) {
        wizardLogger.info('Final validation failed, stopping submission');
        setFormErrors(allErrors);
        return;
      }
      wizardLogger.info('All validation passed!');
    } else {
      // Validate current step only for navigation
      wizardLogger.debug('Validating step ' + String(currentStep));
      const stepErrors = validateStep(currentStep, formData, t, { mode: 'navigation' });
      // If only non-blocking fields failed (e.g., title/price on step 1 due to previous state), clear them for navigation
      if (currentStep === 1 && Object.keys(stepErrors).length > 0) {
        const blockingKeys = ['make','model','year'];
        const nonBlockingOnly = Object.keys(stepErrors).every(k => !blockingKeys.includes(k));
        if (nonBlockingOnly) {
          wizardLogger.debug('Non-blocking errors on step 1 ignored for navigation');
          setFormErrors({});
          setCurrentStep(prev => prev + 1);
          return;
        }
      }
      wizardLogger.debug('Validation errors ' + JSON.stringify(stepErrors));
      if (Object.keys(stepErrors).length > 0) {
        wizardLogger.info('Validation failed, stopping submission');
        setFormErrors(stepErrors);
        return;
      }
    }
    wizardLogger.info('Validation passed, proceeding...');

    // Clear errors for valid step
    setFormErrors({});

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Submit the form (final step)
    try {
      setIsSubmitting(true);
      
      if (mode === 'create') {
        const result = await createListing(formData);
        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      } else if (mode === 'edit' && listingId) {
        wizardLogger.info('Starting update for listing ' + String(listingId));
        wizardLogger.debug('[ListingWizard] Form data before update:', {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          mileage: formData.mileage,
          transmission: formData.transmission,
          currency: formData.currency,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          location: formData.location,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          contactName: formData.contactName
        });

        // V2: Enhanced backend provides all IDs directly - no conversion needed!
        wizardLogger.debug('Using direct IDs from enhanced form data:', {
          makeId: formData.makeId,
          modelId: formData.modelId,
          transmissionId: formData.transmissionId,
          fuelTypeId: formData.fuelTypeId,
          locationId: formData.locationId,
          governorateId: formData.governorateId
        });
        
        const locationId = formData.locationId;
        const _governorateId = formData.governorateId;
        
        // V2: Use IDs directly - no conversion needed! Enhanced backend provides all IDs
        const updateData: UpdateListingData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          
          // V2: Direct ID usage - no slug-to-ID conversion needed!
          transmissionId: formData.transmissionId,
          fuelTypeId: formData.fuelTypeId,
          modelId: formData.modelId,
          
          currency: formData.currency,
          modelYear: formData.year ? parseInt(formData.year) : undefined,
          locationId: locationId, // Direct from form state
          
          // V3: Include contact fields in update
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          contactPreference: formData.contactPreference,
        };
        
        // Remove undefined values to avoid sending null data
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof UpdateListingData] === undefined) {
            delete updateData[key as keyof UpdateListingData];
          }
        });
        
        wizardLogger.debug('Update payload ' + JSON.stringify(updateData));
        wizardLogger.debug('locationId in update data ' + String(updateData.locationId));
        wizardLogger.debug('Fields being updated ' + JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          mileage: formData.mileage,
          transmission: formData.transmission,
          currency: formData.currency,
          year: formData.year,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          location: formData.location,
          governorateSlug: formData.governorateSlug,
          locationSlug: formData.locationSlug
        }));
        
        const result = await updateListing(listingId, updateData);
        wizardLogger.info('Update successful');
        
        // Handle image uploads for edit mode
        if (formData.images && formData.images.length > 0) {
          wizardLogger.info(`Uploading ${formData.images.length} new images for listing ${listingId}`);
          
          try {
            // Filter out any undefined/invalid images and upload valid ones
            const validImages = formData.images.filter(image => image && image instanceof File);
            
            if (validImages.length === 0) {
              wizardLogger.debug('No valid images to upload');
            } else {
              // Upload new images one by one (API limitation: one image per request)
              for (let i = 0; i < validImages.length; i++) {
                const image = validImages[i];
                wizardLogger.debug(`Uploading image ${i + 1}/${validImages.length}: ${image.name}`);
                
                const uploadResult = await uploadListingImage(listingId, image);
                wizardLogger.debug(`Image upload successful: ${uploadResult.imageKey}`);
              }
            }
            
            wizardLogger.info('All images uploaded successfully');
          } catch (imageError) {
            wizardLogger.error('Error uploading images:', imageError);
            // Don't fail the entire update if image upload fails
            // But inform the user
            setError(`Listing updated successfully, but there was an error uploading images: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
          }
        }
        
        // Note: Contact information (email, phone, name) is tied to the user account
        // and cannot be updated via the listing update API. Users need to update
        // their profile information separately.
        wizardLogger.info('Note: Contact info updates require separate profile API calls');
        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      }
    } catch (error) {
      wizardLogger.error('Error during submission');
      setError(error instanceof Error ? error.message : t('common:unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, t, mode, listingId, onSuccess]);

  // Auto-load data based on mode and autoLoad prop
  useEffect(() => {
    const loadData = async () => {
      if (!autoLoad || !ready) return;

      try {
        setIsLoadingData(true);
        setLoadError(null);
        
        wizardLogger.debug('[ListingWizard] Auto-loading data for mode:', mode, 'listingId:', listingId);
        const loadedData = await ListingDataService.loadFormData(mode, listingId);
        
        setFormData(prevFormData => ({
          ...prevFormData,
          ...loadedData,
          // Ensure arrays are properly handled
          images: loadedData.images || prevFormData.images || [],
          videos: loadedData.videos || prevFormData.videos || [],
          videoUrls: loadedData.videoUrls || prevFormData.videoUrls || [],
          existingImageUrls: loadedData.existingImageUrls || prevFormData.existingImageUrls || [],
          existingVideoUrls: loadedData.existingVideoUrls || prevFormData.existingVideoUrls || [],
          features: loadedData.features || prevFormData.features || []
        }));
        
        wizardLogger.debug('[ListingWizard] Data auto-loaded successfully');
      } catch (error) {
        wizardLogger.error('Error auto-loading data');
        setLoadError(error instanceof Error ? error.message : 'Failed to load listing data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [mode, listingId, autoLoad, ready]);

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





  // Load existing listing data for edit mode
  useEffect(() => {
    if (autoLoad && mode === 'edit' && listingId && ready) {
      const loadEditData = async () => {
        try {
          setIsLoadingData(true);
          setLoadError(null);
          wizardLogger.info(`Loading edit data for listing ID: ${listingId}`);
          
          const data = await ListingDataService.loadFormData(mode, listingId);
          setFormData(prev => ({ ...prev, ...data }));
          
          // After setting form data, trigger model loading if make is present
          if (data.make && data.makeId) {
            wizardLogger.debug(`Edit mode: Loading models for make: ${data.make} (ID: ${data.makeId})`);
            loadCarModels(data.makeId.toString()).catch(error => {
              wizardLogger.error('Failed to load car models in edit mode:', error);
            });
          }
          
          // Also trigger location loading if governorate is present
          if (data.governorateSlug) {
            wizardLogger.debug(`Edit mode: Loading locations for governorate: ${data.governorateSlug}`);
            loadLocations(data.governorateSlug).catch(error => {
              wizardLogger.error('Failed to load locations in edit mode:', error);
            });
          }
          
          wizardLogger.info('Edit data loaded successfully');
        } catch (error) {
          wizardLogger.error('Failed to load edit data:', error);
          setLoadError(error instanceof Error ? error.message : 'Failed to load listing data');
          setError(t('common:failedToLoadData'));
        } finally {
          setIsLoadingData(false);
        }
      };
      
      loadEditData();
    }
  }, [autoLoad, mode, listingId, ready, loadCarModels, loadLocations, t]);

  // Duplicate models loading removed - now handled by extracted hook above

  // Existing media previews are handled inside media components now

  // Optimized step accessibility check with debounced validation
  const isStepAccessible = useCallbackPerf((targetStep: number) => {
    wizardLogger.debug(`isStepAccessible targetStep=${targetStep} currentStep=${currentStep}`);
    
    // Always allow going to previous steps
    if (targetStep <= currentStep) {
      wizardLogger.debug(`Step ${targetStep} is accessible`);
      return true;
    }
    
    // For next step, validate all previous steps using debounced data
    for (let step = 1; step < targetStep; step++) {
      wizardLogger.debug(`Validating step ${step} for accessibility`);
      const stepErrors = validateStep(step, debouncedFormData, t, { mode: 'accessibility' });
      wizardLogger.debug(`Step ${step} validation errors ${JSON.stringify(stepErrors)}`);
      if (Object.keys(stepErrors).length > 0) {
        wizardLogger.info(`Step ${targetStep} is NOT accessible due to step ${step} errors`);
        return false;
      }
    }
    
    // Only allow accessing the next immediate step
    const isNextImmediateStep = targetStep === currentStep + 1;
    wizardLogger.debug(`Step ${targetStep} accessibility: nextImmediate=${isNextImmediateStep}`);
    return isNextImmediateStep;
  }, [currentStep, debouncedFormData, t]);

  // Helper function to handle validation errors
  const handleValidationErrors = useCallback((stepErrors: FormErrors) => {
    wizardLogger.debug('handleValidationErrors');
    
    if (Object.keys(stepErrors).length > 0) {
      wizardLogger.debug('Setting form errors');
      setFormErrors(stepErrors);
      
      // Focus and smooth-scroll to first field with error for better UX
      const firstErrorField = Object.keys(stepErrors)[0];
      wizardLogger.debug('Focusing first error field ' + firstErrorField);
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement | null;
      if (errorElement) {
        try {
          errorElement.focus({ preventScroll: true });
        } catch {
        errorElement.focus();
        }
        if (typeof errorElement.scrollIntoView === 'function') {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      // Show specific field errors instead of generic message
      const errorMessages = Object.values(stepErrors).filter(Boolean);
      if (errorMessages.length > 0) {
        // Use Intl.ListFormat for grammatically correct joining of errors
        const listFormatter = new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' });
        const specificError = listFormatter.format(errorMessages);
        wizardLogger.debug('Setting error message');
        setError(specificError);
      }
      wizardLogger.debug('Validation failed');
      return true; // Indicates validation failed
    }
    wizardLogger.debug('No validation errors');
    return false; // Indicates validation passed
  }, [i18n.language]);

  // Navigation helpers
  const handleStepChange = useCallback((step: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    wizardLogger.debug(`handleStepChange step=${step} currentStep=${currentStep}`);
    wizardLogger.debug(`[ListingWizard] Current form data:`, {
      title: formData.title,
      description: formData.description,
      price: formData.price,
      currency: formData.currency
    });
    
    // Fast-path for moving from Step 1 to Step 2: validate blocking-only fields and proceed
    if (step === currentStep + 1 && currentStep === 1) {
      const navErrors = validateStep(1, formData, t, { mode: 'navigation' });
      if (Object.keys(navErrors).length === 0) {
        wizardLogger.debug('Fast-path: Step 1 blocking fields valid, moving to Step 2');
        setFormErrors({});
        setError(null);
        setCurrentStep(2);
        return;
      }
    }
    
    if (!isStepAccessible(step)) {
      wizardLogger.debug(`Step ${step} not accessible`);
      // Show specific message when trying to access locked step
      if (step > currentStep) {
        const stepErrors = validateStep(currentStep, formData, t, { mode: 'navigation' });
        wizardLogger.debug(`Step ${currentStep} validation errors ${JSON.stringify(stepErrors)}`);
        handleValidationErrors(stepErrors);
      }
      return;
    }

    // Validate current step before moving forward
    if (step > currentStep) {
      wizardLogger.debug(`Validating step ${currentStep} before moving to step ${step}`);
      const stepErrors = validateStep(currentStep, formData, t);
      wizardLogger.debug(`Step ${currentStep} validation errors ${JSON.stringify(stepErrors)}`);
      
      // DEBUGGING: Log specific Step 3 validation details
      if (currentStep === 3) {
        wizardLogger.debug(`[Step 3 Debug] Title: "${formData.title}", Description: "${formData.description}"`);
        wizardLogger.debug(`[Step 3 Debug] Title empty: ${!formData.title || formData.title.trim().length === 0}`);
        wizardLogger.debug(`[Step 3 Debug] Description empty: ${!formData.description || formData.description.trim().length === 0}`);
      }
      
      if (handleValidationErrors(stepErrors)) {
        wizardLogger.debug('Validation failed, stay on current step');
        return;
      }
      wizardLogger.debug('Current step validation passed');
    }
    
    wizardLogger.debug(`Navigating to step ${step} from ${currentStep}`);
    setCurrentStep(step);
    setFormErrors({}); // Clear errors when changing steps
    setError(null); // Clear any existing error messages
  }, [currentStep, formData, t, isStepAccessible, handleValidationErrors]);

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

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Tab trapping within form
    if (event.key === 'Tab') {
      const form = formRef.current;
      if (!form) return;
      
      const focusableElements = form.querySelectorAll(FOCUSABLE_SELECTOR);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
