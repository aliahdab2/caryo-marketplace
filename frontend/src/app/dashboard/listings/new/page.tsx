"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { fetchGovernorates, Governorate } from '@/services/api';
import { getVehicleMakes, getVehicleModels, CarBrand, CarModel } from '@/services/referenceData';
import { createListing } from '@/services/listings';
import { ListingFormData } from "@/types/listings";
import { FormErrors, StepConfig } from "@/types/forms";
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { validateStep, calculateProgress, processFormFieldValue } from '@/utils/formUtils';
import SuccessAlert from '@/components/ui/SuccessAlert';
import NumericInput from '@/components/ui/NumericInput';
import { getLocationsByGovernorateSlug, Location } from '@/services/locations';

// Constants
const TOTAL_STEPS = 4;
const DEFAULT_CURRENCY = "USD";

// Error message component
const ErrorMessage: React.FC<{ error?: string; id?: string }> = ({ error, id }) => {
  if (!error) return null;
  
  return (
    <div 
      id={id}
      className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center" 
      role="alert" 
      aria-live="polite"
    >
      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </div>
  );
};

export default function NewListingPage() {
  const router = useRouter();
  const { t, i18n } = useLazyTranslation(['dashboard', 'listings', 'common', 'errors']);
  

  

  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [carMakes, setCarMakes] = useState<CarBrand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    price: "",
    currency: DEFAULT_CURRENCY,
    mileage: "",
    engine: "",
    color: "",
    transmission: "",
    fuelType: "",
    exteriorColor: "",
    interiorColor: "",
    governorateSlug: "",
    locationSlug: "",
    state: "",
    zipCode: "",
    contactPhone: "",
    contactName: "",
    contactEmail: "",
    contactPreference: "phone",
    condition: "used",
    features: [],
    status: "active" as const,
    images: [],
    categoryId: "1"
  });

  // Store image object URLs for preview
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Memoized step configuration
  const stepConfig = useMemo((): StepConfig[] => [
    { step: 1, title: t('listings:newListingStep1Title', 'Basic Info'), icon: '📝', isComplete: currentStep > 1 },
    { step: 2, title: t('listings:newListingStep2Title', 'Details'), icon: '🚗', isComplete: currentStep > 2 },
    { step: 3, title: t('listings:newListingStep3Title', 'Location & Contact'), icon: '📍', isComplete: currentStep > 3 },
    { step: 4, title: t('listings:newListingStep4Title', 'Images'), icon: '📸', isComplete: currentStep > 4 }
  ], [currentStep, t]);

  type FieldName = keyof ListingFormData;

  // Load locations when governorate changes
  useEffect(() => {
    const loadLocations = async () => {
      if (formData.governorateSlug && formData.governorateSlug.trim() !== '') {
        try {
          setIsLoadingLocations(true);
          setLocations([]); // Clear previous locations
          const locationData = await getLocationsByGovernorateSlug(formData.governorateSlug);
          setLocations(locationData);
        } catch (error) {
          console.error('Failed to load locations:', error);
          setError(t('errors:failedToLoadLocations', 'Failed to load locations. Please try again.'));
        } finally {
          setIsLoadingLocations(false);
        }
      } else {
        setLocations([]);
      }
    };

    loadLocations();
  }, [formData.governorateSlug, t]);

  // Enhanced form change handler with smart field processing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | string, fieldName?: string) => {
    let name: string;
    let value: string;
    
    // Handle both event objects and direct string values (for NumericInput)
    if (typeof e === 'string') {
      name = fieldName!;
      value = e;
    } else {
      name = e.target.name;
      value = e.target.value;
    }
    
    const fieldNameType = name as FieldName;
    
    // Use centralized field processing utility for non-numeric fields
    const finalValue = processFormFieldValue(fieldNameType, value);
    
    setFormData(prev => {
      const updates: Partial<ListingFormData> = {
        [name]: finalValue
      };
      
      // Reset model when make changes
      if (name === 'make') {
        updates.model = '';
      }
      
      // Reset location when governorate changes
      if (name === 'governorateSlug') {
        updates.locationSlug = '';
      }
      
      return {
        ...prev,
        ...updates
      };
    });

    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  // Enhanced form submission with validation
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate current step
    const stepErrors = validateStep(currentStep, formData, t);
    if (Object.keys(stepErrors).length > 0) {
      setFormErrors(stepErrors);
      
      // Focus on first field with error for better UX
      const firstErrorField = Object.keys(stepErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      if (errorElement) {
        errorElement.focus();
      }
      
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createListing(formData);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error creating listing:", error);
      setError(t('errors:failedToSubmitListing', 'Failed to create listing. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, t]);

  // Handle success alert completion
  const handleSuccessAlertComplete = useCallback(() => {
    setShowSuccessAlert(false);
    router.push("/dashboard/listings");
  }, [router]);

  // Check if a step can be accessed based on validation
  const isStepAccessible = useCallback((targetStep: number) => {
    // Always allow going to previous steps
    if (targetStep <= currentStep) {
      return true;
    }
    
    // For next step, validate all previous steps
    for (let step = 1; step < targetStep; step++) {
      const stepErrors = validateStep(step, formData, t);
      if (Object.keys(stepErrors).length > 0) {
        return false;
      }
    }
    
    // Only allow accessing the next immediate step
    return targetStep === currentStep + 1;
  }, [currentStep, formData, t]);

  // Helper function to handle validation errors
  const handleValidationErrors = useCallback((stepErrors: FormErrors) => {
    if (Object.keys(stepErrors).length > 0) {
      setFormErrors(stepErrors);
      
      // Focus on first field with error for better UX
      const firstErrorField = Object.keys(stepErrors)[0];
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
        setError(specificError);
      }
      return true; // Indicates validation failed
    }
    return false; // Indicates validation passed
  }, [i18n.language]);

  // Enhanced step navigation with validation
  const handleStepChange = useCallback((step: number) => {
    if (!isStepAccessible(step)) {
      // Show specific message when trying to access locked step
      if (step > currentStep) {
        const stepErrors = validateStep(currentStep, formData, t);
        handleValidationErrors(stepErrors);
      }
      return;
    }

    // Validate current step before moving forward
    if (step > currentStep) {
      const stepErrors = validateStep(currentStep, formData, t);
      if (handleValidationErrors(stepErrors)) {
        return;
      }
    }
    
    setCurrentStep(step);
    setFormErrors({}); // Clear errors when changing steps
    setError(null); // Clear any existing error messages
  }, [currentStep, formData, t, isStepAccessible, handleValidationErrors]);

  // Handle previous step
  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setFormErrors({});
    }
  }, [currentStep]);

  // Enhanced data loading with error handling and retry mechanism
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingGovernorates(true);
        setError(null); // Clear any existing errors
        const governorateData = await fetchGovernorates();
        setGovernorates(governorateData);
      } catch (error) {
        console.error('Failed to load governorates:', error);
        setError(t('errors:failedToLoadData', 'Failed to load required data. Please refresh the page.'));
        // Set empty array to prevent undefined errors
        setGovernorates([]);
      } finally {
        setIsLoadingGovernorates(false);
      }
    };

    loadInitialData();
  }, [t]);

  // Load car makes when component mounts with better error handling
  useEffect(() => {
    const loadCarMakes = async () => {
      try {
        setIsLoadingMakes(true);
        const makes = await getVehicleMakes();
        setCarMakes(makes);
      } catch (error) {
        console.error('Failed to load car makes:', error);
        // Set empty array to prevent undefined errors
        setCarMakes([]);
        // Don't show error for car makes as it's not critical for form submission
      } finally {
        setIsLoadingMakes(false);
      }
    };

    loadCarMakes();
  }, []);

  // Load car models when make changes with better error handling
  useEffect(() => {
    if (formData.make) {
      const loadModels = async () => {
        try {
          setIsLoadingModels(true);
          const models = await getVehicleModels(parseInt(formData.make));
          setCarModels(models);
        } catch (error) {
          console.error("Error loading car models:", error);
          // Set empty array to prevent undefined errors
          setCarModels([]);
        } finally {
          setIsLoadingModels(false);
        }
      };

      loadModels();
    } else {
      setCarModels([]);
    }
  }, [formData.make]);

  // Handle image preview URLs
  useEffect(() => {
    // Create managed object URLs for image previews
    const newUrls = formData.images.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(newUrls);

    // Cleanup: revoke object URLs to prevent memory leaks
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  // Image handling functions
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        console.warn(`File ${file.name} is too large (over 5MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        console.warn(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles]
      }));
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  // Progress calculation
  const progressPercentage = useMemo(() => {
    return calculateProgress(currentStep, TOTAL_STEPS);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard:createListing', 'Create New Listing')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('listings:newListingSubtitle', 'Share your car with potential buyers in a few simple steps')}
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Enhanced Progress Bar */}
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              {stepConfig.map(({ step, title, icon, isComplete }) => {
                const stepAccessible = isStepAccessible(step);
                return (
                <div key={step} className="flex flex-col items-center relative">
                  <button
                    type="button"
                    onClick={() => handleStepChange(step)}
                    disabled={!stepAccessible}
                    aria-label={`${title} - Step ${step} of ${TOTAL_STEPS}${isComplete ? ' (completed)' : currentStep === step ? ' (current)' : ''}${!stepAccessible ? ' (locked)' : ''}`}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-lg relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      currentStep >= step 
                        ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 cursor-pointer transform hover:scale-105' 
                        : stepAccessible
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600 animate-pulse hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : currentStep === step ? (
                      <span className="text-lg" aria-hidden="true">{icon}</span>
                    ) : stepAccessible ? (
                      <span aria-hidden="true">{step}</span>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
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
                      className={`absolute top-6 left-12 w-20 h-0.5 transition-colors duration-300 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                );
              })}
            </div>
            
            {/* Enhanced progress percentage with accessibility */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{t('listings:newListingStepCounter', 'Step {{current}} of {{total}}', { current: currentStep, total: TOTAL_STEPS })}</span>
                <span>{progressPercentage}% {t('common:complete', 'Complete')}</span>
              </div>
              <div 
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Form completion progress: ${progressPercentage}%`}
              >
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            {/* Enhanced progress bar with animation */}
            <div className="mt-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-700 ease-out relative z-10"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('listings:newListingNavigationHint', 'Use Alt + ← → or click step numbers to navigate')}
              </span>
            </p>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Step Header */}
                <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('listings:newListingStep1Title', 'Basic Information')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('listings:newListingStep1Description', 'Tell us about your car listing')}
              </p>
                </div>

                {/* Title Field */}
                <div className="group">
                  <label htmlFor="title" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mr-2 dark:bg-blue-900 dark:text-blue-300">
                      📝
                    </span>
                    {t('listings:newListingTitle', 'Listing Title')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${
                      formErrors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                    }`}
                    placeholder={t('listings:newListingTitlePlaceholder', 'e.g., 2020 Toyota Camry - Excellent Condition')}
                    required
                    aria-describedby={formErrors.title ? 'title-error' : 'title-hint'}
                  />
                  <ErrorMessage error={formErrors.title} id="title-error" />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="title-hint">
                    {t('listings:newListingTitleHint', 'Make it descriptive and appealing to buyers')}
                  </p>
                </div>

                {/* Price and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label htmlFor="price" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-semibold mr-2 dark:bg-green-900 dark:text-green-300">
                        💰
                      </span>
                                          {t('listings:newListingPrice', 'Price')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <NumericInput
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={(value) => handleChange(value, 'price')}
                    placeholder={t('listings:newListingPricePlaceholder', '25000')}
                    required
                    error={!!formErrors.price}
                    aria-describedby={formErrors.price ? 'price-error' : 'price-hint'}
                  />
                  <ErrorMessage error={formErrors.price} id="price-error" />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="price-hint">
                    {t('listings:newListingPriceHint', 'Enter the price in numbers only')}
                  </p>
                  </div>
                  
                  <div className="group">
                    <label htmlFor="currency" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mr-2 dark:bg-blue-900 dark:text-blue-300">
                        💱
                      </span>
                                          {t('listings:newListingCurrency', 'Currency')}
                    <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 appearance-none bg-white ${
                        i18n.language === 'ar' ? 'text-right' : 'text-left'
                      }`}
                      required
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {i18n.language === 'ar' ? curr.nameAr : curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="group">
                  <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold mr-2 dark:bg-purple-900 dark:text-purple-300">
                      📄
                    </span>
                    {t('listings:newListingDescription', 'Description')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-vertical ${
                      formErrors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
                    }`}
                    placeholder={t('listings:newListingDescriptionPlaceholder', 'Describe your car in detail...')}
                    required
                    aria-describedby={formErrors.description ? 'description-error' : 'description-hint'}
                  />
                  <ErrorMessage error={formErrors.description} id="description-error" />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('listings:newListingDescriptionHint', 'Include key features, condition, and any special details')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Step 2: Car Details */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Step Header */}
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('listings:newListingStep2Title', 'Car Details')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('listings:newListingStep2Description', 'Provide specific details about your vehicle')}
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
                  <ErrorMessage error={formErrors.make} id="make-error" />
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
                    disabled={!formData.make || isLoadingModels}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      formErrors.model ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    } ${(!formData.make || isLoadingModels) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  <ErrorMessage error={formErrors.model} id="model-error" />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="model-hint">
                    {t('listings:newListingModelHint', 'Select the specific model of your car')}
                  </p>
                </div>

                {/* Year and Mileage Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Year */}
                  <div className="space-y-3">
                    <label 
                      htmlFor="year" 
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                                          {t('listings:newListingYear', 'Year')} <span className="text-red-500">*</span>
                  </label>
                  <NumericInput
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={(value) => handleChange(value, 'year')}
                    placeholder={t('listings:newListingYearPlaceholder', '2020')}
                    required
                    error={!!formErrors.year}
                    aria-invalid={!!formErrors.year}
                    aria-describedby={formErrors.year ? 'year-error' : 'year-hint'}
                  />
                  <ErrorMessage error={formErrors.year} id="year-error" />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="year-hint">
                    {t('listings:newListingYearHint', 'Manufacturing year')}
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
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="mileage-hint">
                    {t('listings:newListingMileageHint', 'Total kilometers driven')}
                  </p>
                  </div>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-describedby="transmission-hint"
                  >
                    <option value="">{t('listings:newListingTransmissionSelect', 'Select transmission type')}</option>
                    <option value="automatic">{t('listings:newListingTransmissionAutomatic', 'Automatic')}</option>
                    <option value="manual">{t('listings:newListingTransmissionManual', 'Manual')}</option>
                    <option value="cvt">{t('listings:newListingTransmissionCVT', 'CVT')}</option>
                  </select>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-describedby="fuelType-hint"
                  >
                    <option value="">{t('listings:newListingFuelTypeSelect', 'Select fuel type')}</option>
                    <option value="gasoline">{t('listings:newListingFuelTypeGasoline', 'Gasoline')}</option>
                    <option value="diesel">{t('listings:newListingFuelTypeDiesel', 'Diesel')}</option>
                    <option value="hybrid">{t('listings:newListingFuelTypeHybrid', 'Hybrid')}</option>
                    <option value="electric">{t('listings:newListingFuelTypeElectric', 'Electric')}</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="fuelType-hint">
                    {t('listings:newListingFuelTypeHint', 'Type of fuel or power source')}
                  </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location and Contact */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Step Header */}
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {t('listings:newListingStep3Title', 'Location & Contact')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('listings:newListingStep3Description', 'Where to find you and how to get in touch')}
                  </p>
                </div>

                {/* Location Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {t('listings:newListingLocationInfo', 'Location Information')}
                  </h3>
                  
                  {/* Governorate and Location Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Governorate */}
                    <div className="space-y-3">
                      <label 
                        htmlFor="governorateSlug" 
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingGovernorate', 'Governorate')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="governorateSlug"
                        name="governorateSlug"
                        value={formData.governorateSlug}
                        onChange={handleChange}
                        disabled={isLoadingGovernorates}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
                      </select>
                      <ErrorMessage error={formErrors.governorateSlug} id="governorateSlug-error" />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="governorateSlug-hint">
                        {t('listings:newListingGovernorateHint', 'Select the governorate where the car is located')}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                      <label 
                        htmlFor="locationSlug" 
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingLocation', 'Location')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="locationSlug"
                        name="locationSlug"
                        value={formData.locationSlug}
                        onChange={handleChange}
                        disabled={isLoadingLocations || !formData.governorateSlug || formData.governorateSlug.trim() === ''}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          formErrors.locationSlug ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        } ${(isLoadingLocations || !formData.governorateSlug || formData.governorateSlug.trim() === '') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-invalid={!!formErrors.locationSlug}
                        aria-describedby={formErrors.locationSlug ? 'locationSlug-error' : 'locationSlug-hint'}
                      >
                        <option value="">
                          {!formData.governorateSlug || formData.governorateSlug.trim() === ''
                            ? t('listings:newListingSelectGovernorateFirst', 'Select a governorate first')
                            : isLoadingLocations
                            ? t('listings:newListingLoadingLocations', 'Loading locations...')
                            : t('listings:newListingSelectLocation', 'Select a location')
                          }
                        </option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.slug}>
                            {i18n.language === 'ar' ? location.displayNameAr : location.displayNameEn}
                          </option>
                        ))}
                      </select>
                      <ErrorMessage error={formErrors.locationSlug} id="locationSlug-error" />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="locationSlug-hint">
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
                  
                  {/* Contact Name and Phone Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Name */}
                    <div className="space-y-3">
                      <label 
                        htmlFor="contactName" 
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingContactName', 'Contact Name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          formErrors.contactName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder={t('listings:newListingContactNamePlaceholder', 'Your Name')}
                        aria-invalid={!!formErrors.contactName}
                        aria-describedby={formErrors.contactName ? 'contactName-error' : 'contactName-hint'}
                      />
                      <ErrorMessage error={formErrors.contactName} id="contactName-error" />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="contactName-hint">
                        {t('listings:newListingContactNameHint', 'Name for potential buyers to contact')}
                      </p>
                    </div>

                    {/* Contact Phone */}
                    <div className="space-y-3">
                      <label 
                        htmlFor="contactPhone" 
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingContactPhone', 'Contact Phone')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          formErrors.contactPhone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder={t('listings:newListingContactPhonePlaceholder', 'e.g., +965 12345678')}
                        aria-invalid={!!formErrors.contactPhone}
                        aria-describedby={formErrors.contactPhone ? 'contactPhone-error' : 'contactPhone-hint'}
                      />
                      <ErrorMessage error={formErrors.contactPhone} id="contactPhone-error" />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="contactPhone-hint">
                        {t('listings:newListingContactPhoneHint', 'Phone number for inquiries')}
                      </p>
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-3">
                    <label 
                      htmlFor="contactEmail" 
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {t('listings:newListingContactEmail', 'Contact Email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        formErrors.contactEmail ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder={t('listings:newListingContactEmailPlaceholder', 'your.email@example.com')}
                      aria-invalid={!!formErrors.contactEmail}
                      aria-describedby={formErrors.contactEmail ? 'contactEmail-error' : 'contactEmail-hint'}
                    />
                    <ErrorMessage error={formErrors.contactEmail} id="contactEmail-error" />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="contactEmail-hint">
                      {t('listings:newListingContactEmailHint', 'Email address for inquiries')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Step 4 Header */}
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {t('listings:newListingStep4Title', 'Upload Images')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {t('listings:newListingStep4Description', 'Add high-quality photos to showcase your car and attract potential buyers.')}
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {t('listings:newListingCarImages', 'Car Images')}
                  </h3>
                  
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">{t('listings:newListingUploadImages', 'Click to upload images')}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('listings:newListingImageFormats', 'PNG, JPG, JPEG (MAX. 5MB each)')}
                          </p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          aria-describedby="image-upload-hint"
                        />
                      </label>
                    </div>
                    <ErrorMessage error={formErrors.images} id="images-error" />
                    <p className="text-xs text-gray-500 dark:text-gray-400" id="image-upload-hint">
                      {t('listings:newListingImageUploadHint', 'Upload multiple images to showcase your car. First image will be the main photo.')}
                    </p>
                  </div>

                  {/* Image Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                        {t('listings:newListingImagePreview', 'Image Preview')} ({formData.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imagePreviewUrls.map((url: string, index: number) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                              <Image
                                src={url}
                                alt={`Car listing image ${index + 1} - uploaded preview for ${formData.title || 'new listing'}`}
                                fill
                                className="object-cover transition-transform duration-200 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              ×
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                {t('listings:newListingMainImage', 'Main')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                aria-label="Go to previous step"
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className={`w-4 h-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={i18n.language === 'ar' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                </svg>
                {t('common:previous', 'Previous')}
              </button>
              
              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={() => handleStepChange(currentStep + 1)}
                  aria-label="Go to next step"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {t('common:next', 'Next')}
                  <svg className={`w-4 h-4 ${i18n.language === 'ar' ? 'mr-2' : 'ml-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={i18n.language === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <svg className={`animate-spin h-4 w-4 text-white ${i18n.language === 'ar' ? 'ml-3 -mr-1' : '-ml-1 mr-3'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('listings:newListingSubmitting', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      {t('listings:newListingSubmit', 'Submit Listing')}
                      <svg className={`w-4 h-4 ${i18n.language === 'ar' ? 'mr-2' : 'ml-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Success Alert */}
      <SuccessAlert
        message={t('listings:newListingSuccessMessage', 'Listing created successfully!')}
        visible={showSuccessAlert}
        onComplete={handleSuccessAlertComplete}
        autoHideDuration={3000}
      />
    </div>
  );
}
