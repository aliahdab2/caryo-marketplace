import { useState, useCallback, useMemo } from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { validateStep } from '@/utils/formUtils';
import { createLogger } from '@/utils/logger';
import { validatePhoneNumber } from './useFormState';

interface UseFormValidationOptions {
  debugEnabled?: boolean;
  translationFunction?: (key: string, options?: Record<string, unknown>) => string; // Translation function
}

interface UseFormValidationReturn {
  formErrors: FormErrors;
  setFormErrors: (errors: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
  validateCurrentStep: (step: number, formData: ListingFormData, mode?: 'final' | 'navigation' | 'accessibility') => boolean;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  hasErrors: () => boolean;
  getFieldError: (field: string) => string | undefined;
  setFieldError: (field: string, error: string) => void;
}

/**
 * Custom hook for form validation management
 * 
 * Features:
 * - Multi-step form validation
 * - Different validation modes (final, navigation, accessibility)
 * - Individual field error management
 * - Centralized error state management
 * - Debug logging support
 * 
 * @param options Configuration options
 * @returns Form validation utilities
 */
export const useFormValidation = ({
  debugEnabled = false,
  translationFunction
}: UseFormValidationOptions = {}): UseFormValidationReturn => {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Create logger
  const logger = useMemo(() => createLogger({
    enabled: debugEnabled && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_FORM_VALIDATION === 'true'),
    level: 'debug',
    prefix: 'FORM_VALIDATION'
  }), [debugEnabled]);

  // Validate current step
  const validateCurrentStep = useCallback((
    step: number, 
    formData: ListingFormData, 
    mode: 'final' | 'navigation' | 'accessibility' = 'final'
  ): boolean => {
    logger.debug(`Validating step ${step} in ${mode} mode`);
    
    try {
      const errors = validateStep(step, formData, translationFunction, { mode });
      
      // Add phone number validation for step 4 (contact information)
      if (step === 4 && formData.contactPhone) {
        const phoneError = validatePhoneNumber(formData.contactPhone);
        if (phoneError) {
          errors.contactPhone = phoneError;
        }
      }
      
      const hasErrors = Object.keys(errors).length > 0;
      
      if (hasErrors) {
        logger.debug(`Validation failed for step ${step}:`, errors);
        setFormErrors(errors);
      } else {
        logger.debug(`Validation passed for step ${step}`);
        setFormErrors({});
      }
      
      return !hasErrors;
    } catch (error) {
      logger.error('Validation error:', error);
      return false;
    }
  }, [logger, translationFunction]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    logger.debug('Clearing all form errors');
    setFormErrors({});
  }, [logger]);

  // Clear specific field error
  const clearFieldError = useCallback((field: string) => {
    logger.debug(`Clearing error for field: ${field}`);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, [logger]);

  // Check if there are any errors
  const hasErrors = useCallback((): boolean => {
    return Object.keys(formErrors).length > 0;
  }, [formErrors]);

  // Get error for specific field
  const getFieldError = useCallback((field: string): string | undefined => {
    return formErrors[field];
  }, [formErrors]);

  // Set error for specific field
  const setFieldError = useCallback((field: string, error: string) => {
    logger.debug(`Setting error for field ${field}: ${error}`);
    setFormErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [logger]);

  return {
    formErrors,
    setFormErrors,
    validateCurrentStep,
    clearErrors,
    clearFieldError,
    hasErrors,
    getFieldError,
    setFieldError
  };
};

export default useFormValidation;
