import { useState, useCallback, useMemo } from 'react';
import { ListingFormData } from '@/types/listings';
import { createLogger } from '@/utils/logger';

interface UseWizardStepsOptions {
  totalSteps: number;
  initialStep?: number;
  debugEnabled?: boolean;
  validateStepAccessibility?: (targetStep: number, currentStep: number, formData: ListingFormData) => boolean;
  onStepChange?: (newStep: number, previousStep: number) => void;
}

interface UseWizardStepsReturn {
  currentStep: number;
  previousStep: number | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoToStep: (step: number, formData?: ListingFormData) => boolean;
  goToStep: (step: number, formData?: ListingFormData) => boolean;
  goToNextStep: (formData?: ListingFormData) => boolean;
  goToPreviousStep: () => boolean;
  goToFirstStep: () => void;
  goToLastStep: (formData?: ListingFormData) => boolean;
  getStepProgress: () => number;
  getAllowedSteps: (formData?: ListingFormData) => number[];
  resetToFirstStep: () => void;
}

/**
 * Custom hook for managing wizard step navigation with validation
 * 
 * Features:
 * - Step navigation with validation
 * - Step accessibility checking
 * - Progress calculation
 * - History tracking
 * - Boundary checks
 * 
 * @param options Configuration options
 * @returns Wizard navigation utilities
 */
export const useWizardSteps = ({
  totalSteps,
  initialStep = 1,
  debugEnabled = false,
  validateStepAccessibility,
  onStepChange
}: UseWizardStepsOptions) => {
  
  // Create logger
  const logger = useMemo(() => createLogger({
    enabled: debugEnabled && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_WIZARD_STEPS === 'true'),
    level: 'debug',
    prefix: 'WIZARD_STEPS'
  }), [debugEnabled]);

  // Validate initial step
  const validatedInitialStep = useMemo(() => {
    if (initialStep < 1 || initialStep > totalSteps) {
      logger.warn(`Invalid initial step ${initialStep}, defaulting to 1`);
      return 1;
    }
    return initialStep;
  }, [initialStep, totalSteps, logger]);

  // State for current and previous steps
  const [currentStep, setCurrentStep] = useState(validatedInitialStep);
  const [previousStep, setPreviousStep] = useState<number | null>(null);

  // Computed properties
  const isFirstStep = useMemo(() => currentStep === 1, [currentStep]);
  const isLastStep = useMemo(() => currentStep === totalSteps, [currentStep, totalSteps]);

  // Check if a step can be accessed
  const canGoToStep = useCallback((step: number, formData?: ListingFormData): boolean => {
    // Basic boundary checks
    if (step < 1 || step > totalSteps) {
      logger.debug(`Step ${step} is out of bounds (1-${totalSteps})`);
      return false;
    }

    // Always allow going to current step
    if (step === currentStep) {
      return true;
    }

    // Custom validation if provided
    if (validateStepAccessibility && formData) {
      const canAccess = validateStepAccessibility(step, currentStep, formData);
      logger.debug(`Custom validation for step ${step}: ${canAccess}`);
      return canAccess;
    }

    // Default behavior: allow going to adjacent steps and backwards
    const canAccess = step <= currentStep + 1;
    logger.debug(`Default validation for step ${step}: ${canAccess}`);
    return canAccess;
  }, [currentStep, totalSteps, validateStepAccessibility, logger]);

  // Navigate to specific step
  const goToStep = useCallback((step: number, formData?: ListingFormData): boolean => {
    logger.debug(`Attempting to navigate to step ${step}`);

    if (!canGoToStep(step, formData)) {
      logger.debug(`Cannot navigate to step ${step}`);
      return false;
    }

    logger.debug(`Navigating from step ${currentStep} to step ${step}`);
    
    setPreviousStep(currentStep);
    setCurrentStep(step);
    
    // Call step change callback
    onStepChange?.(step, currentStep);
    
    return true;
  }, [currentStep, canGoToStep, onStepChange, logger]);

  // Go to next step
  const goToNextStep = useCallback((formData?: ListingFormData): boolean => {
    if (isLastStep) {
      logger.debug('Already at last step, cannot go to next');
      return false;
    }

    return goToStep(currentStep + 1, formData);
  }, [isLastStep, currentStep, goToStep, logger]);

  // Go to previous step
  const goToPreviousStep = useCallback((): boolean => {
    if (isFirstStep) {
      logger.debug('Already at first step, cannot go to previous');
      return false;
    }

    return goToStep(currentStep - 1);
  }, [isFirstStep, currentStep, goToStep, logger]);

  // Go to first step
  const goToFirstStep = useCallback(() => {
    logger.debug('Navigating to first step');
    goToStep(1);
  }, [goToStep, logger]);

  // Go to last step
  const goToLastStep = useCallback((formData?: ListingFormData): boolean => {
    logger.debug('Attempting to navigate to last step');
    return goToStep(totalSteps, formData);
  }, [totalSteps, goToStep, logger]);

  // Calculate progress percentage
  const getStepProgress = useCallback((): number => {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    logger.debug(`Step progress: ${progress}% (${currentStep}/${totalSteps})`);
    return Math.max(0, Math.min(100, progress));
  }, [currentStep, totalSteps, logger]);

  // Get all allowed/accessible steps
  const getAllowedSteps = useCallback((formData?: ListingFormData): number[] => {
    const allowedSteps: number[] = [];
    
    for (let step = 1; step <= totalSteps; step++) {
      if (canGoToStep(step, formData)) {
        allowedSteps.push(step);
      }
    }
    
    logger.debug('Allowed steps:', allowedSteps);
    return allowedSteps;
  }, [totalSteps, canGoToStep, logger]);

  // Reset to first step
  const resetToFirstStep = useCallback(() => {
    logger.info('Resetting wizard to first step');
    setPreviousStep(null);
    setCurrentStep(1);
    onStepChange?.(1, currentStep);
  }, [currentStep, onStepChange, logger]);

  return {
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
  };
};

export default useWizardSteps;
