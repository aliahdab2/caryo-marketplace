import { useState, useCallback, useMemo } from 'react';
import { validateStep } from '@/utils/formUtils';
import { FormErrors } from '@/types/forms';
import { ListingFormData } from '@/types/listings';
import { createLogger } from '@/utils/logger';

type ValidationMode = 'final' | 'navigation' | 'accessibility';

interface ValidationOptions {
  mode?: ValidationMode;
  stepRange?: [number, number]; // [startStep, endStep]
}

interface UseFormValidationProps {
  totalSteps: number;
  translationFunction: (key: string, fallback?: string) => string;
  debugEnabled?: boolean;
}

interface UseFormValidationReturn {
  formErrors: FormErrors;
  setFormErrors: (errors: FormErrors) => void;
  clearFormErrors: () => void;
  clearFieldError: (field: keyof FormErrors) => void;
  validateCurrentStep: (step: number, formData: ListingFormData, options?: ValidationOptions) => FormErrors;
  validateAllSteps: (formData: ListingFormData, options?: ValidationOptions) => FormErrors;
  validateStepRange: (formData: ListingFormData, startStep: number, endStep: number, options?: ValidationOptions) => FormErrors;
  isStepValid: (step: number, formData: ListingFormData, options?: ValidationOptions) => boolean;
  hasValidationErrors: () => boolean;
  getFieldError: (field: keyof FormErrors) => string | undefined;
  validateFieldsForAccessibility: (targetStep: number, currentStep: number, formData: ListingFormData) => boolean;
}

// Logger (gated by env and prop)
const createValidationLogger = (enabled: boolean) => createLogger({
  enabled: enabled && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_VALIDATION === 'true'),
  level: 'debug',
  prefix: 'FORM_VALIDATION'
});

/**
 * Custom hook for form validation with multi-step support
 * 
 * Features:
 * - Multi-step validation with different modes
 * - Step accessibility validation
 * - Real-time field-level validation
 * - Comprehensive error management
 * - Performance optimized with memoization
 * 
 * @param totalSteps - Total number of steps in the form
 * @param translationFunction - Function to translate validation messages
 * @param debugEnabled - Enable debug logging (default: false)
 */
export const useFormValidation = ({
  totalSteps,
  translationFunction: t,
  debugEnabled = false
}: UseFormValidationProps): UseFormValidationReturn => {
  const logger = useMemo(() => createValidationLogger(debugEnabled), [debugEnabled]);
  
  // State for form errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Clear all form errors
  const clearFormErrors = useCallback(() => {
    logger.debug('Clearing all form errors');
    setFormErrors({});
  }, [logger]);

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof FormErrors) => {
    logger.debug(`Clearing error for field: ${String(field)}`);
    setFormErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, [logger]);

  // Validate a single step
  const validateCurrentStep = useCallback((
    step: number, 
    formData: ListingFormData, 
    options: ValidationOptions = {}
  ): FormErrors => {
    logger.debug(`Validating step ${step} with mode: ${options.mode || 'final'}`);
    
    const stepErrors = validateStep(step, formData, t, { mode: options.mode });
    
    logger.debug(`Step ${step} validation result:`, stepErrors);
    
    return stepErrors;
  }, [t, logger]);

  // Validate all steps
  const validateAllSteps = useCallback((
    formData: ListingFormData, 
    options: ValidationOptions = {}
  ): FormErrors => {
    logger.debug('Validating ALL steps');
    
    let allErrors: FormErrors = {};
    
    for (let step = 1; step <= totalSteps; step++) {
      const stepErrors = validateStep(step, formData, t, { mode: options.mode });
      allErrors = { ...allErrors, ...stepErrors };
      
      if (Object.keys(stepErrors).length > 0) {
        logger.debug(`Step ${step} validation errors:`, stepErrors);
      }
    }
    
    logger.debug('All validation errors:', allErrors);
    
    return allErrors;
  }, [totalSteps, t, logger]);

  // Validate a range of steps
  const validateStepRange = useCallback((
    formData: ListingFormData, 
    startStep: number, 
    endStep: number, 
    options: ValidationOptions = {}
  ): FormErrors => {
    logger.debug(`Validating steps ${startStep} to ${endStep}`);
    
    let rangeErrors: FormErrors = {};
    
    for (let step = startStep; step <= Math.min(endStep, totalSteps); step++) {
      const stepErrors = validateStep(step, formData, t, { mode: options.mode });
      rangeErrors = { ...rangeErrors, ...stepErrors };
      
      if (Object.keys(stepErrors).length > 0) {
        logger.debug(`Step ${step} validation errors:`, stepErrors);
      }
    }
    
    logger.debug(`Steps ${startStep}-${endStep} validation errors:`, rangeErrors);
    
    return rangeErrors;
  }, [totalSteps, t, logger]);

  // Check if a specific step is valid
  const isStepValid = useCallback((
    step: number, 
    formData: ListingFormData, 
    options: ValidationOptions = {}
  ): boolean => {
    const stepErrors = validateCurrentStep(step, formData, options);
    const isValid = Object.keys(stepErrors).length === 0;
    
    logger.debug(`Step ${step} is ${isValid ? 'valid' : 'invalid'}`);
    
    return isValid;
  }, [validateCurrentStep, logger]);

  // Check if there are any validation errors
  const hasValidationErrors = useCallback((): boolean => {
    const hasErrors = Object.keys(formErrors).length > 0;
    logger.debug(`Form has validation errors: ${hasErrors}`);
    return hasErrors;
  }, [formErrors, logger]);

  // Get specific field error
  const getFieldError = useCallback((field: keyof FormErrors): string | undefined => {
    return formErrors[field];
  }, [formErrors]);

  // Validate fields for step accessibility (optimized for wizard navigation)
  const validateFieldsForAccessibility = useCallback((
    targetStep: number, 
    currentStep: number, 
    formData: ListingFormData
  ): boolean => {
    logger.debug(`Checking accessibility: target=${targetStep}, current=${currentStep}`);
    
    // Always allow going to previous steps
    if (targetStep <= currentStep) {
      logger.debug(`Step ${targetStep} is accessible (previous/current step)`);
      return true;
    }
    
    // Only allow accessing the next immediate step
    if (targetStep > currentStep + 1) {
      logger.debug(`Step ${targetStep} is NOT accessible (skipping steps)`);
      return false;
    }
    
    // For next step, validate all previous steps using accessibility mode
    for (let step = 1; step < targetStep; step++) {
      logger.debug(`Validating step ${step} for accessibility`);
      const stepErrors = validateStep(step, formData, t, { mode: 'accessibility' });
      
      if (Object.keys(stepErrors).length > 0) {
        logger.debug(`Step ${targetStep} is NOT accessible due to step ${step} errors:`, stepErrors);
        return false;
      }
    }
    
    logger.debug(`Step ${targetStep} is accessible`);
    return true;
  }, [t, logger]);

  return {
    formErrors,
    setFormErrors,
    clearFormErrors,
    clearFieldError,
    validateCurrentStep,
    validateAllSteps,
    validateStepRange,
    isStepValid,
    hasValidationErrors,
    getFieldError,
    validateFieldsForAccessibility
  };
};

export default useFormValidation;
