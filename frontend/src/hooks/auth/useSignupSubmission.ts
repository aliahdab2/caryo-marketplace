import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth';
import { getCurrentMarket } from '@/config/businessRegistration';
import { SignupFormData, SignupUIState } from './useSignupForm';

interface UseSignupSubmissionProps {
  formData: SignupFormData;
  uiState: SignupUIState;
  updateUIState: (updates: Partial<SignupUIState>) => void;
  clearLocalStorage: () => void;
  callbackUrl?: string;
}

export function useSignupSubmission({
  formData,
  uiState,
  updateUIState,
  clearLocalStorage,
  callbackUrl = '/dashboard',
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

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Form submission data:', {
          email: formData.email,
          password: formData.password ? '[REDACTED]' : 'EMPTY',
          confirmPassword: formData.confirmPassword ? '[REDACTED]' : 'EMPTY',
          username: formData.username,
          phone: formData.phone,
          city: formData.city,
          dateOfBirth: formData.dateOfBirth,
          sellerType
        });
      }

      // Basic required fields validation with specific error messages
      if (!formData.email?.trim()) {
        throw new Error(t('emailRequired', 'Email is required'));
      }
      if (!formData.password?.trim()) {
        throw new Error(t('passwordRequired', 'Password is required'));
      }
      if (!formData.confirmPassword?.trim()) {
        throw new Error(t('confirmPasswordRequired', 'Please confirm your password'));
      }

      // Private seller specific validation
      if (sellerType === 'private') {
        if (!formData.username?.trim()) {
          throw new Error(t('usernameRequired', 'Full name is required'));
        }
        if (!formData.phone?.trim()) {
          throw new Error(t('phoneRequired', 'Phone number is required'));
        }
        if (!formData.city?.trim()) {
          throw new Error(t('cityRequired', 'City is required'));
        }
        if (!formData.dateOfBirth?.trim()) {
          throw new Error(t('dateOfBirthRequired', 'Date of birth is required'));
        }
      }

      // Dealer specific validation
      if (sellerType === 'dealer' && !formData.businessName?.trim()) {
        throw new Error(t('businessNameRequired', 'Business name is required for dealers'));
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

      // Fire lightweight analytics (non-blocking)
      try {
        const market = getCurrentMarket();
        if (typeof window !== 'undefined') {
          // Defer to next tick to avoid blocking UI
          setTimeout(() => {
            // Prefer a global analytics handler if available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyWindow = window as any;
            if (anyWindow?.analytics?.track) {
              anyWindow.analytics.track('dealer_signup_submitted', {
                market,
                sellerType,
                providedBusinessRegistration: !!formData.vatNumber,
                businessRegistrationLength: formData.vatNumber?.length || 0,
              });
            } else if (process.env.NODE_ENV === 'development') {
              console.debug('analytics(track) dealer_signup_submitted', {
                market,
                sellerType,
                providedBusinessRegistration: !!formData.vatNumber,
                businessRegistrationLength: formData.vatNumber?.length || 0,
              });
            }
          }, 0);
        }
      } catch {
        // Swallow analytics failures silently
      }

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

      // Redirect to email verification page with callback URL
      setTimeout(() => {
        const checkEmailUrl = `/auth/check-email?email=${encodeURIComponent(formData.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        router.push(checkEmailUrl);
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
  }, [formData, uiState, updateUIState, prepareSignupData, clearLocalStorage, router, t, callbackUrl]);

  return {
    submitSignup,
  };
}
