"use client";

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSignupForm, SignupUIState } from '@/hooks/auth/useSignupForm';
import { useSignupValidation } from '@/hooks/auth/useSignupValidation';
import { useSignupSubmission } from '@/hooks/auth/useSignupSubmission';
import { useSignupKeyboardNavigation } from '@/hooks/auth/useSignupKeyboardNavigation';
import { validateAge } from '@/utils/ageValidation';
import AgeRestrictionModal from './signup/AgeRestrictionModal';
import {
  Step1UserTypeSelection,
  Step2PrivateSellerForm,
  Step3DealerBusinessInfo,
  Step4DealerContactInfo,
  SignupNavigation
} from './signup';

interface SignupFormProps {
  callbackUrl?: string;
}

export default function SignupForm({ callbackUrl = '/dashboard' }: SignupFormProps) {
  const { t } = useTranslation(['auth', 'validation']);
  const [showAgeRestrictionModal, setShowAgeRestrictionModal] = React.useState(false);
  const [userAge, setUserAge] = React.useState<number | undefined>();

  const {
    formData,
    uiState,
    updateFormData,
    updateUIState,
    resetForm: _resetForm,
    loadFromLocalStorage,
    clearLocalStorage,
    isDealerType,
    totalSteps,
    stepProgress: _stepProgress,
    canProceedToNextStep,
  } = useSignupForm();


  const { validateCurrentStep } = useSignupValidation(formData, uiState);
  const { submitSignup } = useSignupSubmission({
    formData,
    uiState,
    updateUIState,
    clearLocalStorage,
    callbackUrl,
  });

  // Load saved data on component mount and ensure clean state
  useEffect(() => {
    // Clear any error state first - this should prevent premature alerts
    updateUIState({
      currentStep: 1, // Always start from step 1 for better UX
      error: '',
      hasAttemptedValidation: false,
      // Also clear all field-specific errors
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
    loadFromLocalStorage();
  }, [loadFromLocalStorage, updateUIState]);

  // Separate effect for setting default seller type to avoid infinite loops
  useEffect(() => {
    if (!uiState.selectedSellerType) {
      updateUIState({ selectedSellerType: 'private' });
    }
  }, [uiState.selectedSellerType, updateUIState]);

  // Keyboard navigation
  useSignupKeyboardNavigation({
    uiState,
    updateUIState,
    totalSteps,
    onNext: handleNextStep,
    onPrevious: handlePreviousStep,
    canProceedToNextStep,
  });


  // Helper function to provide user-friendly fallback messages
  const getUserFriendlyFallback = (validationKey: string): string => {
    const fallbacks: Record<string, string> = {
      'validationUsernameRequired': 'Please enter your full name',
      'validationUsernameTooShort': 'Full name must be at least 2 characters',
      'validationEmailRequired': 'Email address is required',
      'validationInvalidEmailFormat': 'Please enter a valid email address',
      'validationPhoneRequired': 'Phone number is required',
      'validationInvalidPhoneFormat': 'Please enter a valid phone number',
      'validationCityRequired': 'Please enter your city',
      'validationPasswordRequired': 'Password is required',
      'validationPasswordTooShort': 'Password must be at least 6 characters',
      'validationConfirmPasswordRequired': 'Please confirm your password',
      'validationPasswordsDoNotMatch': 'Passwords do not match',
      'validationDateOfBirthRequired': 'Please enter your date of birth',
      'validationInvalidDateOfBirth': 'Please enter a valid date of birth',
      'validationAgeRestriction': 'You must be at least 18 years old',
      'validationBusinessNameRequired': 'Business name is required',
      'validationInvalidVatFormat': 'Please enter a valid VAT number',
      'validationSellerTypeRequired': 'Please select a seller type'
    };

    return fallbacks[validationKey] || 'This field is required';
  };

  // Navigation handlers
  function handleNextStep() {
    if (!canProceedToNextStep) return;

    // Mark that user has attempted validation
    updateUIState({ hasAttemptedValidation: true });

    // Age validation only for private sellers (dealers don't provide DOB)
    // Dealers are businesses, so age validation doesn't apply
    if (!isDealerType && formData.dateOfBirth && uiState.currentStep === 2) {
      // For private sellers, validate for selling context (must be 18+)
      const ageValidation = validateAge(formData.dateOfBirth, 'selling');
      if (!ageValidation.isValid) {
        setUserAge(ageValidation.age);
        setShowAgeRestrictionModal(true);
        return;
      }
    }

    const validation = validateCurrentStep();
    if (!validation.isValid) {
      // Update UI state with validation errors
      const errorUpdates: Partial<SignupUIState> = {};
      Object.keys(validation.errors).forEach(key => {
        const errorMessage = validation.errors[key as keyof typeof validation.errors];
        // Translate error messages using i18n with proper fallbacks
        let translatedError = errorMessage;

        // Try to translate the message, fallback to user-friendly defaults
        if (errorMessage && errorMessage.startsWith('validation.')) {
          translatedError = t(errorMessage, getUserFriendlyFallback(errorMessage));
        } else if (errorMessage) {
          // If it's not a validation key, use it as-is or translate it
          translatedError = t(errorMessage, errorMessage);
        }

        if (key === 'email') errorUpdates.emailError = translatedError;
        else if (key === 'phone') errorUpdates.phoneError = translatedError;
        else if (key === 'businessEmail') errorUpdates.businessEmailError = translatedError;
        else if (key === 'businessPhone') errorUpdates.businessPhoneError = translatedError;
        else if (key === 'businessName') errorUpdates.businessNameError = translatedError;
        else if (key === 'vatNumber') errorUpdates.vatError = translatedError;
        else if (key === 'username') errorUpdates.businessNameError = translatedError; // For dealer business name
        else if (key === 'dateOfBirth') errorUpdates.dateOfBirthError = translatedError;
        else if (key === 'password') errorUpdates.passwordError = translatedError;
        else if (key === 'confirmPassword') errorUpdates.passwordError = translatedError; // Map to passwordError for now
        else if (key === 'city') errorUpdates.businessNameError = translatedError; // Map to businessNameError for now
        else if (key === 'sellerType') errorUpdates.error = translatedError; // General error for seller type
      });

      if (Object.keys(errorUpdates).length > 0) {
        updateUIState(errorUpdates);
      }
      return;
    }

    if (uiState.currentStep < totalSteps) {
      updateUIState({ currentStep: uiState.currentStep + 1 });
    } else {
      // Run validation before submitting on final step
      const validation = validateCurrentStep();
      if (!validation.isValid) {
        // Update UI state with validation errors
        const errorUpdates: Partial<SignupUIState> = {};
        Object.keys(validation.errors).forEach(key => {
          const errorMessage = validation.errors[key as keyof typeof validation.errors];
          // Translate error messages using i18n with proper fallbacks
          let translatedError = errorMessage;

          // Try to translate the message, fallback to user-friendly defaults
          if (errorMessage && errorMessage.startsWith('validation.')) {
            translatedError = t(errorMessage, getUserFriendlyFallback(errorMessage));
          } else if (errorMessage) {
            // If it's not a validation key, use it as-is or translate it
            translatedError = t(errorMessage, errorMessage);
          }

          if (key === 'email') errorUpdates.emailError = translatedError;
          else if (key === 'phone') errorUpdates.phoneError = translatedError;
          else if (key === 'businessEmail') errorUpdates.businessEmailError = translatedError;
          else if (key === 'businessPhone') errorUpdates.businessPhoneError = translatedError;
          else if (key === 'businessName') errorUpdates.businessNameError = translatedError;
          else if (key === 'vatNumber') errorUpdates.vatError = translatedError;
          else if (key === 'username') errorUpdates.businessNameError = translatedError; // For dealer business name
          else if (key === 'dateOfBirth') errorUpdates.dateOfBirthError = translatedError;
          else if (key === 'password') errorUpdates.passwordError = translatedError;
          else if (key === 'confirmPassword') errorUpdates.passwordError = translatedError; // Map to passwordError for now
          else if (key === 'city') errorUpdates.businessNameError = translatedError; // Map to businessNameError for now
          else if (key === 'sellerType') errorUpdates.error = translatedError; // General error for seller type
        });

        if (Object.keys(errorUpdates).length > 0) {
          updateUIState(errorUpdates);
        }
        return; // Don't proceed with submission if validation fails
      }

      // If validation passes, proceed with submission
      handleSubmit();
    }
  }

  function handlePreviousStep() {
    if (uiState.currentStep > 1) {
      // Clear error messages when navigating to previous step
      updateUIState({
        currentStep: uiState.currentStep - 1,
        error: '', // Clear main error alert
        // Also clear any field-specific errors to prevent confusion
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

  function handleSubmit() {
    // Ensure validation flag is set before submission
    updateUIState({ hasAttemptedValidation: true });
    
    // Run final validation before submission
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      // Update UI state with validation errors
      const errorUpdates: Partial<SignupUIState> = {};
      Object.keys(validation.errors).forEach(key => {
        const errorMessage = validation.errors[key as keyof typeof validation.errors];
        // Translate error messages using i18n with proper fallbacks
        let translatedError = errorMessage;

        // Try to translate the message, fallback to user-friendly defaults
        if (errorMessage && errorMessage.startsWith('validation.')) {
          translatedError = t(errorMessage, getUserFriendlyFallback(errorMessage));
        } else if (errorMessage) {
          // If it's not a validation key, use it as-is or translate it
          translatedError = t(errorMessage, errorMessage);
        }

        if (key === 'email') errorUpdates.emailError = translatedError;
        else if (key === 'phone') errorUpdates.phoneError = translatedError;
        else if (key === 'businessEmail') errorUpdates.businessEmailError = translatedError;
        else if (key === 'businessPhone') errorUpdates.businessPhoneError = translatedError;
        else if (key === 'businessName') errorUpdates.businessNameError = translatedError;
        else if (key === 'vatNumber') errorUpdates.vatError = translatedError;
        else if (key === 'username') errorUpdates.businessNameError = translatedError; // For dealer business name
        else if (key === 'dateOfBirth') errorUpdates.dateOfBirthError = translatedError;
        else if (key === 'password') errorUpdates.passwordError = translatedError;
        else if (key === 'confirmPassword') errorUpdates.passwordError = translatedError; // Map to passwordError for now
        else if (key === 'city') errorUpdates.businessNameError = translatedError; // Map to businessNameError for now
        else if (key === 'sellerType') errorUpdates.error = translatedError; // General error for seller type
      });

      if (Object.keys(errorUpdates).length > 0) {
        updateUIState(errorUpdates);
      }
      return; // Don't proceed with submission if validation fails
    }
    
    submitSignup();
  }


  // Seller types data
  const sellerTypes = [
    {
      id: 1,
      name: 'private',
      title: t('privateSeller', 'Private Seller'),
      description: t('privateSellerDescription', 'Sell your personal items and vehicles'),
      features: [
        t('privateSellerFeature1', 'Sell personal vehicles'),
        t('privateSellerFeature2', 'Simple registration'),
        t('privateSellerFeature3', 'Direct communication'),
      ],
    },
    {
      id: 2,
      name: 'dealer',
      title: t('dealer', 'Dealer'),
      description: t('dealerDescription', 'Professional vehicle dealership'),
      features: [
        t('dealerFeature1', 'Bulk vehicle listings'),
        t('dealerFeature2', 'Business verification'),
        t('dealerFeature3', 'Advanced features'),
      ],
    },
  ];

  // Render current step content
  const renderStepContent = () => {
    switch (uiState.currentStep) {
      case 1:
        return (
          <Step1UserTypeSelection
            sellerTypes={sellerTypes}
            selectedSellerType={uiState.selectedSellerType}
            setSelectedSellerType={(type) => updateUIState({ selectedSellerType: type })}
            setDealerIntent={(intent) => updateUIState({ dealerIntent: intent })}
            loading={uiState.loading}
          />
        );

      case 2:
        if (isDealerType) {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('businessInformation', 'Business Information')}
              </h3>
              <Step3DealerBusinessInfo
                businessName={formData.businessName}
                setBusinessName={(value) => updateFormData({ businessName: value })}
                vatNumber={formData.vatNumber}
                setVatNumber={(value) => updateFormData({ vatNumber: value })}
                tradingAddress={formData.tradingAddress}
                setTradingAddress={(value) => updateFormData({ tradingAddress: value })}
                businessNameError={uiState.businessNameError}
                setBusinessNameError={(error) => updateUIState({ businessNameError: error })}
                vatError={uiState.vatError}
                setVatError={(error) => updateUIState({ vatError: error })}
                addressError={uiState.addressError}
                setAddressError={(error) => updateUIState({ addressError: error })}
                loading={uiState.loading}
                hasAttemptedValidation={uiState.hasAttemptedValidation}
              />
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <Step2PrivateSellerForm
                username={formData.username}
                setUsername={(value) => updateFormData({ username: value })}
                email={formData.email}
                setEmail={(value) => updateFormData({ email: value })}
                phone={formData.phone}
                setPhone={(value) => updateFormData({ phone: value })}
                city={formData.city}
                setCity={(value) => updateFormData({ city: value })}
                dateOfBirth={formData.dateOfBirth}
                setDateOfBirth={(value) => updateFormData({ dateOfBirth: value })}
                password={formData.password}
                setPassword={(value) => updateFormData({ password: value })}
                confirmPassword={formData.confirmPassword}
                setConfirmPassword={(value) => updateFormData({ confirmPassword: value })}
                emailError={uiState.emailError}
                setEmailError={(error) => updateUIState({ emailError: error })}
                phoneError={uiState.phoneError}
                setPhoneError={(error) => updateUIState({ phoneError: error })}
                dateOfBirthError={uiState.dateOfBirthError}
                setDateOfBirthError={(error) => updateUIState({ dateOfBirthError: error })}
                loading={uiState.loading}
                passwordError={uiState.passwordError}
                hasAttemptedValidation={uiState.hasAttemptedValidation}
              />
            </div>
          );
        }

      case 3:
        if (isDealerType) {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('contactInformation', 'Contact Information')}
              </h3>
              <Step4DealerContactInfo
                businessEmail={formData.businessEmail}
                setBusinessEmail={(value) => updateFormData({ businessEmail: value })}
                businessPhone={formData.businessPhone}
                setBusinessPhone={(value) => updateFormData({ businessPhone: value })}
                logoUrl={formData.logoUrl}
                setLogoUrl={(value) => updateFormData({ logoUrl: value })}
                businessEmailError={uiState.businessEmailError}
                setBusinessEmailError={(error) => updateUIState({ businessEmailError: error })}
                businessPhoneError={uiState.businessPhoneError}
                setBusinessPhoneError={(error) => updateUIState({ businessPhoneError: error })}
                loading={uiState.loading}
                hasAttemptedValidation={uiState.hasAttemptedValidation}
              />
            </div>
          );
        }
        break;

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full min-h-[600px]" data-testid="signup-form">

        {/* Error Display */}
        {uiState.error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 rounded-md dark:bg-red-900/30 dark:text-red-200 text-red-700 flex items-center text-sm border-l-4 border-red-500 dark:border-red-700">
            <svg className="w-4 h-4 flex-shrink-0 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {uiState.error}
          </div>
        )}

        {/* Step Content - Flexible height */}
        <div className="flex-1 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation - Pinned to bottom with breathing room */}
        {uiState.selectedSellerType && (
        <div className="mt-auto pt-6 pb-4">
          <SignupNavigation
            currentStep={uiState.currentStep}
            totalSteps={totalSteps}
              onPrevious={handlePreviousStep}
              onNext={handleNextStep}
              onSubmit={handleSubmit}
            loading={uiState.loading}
              nextDisabled={!canProceedToNextStep}
              submitDisabled={uiState.loading}
            />
        </div>
        )}
    </div>

      {/* Age Restriction Modal */}
      <AgeRestrictionModal
        isOpen={showAgeRestrictionModal}
        onClose={() => setShowAgeRestrictionModal(false)}
        userAge={userAge}
      />
    </>
  );
}
