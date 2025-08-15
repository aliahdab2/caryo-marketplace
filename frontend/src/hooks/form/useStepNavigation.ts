"use client";

import { useCallback } from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';

type LoggerLike = {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
};

export type UseStepNavigationParams = {
  currentStep: number;
  totalSteps: number;
  formData: ListingFormData;
  debouncedFormData: ListingFormData;
  t: unknown;
  language: string;
  validateStep: (
    step: number,
    data: ListingFormData,
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string,
    opts?: Record<string, unknown>
  ) => FormErrors;
  setFormErrors: (updater: FormErrors | ((prev: FormErrors) => FormErrors)) => void;
  setCurrentStep: (updater: number | ((prev: number) => number)) => void;
  setError: (msg: string | null) => void;
  logger?: LoggerLike;
};

export type UseStepNavigationReturn = {
  isStepAccessible: (targetStep: number) => boolean;
  handleValidationErrors: (stepErrors: FormErrors) => boolean;
  handleStepChange: (step: number, e?: React.MouseEvent) => void;
};

export function useStepNavigation(params: UseStepNavigationParams): UseStepNavigationReturn {
  const { currentStep, totalSteps: _totalSteps, formData, debouncedFormData, t, language, validateStep, setFormErrors, setCurrentStep, setError, logger } = params;

  const isStepAccessible = useCallback((targetStep: number) => {
    logger?.debug(`isStepAccessible targetStep=${targetStep} currentStep=${currentStep}`);
    if (targetStep <= currentStep) {
      logger?.debug(`Step ${targetStep} is accessible`);
      return true;
    }
    for (let step = 1; step < targetStep; step++) {
      logger?.debug(`Validating step ${step} for accessibility`);
      const stepErrors = validateStep(step, debouncedFormData, t as (key: string, fallback?: string, vars?: Record<string, unknown>) => string, { mode: 'accessibility' });
      logger?.debug(`Step ${step} validation errors ${JSON.stringify(stepErrors)}`);
      if (Object.keys(stepErrors).length > 0) {
        logger?.info(`Step ${targetStep} is NOT accessible due to step ${step} errors`);
        return false;
      }
    }
    const isNextImmediateStep = targetStep === currentStep + 1;
    logger?.debug(`Step ${targetStep} accessibility: nextImmediate=${isNextImmediateStep}`);
    return isNextImmediateStep;
  }, [currentStep, debouncedFormData, t, validateStep, logger]);

  const handleValidationErrors = useCallback((stepErrors: FormErrors) => {
    logger?.debug('handleValidationErrors');
    if (Object.keys(stepErrors).length > 0) {
      logger?.debug('Setting form errors');
      setFormErrors(stepErrors);
      const firstErrorField = Object.keys(stepErrors)[0];
      logger?.debug('Focusing first error field ' + firstErrorField);
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement | null;
      if (errorElement) {
        try {
          (errorElement as HTMLElement & { focus: (options?: { preventScroll?: boolean }) => void }).focus({ preventScroll: true });
        } catch {
          errorElement.focus();
        }
        if (typeof (errorElement as HTMLElement & { scrollIntoView: (options?: ScrollIntoViewOptions) => void }).scrollIntoView === 'function') {
          (errorElement as HTMLElement & { scrollIntoView: (options?: ScrollIntoViewOptions) => void }).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      const errorMessages = Object.values(stepErrors).filter(Boolean);
      if (errorMessages.length > 0) {
        const listFormatter = new Intl.ListFormat(language, { style: 'long', type: 'conjunction' });
        const specificError = listFormatter.format(errorMessages as string[]);
        logger?.debug('Setting error message');
        setError(specificError);
      }
      logger?.debug('Validation failed');
      return true;
    }
    logger?.debug('No validation errors');
    return false;
  }, [language, setError, setFormErrors, logger]);

  const handleStepChange = useCallback((step: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    logger?.debug(`handleStepChange step=${step} currentStep=${currentStep}`);
    logger?.debug(`[ListingWizard] Current form data:`, {
      title: formData.title,
      description: formData.description,
      price: formData.price,
      currency: formData.currency
    });
    if (step === currentStep + 1 && currentStep === 1) {
      const navErrors = validateStep(1, formData, t as (key: string, fallback?: string, vars?: Record<string, unknown>) => string, { mode: 'navigation' });
      if (Object.keys(navErrors).length === 0) {
        logger?.debug('Fast-path: Step 1 blocking fields valid, moving to Step 2');
        setFormErrors({});
        setError(null);
        setCurrentStep(2);
        return;
      }
    }
    if (!isStepAccessible(step)) {
      logger?.debug(`Step ${step} not accessible`);
      if (step > currentStep) {
        const stepErrors = validateStep(currentStep, formData, t as (key: string, fallback?: string, vars?: Record<string, unknown>) => string, { mode: 'navigation' });
        logger?.debug(`Step ${currentStep} validation errors ${JSON.stringify(stepErrors)}`);
        handleValidationErrors(stepErrors);
      }
      return;
    }
    if (step > currentStep) {
      logger?.debug(`Validating step ${currentStep} before moving to step ${step}`);
      const stepErrors = validateStep(currentStep, formData, t as (key: string, fallback?: string, vars?: Record<string, unknown>) => string);
      logger?.debug(`Step ${currentStep} validation errors ${JSON.stringify(stepErrors)}`);
      if (currentStep === 3) {
        logger?.debug(`[Step 3 Debug] Title: "${formData.title}", Description: "${formData.description}"`);
        logger?.debug(`[Step 3 Debug] Title empty: ${!formData.title || formData.title.trim().length === 0}`);
        logger?.debug(`[Step 3 Debug] Description empty: ${!formData.description || formData.description.trim().length === 0}`);
      }
      if (handleValidationErrors(stepErrors)) {
        logger?.debug('Validation failed, stay on current step');
        return;
      }
      logger?.debug('Current step validation passed');
    }
    logger?.debug(`Navigating to step ${step} from ${currentStep}`);
    setCurrentStep(step);
    setFormErrors({});
    setError(null);
  }, [currentStep, formData, t, isStepAccessible, handleValidationErrors, setCurrentStep, setError, setFormErrors, validateStep, logger]);

  return { isStepAccessible, handleValidationErrors, handleStepChange };
}


