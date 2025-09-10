import { useEffect, useCallback } from 'react';
import { SignupUIState } from './useSignupForm';

interface UseSignupKeyboardNavigationProps {
  uiState: SignupUIState;
  updateUIState: (updates: Partial<SignupUIState>) => void;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  canProceedToNextStep: boolean;
}

export function useSignupKeyboardNavigation({
  uiState,
  updateUIState,
  totalSteps,
  onNext,
  onPrevious,
  canProceedToNextStep,
}: UseSignupKeyboardNavigationProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle keyboard navigation when not typing in input fields
    const activeElement = document.activeElement;
    const isInputField = activeElement?.tagName === 'INPUT' ||
                        activeElement?.tagName === 'TEXTAREA' ||
                        activeElement?.tagName === 'SELECT' ||
                        (activeElement as HTMLElement)?.contentEditable === 'true';

    // Allow keyboard navigation even in input fields for specific keys
    if (event.key === 'Enter' && !isInputField) {
      event.preventDefault();
      if (canProceedToNextStep) {
        onNext();
      }
    } else if (event.key === 'ArrowRight' && !isInputField) {
      event.preventDefault();
      if (canProceedToNextStep && uiState.currentStep < totalSteps) {
        onNext();
      }
    } else if (event.key === 'ArrowLeft' && !isInputField) {
      event.preventDefault();
      if (uiState.currentStep > 1) {
        onPrevious();
      }
    } else if (event.key === 'Escape') {
      // Allow escape to clear all errors
      if (uiState.error || uiState.emailError || uiState.phoneError || uiState.businessEmailError ||
          uiState.businessPhoneError || uiState.businessNameError || uiState.vatError ||
          uiState.addressError || uiState.passwordError || uiState.dateOfBirthError) {
        updateUIState({
          error: '',
          emailError: '',
          phoneError: '',
          businessEmailError: '',
          businessPhoneError: '',
          businessNameError: '',
          vatError: '',
          addressError: '',
          passwordError: '',
          dateOfBirthError: '',
          ageRestrictionError: ''
        });
      }
    }
  }, [uiState.currentStep, totalSteps, canProceedToNextStep, onNext, onPrevious, updateUIState, uiState.error, uiState.emailError, uiState.phoneError, uiState.businessEmailError, uiState.businessPhoneError, uiState.businessNameError, uiState.vatError, uiState.addressError, uiState.passwordError, uiState.dateOfBirthError]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
