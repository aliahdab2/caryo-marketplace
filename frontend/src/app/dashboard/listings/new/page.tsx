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

// Clean and direct error message component following UX best practices
interface ErrorMessageProps {
  error?: string;
  id?: string;
  className?: string;
}

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
interface UploadProgressProps {
  progress: number;
  fileName: string;
  isComplete: boolean;
}

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
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={roundedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Upload progress for ${fileName}: ${roundedProgress}%`}
        />
      </div>
    </div>
  );
});

export default function NewListingPage() {
  const router = useRouter();
  const { t, i18n } = useLazyTranslation(['dashboard', 'listings', 'common', 'errors']);
  
  // Video feature configuration
  const isVideoUploadEnabled = process.env.NEXT_PUBLIC_VIDEO_UPLOAD_ENABLED === 'true';
  const isVideoUrlEnabled = process.env.NEXT_PUBLIC_VIDEO_URL_ENABLED === 'true';
  const isAnyVideoFeatureEnabled = isVideoUploadEnabled || isVideoUrlEnabled;

  // Video URL utilities
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getVimeoVideoId = (url: string): string | null => {
    const pattern = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`;
    }
    
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    return null;
  };

  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoUrl, setShowVideoUrl] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  // Progress tracking states (for future implementation)
  // const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  // const [isUploadingImages, setIsUploadingImages] = useState(false);
  // const [isUploadingVideo, setIsUploadingVideo] = useState(false);
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
    videos: [],
    videoUrls: [],
    categoryId: "1"
  });

  // Store image object URLs for preview
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  // Store video object URLs for preview
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);

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

  useEffect(() => {
    // Create managed object URLs for video previews
    if (formData.videos && formData.videos.length > 0) {
      const newUrls = formData.videos.map(file => URL.createObjectURL(file));
      setVideoPreviewUrls(newUrls);

      // Cleanup: revoke object URLs to prevent memory leaks
      return () => {
        newUrls.forEach(url => URL.revokeObjectURL(url));
      };
    } else {
      setVideoPreviewUrls([]);
    }
  }, [formData.videos]);

  // Auto-open video upload toggle when there are videos
  useEffect(() => {
    if (formData.videos && formData.videos.length > 0) {
      setShowVideoUpload(true);
    }
  }, [formData.videos]);

  // Auto-open video URL toggle when there's a URL
  useEffect(() => {
    if (formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0]) {
      setShowVideoUrl(true);
    }
  }, [formData.videoUrls]);

  // Auto-open the only available option when only one feature is enabled
  useEffect(() => {
    if (isVideoUploadEnabled && !isVideoUrlEnabled) {
      setShowVideoUpload(true);
    } else if (!isVideoUploadEnabled && isVideoUrlEnabled) {
      setShowVideoUrl(true);
    }
  }, [isVideoUploadEnabled, isVideoUrlEnabled]);

  // Image handling functions
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files with friendly error messages
    let hasErrors = false;
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        setFormErrors(prev => ({
          ...prev,
          images: `The file "${file.name}" is ${fileSizeMB}MB, which is larger than our 5MB limit. Please try a smaller image or compress it first.`
        }));
        hasErrors = true;
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          images: `The file "${file.name}" isn't an image file. Please select PNG, JPG, or JPEG files only.`
        }));
        hasErrors = true;
        return false;
      }
      return true;
    });

    if (hasErrors) return;

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

  // Drag and drop handlers for images
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      if (nonImageFiles.length === 1) {
        setFormErrors(prev => ({
          ...prev,
          images: `The file "${nonImageFiles[0].name}" isn't an image. Please drop PNG, JPG, or JPEG files only.`
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          images: `None of the dropped files are images. Please drop PNG, JPG, or JPEG files only.`
        }));
      }
      return;
    }

    // Validate files with friendly error messages
    let hasValidationErrors = false;
    const validFiles = imageFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        setFormErrors(prev => ({
          ...prev,
          images: `The file "${file.name}" is ${fileSizeMB}MB, which is larger than our 5MB limit. Please try a smaller image or compress it first.`
        }));
        hasValidationErrors = true;
        return false;
      }
      return true;
    });

    if (hasValidationErrors || validFiles.length === 0) return;

    // Check total count limit with helpful messaging
    const currentCount = formData.images.length;
    const remainingSlots = 10 - currentCount;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length < validFiles.length) {
      const rejected = validFiles.length - filesToAdd.length;
      setFormErrors(prev => ({
        ...prev,
        images: `You can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} (maximum 10 total). ${rejected} file${rejected !== 1 ? 's were' : ' was'} not added.`
      }));
    }

    if (filesToAdd.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...filesToAdd]
      }));
      
      // Clear any existing errors
      setFormErrors(prev => {
        const { images: _images, ...rest } = prev;
        return rest;
      });
    }
  }, [formData.images.length]);

  // Image reordering handlers
  const handleImageDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for drag to work
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverImageIndex(index);
  }, []);

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the thumbnail entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverImageIndex(null);
    }
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverImageIndex(null);
    
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      return;
    }

    // Reorder both images array and preview URLs
    const newImages = [...formData.images];
    const newPreviewUrls = [...imagePreviewUrls];
    
    // Remove dragged items
    const [draggedImage] = newImages.splice(draggedImageIndex, 1);
    const [draggedPreviewUrl] = newPreviewUrls.splice(draggedImageIndex, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    newPreviewUrls.splice(dropIndex, 0, draggedPreviewUrl);
    
    // Update state
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    
    // Update preview URLs directly since they're managed separately
    setImagePreviewUrls(newPreviewUrls);
    
    setDraggedImageIndex(null);
  }, [draggedImageIndex, formData.images, imagePreviewUrls]);

  const handleImageDragEnd = useCallback(() => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, []);

  // Video handling functions
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVideoUploadEnabled) {
      setFormErrors(prev => ({ 
        ...prev, 
        videos: 'Video uploads are temporarily unavailable. You can still add video URLs if that option is enabled.' 
      }));
      return;
    }
    
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check video limit first (max 1 video file)
    if (formData.videos && formData.videos.length > 0) {
      setFormErrors(prev => ({ 
        ...prev, 
        videos: 'You can only upload one video per listing. Please remove the current video first if you want to upload a different one.' 
      }));
      return;
    }

    // Validate video files with friendly messages
    let hasValidationErrors = false;
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        setFormErrors(prev => ({ 
          ...prev, 
          videos: `The file "${file.name}" isn't a video file. Please select MP4, MOV, AVI, or other video formats.` 
        }));
        hasValidationErrors = true;
        return false;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        setFormErrors(prev => ({ 
          ...prev, 
          videos: `The video "${file.name}" is ${fileSizeMB}MB, which exceeds our 100MB limit. Please try a smaller video or compress it first.` 
        }));
        hasValidationErrors = true;
        return false;
      }
      return true;
    });

    if (hasValidationErrors || validFiles.length === 0) return;

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        videos: [validFiles[0]] // Only take the first video file
      }));
      setFormErrors(prev => {
        const { videos: _videos, ...rest } = prev;
        return rest;
      });
    }
  }, [formData.videos, isVideoUploadEnabled]);

  const removeVideo = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleVideoUrlChange = useCallback((url: string) => {
    if (!isVideoUrlEnabled) {
      setFormErrors(prev => ({ 
        ...prev, 
        videoUrls: 'External video URLs are temporarily unavailable. You can still upload video files if that option is enabled.' 
      }));
      return;
    }
    
    // Basic URL validation for YouTube and Vimeo
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}.*$/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+.*$/;
    const generalUrlRegex = /^https?:\/\/.+/;

    if (url.trim() === '') {
      setFormData(prev => ({
        ...prev,
        videoUrls: []
      }));
      setFormErrors(prev => {
        const { videoUrls: _videoUrls, ...rest } = prev;
        return rest;
      });
      return;
    }

    if (!youtubeRegex.test(url) && !vimeoRegex.test(url) && !generalUrlRegex.test(url)) {
      if (!url.startsWith('http')) {
        setFormErrors(prev => ({ 
          ...prev, 
          videoUrls: 'Please enter a complete URL starting with "https://" (for example: https://youtube.com/watch?v=...)' 
        }));
      } else {
        setFormErrors(prev => ({ 
          ...prev, 
          videoUrls: 'This URL doesn\'t look like a video link. Please use YouTube, Vimeo, or other video platform URLs.' 
        }));
      }
      // Still update the formData to show the invalid URL in the input
      setFormData(prev => ({
        ...prev,
        videoUrls: [url]
      }));
      return;
    }

    // Check external video limit (max 1 external video) - but allow updating existing URL
    if (formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0] !== url) {
      setFormErrors(prev => ({ ...prev, videoUrls: t('listings:videoLimitReached', 'Maximum video limit reached') }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      videoUrls: [url]
    }));
    setFormErrors(prev => {
      const { videoUrls: _videoUrls, ...rest } = prev;
      return rest;
    });
  }, [formData.videoUrls, t, isVideoUrlEnabled]);

  const removeVideoUrl = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      videoUrls: prev.videoUrls?.filter((_, i) => i !== index) || []
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
            {t('listings:newListingTitle', 'Create New Listing')}
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
                      className={`absolute top-6 start-12 w-20 h-0.5 transition-colors duration-300 ${
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
        
        <ErrorMessage error={error || undefined} id="general-error" />

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
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold me-2 dark:bg-blue-900 dark:text-blue-300">
                      📝
                    </span>
                    {t('listings:newListingTitle', 'Listing Title')}
                    <span className="text-red-500 ms-1">*</span>
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
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-semibold me-2 dark:bg-green-900 dark:text-green-300">
                        💰
                      </span>
                      {t('listings:newListingPrice', 'Price')}
                      <span className="text-red-500 ms-1">*</span>
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
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold me-2 dark:bg-blue-900 dark:text-blue-300">
                        💱
                      </span>
                      {t('listings:newListingCurrency', 'Currency')}
                      <span className="text-red-500 ms-1">*</span>
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
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold me-2 dark:bg-purple-900 dark:text-purple-300">
                      📄
                    </span>
                    {t('listings:newListingDescription', 'Description')}
                    <span className="text-red-500 ms-1">*</span>
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
                  
                  {/* Enhanced Image Upload Section with Drag & Drop */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-center w-full">
                      <div
                        className={`w-full transition-all duration-300 ${
                          isDragOver 
                            ? 'scale-[1.02] shadow-xl ring-4 ring-blue-200 dark:ring-blue-700' 
                            : 'hover:shadow-lg'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <label 
                          htmlFor="image-upload" 
                          className={`group flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-200 dark:focus-within:ring-blue-800 ${
                            isDragOver
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                          role="button"
                          tabIndex={0}
                          aria-label="Upload car images by clicking or dragging files here"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              document.getElementById('image-upload')?.click();
                            }
                          }}
                        >
                          <div className="flex flex-col items-center justify-center pt-8 pb-8 space-y-6">
                            {/* Enhanced Upload Icon */}
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                              isDragOver 
                                ? 'bg-blue-100 dark:bg-blue-800/50 scale-110' 
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 group-hover:scale-105'
                            }`}>
                              <svg className={`w-10 h-10 transition-colors duration-300 ${
                                isDragOver 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                              </svg>
                            </div>

                            {/* Main Text */}
                            <div className="text-center space-y-3">
                              <h4 className={`text-xl font-semibold transition-colors duration-300 ${
                                isDragOver 
                                  ? 'text-blue-800 dark:text-blue-200' 
                                  : 'text-gray-700 dark:text-gray-200'
                              }`}>
                                {isDragOver 
                                  ? t('listings:dropImagesHere', 'Drop your images here!')
                                  : t('listings:newListingUploadImages', 'Upload Car Images')
                                }
                              </h4>
                              
                              <p className={`text-base transition-colors duration-300 ${
                                isDragOver 
                                  ? 'text-blue-600 dark:text-blue-300' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {isDragOver 
                                  ? 'Release to add images to your listing'
                                  : 'Drag & drop images here, or click to browse'
                                }
                              </p>

                              {/* Format info moved below and muted */}
                              <div className="pt-2 space-y-1">
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  {t('listings:newListingImageUploadHint', 'Upload multiple images to showcase your car. First image will be the main photo.')}
                                </p>
                                <div className="flex items-center justify-center space-x-6 text-xs text-gray-400 dark:text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>PNG, JPG, JPEG</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Max 5MB each</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Up to 10 images</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <input
                            id="image-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            aria-describedby="image-upload-hint"
                            aria-label="Select car images to upload (PNG, JPG, JPEG, max 5MB each, up to 10 images)"
                          />
                        </label>
                      </div>
                    </div>
                    <ErrorMessage error={formErrors.images} id="images-error" />
                    
                    {/* Upload Progress Indicators - TODO: Implement progress tracking */}
                    {/* {Object.keys(uploadProgress).length > 0 && (
                      <div className="space-y-3" aria-live="polite" aria-label="Upload progress">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Uploading images...
                        </h5>
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                          <UploadProgress
                            key={fileName}
                            fileName={fileName}
                            progress={progress}
                            isComplete={progress >= 100}
                          />
                        ))}
                      </div>
                    )} */}
                  </div>

                  {/* Enhanced Image Preview Grid with Drag & Drop Reordering */}
                  {formData.images.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {t('listings:newListingImagePreview', 'Image Preview')} ({formData.images.length})
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Drag images to reorder • First image is your main photo
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formData.images.length}/10 images
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {imagePreviewUrls.map((url: string, index: number) => (
                          <div
                            key={`${url}-${index}`}
                            className={`relative group cursor-move transition-all duration-300 ${
                              draggedImageIndex === index
                                ? 'scale-105 rotate-2 opacity-75 z-10'
                                : dragOverImageIndex === index
                                ? 'scale-105 ring-4 ring-blue-300 dark:ring-blue-600'
                                : 'hover:scale-[1.02]'
                            }`}
                            draggable
                            onDragStart={(e) => handleImageDragStart(e, index)}
                            onDragOver={(e) => handleImageDragOver(e, index)}
                            onDragLeave={handleImageDragLeave}
                            onDrop={(e) => handleImageDrop(e, index)}
                            onDragEnd={handleImageDragEnd}
                          >
                            {/* Image Container */}
                            <div className={`aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 relative border-2 transition-all duration-300 ${
                              index === 0 
                                ? 'border-blue-400 dark:border-blue-500 shadow-lg' 
                                : 'border-gray-200 dark:border-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-500'
                            }`}>
                              <Image
                                src={url}
                                alt={`Car listing image ${index + 1} - uploaded preview for ${formData.title || 'new listing'}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                draggable={false}
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

                            {/* Enhanced Remove Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>

                            {/* Enhanced Main Photo Badge */}
                            {index === 0 && (
                              <div className="absolute bottom-2 start-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="font-medium">{t('listings:newListingMainImage', 'Main Photo')}</span>
                              </div>
                            )}

                            {/* Image Number Badge */}
                            <div className="absolute top-2 start-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                              {index + 1}
                            </div>

                            {/* File Info on Hover */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {(formData.images[index]?.size / 1024 / 1024).toFixed(1)}MB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reordering Instructions */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              💡 How to reorder your photos
                            </h5>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Drag and drop images to change their order. The first image will be your main listing photo that buyers see first.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Section - Conditionally rendered based on configuration */}
                  {isAnyVideoFeatureEnabled && (
                  <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('listings:videoFieldsTitle', 'Videos (Optional)')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {t('listings:videoFieldsSubtitle', 'Add videos to showcase your vehicle')}
                      </p>
                    </div>

                    {/* Video Options - Enhanced UX with Configuration Handling */}
                    <div className="space-y-4">
                      {/* Header with better description - Adaptive based on available options */}
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {isVideoUploadEnabled && isVideoUrlEnabled 
                            ? t('listings:videoSectionTitleBoth', "Choose how you'd like to add videos to your listing")
                            : isVideoUploadEnabled 
                              ? t('listings:videoSectionTitleUploadOnly', "Upload a video file to showcase your vehicle")
                              : t('listings:videoSectionTitleUrlOnly', "Add a video URL to showcase your vehicle")
                          }
                        </span>
                      </div>

                      {/* Enhanced Toggle Buttons - Responsive grid based on available options */}
                      <div className={`grid gap-4 ${
                        isVideoUploadEnabled && isVideoUrlEnabled 
                          ? 'grid-cols-1 md:grid-cols-2' 
                          : 'grid-cols-1'
                      }`}>
                        {isVideoUploadEnabled && (
                          <div className="group">
                            <button
                              type="button"
                              onClick={() => setShowVideoUpload(!showVideoUpload)}
                              className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 ${
                                showVideoUpload || (formData.videos && formData.videos.length > 0)
                                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-900 dark:text-blue-100 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                              } ${
                                !isVideoUrlEnabled ? 'ring-2 ring-blue-200 dark:ring-blue-700' : ''
                              }`}
                              aria-label={`Upload video file - ${showVideoUpload ? 'expanded' : 'collapsed'}`}
                              aria-expanded={showVideoUpload}
                              aria-describedby="video-upload-description"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                    showVideoUpload || (formData.videos && formData.videos.length > 0)
                                      ? 'bg-blue-500 text-white shadow-lg'
                                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40'
                                  }`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16l13-8z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-1">
                                      {t('listings:addVideoUpload', 'Upload Video File')}
                                      {!isVideoUrlEnabled && (
                                        <span className="ms-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                                          Only Option
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" id="video-upload-description">
                                      {t('listings:videoUploadToggleHelp', 'Upload a video file from your device')}
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mt-3">
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Max 100MB</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>3 min duration</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>MP4, MOV, AVI</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`transform transition-all duration-300 ${
                                  showVideoUpload ? 'rotate-90 scale-110' : 'group-hover:scale-105'
                                }`}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                              {(formData.videos && formData.videos.length > 0) && (
                                <div className="mt-3 flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                    {formData.videos.length} video file ready to upload
                                  </span>
                                </div>
                              )}
                            </button>
                          </div>
                        )}

                        {isVideoUrlEnabled && (
                          <div className="group">
                            <button
                              type="button"
                              onClick={() => setShowVideoUrl(!showVideoUrl)}
                              className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800 ${
                                showVideoUrl || (formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0])
                                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-900 dark:text-purple-100 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                              } ${
                                !isVideoUploadEnabled ? 'ring-2 ring-purple-200 dark:ring-purple-700' : ''
                              }`}
                              aria-label={`Add video URL - ${showVideoUrl ? 'expanded' : 'collapsed'}`}
                              aria-expanded={showVideoUrl}
                              aria-describedby="video-url-description"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                    showVideoUrl || (formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0])
                                      ? 'bg-purple-500 text-white shadow-lg'
                                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40'
                                  }`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-1">
                                      {t('listings:addVideoUrl', 'Add Video URL')}
                                      {!isVideoUploadEnabled && (
                                        <span className="ms-2 px-2 py-1 text-xs bg-purple-500 text-white rounded-full">
                                          Only Option
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" id="video-url-description">
                                      {t('listings:videoUrlToggleHelp', 'Add a YouTube, Vimeo, or other video URL')}
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mt-3">
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span>YouTube</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span>Vimeo</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span>External links</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`transform transition-all duration-300 ${
                                  showVideoUrl ? 'rotate-90 scale-110' : 'group-hover:scale-105'
                                }`}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                              {(formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0]) && (
                                <div className="mt-3 flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                    Video URL added and ready
                                  </span>
                                </div>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Configuration-aware messaging and tips */}
                      {!showVideoUpload && !showVideoUrl && (!formData.videos || formData.videos.length === 0) && (!formData.videoUrls || !formData.videoUrls[0]) && (
                        <div className="space-y-3">
                          {/* Pro tip - Always show when no videos are added */}
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  💡 {t('listings:videoProTip', 'Pro tip: Videos increase listing engagement by 3x')}
                                </h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {isVideoUploadEnabled && isVideoUrlEnabled 
                                    ? t('listings:videoSectionSubtitleBoth', "Upload a video file for the best quality, or add a YouTube/Vimeo link for easy sharing")
                                    : isVideoUploadEnabled 
                                      ? t('listings:videoSectionSubtitleUploadOnly', "Upload a video file to show your vehicle in action")
                                      : t('listings:videoSectionSubtitleUrlOnly', "Add a YouTube or Vimeo link to showcase your vehicle")
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Show disabled feature notice when upload is disabled but URL is enabled */}
                          {!isVideoUploadEnabled && isVideoUrlEnabled && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                    📹 Video Upload Currently Unavailable
                                  </h5>
                                  <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Direct video uploads are temporarily disabled. You can still add videos by sharing YouTube, Vimeo, or other video platform links.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show disabled URL notice when URL is disabled but upload is enabled */}
                          {isVideoUploadEnabled && !isVideoUrlEnabled && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                                    🔗 External Video URLs Currently Unavailable
                                  </h5>
                                  <p className="text-xs text-purple-700 dark:text-purple-300">
                                    External video links are temporarily disabled. You can upload video files directly from your device.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Video File Upload - Enhanced Animation */}
                    {isVideoUploadEnabled && showVideoUpload && (
                      <div className="animate-in slide-in-from-top-4 duration-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
                        <div className="space-y-6">
                          {/* Upload Header */}
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16l13-8z" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-semibold text-blue-900 dark:text-blue-100">
                                Upload Video File
                              </h5>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                Drag & drop or click to select
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center w-full">
                            <label 
                              htmlFor="video-upload" 
                              className="group flex flex-col items-center justify-center w-full h-56 border-2 border-blue-300 border-dashed rounded-2xl cursor-pointer bg-white/80 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg focus-within:ring-4 focus-within:ring-blue-200 dark:focus-within:ring-blue-800"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  document.getElementById('video-upload')?.click();
                                }
                              }}
                            >
                              <div className="flex flex-col items-center justify-center pt-6 pb-6 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                  </svg>
                                </div>
                                <div className="text-center space-y-2">
                                  <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                                    {t('listings:uploadVideoLabel', 'Choose your video file')}
                                  </p>
                                  <p className="text-sm text-blue-600 dark:text-blue-400">
                                    or drag and drop it here
                                  </p>
                                  <div className="flex items-center justify-center space-x-6 text-xs text-blue-500 dark:text-blue-400 mt-4">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>Max 100MB</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>3 min duration</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>MP4, MOV, AVI</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <input
                                id="video-upload"
                                type="file"
                                className="sr-only"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                aria-describedby="video-upload-hint video-upload-description"
                                aria-label="Select video file to upload (MP4, MOV, AVI, max 100MB, 3 minutes duration)"
                                disabled={formData.videos && formData.videos.length > 0}
                              />
                            </label>
                          </div>
                          <ErrorMessage error={formErrors.videos} id="videos-error" />
                          
                          {/* Video Upload Progress - TODO: Implement progress tracking */}
                          {/* {isUploadingVideo && formData.videos && formData.videos.length > 0 && (
                            <div className="mt-4" aria-live="polite">
                              <UploadProgress
                                fileName={formData.videos[0].name}
                                progress={uploadProgress[formData.videos[0].name] || 0}
                                isComplete={(uploadProgress[formData.videos[0].name] || 0) >= 100}
                              />
                            </div>
                          )} */}
                        </div>

                        {/* Enhanced Video Preview */}
                        {formData.videos && formData.videos.length > 0 && videoPreviewUrls.length > 0 && (
                          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4 mt-6 pt-6 border-t border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                    {t('listings:videoPreview', 'Video Preview')}
                                  </h4>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {formData.videos[0].name} • {(formData.videos[0].size / 1024 / 1024).toFixed(1)}MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVideo(0)}
                                className="flex items-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 text-sm font-medium"
                                aria-label="Remove video"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Remove</span>
                              </button>
                            </div>
                            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                              <video
                                src={videoPreviewUrls[0]}
                                controls
                                className="w-full max-w-2xl mx-auto"
                                style={{ maxHeight: '400px' }}
                                poster=""
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div className="absolute top-4 start-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                                <span className="text-white text-sm font-medium">Ready to upload</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* External Video URL - Enhanced UX */}
                    {isVideoUrlEnabled && showVideoUrl && (
                      <div className="animate-in slide-in-from-top-4 duration-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg">
                        <div className="space-y-6">
                          {/* URL Header */}
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-semibold text-purple-900 dark:text-purple-100">
                                Add Video URL
                              </h5>
                              <p className="text-sm text-purple-700 dark:text-purple-300">
                                Paste your video link below
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label htmlFor="video-url" className="block text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
                                {t('listings:videoUrlLabel', 'Video URL')}
                              </label>
                              <div className="relative">
                                <input
                                  type="url"
                                  id="video-url"
                                  placeholder={t('listings:videoUrlPlaceholder', 'https://youtube.com/watch?v=... or https://vimeo.com/...')}
                                  className="w-full px-4 py-4 pl-12 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-purple-900/20 dark:text-white transition-all duration-200 text-lg placeholder:text-gray-400"
                                  value={formData.videoUrls?.[0] || ''}
                                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                                  aria-describedby="video-url-hint video-url-description"
                                  aria-label="Enter video URL from YouTube, Vimeo, or other video platforms"
                                />
                                <div className="absolute start-4 top-1/2 transform -translate-y-1/2">
                                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-sm text-purple-600 dark:text-purple-400" id="video-url-hint">
                                  {t('listings:videoUrlHelp', 'Supported: YouTube, Vimeo, and other video platforms')}
                                </p>
                                {formData.videoUrls?.[0] && (
                                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>URL detected</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <ErrorMessage error={formErrors.videoUrls} id="video-urls-error" />

                            {/* Platform Examples */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">▶</span>
                                </div>
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">YouTube</span>
                              </div>
                              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">V</span>
                                </div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Vimeo</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* External Video Preview */}
                        {formData.videoUrls && formData.videoUrls.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                              {t('listings:videoPreview', 'Video preview')} - External
                            </h4>
                            
                            {/* Video Embed Preview */}
                            {(() => {
                              const embedUrl = getVideoEmbedUrl(formData.videoUrls[0]);
                              if (embedUrl) {
                                return (
                                  <div className="relative">
                                    <div className="aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                                      <iframe
                                        src={embedUrl}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title="External video preview"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeVideoUrl(0)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 z-10"
                                      aria-label="Remove video URL"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              }
                              
                              // Fallback for non-embeddable URLs
                              return (
                                <div className="relative p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        External Video URL
                                      </p>
                                      <p className="text-sm text-blue-700 dark:text-blue-300 break-all">
                                        {formData.videoUrls[0]}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        Preview not available for this URL format
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeVideoUrl(0)}
                                      className="ms-4 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                                      aria-label="Remove video URL"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* URL Info */}
                            <div className="text-center">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Source: {formData.videoUrls[0]}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                <svg className={`w-4 h-4 ${i18n.language === 'ar' ? 'ms-2' : 'me-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                  <svg className={`w-4 h-4 ${i18n.language === 'ar' ? 'me-2' : 'ms-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                      <svg className={`animate-spin h-4 w-4 text-white ${i18n.language === 'ar' ? 'ml-3 -mr-1' : '-ms-1 mr-3'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('listings:newListingSubmitting', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      {t('listings:newListingSubmit', 'Submit Listing')}
                      <svg className={`w-4 h-4 ${i18n.language === 'ar' ? 'me-2' : 'ms-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
