"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { fetchGovernorates, Governorate } from '@/services/api';
import { getVehicleMakes, getVehicleModels, getCarReferenceData } from '@/services/referenceData';
import { CarBrand, CarModel } from '@/types/referenceData';
import { createListing, updateListing } from '@/services/listings';
import { ListingFormData, UpdateListingData } from "@/types/listings";

import { FormErrors, StepConfig } from "@/types/forms";
import { ListingDataService } from '@/services/ListingDataService';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { validateStep, calculateProgress, processFormFieldValue } from '@/utils/formUtils';
import SuccessAlert from '@/components/ui/SuccessAlert';
import NumericInput from '@/components/ui/NumericInput';
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator';
import { getLocationsByGovernorateSlug, Location } from '@/services/locations';
import { useAutoSave } from '@/hooks/useAutoSave';
import { 
  Transmission, 
  FuelType, 
  ListingWizardProps, 
  ErrorMessageProps,
  UploadProgressProps 
} from '@/types/wizard';

// Constants
const TOTAL_STEPS = 4;
const DEFAULT_CURRENCY = "USD";

const ErrorMessage: React.FC<ErrorMessageProps> = React.memo(function ErrorMessage({ error, id, className = "" }) {
  if (!error) return null;
  
  return (
    <div 
      id={id}
      className={`mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 ${className}`}
      role="alert" 
      aria-live="polite"
    >
      <div className="flex-shrink-0 w-4 h-4 mt-0.5" aria-hidden="true">
        <svg 
          className="w-4 h-4 text-red-500 dark:text-red-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
          {error}
        </div>
      </div>
    </div>
  );
});

// Upload Progress Component

const _UploadProgress: React.FC<UploadProgressProps> = React.memo(function UploadProgress({ 
  progress, fileName, isComplete 
}) {
  const roundedProgress = Math.round(progress);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            aria-hidden="true"
          >
            {isComplete ? (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={fileName}>
            {fileName}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {roundedProgress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${roundedProgress}%` }}
        />
      </div>
    </div>
  );
});

export default function ListingWizard({ 
  mode, 
  listingId, 
  initialData = {}, 
  autoLoad = true,
  autoSave = true,
  onSuccess, 
  onCancel 
}: ListingWizardProps) {
  const router = useRouter();
  const { t, i18n, ready } = useLazyTranslation(['listings', 'common']);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isLoadingData, setIsLoadingData] = useState(false);
  const [_loadError, setLoadError] = useState<string | null>(null);
  const [_showVideoUpload, _setShowVideoUpload] = useState(false);
  const [_showVideoUrl, _setShowVideoUrl] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [carMakes, setCarMakes] = useState<CarBrand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingMakes, setIsLoadingMakes] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(true);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
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
      console.log('[ListingWizard] Auto-save completed:', draftId);
    },
    onError: (error) => {
      console.error('[ListingWizard] Auto-save error:', error);
    }
  });

  // Memoized car features to prevent recreation on every render
  const _carFeatures = useMemo(() => [
    "airConditioning", "leatherSeats", "sunroof", "navigation",
    "bluetoothConnectivity", "parkingSensors", "reverseCam",
    "cruiseControl", "alloyWheels", "electricWindows"
  ], []);

  // Memoized step configuration
  const stepConfig = useMemo((): StepConfig[] => [
    { step: 1, title: t('listings:vehicleIdentityTitle', 'Vehicle Identity'), icon: '🚗', isComplete: currentStep > 1 },
    { step: 2, title: t('listings:vehicleDetailsTitle', 'Vehicle Details'), icon: '⚙️', isComplete: currentStep > 2 },
    { step: 3, title: t('listings:contentMediaTitle', 'Content & Media'), icon: '📝', isComplete: currentStep > 3 },
    { step: 4, title: t('listings:pricingContactTitle', 'Pricing & Contact'), icon: '💰', isComplete: currentStep > 4 }
  ], [currentStep, t]);

  // Handler functions
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('[ListingWizard] Form submit triggered, current step:', currentStep, 'mode:', mode);
    console.log('[ListingWizard] TOTAL_STEPS constant:', TOTAL_STEPS);
    console.log('[ListingWizard] currentStep === TOTAL_STEPS?', currentStep === TOTAL_STEPS);

    // IMPORTANT: Only process actual final submissions, not navigation
    // The submit event should only fire when clicking the Submit button on step 4
    if (currentStep !== TOTAL_STEPS) {
      console.log('[ListingWizard] Ignoring form submit - not on final step. Current:', currentStep, 'Total:', TOTAL_STEPS);
      return;
    }

    console.log('[ListingWizard] Processing final submission (step 4)');

    // For final submission (step 4), validate ALL steps
    if (currentStep === TOTAL_STEPS) {
      console.log('[ListingWizard] Final submission - validating ALL steps');
      console.log('[ListingWizard] Complete form data:', formData);
      
      // Validate all steps for final submission
      let allErrors: FormErrors = {};
      for (let step = 1; step <= TOTAL_STEPS; step++) {
        const stepErrors = validateStep(step, formData, t);
        allErrors = { ...allErrors, ...stepErrors };
        console.log(`[ListingWizard] Step ${step} validation errors:`, stepErrors);
      }
      
      console.log('[ListingWizard] All validation errors:', allErrors);
      if (Object.keys(allErrors).length > 0) {
        console.log('[ListingWizard] Final validation failed, stopping submission');
        console.log('[ListingWizard] All error fields:', Object.keys(allErrors));
        setFormErrors(allErrors);
        return;
      }
      console.log('[ListingWizard] All validation passed!');
    } else {
      // Validate current step only for navigation
      console.log('[ListingWizard] Validating step:', currentStep);
      const stepErrors = validateStep(currentStep, formData, t);
      console.log('[ListingWizard] Validation errors:', stepErrors);
      if (Object.keys(stepErrors).length > 0) {
        console.log('[ListingWizard] Validation failed, stopping submission');
        setFormErrors(stepErrors);
        return;
      }
    }
    console.log('[ListingWizard] Validation passed, proceeding...');

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
        console.log('[ListingWizard] Starting update process for listing:', listingId);
        console.log('[ListingWizard] Form data before update:', {
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

        // Form data already contains IDs for make/model, just need to convert location
        console.log('[ListingWizard] Processing form data for API...');
        console.log('[ListingWizard] Make/Model IDs:', { makeId: formData.make, modelId: formData.model });
        console.log('[ListingWizard] Location data from form (ID-first approach):', {
          locationId: formData.locationId,
          locationSlug: formData.locationSlug,
          location: formData.location,
          governorateId: formData.governorateId,
          governorateSlug: formData.governorateSlug
        });
        
        // Direct ID usage - no more complex lookups needed!
        const locationId = formData.locationId;
        const governorateId = formData.governorateId;
        
        console.log('[ListingWizard] Using direct IDs - much faster!:', {
          locationId,
          governorateId
        });
        
        // Use the form's make/model IDs directly
        const finalModelId = formData.model ? parseInt(formData.model) : undefined;
        console.log('[ListingWizard] Final model ID to send:', finalModelId);
        
        // Build update data with direct IDs - much simpler and faster!
        const updateData: UpdateListingData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          transmission: formData.transmission,
          // Note: fuelType is not supported by the UpdateListingData API
          currency: formData.currency,
          modelYear: formData.year ? parseInt(formData.year) : undefined,
          // Use direct IDs - no conversion needed!
          modelId: finalModelId,
          locationId: locationId, // Direct from form state
        };
        
        // Remove undefined values to avoid sending null data
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof UpdateListingData] === undefined) {
            delete updateData[key as keyof UpdateListingData];
          }
        });
        
        console.log('[ListingWizard] Update data being sent:', updateData);
        console.log('[ListingWizard] IMPORTANT - locationId in update data:', updateData.locationId);
        console.log('[ListingWizard] Form data fields being updated:', {
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
        });
        
        const result = await updateListing(listingId, updateData);
        console.log('[ListingWizard] Update successful, result:', result);
        console.log('[ListingWizard] Updated listing data returned from API:');
        console.log('- Location name:', result.location?.city || result.location?.address);
        console.log('- Location object:', result.location);
        console.log('- Governorate name:', result.governorate?.nameEn);
        console.log('- Governorate object:', result.governorate);
        
        // Note: Contact information (email, phone, name) is tied to the user account
        // and cannot be updated via the listing update API. Users need to update
        // their profile information separately.
        console.log('[ListingWizard] Note: Contact info updates require separate user profile API calls');
        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      }
    } catch (error) {
      console.error('[ListingWizard] Error during submission:', error);
      console.error('[ListingWizard] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        mode,
        listingId,
        currentStep
      });
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
        
        console.log('[ListingWizard] Auto-loading data for mode:', mode, 'listingId:', listingId);
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
        
        console.log('[ListingWizard] Data auto-loaded successfully');
      } catch (error) {
        console.error('[ListingWizard] Error auto-loading data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load listing data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [mode, listingId, autoLoad, ready]);

  // Update form data when initialData changes (for manual data passing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && !autoLoad) {
      console.log('[ListingWizard] Updating form data with manual initialData:', initialData);
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

  // Load initial data and dependencies
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [governoratesData, makesData, referenceData] = await Promise.all([
          fetchGovernorates(),
          getVehicleMakes(),
          getCarReferenceData()
        ]);
        
        setGovernorates(governoratesData);
        setCarMakes(makesData);
        setTransmissions(referenceData.transmissions || []);
        setFuelTypes(referenceData.fuelTypes || []);
        console.log('[ListingWizard] Loaded reference data:', {
          transmissions: referenceData.transmissions?.length || 0,
          fuelTypes: referenceData.fuelTypes?.length || 0
        });
      } catch (error) {
        console.error("Error loading initial data:", error);
        setError(t('common:failedToLoadData'));
      } finally {
        setIsLoadingGovernorates(false);
        setIsLoadingMakes(false);
        setIsLoadingReferenceData(false);
      }
    };

    if (ready) {
      loadInitialData();
    }
  }, [ready, t]);



  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard/listings');
    }
  }, [onCancel, router]);

  // Enhanced handler for location changes - slug-based approach
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlug = e.target.value;
    console.log('[ListingWizard] Location dropdown changed to slug:', selectedSlug);
    
    // Find the location object to get all its properties
    const selectedLocation = locations.find(loc => loc.slug === selectedSlug);
    
    if (selectedLocation) {
      const locationDisplayName = i18n.language === 'ar' 
        ? selectedLocation.displayNameAr 
        : selectedLocation.displayNameEn;
        
      console.log('[ListingWizard] Updating location with slug-based approach:', {
        id: selectedLocation.id,
        slug: selectedLocation.slug,
        displayName: locationDisplayName,
        selectedLocationObject: selectedLocation
      });
      
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
      console.log('[ListingWizard] Location cleared');
      // Handle empty selection
      setFormData(prev => ({
        ...prev,
        locationId: undefined,
        locationSlug: '',
        location: ''
      }));
    } else {
      console.warn('[ListingWizard] Location not found for slug:', selectedSlug);
    }
  }, [locations, i18n.language, formErrors.locationSlug]);

  // Form field handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, fieldName?: string) => {
    let name: string;
    let value: string;
    
    if (typeof e === 'string') {
      name = fieldName!;
      value = e;
    } else {
      name = e.target.name;
      value = e.target.value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processFormFieldValue(name, value)
    }));
    
    // Clear field-specific errors
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Progress calculation
  const progressPercentage = useMemo(() => {
    return calculateProgress(currentStep, TOTAL_STEPS);
  }, [currentStep]);

  // Load car models when make changes
  useEffect(() => {
    const loadCarModels = async () => {
      if (formData.make && formData.make.trim() !== '') {
        try {
          setIsLoadingModels(true);
          setCarModels([]); // Clear previous models
          const modelData = await getVehicleModels(parseInt(formData.make));
          setCarModels(modelData);
        } catch (error) {
          console.error('Failed to load car models:', error);
          setError(t('common:failedToLoadData'));
        } finally {
          setIsLoadingModels(false);
        }
      } else {
        setCarModels([]);
      }
    };

    loadCarModels();
  }, [formData.make, t]);

  // Load locations when governorate changes
  useEffect(() => {
    const loadLocations = async () => {

      
      if (formData.governorateSlug && formData.governorateSlug.trim() !== '') {
        try {
          setIsLoadingLocations(true);
          setLocations([]); // Clear previous locations
          console.log('[ListingWizard] Loading locations for governorate:', formData.governorateSlug);
          const locationData = await getLocationsByGovernorateSlug(formData.governorateSlug);
          console.log('[ListingWizard] Loaded locations:', locationData.length, 'locations');
          
          // CRITICAL FIX: Set governorate ID from location data
          if (!formData.governorateId && locationData.length > 0) {
            const governorateId = locationData[0].governorateId;
            if (governorateId) {
              console.log('[ListingWizard] Setting missing governorate ID:', governorateId);
              setFormData(prev => ({
                ...prev,
                governorateId: governorateId
              }));
            }
          }
          setLocations(locationData);
        } catch (error) {
          console.error('Failed to load locations:', error);
          setError(t('common:failedToLoadData'));
        } finally {
          setIsLoadingLocations(false);
        }
      } else {
        setLocations([]);
      }
    };

    loadLocations();
  }, [formData.governorateSlug, formData.governorateId, t]);

  // Load models when make changes
  useEffect(() => {
    const loadModels = async () => {
      if (formData.make) {
        try {
          setIsLoadingModels(true);
          setCarModels([]); // Clear previous models
          console.log('[ListingWizard] Loading models for make ID:', formData.make);
          const modelData = await getVehicleModels(parseInt(formData.make));
          console.log('[ListingWizard] Loaded models:', modelData);
          setCarModels(modelData);
        } catch (error) {
          console.error('Failed to load models:', error);
          setError(t('common:failedToLoadData'));
        } finally {
          setIsLoadingModels(false);
        }
      } else {
        setCarModels([]);
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [formData.make, t]);

  // Load existing images and videos when formData changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && formData) {
      // Load existing images (only if not already loaded to prevent duplicates)
      if (formData.existingImageUrls && formData.existingImageUrls.length > 0 && existingImages.length === 0) {
        setExistingImages(formData.existingImageUrls);
        // Set preview URLs to only existing images initially
        setImagePreviewUrls(formData.existingImageUrls);
      }

      // Load existing videos (only if not already loaded to prevent duplicates)
      if (formData.existingVideoUrls && formData.existingVideoUrls.length > 0 && existingVideos.length === 0) {
        setExistingVideos(formData.existingVideoUrls);
        setVideoPreviewUrls(formData.existingVideoUrls);
      }
    }
  }, [mode, formData.existingImageUrls, formData.existingVideoUrls, existingImages.length, existingVideos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if a step can be accessed based on validation
  const isStepAccessible = useCallback((targetStep: number) => {
    console.log(`[ListingWizard] isStepAccessible called: targetStep=${targetStep}, currentStep=${currentStep}`);
    
    // Always allow going to previous steps
    if (targetStep <= currentStep) {
      console.log(`[ListingWizard] Step ${targetStep} is accessible (previous or current step)`);
      return true;
    }
    
    // For next step, validate all previous steps
    for (let step = 1; step < targetStep; step++) {
      console.log(`[ListingWizard] Validating step ${step} for accessibility`);
      const stepErrors = validateStep(step, formData, t);
      console.log(`[ListingWizard] Step ${step} validation errors:`, stepErrors);
      if (Object.keys(stepErrors).length > 0) {
        console.log(`[ListingWizard] Step ${targetStep} is NOT accessible due to step ${step} validation errors`);
        return false;
      }
    }
    
    // Only allow accessing the next immediate step
    const isNextImmediateStep = targetStep === currentStep + 1;
    console.log(`[ListingWizard] Step ${targetStep} accessibility check: isNextImmediateStep=${isNextImmediateStep}`);
    return isNextImmediateStep;
  }, [currentStep, formData, t]);

  // Helper function to handle validation errors
  const handleValidationErrors = useCallback((stepErrors: FormErrors) => {
    console.log(`[ListingWizard] handleValidationErrors called with:`, stepErrors);
    
    if (Object.keys(stepErrors).length > 0) {
      console.log(`[ListingWizard] Setting form errors:`, stepErrors);
      setFormErrors(stepErrors);
      
      // Focus on first field with error for better UX
      const firstErrorField = Object.keys(stepErrors)[0];
      console.log(`[ListingWizard] Focusing on first error field:`, firstErrorField);
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      if (errorElement) {
        errorElement.focus();
      }
      
      // Show specific field errors instead of generic message
      const errorMessages = Object.values(stepErrors).filter(Boolean);
      if (errorMessages.length > 0) {
        // Use Intl.ListFormat for grammatically correct joining of errors
        const listFormatter = new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' });
        const specificError = listFormatter.format(errorMessages);
        console.log(`[ListingWizard] Setting error message:`, specificError);
        setError(specificError);
      }
      console.log(`[ListingWizard] Validation failed, returning true`);
      return true; // Indicates validation failed
    }
    console.log(`[ListingWizard] No validation errors, returning false`);
    return false; // Indicates validation passed
  }, [i18n.language]);

  // Navigation helpers
  const handleStepChange = useCallback((step: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log(`[ListingWizard] handleStepChange called: step=${step}, currentStep=${currentStep}`);
    console.log(`[ListingWizard] Current form data:`, {
      title: formData.title,
      description: formData.description,
      price: formData.price,
      currency: formData.currency
    });
    
    if (!isStepAccessible(step)) {
      console.log(`[ListingWizard] Step ${step} is not accessible`);
      // Show specific message when trying to access locked step
      if (step > currentStep) {
        const stepErrors = validateStep(currentStep, formData, t);
        console.log(`[ListingWizard] Step ${currentStep} validation errors:`, stepErrors);
        handleValidationErrors(stepErrors);
      }
      return;
    }

    // Validate current step before moving forward
    if (step > currentStep) {
      console.log(`[ListingWizard] Validating step ${currentStep} before moving to step ${step}`);
      const stepErrors = validateStep(currentStep, formData, t);
      console.log(`[ListingWizard] Step ${currentStep} validation errors:`, stepErrors);
      if (handleValidationErrors(stepErrors)) {
        console.log(`[ListingWizard] Validation failed, staying on step ${currentStep}`);
        return;
      }
      console.log(`[ListingWizard] Step ${currentStep} validation passed`);
    }
    
    console.log(`[ListingWizard] Navigating to step ${step} from step ${currentStep}`);
    setCurrentStep(step);
    setFormErrors({}); // Clear errors when changing steps
    setError(null); // Clear any existing error messages
  }, [currentStep, formData, t, isStepAccessible, handleValidationErrors]);

  const handlePreviousStep = useCallback(() => {
    console.log(`[ListingWizard] Going back from step ${currentStep} to step ${currentStep - 1}`);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setFormErrors({});
    }
  }, [currentStep]);

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log('[ListingWizard] handleImageUpload called with files:', files);

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
    }

    console.log('[ListingWizard] Valid files found:', validFiles.length);
    console.log('[ListingWizard] New URLs created:', newUrls.length);

    if (validFiles.length > 0) {
      setFormData(prev => {
        const newImages = [...prev.images, ...validFiles];
        console.log('[ListingWizard] Updated formData.images:', newImages.length);
        return {
          ...prev,
          images: newImages
        };
      });
      setImagePreviewUrls(prev => {
        const newPreviewUrls = [...prev, ...newUrls];
        console.log('[ListingWizard] Updated imagePreviewUrls:', newPreviewUrls.length);
        return newPreviewUrls;
      });
    }
  }, []);

  // Remove image handler
  const removeImage = useCallback((index: number) => {
    const _allImagesCount = existingImages.length + formData.images.length;
    const isExistingImage = index < existingImages.length;

    if (isExistingImage) {
      // Remove from existing images
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new uploads
      const newUploadIndex = index - existingImages.length;
      // Revoke object URL to prevent memory leaks for newly uploaded files
      const previewUrl = imagePreviewUrls[index];
      if (previewUrl && !existingImages.includes(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== newUploadIndex)
      }));
    }

    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [existingImages, formData.images, imagePreviewUrls]);

  // Drag and drop handlers for image upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    console.log('[ListingWizard] handleDrop called with files:', files);

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
    });

    console.log('[ListingWizard] Valid files from drop:', validFiles.length);
    console.log('[ListingWizard] New URLs from drop:', newUrls.length);

    if (validFiles.length > 0) {
      setFormData(prev => {
        const newImages = [...prev.images, ...validFiles];
        console.log('[ListingWizard] Updated formData.images from drop:', newImages.length);
        return {
          ...prev,
          images: newImages
        };
      });
      setImagePreviewUrls(prev => {
        const newPreviewUrls = [...prev, ...newUrls];
        console.log('[ListingWizard] Updated imagePreviewUrls from drop:', newPreviewUrls.length);
        return newPreviewUrls;
      });
    }
  }, []);

  // Image drag and drop reordering handlers
  const handleImageDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverImageIndex(index);
  }, []);

  const handleImageDragLeave = useCallback(() => {
    setDragOverImageIndex(null);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;

    // Reorder both images and preview URLs
    const newImages = [...formData.images];
    const newPreviewUrls = [...imagePreviewUrls];

    const draggedImage = newImages[draggedImageIndex];
    const draggedPreviewUrl = newPreviewUrls[draggedImageIndex];

    newImages.splice(draggedImageIndex, 1);
    newPreviewUrls.splice(draggedImageIndex, 1);

    newImages.splice(dropIndex, 0, draggedImage);
    newPreviewUrls.splice(dropIndex, 0, draggedPreviewUrl);

    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviewUrls(newPreviewUrls);
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, [draggedImageIndex, formData.images, imagePreviewUrls]);

  const handleImageDragEnd = useCallback(() => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, []);

  // Video upload handler
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/')) {
        validFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        videos: [...(prev.videos || []), ...validFiles]
      }));
      setVideoPreviewUrls(prev => [...prev, ...newUrls]);
    }
  }, []);

  // Remove video handler
  const removeVideo = useCallback((index: number) => {
    // Revoke object URL to prevent memory leaks
    if (videoPreviewUrls[index]) {
      URL.revokeObjectURL(videoPreviewUrls[index]);
    }

    setFormData(prev => ({
      ...prev,
      videos: (prev.videos || []).filter((_, i) => i !== index)
    }));
    setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [videoPreviewUrls]);

  // Add video URL handler
  const addVideoUrl = useCallback(() => {
    const url = prompt(t('listings:enterVideoUrl', 'Enter video URL (YouTube, Vimeo, etc.)'));
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        videoUrls: [...(prev.videoUrls || []), url.trim()]
      }));
    }
  }, [t]);

  // Remove video URL handler
  const removeVideoUrl = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      videoUrls: (prev.videoUrls || []).filter((_, i) => i !== index)
    }));
  }, []);

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'create' ? t('listings:newListing') : t('listings:editListing')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'create' ? t('listings:newListingSubtitle') : t('listings:editListingSubtitle')}
          </p>
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {stepConfig.map(({ step, title, icon, isComplete }) => (
              <div key={step} className="flex flex-col items-center relative">
                <button
                  type="button"
                  onClick={(e) => handleStepChange(step, e)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-lg relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 cursor-pointer transform hover:scale-105' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer'
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : currentStep === step ? (
                    <span className="text-lg">{icon}</span>
                  ) : (
                    <span>{step}</span>
                  )}
                </button>
                <span className={`text-sm mt-3 text-center max-w-24 font-medium transition-colors duration-300 ${
                  currentStep >= step 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {title}
                </span>
                {step < TOTAL_STEPS && (
                  <div 
                    className={`absolute top-6 start-12 w-20 h-0.5 transition-colors duration-300 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Step {currentStep} of {TOTAL_STEPS}</span>
              <div className="flex items-center gap-4">
                {/* Auto-save indicator (only in create mode) */}
                {mode === 'create' && autoSave && (
                  <AutoSaveIndicator
                    status={autoSaveHook.autoSaveStatus}
                    lastSaved={autoSaveHook.lastSaved}
                    className="text-xs"
                  />
                )}
                <span>{progressPercentage}% Complete</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

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
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info - Simplified for now */}
            {currentStep === 1 && (
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
                      // From next year down to 1990
                      for (let year = currentYear + 1; year >= 1990; year--) {
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
                    {t('listings:newListingYearHint', 'Select the manufacturing year of your vehicle')}
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Details */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Step Header */}
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('listings:vehicleDetailsTitle', 'Vehicle Details')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('listings:vehicleDetailsSubtitle', 'Tell us more about your vehicle\'s condition and features')}
                  </p>
                </div>

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
                    onChange={(value) => handleChange(value, 'mileage')}
                    placeholder={t('listings:newListingMileagePlaceholder', '50000')}
                    error={!!formErrors.mileage}
                    aria-describedby="mileage-hint"
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      onChange={handleChange}
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
                    <select
                      id="transmission"
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                      disabled={isLoadingReferenceData}
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
                        <option key={transmission.id} value={transmission.name}>
                          {i18n.language === 'ar' ? transmission.displayNameAr : transmission.displayNameEn}
                        </option>
                      ))}
                    </select>
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
                      onChange={handleChange}
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
                    <select
                      id="fuelType"
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      disabled={isLoadingReferenceData}
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
                        <option key={fuelType.id} value={fuelType.name}>
                          {i18n.language === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn}
                        </option>
                      ))}
                    </select>
                    {formErrors.fuelType && <ErrorMessage error={formErrors.fuelType} />}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="fuelType-hint">
                      {t('listings:newListingFuelTypeHint', 'Type of fuel or power source')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Content & Media */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Step Header */}
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('listings:contentMediaTitle', 'Content & Media')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('listings:contentMediaSubtitle', 'Create your listing content and add photos')}
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('listings:title')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border-gray-200 dark:border-gray-600 focus:border-blue-500"
                    placeholder={t('listings:titlePlaceholder')}
                    aria-invalid={!!formErrors.title}
                  />
                  {formErrors.title && <ErrorMessage error={formErrors.title} />}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('listings:titleHint', 'Create an attractive title for your listing')}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('listings:description')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 resize-vertical border-gray-200 dark:border-gray-600 focus:border-blue-500"
                    placeholder={t('listings:descriptionPlaceholder', 'Describe your car in detail...')}
                    aria-invalid={!!formErrors.description}
                  />
                  {formErrors.description && <ErrorMessage error={formErrors.description} />}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('listings:descriptionHint', 'Provide detailed information about your vehicle\'s condition, features, and history')}
                  </p>
                </div>

                {/* Images and Videos Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {t('listings:newListingCarImages', 'Car Images')}
                  </h3>
                  
                  {/* Images Upload Placeholder */}
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <h4 className="text-lg font-medium mb-2">Images & Videos Upload</h4>
                      <p className="text-sm">Professional drag & drop upload will be implemented here</p>
                      <p className="text-xs mt-2 text-gray-400">Following the original excellent UX from main branch</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Pricing & Contact */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Step Header */}
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('listings:pricingContactTitle', 'Pricing & Contact')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('listings:pricingContactSubtitle', 'Set your price and contact information')}
                  </p>
                </div>

                {/* Placeholder for Step 4 content */}
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                    <h4 className="text-lg font-medium mb-2">Pricing & Contact</h4>
                    <p className="text-sm">Price, currency, location, and contact information will be implemented here</p>
                    <p className="text-xs mt-2 text-gray-400">Following the original excellent UX from main branch</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-0">
              <div className="order-2 sm:order-1">
                <button
                  type="button"
                  onClick={(e) => handleStepChange(currentStep - 1, e)}
                  disabled={currentStep === 1}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('common:previous')}
                </button>
              </div>
              
              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={(e) => handleStepChange(currentStep + 1, e)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 order-1 sm:order-2"
                >
                  {t('common:next')}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('listings:submitting', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {mode === 'edit' ? t('listings:updateListing', 'Update Listing') : t('listings:createListing', 'Create Listing')}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
