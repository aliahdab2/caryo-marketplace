import { useMemo } from 'react';
import { ListingFormData } from '@/types/listings';
import { useFormState } from './useFormState';
import { useFormValidation } from './useFormValidation';
import { useWizardSteps } from './useWizardSteps';
import { FormErrors } from '@/types/forms';

interface UseListingWizardProps {
  initialData: Partial<ListingFormData>;
  totalSteps?: number;
  initialStep?: number;
  defaultCurrency?: string;
  debugEnabled?: boolean;
  translationFunction: (key: string, fallback?: string) => string;
  onFormChange?: (formData: ListingFormData) => void;
  onStepChange?: (newStep: number, previousStep: number) => void;
}

interface UseListingWizardReturn {
  // Form State
  formData: ListingFormData;
  setFormData: (data: ListingFormData | ((prev: ListingFormData) => ListingFormData)) => void;
  updateField: (field: keyof ListingFormData, value: any) => void;
  updateFields: (fields: Partial<ListingFormData>) => void;
  resetForm: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, fieldName?: string) => void;
  getFieldValue: <K extends keyof ListingFormData>(field: K) => ListingFormData[K];
  hasFormChanges: () => boolean;

  // Validation
  formErrors: FormErrors;
  setFormErrors: (errors: FormErrors) => void;
  clearFormErrors: () => void;
  clearFieldError: (field: keyof FormErrors) => void;
  validateCurrentStep: () => FormErrors;
  validateAllSteps: () => FormErrors;
  isCurrentStepValid: () => boolean;
  hasValidationErrors: () => boolean;
  getFieldError: (field: keyof FormErrors) => string | undefined;

  // Step Management
  currentStep: number;
  previousStep: number | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoToStep: (step: number) => boolean;
  goToStep: (step: number) => boolean;
  goToNextStep: () => boolean;
  goToPreviousStep: () => boolean;
  goToFirstStep: () => void;
  goToLastStep: () => boolean;
  getStepProgress: () => number;
  getAllowedSteps: () => number[];
  resetWizard: () => void;

  // Combined Utilities
  validateAndGoToNextStep: () => boolean;
  validateAndGoToStep: (step: number) => boolean;
  isStepAccessible: (step: number) => boolean;
  submitForm: () => { isValid: boolean; errors: FormErrors };
}

const DEFAULT_TOTAL_STEPS = 4;

/**
 * Comprehensive hook for managing a multi-step listing wizard
 * 
 * This hook combines form state management, validation, and step navigation
 * into a single, cohesive interface. It provides all the functionality needed
 * for a complex multi-step form with validation.
 * 
 * Features:
 * - Complete form state management
 * - Multi-step validation with different modes
 * - Step navigation with accessibility checks
 * - Integrated validation and navigation
 * - Performance optimized
 * 
 * @param initialData - Initial form data
 * @param totalSteps - Total number of steps (default: 4)
 * @param initialStep - Initial step (default: 1)
 * @param defaultCurrency - Default currency (default: 'SYP')
 * @param debugEnabled - Enable debug logging (default: false)
 * @param translationFunction - Function to translate validation messages
 * @param onFormChange - Callback when form data changes
 * @param onStepChange - Callback when step changes
 */
export const useListingWizard = ({
  initialData,
  totalSteps = DEFAULT_TOTAL_STEPS,
  initialStep = 1,
  defaultCurrency = 'SYP',
  debugEnabled = false,
  translationFunction,
  onFormChange,
  onStepChange
}: UseListingWizardProps): UseListingWizardReturn => {
  
  // Initialize form state
  const {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    handleChange,
    getFieldValue,
    hasChanges: hasFormChanges
  } = useFormState({
    initialData,
    defaultCurrency,
    debugEnabled,
    onFormChange
  });

  // Initialize validation
  const {
    formErrors,
    setFormErrors,
    clearFormErrors,
    clearFieldError,
    validateCurrentStep: validateStep,
    validateAllSteps,
    isStepValid,
    hasValidationErrors,
    getFieldError,
    validateFieldsForAccessibility
  } = useFormValidation({
    totalSteps,
    translationFunction,
    debugEnabled
  });

  // Initialize step management with validation integration
  const {
    currentStep,
    previousStep,
    isFirstStep,
    isLastStep,
    canGoToStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    goToFirstStep,
    goToLastStep,
    getStepProgress,
    getAllowedSteps,
    resetToFirstStep
  } = useWizardSteps({
    totalSteps,
    initialStep,
    debugEnabled,
    validateStepAccessibility: validateFieldsForAccessibility,
    onStepChange
  });

  // Enhanced validation methods
  const validateCurrentStep = () => validateStep(currentStep, formData);
  const isCurrentStepValid = () => isStepValid(currentStep, formData);
  const isStepAccessible = (step: number) => validateFieldsForAccessibility(step, currentStep, formData);

  // Enhanced navigation methods with validation
  const validateAndGoToNextStep = (): boolean => {
    const stepErrors = validateCurrentStep();
    
    if (Object.keys(stepErrors).length > 0) {
      setFormErrors(stepErrors);
      return false;
    }
    
    clearFormErrors();
    return goToNextStep(formData);
  };

  const validateAndGoToStep = (step: number): boolean => {
    // If going to a previous step, allow without validation
    if (step <= currentStep) {
      return goToStep(step, formData);
    }

    // For forward navigation, validate current step first
    const stepErrors = validateCurrentStep();
    
    if (Object.keys(stepErrors).length > 0) {
      setFormErrors(stepErrors);
      return false;
    }
    
    clearFormErrors();
    return goToStep(step, formData);
  };

  // Form submission with full validation
  const submitForm = (): { isValid: boolean; errors: FormErrors } => {
    const allErrors = validateAllSteps(formData);
    const isValid = Object.keys(allErrors).length === 0;
    
    if (!isValid) {
      setFormErrors(allErrors);
    }
    
    return { isValid, errors: allErrors };
  };

  // Reset entire wizard
  const resetWizard = () => {
    resetForm();
    clearFormErrors();
    resetToFirstStep();
  };

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Form State
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    handleChange,
    getFieldValue,
    hasFormChanges,

    // Validation
    formErrors,
    setFormErrors,
    clearFormErrors,
    clearFieldError,
    validateCurrentStep,
    validateAllSteps: () => validateAllSteps(formData),
    isCurrentStepValid,
    hasValidationErrors,
    getFieldError,

    // Step Management
    currentStep,
    previousStep,
    isFirstStep,
    isLastStep,
    canGoToStep: (step: number) => canGoToStep(step, formData),
    goToStep: (step: number) => goToStep(step, formData),
    goToNextStep: () => goToNextStep(formData),
    goToPreviousStep,
    goToFirstStep,
    goToLastStep: () => goToLastStep(formData),
    getStepProgress,
    getAllowedSteps: () => getAllowedSteps(formData),
    resetWizard,

    // Combined Utilities
    validateAndGoToNextStep,
    validateAndGoToStep,
    isStepAccessible,
    submitForm
  }), [
    formData, setFormData, updateField, updateFields, resetForm, handleChange, getFieldValue, hasFormChanges,
    formErrors, setFormErrors, clearFormErrors, clearFieldError, validateCurrentStep, validateAllSteps, isCurrentStepValid, hasValidationErrors, getFieldError,
    currentStep, previousStep, isFirstStep, isLastStep, canGoToStep, goToStep, goToNextStep, goToPreviousStep, goToFirstStep, goToLastStep, getStepProgress, getAllowedSteps, resetWizard,
    validateAndGoToNextStep, validateAndGoToStep, isStepAccessible, submitForm
  ]);
};

export default useListingWizard;
