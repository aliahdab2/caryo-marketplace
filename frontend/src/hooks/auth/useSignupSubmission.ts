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
  const { t, i18n } = useTranslation('auth');

  const prepareSignupData = useCallback(() => {
    const sellerType = uiState.selectedSellerType || 'private';
    
    if (sellerType === 'dealer') {
      // Generate a professional, unique username for dealers
      // Format: [businessname]_[timestamp] to ensure uniqueness
      const cleanBusinessName = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
        .substring(0, 12); // Max 12 chars to leave room for timestamp
      
      // Add timestamp suffix to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      const username = cleanBusinessName 
        ? `${cleanBusinessName}_${timestamp}` 
        : `dealer_${timestamp}`;
      
      const dealerData: Record<string, unknown> = {
        username: username, // e.g., "damascusauto_123456" - unique & professional
        email: formData.businessEmail, // Use business email as main email (primary login)
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        sellerTypeId: 2, // 2 = dealer
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
      };
      
      // Only include optional fields if they have values (to avoid validation errors)
      if (formData.vatNumber?.trim()) {
        dealerData.vatNumber = formData.vatNumber.trim();
      }
      if (formData.tradingAddress?.trim()) {
        dealerData.tradingAddress = formData.tradingAddress.trim();
      }
      if (formData.logoUrl?.trim()) {
        dealerData.logoUrl = formData.logoUrl.trim();
      }
      
      return dealerData;
    } else {
      return {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        sellerTypeId: 1, // 1 = private
        phone: formData.phone,
        city: formData.city,
        dateOfBirth: formData.dateOfBirth,
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
      if (!formData.password?.trim()) {
        throw new Error(t('passwordRequired', 'Password is required'));
      }
      if (!formData.confirmPassword?.trim()) {
        throw new Error(t('confirmPasswordRequired', 'Please confirm your password'));
      }

      // Private seller specific validation
      if (sellerType === 'private') {
        if (!formData.email?.trim()) {
          throw new Error(t('emailRequired', 'Email is required'));
        }
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
      if (sellerType === 'dealer') {
        if (!formData.businessName?.trim()) {
          throw new Error(t('businessNameRequired', 'Business name is required for dealers'));
        }
        if (formData.businessName.trim().length < 2) {
          throw new Error(t('businessNameTooShort', 'Business name must be at least 2 characters'));
        }
        if (formData.businessName.trim().length > 100) {
          throw new Error(t('businessNameTooLong', 'Business name must be less than 100 characters'));
        }
        if (!formData.businessEmail?.trim()) {
          throw new Error(t('emailRequired', 'Email is required'));
        }
        if (!formData.businessPhone?.trim()) {
          throw new Error(t('phoneRequired', 'Phone number is required'));
        }
      }

      // Password validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error(t('passwordsDoNotMatch', 'Passwords do not match'));
      }

      if (formData.password.length < 6) {
        throw new Error(t('passwordTooShort', 'Password must be at least 6 characters'));
      }

      const signupData = prepareSignupData();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await authService.signup(signupData as any); // Type assertion needed for dealer/private union

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

      // Clear form data from localStorage on success
      clearLocalStorage();

      const message = 'message' in result ? result.message : t('signupSuccess', 'Account created successfully!');
      updateUIState({ successMessage: message, loading: false });

      // Determine which email to use (dealers use businessEmail, private sellers use email)
      const userEmail = sellerType === 'dealer' ? formData.businessEmail : formData.email;
      const username = sellerType === 'dealer' ? formData.businessName : formData.username;

      // Store user data for verification flow (after clearing old data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('signup-email', userEmail);
        localStorage.setItem('signup-username', username);
        localStorage.setItem('signup-seller-type', sellerType);
      }

      // Redirect to email verification page with callback URL (preserve locale)
      setTimeout(() => {
        const locale = i18n.language || 'en';
        const checkEmailUrl = `/${locale}/auth/check-email?email=${encodeURIComponent(userEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
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
  }, [formData, uiState, updateUIState, prepareSignupData, clearLocalStorage, router, t, callbackUrl, i18n.language]);

  return {
    submitSignup,
  };
}
