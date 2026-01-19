"use client";

import { signIn } from "next-auth/react";
import { isValidEmail, looksLikeEmail } from '@/utils/emailValidation';
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDirection } from '@/utils/direction';
import { useApiErrorHandler } from '@/utils/apiErrorHandler';
import SimpleVerification from '@/components/auth/SimpleVerification';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import PasswordInput from '@/components/ui/PasswordInput';
import Link from 'next/link';
import useLazyTranslation from "@/hooks/useLazyTranslation";
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Move namespaces outside component to prevent recreation on every render
const AUTH_NAMESPACES = ['auth', 'errors'];

const SignInPage: React.FC = () => {
  // Lazy load the auth and errors namespaces
  useLazyTranslation(AUTH_NAMESPACES);

  const { t } = useTranslation(['auth', 'errors', 'validation']);
  const { isRTL: _isRTL } = useDirection();
  const router = useRouter();
  const _searchParams = useSearchParams();
  const { getErrorMessage } = useApiErrorHandler();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [_callbackUrlLoaded, setCallbackUrlLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const signInSchema = z
    .object({
      username: z.string().min(1, t('validationFieldRequired')),
      password: z.string().min(1, t('validationFieldRequired')),
    })
    .superRefine((data, ctx) => {
      if (looksLikeEmail(data.username) && !isValidEmail(data.username)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['username'],
          message: t('validationInvalidEmailFormat'),
        });
      }
    });

  type SignInFormValues = z.infer<typeof signInSchema>;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const username = watch('username');
  const password = watch('password');

    // Extract callback URL from search params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      const callback = searchParams.get('callbackUrl');
      const verified = searchParams.get('verified');
      const email = searchParams.get('email');
      const usernameParam = searchParams.get('username');
      const autoLogin = searchParams.get('auto');
      const expired = searchParams.get('expired');

      // Check for session expiration
      if (expired === 'true') {
        setError(t('errors:SessionExpired', 'Session expired. Please sign in again.'));
      }

      // Check localStorage for redirect URL (from FavoriteButton or other sources) - fallback only
      const storedRedirect = localStorage.getItem('redirectAfterAuth');

      // Determine redirect target with clear priority order
      let redirectTarget = null;
      if (returnUrl) {
        redirectTarget = returnUrl;
      } else if (callback) {
        redirectTarget = callback;
      } else if (storedRedirect) {
        redirectTarget = storedRedirect;
      } else if (verified === 'true') {
        if (usernameParam) {
          redirectTarget = `/?verified=true&username=${encodeURIComponent(usernameParam)}`;
        } else {
          redirectTarget = '/?verified=true';
        }
      } else {
        redirectTarget = '/dashboard';
      }

      // Clear the stored redirect URL if we found one (cleanup)
      if (storedRedirect) {
        localStorage.removeItem('redirectAfterAuth');
      }

      try {
        if (redirectTarget.startsWith('/')) {
          setCallbackUrl(redirectTarget);
        } else {
          const url = new URL(decodeURIComponent(redirectTarget));
          if (url.origin === window.location.origin) {
            // Include the full path and any query parameters or hash
            const finalUrl = url.pathname + url.search + url.hash;
            setCallbackUrl(finalUrl);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Error parsing redirect URL:', e);
          setCallbackUrl('/dashboard');
        }
      }

      // Handle email verification success
      if (verified === 'true') {
        // Focus password field for better UX after email verification
        setTimeout(() => {
          const passwordInput = document.getElementById('password');
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 100);
      }

      // Pre-fill username field - prefer username over email for better UX
      if (usernameParam) {
        setValue('username', decodeURIComponent(usernameParam));
      } else if (email) {
        // Fallback to email if username not available
        setValue('username', decodeURIComponent(email));
      }

      // Handle auto-login for verified users
      if (autoLogin === 'true' && verified === 'true' && email) {
        console.log('🔄 Auto-login requested for verified user:', email);
        setShowSuccess(true);

        // Show a message that they're verified and can sign in
        setTimeout(() => {
          // Focus on password field since email is pre-filled
          const passwordField = document.getElementById('password');
          if (passwordField) {
            passwordField.focus();
          }
        }, 100);
      }

      // Mark that callback URL has been loaded
      setCallbackUrlLoaded(true);
    }
  }, [setValue, t]);

  // Reset credentials mode when inputs change (logic removed for simplicity)
  useEffect(() => {
    // Inputs changed
  }, [username, password]);

  // Error handling logic
  useEffect(() => {
    if (error && error !== "") {
        // Handle error side effects here if needed
    }
  }, [error]);

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);
    setError(null);
    setShowSuccess(false);

    if (!isVerified) {
      setError(t('verificationRequired'));
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: data.username,
        password: data.password
        // Note: Not passing callbackUrl to signIn to prevent NextAuth from overriding our redirect logic
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin' ||
            result.error.toLowerCase().includes('invalid') ||
            result.error.toLowerCase().includes('credentials') ||
            result.error.toLowerCase().includes('password') ||
            result.error.toLowerCase().includes('user')) {
          setError(t('errors:CredentialsSignin', 'Invalid username or password. Please try again.'));
        } else {
          setError(getErrorMessage({ message: result.error }));
        }
        setLoading(false);
      } else if (result?.ok) {
        setShowSuccess(true);
        setError(null);

        // Short delay to show success state, then redirect
        setTimeout(() => {
          setRedirecting(true);
          // Always prefer our callbackUrl over the result.url to ensure proper redirect
          const redirectUrl = callbackUrl;
          try {
            router?.push?.(redirectUrl);
          } catch (e) {
            console.error('Router push failed:', e);
            window.location.href = redirectUrl;
          }
        }, 1000);
      } else {
        setError("An unknown error occurred.");
        setLoading(false);
      }
    } catch (e) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
    // No finally block needed for setLoading if all paths handle it.
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-start sm:items-center justify-center bg-white sm:bg-gray-50 dark:bg-gray-900 p-0 sm:p-4 transition-colors duration-300">
      <div className="w-full sm:h-auto sm:max-w-[900px] sm:bg-white sm:dark:bg-gray-800 sm:shadow-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-none bg-white dark:bg-gray-800 sm:-mt-16">
        
        {/* LEFT SIDE: Brand Sidebar (Desktop Only) */}
        <div className="hidden md:flex md:w-[40%] bg-[#0f172a] text-white flex-col items-center justify-center relative p-10 text-center overflow-hidden">
           {/* Abstract Background Shape */}
           <div className="absolute bottom-0 left-0 w-full h-[70%] opacity-20 pointer-events-none">
             <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-blue-500 fill-current">
               <path transform="translate(100 100)" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.2,-19.2,95.8,-4.9C93.4,9.5,81.8,23.3,70.8,35.2C59.9,47.1,49.5,57.1,37.3,64.8C25.1,72.5,11.1,77.9,-1.8,81C-14.7,84.1,-27.9,84.9,-39.9,78.8C-51.9,72.7,-62.7,59.7,-70.8,45.8C-78.9,31.9,-84.3,17.1,-83.4,2.5C-82.5,-12.1,-75.3,-26.5,-65.4,-38.3C-55.5,-50.1,-42.9,-59.3,-29.9,-67.2C-16.9,-75.1,-3.5,-81.7,9.3,-80.7C22.1,-79.7,29.9,-71,44.7,-76.4Z" />
             </svg>
           </div>
           
           <div className="z-10 flex flex-col items-center">
             <div className="mb-6 p-4 bg-white/10 rounded-full backdrop-blur-sm shadow-lg ring-1 ring-white/20">
               {/* SVG Logo Icon */}
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
               </svg>
             </div>
             
             <h1 className="text-3xl font-bold mb-3 tracking-tight">
               {t('welcomeBack')}
             </h1>
             <p className="text-blue-100/80 text-sm leading-relaxed max-w-[200px]">
               {t('signInDescription', 'Sign in to your account to continue.')}
             </p>
           </div>
        </div>
  
        {/* RIGHT SIDE: Login Form */}
        <div className="flex-1 flex flex-col justify-start sm:justify-center px-6 sm:px-12 md:px-12 lg:px-16 py-6 sm:py-10 overflow-y-auto sm:overflow-visible">
            
             {/* Mobile Logo Only */}
             <div className="md:hidden flex flex-col items-center mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-gray-800 rounded-full mb-2">
                   <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                   </svg>
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('welcomeBack')}</h1>
             </div>

             <div className="hidden md:block mb-6">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                 {t('signIn')}
               </h2>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 {t('signInDescription_short', 'Enter your details to access your account.')}
               </p>
             </div>

            {error && (
              <div role="alert" aria-live="polite" className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-xs sm:text-sm flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${redirecting ? 'opacity-50' : ''}`}>
               {/* Username */}
               <div>
                 <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   {t('usernameOrEmail')}
                 </label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <input
                     id="username"
                     type="text"
                     {...register('username')}
                     className={`block w-full pl-9 sm:pl-10 pr-4 py-2.5 rounded-xl border-none ring-1 ring-gray-200 dark:ring-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base transition-shadow ${
                       errors.username ? 'ring-red-300 bg-red-50' : ''
                     }`}
                     placeholder={t('usernameOrEmailPlaceholder', 'Enter your username')}
                   />
                 </div>
                 {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
               </div>

               {/* Password */}
               <div>
                 <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('password')}
                    </label>
                    <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                       <PasswordInput
                         {...field}
                         id="password"
                         className="bg-gray-50 dark:bg-gray-900/50 border-none ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl py-2.5 text-sm sm:text-base"
                         placeholder="••••••"
                       />
                    )}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
               </div>

               {/* Verification */}
               <SimpleVerification
                 onVerified={(verified: boolean) => {
                   if (verified !== isVerified) {
                     setIsVerified(verified);
                     if (verified && error === t('verificationRequired')) {
                       setError('');
                     }
                   }
                 }}
                 autoStart={true}
               />

               <button
                 type="submit"
                 disabled={loading || !isVerified}
                 className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 ${!loading && isVerified ? 'hover-lift' : ''}`}
               >
                 {loading ? t('loading') : t('signIn')}
               </button>
            </form>

            {showSuccess && !error && (
              <div
                className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100 flex items-center gap-2"
                role="alert"
                data-testid="success-alert"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {t('loginSuccessful', 'Login successful! Redirecting...')}
              </div>
            )}

            <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 bg-white dark:bg-gray-800 text-gray-400">
                      {t('orContinueWith', 'or')}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                   <GoogleSignInButton 
                     className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-2.5 h-auto shadow-sm"
                   />
                </div>
            </div>

            <p className="mt-6 text-center text-xs sm:text-sm text-gray-500">
              {t('dontHaveAccount')}{' '}
              <Link href="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                {t('signUp')}
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
