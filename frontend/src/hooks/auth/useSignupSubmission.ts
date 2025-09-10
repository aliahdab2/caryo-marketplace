import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth';
import { SignupFormData, SignupUIState } from './useSignupForm';

interface UseSignupSubmissionProps {
  formData: SignupFormData;
  uiState: SignupUIState;
  updateUIState: (updates: Partial<SignupUIState>) => void;
  clearLocalStorage: () => void;
}

export function useSignupSubmission({
  formData,
  uiState,
  updateUIState,
  clearLocalStorage,
}: UseSignupSubmissionProps) {
  const router = useRouter();
  const { t } = useTranslation('auth');

  const prepareSignupData = useCallback(() => {
    const sellerType = uiState.selectedSellerType || 'private';
    
    const baseData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      sellerTypeId: sellerType === 'dealer' ? 2 : 1, // Assuming 1=private, 2=dealer
    };

    if (sellerType === 'dealer') {
      return {
        ...baseData,
        businessName: formData.businessName,
        vatNumber: formData.vatNumber,
        tradingAddress: formData.tradingAddress,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        logoUrl: formData.logoUrl,
      };
    } else {
      return {
        ...baseData,
        phone: formData.phone,
        city: formData.city,
        dateOfBirth: formData.dateOfBirth, // Include dateOfBirth for private sellers
      };
    }
  }, [formData, uiState.selectedSellerType]);

  const submitSignup = useCallback(async () => {
    updateUIState({ loading: true, error: '', successMessage: '' });

    try {
      // Ensure seller type is selected - with fallback to default
      const sellerType = uiState.selectedSellerType || 'private';

      // Basic required fields validation
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error(t('validationFieldRequired', 'Required fields are missing'));
      }

      // Private seller specific validation
      if (sellerType === 'private') {
        if (!formData.username?.trim()) {
          throw new Error(t('validationUsernameRequired', 'Full name is required'));
        }
        if (!formData.phone?.trim()) {
          throw new Error(t('validationPhoneRequired', 'Phone number is required'));
        }
        if (!formData.city?.trim()) {
          throw new Error(t('validationCityRequired', 'City is required'));
        }
        if (!formData.dateOfBirth?.trim()) {
          throw new Error(t('validationDateOfBirthRequired', 'Date of birth is required'));
        }
      }

      // Dealer specific validation
      if (sellerType === 'dealer' && !formData.businessName?.trim()) {
        throw new Error(t('validationBusinessNameRequired', 'Business name is required for dealers'));
      }

      // Password validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error(t('passwordsDoNotMatch', 'Passwords do not match'));
      }

      if (formData.password.length < 6) {
        throw new Error(t('passwordTooShort', 'Password must be at least 6 characters'));
      }

      const signupData = prepareSignupData();

      const result = await authService.signup(signupData);

      // Store user data for verification flow
      if (typeof window !== 'undefined') {
        localStorage.setItem('signup-email', formData.email);
        localStorage.setItem('signup-username', formData.username);
        localStorage.setItem('signup-seller-type', sellerType);
      }

      // Clear form data from localStorage on success
      clearLocalStorage();

      const message = 'message' in result ? result.message : t('signupSuccess', 'Account created successfully!');
      updateUIState({ successMessage: message, loading: false });

      // Redirect to email verification page
      setTimeout(() => {
        router.push(`/auth/check-email?email=${encodeURIComponent(formData.email)}`);
      }, 2000);

    } catch (err) {
      let message = t('registrationFailed', 'Registration failed. Please try again.');

      if (typeof err === "object" && err !== null) {
        if ("data" in err && typeof (err as Record<string, unknown>).data === "object") {
          const data = (err as { data?: { message?: string } }).data;
          if (data?.message) {
            message = String(data.message);
          }
        } else if ("message" in err && typeof (err as { message?: string }).message === "string") {
          message = (err as { message?: string }).message!;
        } else if (err instanceof Error) {
          message = err.message;
        }
      }

      updateUIState({ error: message, loading: false });

      // Log error for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error("Registration error:", err);
      }
    }
  }, [formData, uiState, updateUIState, prepareSignupData, clearLocalStorage, router, t]);

  return {
    submitSignup,
  };
}
