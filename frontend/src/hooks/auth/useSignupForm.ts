import { useState, useMemo, useCallback, useEffect } from 'react';

export interface SignupFormData {
  // Common fields
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string; // YYYY-MM-DD format

  // Private seller specific
  phone: string;
  city: string;

  // Dealer specific
  businessName: string;
  vatNumber: string;
  tradingAddress: string;
  businessEmail: string;
  businessPhone: string;
  logoUrl: string;
}

export interface SignupUIState {
  currentStep: number;
  selectedSellerType: string;
  loading: boolean;
  error: string;
  successMessage: string;
  emailError: string;
  phoneError: string;
  businessEmailError: string;
  businessPhoneError: string;
  businessNameError: string;
  vatError: string;
  addressError: string;
  passwordError: string;
  dateOfBirthError: string;
  ageRestrictionError: string;
  dealerIntent: boolean;
  hasAttemptedValidation: boolean; // Track if user has tried to proceed
}

const initialFormData: SignupFormData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  phone: '',
  city: '',
  businessName: '',
  vatNumber: '',
  tradingAddress: '',
  businessEmail: '',
  businessPhone: '',
  logoUrl: '',
};

const initialUIState: SignupUIState = {
  currentStep: 1,
  selectedSellerType: 'private', // Default to private seller
  loading: false,
  error: '',
  successMessage: '',
  emailError: '',
  phoneError: '',
  businessEmailError: '',
  businessPhoneError: '',
  businessNameError: '',
  vatError: '',
  addressError: '',
  passwordError: '',
  dateOfBirthError: '',
  ageRestrictionError: '',
  dealerIntent: false,
  hasAttemptedValidation: false, // Initially false, set to true when user tries to proceed
};

export function useSignupForm() {
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [uiState, setUIState] = useState<SignupUIState>(initialUIState);

  // Auto-save to localStorage with debouncing
  const saveToLocalStorage = useCallback((data: SignupFormData, state: SignupUIState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('signup-form-data', JSON.stringify(data));
        localStorage.setItem('signup-ui-state', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save signup data to localStorage:', error);
      }
    }
  }, []);

  // Debounced save function
  const debouncedSave = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (data: SignupFormData, state: SignupUIState) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => saveToLocalStorage(data, state), 500);
    };
  }, [saveToLocalStorage]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFormData = localStorage.getItem('signup-form-data');
        const savedUIState = localStorage.getItem('signup-ui-state');

        if (savedFormData) {
          const parsedFormData = JSON.parse(savedFormData);
          setFormData(prev => ({ ...prev, ...parsedFormData }));
        }

        if (savedUIState) {
          const parsedUIState = JSON.parse(savedUIState);
          // Ensure default values are preserved if not set in saved state
          const mergedUIState = {
            ...initialUIState, // Start with defaults
            ...parsedUIState,  // Override with saved data
            // Ensure selectedSellerType has a valid default if empty
            selectedSellerType: parsedUIState.selectedSellerType || initialUIState.selectedSellerType,
            // Always reset validation state on page load to prevent premature errors
            hasAttemptedValidation: false,
            error: '', // Clear any previous errors
            // Also clear all field-specific errors to prevent premature alerts
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
          };
          setUIState(mergedUIState);
        }
      } catch (error) {
        console.warn('Failed to load signup data from localStorage:', error);
      }
    }
  }, []);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('signup-form-data');
      localStorage.removeItem('signup-ui-state');
    }
  }, []);

  const updateFormData = useCallback((updates: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUIState = useCallback((updates: Partial<SignupUIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-save to localStorage when data changes
  useEffect(() => {
    debouncedSave(formData, uiState);
  }, [formData, uiState, debouncedSave]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setUIState(initialUIState);
    clearLocalStorage();
  }, [clearLocalStorage]);

  // Computed values
  const isDealerType = useMemo(() => uiState.selectedSellerType === 'dealer', [uiState.selectedSellerType]);

  const totalSteps = useMemo(() => {
    if (!uiState.selectedSellerType) return 1;
    return isDealerType ? 3 : 2; // Private sellers have 2 steps: 1) Account type, 2) Personal info
  }, [uiState.selectedSellerType, isDealerType]);

  const stepProgress = useMemo(() => {
    return (uiState.currentStep / totalSteps) * 100;
  }, [uiState.currentStep, totalSteps]);

  const canProceedToNextStep = useMemo(() => {
    if (uiState.currentStep === 1) {
      return !!uiState.selectedSellerType;
    }
    // Add more validation logic for other steps as needed
    return true;
  }, [uiState.currentStep, uiState.selectedSellerType]);

  return {
    formData,
    uiState,
    updateFormData,
    updateUIState,
    resetForm,
    loadFromLocalStorage,
    clearLocalStorage,
    isDealerType,
    totalSteps,
    stepProgress,
    canProceedToNextStep,
  };
}
