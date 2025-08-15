import { useCallback } from 'react';
import { ListingFormData, UpdateListingData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { createListing, updateListing, uploadListingImage } from '@/services/listings';

interface UseListingSubmissionOptions {
  currentStep: number;
  totalSteps: number;
  mode: 'create' | 'edit';
  listingId?: string;
  formData: ListingFormData;
  t: unknown;
  validateStep: (
    step: number,
    data: ListingFormData,
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string,
    opts?: Record<string, unknown>
  ) => FormErrors;
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
  function isTranslator(fn: unknown): fn is (key: string, defaultValue?: string, vars?: Record<string, unknown>) => string {
    return typeof fn === 'function';
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentStep !== totalSteps) {
      return;
    }

    // Validate ALL steps for final submission
    let allErrors: FormErrors = {};
    for (let step = 1; step <= totalSteps; step++) {
      const stepErrors = validateStep(step, formData, t as (key: string, fallback?: string, vars?: Record<string, unknown>) => string);
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
        const result = await createListing(formData);
        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      } else if (mode === 'edit' && listingId) {
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
          contactEmail: formData.contactEmail,
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

        // Upload images sequentially (API limitation)
        if (formData.images && formData.images.length > 0) {
          const validImages = formData.images.filter((img) => img && img instanceof File);
          for (let i = 0; i < validImages.length; i++) {
            const image = validImages[i] as File;
            await uploadListingImage(listingId, image);
          }
        }

        setShowSuccessAlert(true);
        onSuccess?.(result.id);
      }
    } catch (err) {
      const translated = isTranslator(t) ? t('common:unexpectedError') : 'Unexpected error';
      setError(err instanceof Error ? err.message : translated);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, totalSteps, mode, listingId, formData, t, validateStep, setFormErrors, setError, setIsSubmitting, setShowSuccessAlert, onSuccess]);

  return { handleSubmit };
}


