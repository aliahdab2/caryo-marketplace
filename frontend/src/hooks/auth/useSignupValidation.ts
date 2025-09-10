import { useMemo } from 'react';
import { SignupFormData, SignupUIState } from './useSignupForm';

export function useSignupValidation(
  formData: SignupFormData,
  uiState: SignupUIState,
  t?: (key: string) => string
) {
  const isValidPhoneNumber = useMemo(() => (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, []);

  const isValidEmail = useMemo(() => (email: string) => {
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }, []);

  const isValidPassword = useMemo(() => (password: string) => {
    return password.length >= 6;
  }, []);

  const validateVatNumber = (vat: string) => {
    // Basic VAT validation - can be enhanced based on country requirements
    const vatRegex = /^[A-Z]{2}\d{8,12}$/;
    return vatRegex.test(vat.toUpperCase());
  };

  const validateStep1 = useMemo(() => {
    // Step 1 validation - seller type selection (we have a default, so be more lenient)
    if (!uiState.hasAttemptedValidation) {
      return {
        isValid: true,
        errors: {}
      };
    }

    return {
      isValid: !!uiState.selectedSellerType,
      errors: uiState.selectedSellerType ? {} : { sellerType: 'validation.sellerTypeRequired' }
    };
  }, [uiState.selectedSellerType, uiState.hasAttemptedValidation]);

  const validateStep2Private = useMemo(() => {
    const errors: Record<string, string> = {};

    // Only validate if user has attempted validation (clicked Next/Submit)
    if (!uiState.hasAttemptedValidation) {
      return {
        isValid: true,
        errors: {}
      };
    }

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'validation.usernameRequired';
    } else if (formData.username.length < 2) {
      errors.username = 'validation.usernameTooShort';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = t ? t('validation.emailRequired') : 'validation.emailRequired';
    } else if (!isValidEmail(formData.email)) {
      errors.email = t ? t('validation.invalidEmailFormat') : 'validation.invalidEmailFormat';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = t ? t('validation.phoneRequired') : 'validation.phoneRequired';
    } else if (!isValidPhoneNumber(formData.phone)) {
      errors.phone = t ? t('validation.invalidPhoneFormat') : 'validation.invalidPhoneFormat';
    }

    // City validation
    if (!formData.city.trim()) {
      errors.city = t ? t('validation.cityRequired') : 'validation.cityRequired';
    }

    // Password validation
    if (!formData.password) {
      errors.password = t ? t('validation.passwordRequired') : 'validation.passwordRequired';
    } else if (!isValidPassword(formData.password)) {
      errors.password = t ? t('validation.passwordTooShort') : 'validation.passwordTooShort';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = t ? t('validation.confirmPasswordRequired') : 'validation.confirmPasswordRequired';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t ? t('validation.passwordsDoNotMatch') : 'validation.passwordsDoNotMatch';
    }

    // Date of birth validation
    if (!formData.dateOfBirth.trim()) {
      errors.dateOfBirth = t ? t('validation.dateOfBirthRequired') : 'validation.dateOfBirthRequired';
    } else {
      // Validate age (must be 18+)
      const birthDate = new Date(formData.dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        errors.dateOfBirth = t ? t('validation.invalidDateOfBirth') : 'validation.invalidDateOfBirth';
      } else {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          errors.dateOfBirth = t ? t('validation.ageRestriction') : 'validation.ageRestriction';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formData, uiState.hasAttemptedValidation, isValidEmail, isValidPhoneNumber, isValidPassword, t]);

  const validateStep3Dealer = useMemo(() => {
    const errors: Record<string, string> = {};

    // Only validate if user has attempted validation (clicked Next/Submit)
    if (!uiState.hasAttemptedValidation) {
      return {
        isValid: true,
        errors: {}
      };
    }

    // Business name validation
    if (!formData.businessName.trim()) {
      errors.businessName = t ? t('validation.businessNameRequired') : 'validation.businessNameRequired';
    }

    // VAT validation (optional but if provided, must be valid)
    if (formData.vatNumber && !validateVatNumber(formData.vatNumber)) {
      errors.vatNumber = t ? t('validation.invalidVatFormat') : 'validation.invalidVatFormat';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formData, uiState.hasAttemptedValidation, t]);

  const validateStep4Dealer = useMemo(() => {
    const errors: Record<string, string> = {};

    // Only validate if user has attempted validation (clicked Next/Submit)
    if (!uiState.hasAttemptedValidation) {
      return {
        isValid: true,
        errors: {}
      };
    }

    // Business email validation (optional but if provided, must be valid)
    if (formData.businessEmail && !isValidEmail(formData.businessEmail)) {
      errors.businessEmail = t ? t('validation.invalidEmailFormat') : 'validation.invalidEmailFormat';
    }

    // Business phone validation (optional but if provided, must be valid)
    if (formData.businessPhone && !isValidPhoneNumber(formData.businessPhone)) {
      errors.businessPhone = t ? t('validation.invalidPhoneFormat') : 'validation.invalidPhoneFormat';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formData, uiState.hasAttemptedValidation, isValidEmail, isValidPhoneNumber, t]);

  const validateDealerConsolidated = useMemo(() => {
    // Combine all dealer validations
    const step3Validation = validateStep3Dealer;
    const step4Validation = validateStep4Dealer;

    return {
      isValid: step3Validation.isValid && step4Validation.isValid,
      errors: { ...step3Validation.errors, ...step4Validation.errors }
    };
  }, [validateStep3Dealer, validateStep4Dealer]);

  const validateCurrentStep = () => {
    switch (uiState.currentStep) {
      case 1:
        return validateStep1;
      case 2:
        return uiState.selectedSellerType === 'dealer' ? validateStep3Dealer : validateStep2Private;
      case 3:
        return validateStep4Dealer;
      default:
        return { isValid: false, errors: { general: 'Invalid step' } };
    }
  };

  return {
    validateStep1,
    validateStep2Private,
    validateStep3Dealer,
    validateStep4Dealer,
    validateDealerConsolidated,
    validateCurrentStep,
  };
}
