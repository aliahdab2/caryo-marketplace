"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import Image from "next/image";
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
import NumericInput from '@/components/ui/NumericInput';
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMemo as useMemoPerf, useCallback as useCallbackPerf } from 'react';
import { useDirection } from '@/utils/direction';
import { createRTLHelpers } from '@/utils/rtlHelpers';
import { ImageUploadSection } from './ImageUploadSection';
import { VideoUploadSection } from './VideoUploadSection';

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
function useThrottle<T extends (...args: any[]) => any>(func: T, delay: number): T { // eslint-disable-line @typescript-eslint/no-explicit-any -- Necessary for generic function throttling
  const lastRun = useRef(Date.now());
  
  return useCallbackPerf((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      func(...args);
      lastRun.current = Date.now();
    }
  }, [func, delay]) as T;
}
import { 
  ListingWizardProps, 
  ErrorMessageProps 
} from '@/types/wizard';

// Constants
const TOTAL_STEPS = 4;
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
const wizardLogger = createLogger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_WIZARD === 'true',
  level: 'debug',
  prefix: 'LISTING_WIZARD'
});
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

// Memoized image preview component for better performance
const _ImagePreview = memo(function ImagePreview({ 
  url, 
  index, 
  isMainPhoto, 
  fileSize,
  isDragging,
  isDragOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isRTL
}: {
  url: string;
  index: number;
  isMainPhoto: boolean;
  fileSize?: number;
  isDragging: boolean;
  isDragOver: boolean;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isRTL: boolean;
}) {
  return (
    <div
      className={`relative group cursor-move transition-all duration-300 ${
        isDragging
          ? 'scale-105 rotate-2 opacity-75 z-10'
          : isDragOver
          ? 'scale-105 ring-4 ring-blue-300 dark:ring-blue-600'
          : 'hover:scale-[1.02]'
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Image Container */}
      <div className={`aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 relative border-2 transition-all duration-300 ${
        isMainPhoto 
          ? 'border-blue-400 dark:border-blue-500 shadow-lg' 
          : 'border-gray-200 dark:border-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-500'
      }`}>
        <Image
          src={url}
          alt={`Car listing image ${index + 1}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          draggable={false}
          priority={index === 0} // Prioritize main image
        />
        
        {/* Drag Handle Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 backdrop-blur-sm">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110`}
        aria-label={`Remove image ${index + 1}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main Photo Badge */}
      {isMainPhoto && (
        <div className={`absolute bottom-2 ${isRTL ? 'end-2' : 'start-2'} bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-medium">Main Photo</span>
        </div>
      )}

      {/* Image Number Badge */}
      <div className={`absolute top-2 ${isRTL ? 'end-2' : 'start-2'} bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm`}>
        {index + 1}
          </div>

      {/* File Info on Hover */}
      {fileSize && (
        <div className={`absolute bottom-2 ${isRTL ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {typeof fileSize === 'number' ? (fileSize / 1024 / 1024).toFixed(1) + 'MB' : ''}
        </div>
      </div>
      )}
    </div>
  );
});

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

// Virtualized select component for large datasets
const _VirtualizedSelect = memo(function VirtualizedSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  isLoading, 
  className = "",
  maxHeight = 200,
  itemHeight = 40,
  ...props 
}: {
  options: Array<{ id: string; name: string; nameAr?: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isLoading?: boolean;
  className?: string;
  maxHeight?: number;
  itemHeight?: number;
  [key: string]: unknown;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleStart, setVisibleStart] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible items for virtual scrolling
  const visibleCount = Math.ceil(maxHeight / itemHeight);
  const visibleEnd = Math.min(visibleStart + visibleCount + 2, options.length); // Buffer items
  
  const selectedOption = options.find(opt => opt.id === value);
  
  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const newStart = Math.floor(scrollTop / itemHeight);
    setVisibleStart(Math.max(0, newStart - 1)); // Add buffer
  }, 16); // 60fps throttling
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
        {...props}
      >
        {isLoading ? "Loading..." : selectedOption?.name || placeholder}
      </button>
      
      {isOpen && !isLoading && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg"
          style={{ maxHeight }}
          onScroll={handleScroll}
        >
          <div style={{ height: options.length * itemHeight, position: 'relative' }}>
            {options.slice(visibleStart, visibleEnd).map((option, index) => (
              <div
                key={option.id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                style={{ 
                  position: 'absolute',
                  top: (visibleStart + index) * itemHeight,
                  height: itemHeight,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                {option.name}
      </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

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
  const previousButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

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
  

  
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [_existingVideos, setExistingVideos] = useState<string[]>([]);
  const [imagesInitialized, setImagesInitialized] = useState(false);
  const [videosInitialized, setVideosInitialized] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [_draggedImageIndex, _setDraggedImageIndex] = useState<number | null>(null);
  const [_dragOverImageIndex, _setDragOverImageIndex] = useState<number | null>(null);
  
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

  // Load existing images and videos when formData changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && formData) {
      // Load existing images (only if not already initialized to prevent duplicates)
      if (formData.existingImageUrls && formData.existingImageUrls.length > 0 && !imagesInitialized) {
        setExistingImages(formData.existingImageUrls);
        // Set preview URLs to only existing images initially
        setImagePreviewUrls(formData.existingImageUrls);
        setImagesInitialized(true);
      }

      // Load existing videos (only if not already initialized to prevent duplicates)
      if (formData.existingVideoUrls && formData.existingVideoUrls.length > 0 && !videosInitialized) {
        setExistingVideos(formData.existingVideoUrls);
        setVideoPreviewUrls(formData.existingVideoUrls);
        setVideosInitialized(true);
      }
    }
  }, [mode, formData.existingImageUrls, formData.existingVideoUrls, imagesInitialized, videosInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Optimized image upload handler with better memory management
  const handleImageUpload = useCallbackPerf((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    wizardLogger.debug('handleImageUpload');

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
    }

    wizardLogger.debug('Valid files: ' + String(validFiles.length));
    wizardLogger.debug('New URLs: ' + String(newUrls.length));

    if (validFiles.length > 0) {
      setFormData(prev => {
        const newImages = [...prev.images, ...validFiles];
        wizardLogger.debug('Updated images length ' + String(newImages.length));
        return {
          ...prev,
          images: newImages
        };
      });
      setImagePreviewUrls(prev => {
        const newPreviewUrls = [...prev, ...newUrls];
        wizardLogger.debug('Updated preview URLs length ' + String(newPreviewUrls.length));
        return newPreviewUrls;
      });
    }
  }, []);

  // Remove image handler
  const removeImage = useCallback((index: number) => {
    // allImagesCount calculation removed - not used
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
  }, [existingImages, imagePreviewUrls]);

  // Optimized drag and drop handlers with throttling
  const _handleDragOver = useThrottle(useCallbackPerf((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []), 100);

  const _handleDragLeave = useCallbackPerf((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const _handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    wizardLogger.debug('handleDrop');

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
    });

    wizardLogger.debug('Valid files from drop ' + String(validFiles.length));
    wizardLogger.debug('New URLs from drop ' + String(newUrls.length));

    if (validFiles.length > 0) {
      setFormData(prev => {
        const newImages = [...prev.images, ...validFiles];
        wizardLogger.debug('Updated images from drop ' + String(newImages.length));
        return {
          ...prev,
          images: newImages
        };
      });
      setImagePreviewUrls(prev => {
        const newPreviewUrls = [...prev, ...newUrls];
        wizardLogger.debug('Updated preview URLs from drop ' + String(newPreviewUrls.length));
        return newPreviewUrls;
      });
    }
  }, []);

  // Image drag and drop reordering handlers
  const _handleImageDragStart = useCallback((e: React.DragEvent, index: number) => {
    _setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const _handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    _setDragOverImageIndex(index);
  }, []);

  const _handleImageDragLeave = useCallback(() => {
    _setDragOverImageIndex(null);
  }, []);

  const _handleImageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (_draggedImageIndex === null || _draggedImageIndex === dropIndex) return;

    // Reorder both images and preview URLs
    const newImages = [...formData.images];
    const newPreviewUrls = [...imagePreviewUrls];

    const draggedImage = newImages[_draggedImageIndex];
    const draggedPreviewUrl = newPreviewUrls[_draggedImageIndex];

    newImages.splice(_draggedImageIndex, 1);
    newPreviewUrls.splice(_draggedImageIndex, 1);

    newImages.splice(dropIndex, 0, draggedImage);
    newPreviewUrls.splice(dropIndex, 0, draggedPreviewUrl);

    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviewUrls(newPreviewUrls);
    _setDraggedImageIndex(null);
    _setDragOverImageIndex(null);
  }, [_draggedImageIndex, formData.images, imagePreviewUrls]);

  const _handleImageDragEnd = useCallback(() => {
    _setDraggedImageIndex(null);
    _setDragOverImageIndex(null);
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

  // addVideoUrl removed - not used in current implementation

  // Remove video URL handler
  const removeVideoUrl = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      videoUrls: (prev.videoUrls || []).filter((_, i) => i !== index)
    }));
  }, []);

  // Video URL change handler
  const handleVideoUrlChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newVideoUrls = [...(prev.videoUrls || [])];
      const isYouTube = /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(value);
      if (newVideoUrls[index]) {
        newVideoUrls[index].url = value;
        newVideoUrls[index].isValidated = isYouTube;
      } else {
        newVideoUrls[index] = { 
          url: value, 
          isValidated: isYouTube 
        };
      }
      return { ...prev, videoUrls: newVideoUrls };
    });
  }, []);

  // Helper function to get video embed URL
  const _getVideoEmbedUrl = useCallback((url: string): string | null => {
    if (!url) return null;
    
    // YouTube URLs
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo removed
    
    return null;
  }, []);

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
              <span>{t('listings:newListingStepCounter', 'Step {{current}} of {{total}}', { current: currentStep, total: TOTAL_STEPS })}</span>
              <div className="flex items-center gap-4">
                {/* Auto-save indicator (only in create mode) */}
                {mode === 'create' && autoSave && (
                  <AutoSaveIndicator
                    status={autoSaveHook.autoSaveStatus}
                    lastSaved={autoSaveHook.lastSaved}
                    className="text-xs"
                  />
                )}
                <span>{t('listings:progressComplete', '{{percent}}% Complete', { percent: progressPercentage })}</span>
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
          <form ref={formRef} onSubmit={handleSubmit}>
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
                    onChange={handleMakeChange}
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
                      <option key={make.id} value={make.slug}>
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
                    onChange={createDropdownHandler('model', 'modelId', carModels)}
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
                      <option key={model.id} value={model.slug}>
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
                    onChange={handleFieldChange('year')}
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
                    onChange={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
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
                      onChange={handleFieldChange('engine')}
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
                      onChange={createDropdownHandler('transmission', 'transmissionId', transmissions)}
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
                        <option key={transmission.id} value={transmission.slug}>
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
                      onChange={handleFieldChange('color')}
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
                      onChange={createDropdownHandler('fuelType', 'fuelTypeId', fuelTypes)}
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
                        <option key={fuelType.id} value={fuelType.slug}>
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
                    onChange={handleFieldChange('title')}
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
                    onChange={handleFieldChange('description')}
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
                <div className="space-y-8">
                  <ImageUploadSection
                    formData={formData}
                    onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                    formErrors={formErrors}
                    isRTL={isRTL}
                    imagePreviewUrls={imagePreviewUrls}
                    existingImages={existingImages}
                    isDragOver={isDragOver}
                    setIsDragOver={setIsDragOver}
                    setImagePreviewUrls={setImagePreviewUrls}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                  />

                  <VideoUploadSection
                    formData={formData}
                    onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                    formErrors={formErrors}
                    isRTL={isRTL}
                    videoPreviewUrls={videoPreviewUrls}
                    existingVideos={_existingVideos}
                    isDragOver={isDragOver}
                    setIsDragOver={setIsDragOver}
                    setVideoPreviewUrls={setVideoPreviewUrls}
                    onVideoUpload={handleVideoUpload}
                    onRemoveVideo={removeVideo}
                    onRemoveVideoUrl={removeVideoUrl}
                    onVideoUrlChange={handleVideoUrlChange}
                    isAnyVideoFeatureEnabled={isAnyVideoFeatureEnabled}
                    isVideoUploadEnabled={isVideoUploadEnabled}
                    isVideoUrlEnabled={isVideoUrlEnabled}
                    rtl={rtl}
                  />
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
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingPrice', 'Price')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleFieldChange('price')}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          formErrors.price ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder={t('listings:newListingPricePlaceholder', '25000')}
                        aria-invalid={!!formErrors.price}
                        aria-describedby={formErrors.price ? 'price-error' : 'price-hint'}
                      />
                      <ErrorMessage error={formErrors.price} id="price-error" />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="price-hint">
                        {t('listings:newListingPriceHint', 'Enter the asking price for your vehicle')}
                      </p>
                    </div>

                    {/* Currency */}
                    <div className="space-y-3">
                      <label 
                        htmlFor="currency" 
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingCurrency', 'Currency')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleFieldChange('currency')}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          formErrors.currency ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        aria-invalid={!!formErrors.currency}
                        aria-describedby={formErrors.currency ? 'currency-error' : 'currency-hint'}
                      >
                        <option value="SYP">{t('listings:currencySYP', 'Syrian Pound (SYP)')}</option>
                        <option value="USD">{t('listings:currencyUSD', 'US Dollar (USD)')}</option>
                      </select>
                      <ErrorMessage error={formErrors.currency} id="currency-error" />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="currency-hint">
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
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {t('listings:newListingGovernorate', 'Governorate')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="governorateSlug"
                        name="governorateSlug"
                        value={formData.governorateSlug}
                        onChange={handleGovernorateChange}
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
                        onChange={createDropdownHandler('locationSlug', 'locationId', locations)}
                        disabled={isLoadingLocations || !formData.governorateSlug || formData.governorateSlug.trim() === ''}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
                        onChange={handleFieldChange('contactName')}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          formErrors.contactName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder={t('listings:newListingContactNamePlaceholder', 'Your full name')}
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
                        onChange={handleFieldChange('contactPhone')}
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
                      onChange={handleFieldChange('contactEmail')}
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

                  {/* Contact Preference */}
                  <div className="space-y-3">
                    <label 
                      htmlFor="contactPreference" 
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {t('listings:newListingContactPreference', 'Preferred Contact Method')}
                    </label>
                    <select
                      id="contactPreference"
                      name="contactPreference"
                      value={formData.contactPreference}
                      onChange={handleFieldChange('contactPreference')}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        formErrors.contactPreference ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      }`}
                      aria-invalid={!!formErrors.contactPreference}
                      aria-describedby={formErrors.contactPreference ? 'contactPreference-error' : 'contactPreference-hint'}
                    >
                      <option value="email">{t('listings:contactPreferenceEmail', 'Email')}</option>
                      <option value="phone">{t('listings:contactPreferencePhone', 'Phone')}</option>
                      <option value="both">{t('listings:contactPreferenceBoth', 'Both Email and Phone')}</option>
                    </select>
                    <ErrorMessage error={formErrors.contactPreference} id="contactPreference-error" />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id="contactPreference-hint">
                      {t('listings:newListingContactPreferenceHint', 'How would you prefer buyers to contact you?')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Navigation (sticky on mobile) */}
            <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-0">
              <div className="order-2 sm:order-1">
                <button
                  ref={previousButtonRef}
                  type="button"
                  onClick={(e) => handleStepChange(currentStep - 1, e)}
                  disabled={currentStep === 1}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className={`w-4 h-4 ${rtl.spacing.mr('2')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={rtl.arrows.leftArrow} />
                  </svg>
                  {t('common:previous')}
                </button>
              </div>
              
              {currentStep < TOTAL_STEPS ? (
                <button
                  ref={nextButtonRef}
                  type="button"
                  onClick={(e) => handleStepChange(currentStep + 1, e)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-lg hover:shadow-xl order-1 sm:order-2"
                >
                  {t('common:next')}
                  <svg className={`w-4 h-4 ${rtl.spacing.ml('2')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={rtl.arrows.rightArrow} />
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
