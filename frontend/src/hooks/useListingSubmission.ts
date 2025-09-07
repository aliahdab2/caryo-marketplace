import { useCallback } from 'react';
import { ListingFormData, UpdateListingData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { createListing, updateListing, uploadListingImage } from '@/services/listings';
import { addExternalVideoToListing } from '@/services/videoService';
import { useOptimizedUser } from '@/hooks/useOptimizedSession';

type ValidationMode = 'final' | 'navigation' | 'accessibility';

interface UseListingSubmissionOptions {
  currentStep: number;
  totalSteps: number;
  mode: 'create' | 'edit';
  listingId?: string;
  formData: ListingFormData;
  t: (key: string, fallback: string) => string;
  validateStep: (step: number, formData: ListingFormData, t: (key: string, fallback: string) => string, options?: { mode?: ValidationMode }) => FormErrors;
  setFormErrors: (updater: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
  setCurrentStep: (updater: (prev: number) => number) => void;
  setError: (msg: string | null) => void;
  setIsSubmitting: (updater: boolean | ((prev: boolean) => boolean)) => void;
  setShowSuccessAlert: (updater: boolean | ((prev: boolean) => boolean)) => void;
  onSuccess?: (id: string) => void;
}

export function useListingSubmission({
  currentStep,
  totalSteps,
  mode,
  listingId,
  formData,
  t,
  validateStep,
  setFormErrors,
  setCurrentStep: _setCurrentStep,
  setError,
  setIsSubmitting,
  setShowSuccessAlert,
  onSuccess
}: UseListingSubmissionOptions) {
  const user = useOptimizedUser();
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentStep !== totalSteps) {
      return;
    }

    // Validate ALL steps for final submission
    let allErrors: FormErrors = {};
    for (let step = 1; step <= totalSteps; step++) {
      const stepErrors = validateStep(step, formData, t);
      allErrors = { ...allErrors, ...stepErrors };
    }
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    setFormErrors({});

    try {
      setIsSubmitting(true);
      if (mode === 'create') {
        // Use user's email from session instead of form data
        const formDataWithEmail = {
          ...formData,
          contactEmail: user?.email || ''
        };
        const result = await createListing(formDataWithEmail);
        
        // Images are already uploaded by createListing() - no need to upload again
        console.log(`[Create Mode] Images already handled by createListing() - skipping duplicate upload of ${formData.images?.length || 0} images`);

        // Add external video URLs if provided
        if (formData.videoUrls && formData.videoUrls.length > 0) {
          for (const videoUrl of formData.videoUrls) {
            if (videoUrl.url && videoUrl.url.trim()) {
              try {
                await addExternalVideoToListing(result.id, {
                  url: videoUrl.url.trim(),
                  title: 'Car Video',
                  durationSeconds: undefined // Let backend determine duration
                });
              } catch (videoError) {
                console.error('Failed to add video URL:', videoError);
                // Don't fail the entire listing creation for video errors
              }
            }
          }
        }

        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      } else if (mode === 'edit' && listingId) {
        // Debug: Log the current state of images in edit mode
        console.log('[Edit Mode Debug]', {
          existingImageUrls: formData.existingImageUrls?.length || 0,
          newImages: formData.images?.length || 0,
          imageTypes: formData.images?.map(img => typeof img === 'object' && img instanceof File ? 'File' : typeof img),
          existingUrls: formData.existingImageUrls?.slice(0, 2), // First 2 URLs for debugging
        });
        
        const locationId = formData.locationId;
        const updateData: UpdateListingData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          transmissionId: formData.transmissionId,
          fuelTypeId: formData.fuelTypeId,
          modelId: formData.modelId,
          currency: formData.currency,
          modelYear: formData.year ? parseInt(formData.year) : undefined,
          locationId,
          contactName: formData.contactName,
          contactEmail: user?.email || '',
          contactPhone: formData.contactPhone,
          contactPreference: formData.contactPreference,
        };

        Object.keys(updateData).forEach((key) => {
          const k = key as keyof UpdateListingData;
          if (updateData[k] === undefined) {
            delete updateData[k];
          }
        });

        const result = await updateListing(listingId, updateData);

        // Upload only NEW images sequentially (API limitation)
        // In edit mode, only upload File objects (new images), not existing URLs
        if (formData.images && formData.images.length > 0) {
          const newImages = formData.images.filter((img) => img && img instanceof File);
          console.log(`[Edit Mode] Uploading ${newImages.length} new images out of ${formData.images.length} total images`);
          
          // Additional safety check: log any non-File objects that might have gotten into the array
          const nonFileItems = formData.images.filter((img) => img && !(img instanceof File));
          if (nonFileItems.length > 0) {
            console.warn('[Edit Mode] Found non-File objects in images array:', nonFileItems.map(item => typeof item));
          }
          
          for (let i = 0; i < newImages.length; i++) {
            const image = newImages[i] as File;
            await uploadListingImage(listingId, image);
          }
        }

        // Add external video URLs if provided
        if (formData.videoUrls && formData.videoUrls.length > 0) {
          for (const videoUrl of formData.videoUrls) {
            if (videoUrl.url && videoUrl.url.trim()) {
              try {
                await addExternalVideoToListing(listingId, {
                  url: videoUrl.url.trim(),
                  title: 'Car Video',
                  durationSeconds: undefined // Let backend determine duration
                });
              } catch (videoError) {
                console.error('Failed to add video URL:', videoError);
                // Don't fail the entire listing update for video errors
              }
            }
          }
        }

        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      }
    } catch (error) {
      // Handle specific email verification error
      if (error instanceof Error && error.message.includes('Email verification required')) {
        const emailErrorMessage = `${t('common:emailVerificationRequired', 'Email verification required')}\n\n${t('common:emailVerificationMessage', 'Please check your email and verify your account before creating listings.')}`;
        setError(emailErrorMessage);
      } else {
        // Handle other errors with generic message
        const translated = t('common:unexpectedError', 'An unexpected error occurred');
        setError(error instanceof Error ? error.message : translated);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, totalSteps, mode, listingId, formData, t, validateStep, setFormErrors, setError, setIsSubmitting, setShowSuccessAlert, onSuccess, user]);

  return { handleSubmit };
}


