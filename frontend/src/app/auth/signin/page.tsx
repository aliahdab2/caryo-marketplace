"use client";

import { signIn } from "next-auth/react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useApiErrorHandler } from '@/utils/apiErrorHandler';
import SimpleVerification from '@/components/auth/SimpleVerification';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';
import Image from 'next/image';
import useLazyTranslation from "@/hooks/useLazyTranslation";

// Move namespaces outside component to prevent recreation on every render
const AUTH_NAMESPACES = ['auth', 'errors'];

const SignInPage: React.FC = () => {
  // Lazy load the auth and errors namespaces
  useLazyTranslation(AUTH_NAMESPACES);

  const { t } = useTranslation(['auth', 'errors']);
  const router = useRouter();
  const { getErrorMessage } = useApiErrorHandler();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [callbackUrlLoaded, setCallbackUrlLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [credentialsCorrect, setCredentialsCorrect] = useState(false);

  const { session } = useAuthSession();

  // Extract callback URL from search params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      const callback = searchParams.get('callbackUrl');
      
      // Check localStorage for redirect URL (from FavoriteButton or other sources) - fallback only
      const storedRedirect = localStorage.getItem('redirectAfterAuth');
      
      console.log('Sign-in redirect setup:', { returnUrl, callback, storedRedirect });
      
      // Prefer URL parameters over localStorage, then default to /dashboard
      const redirectTarget = returnUrl || callback || storedRedirect || '/dashboard';
      
      // Clear the stored redirect URL if we found one (cleanup)
      if (storedRedirect) {
        localStorage.removeItem('redirectAfterAuth');
        console.log('Cleaned up stored redirect URL:', storedRedirect);
      }
      
      try {
        if (redirectTarget.startsWith('/')) {
          setCallbackUrl(redirectTarget);
          console.log('Set callbackUrl to:', redirectTarget);
        } else {
          const url = new URL(decodeURIComponent(redirectTarget));
          if (url.origin === window.location.origin) {
            // Include the full path and any query parameters or hash
            const finalUrl = url.pathname + url.search + url.hash;
            setCallbackUrl(finalUrl);
            console.log('Set callbackUrl to:', finalUrl);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Error parsing redirect URL:', e);
          setCallbackUrl('/dashboard');
        }
      }
      
      // Mark that callback URL has been loaded
      setCallbackUrlLoaded(true);
    }
  }, []);

  // Reset credentialsCorrect when inputs change
  useEffect(() => {
    setCredentialsCorrect(false);
  }, [username, password]);

  // Reset credentialsCorrect if a new error message appears
  useEffect(() => {
    if (error && error !== "") { 
        setCredentialsCorrect(false);
    }
  }, [error]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setShowSuccess(false);
    setCredentialsCorrect(false);

    if (!username || !password) {
      setError(t('fieldRequired'));
      setLoading(false);
      return;
    }

    if (!isVerified) {
      setError(t('verificationRequired'));
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password
        // Note: Not passing callbackUrl to signIn to prevent NextAuth from overriding our redirect logic
      });

      if (result?.error) {
        if (result.error.toLowerCase().includes('invalid') || 
            result.error.toLowerCase().includes('credentials') ||
            result.error.toLowerCase().includes('password') ||
            result.error.toLowerCase().includes('user')) {
          setError(t('errors:invalidCredentials', 'Invalid username or password. Please try again.'));
        } else {
          setError(getErrorMessage({ message: result.error }));
        }
        setLoading(false);
      } else if (result?.ok) {
        setCredentialsCorrect(true);
        setShowSuccess(true);
        setError("");

        // Short delay to show success state, then redirect
        setTimeout(() => {
          setRedirecting(true);
          // Always prefer our callbackUrl over the result.url to ensure proper redirect
          const redirectUrl = callbackUrl;
          console.log('Redirecting after sign-in:', { callbackUrl, resultUrl: result.url, chosen: redirectUrl });
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

  // Safe redirect when user already has an active session
  // Only redirect after callbackUrl has been properly loaded from localStorage
  useEffect(() => {
    if (session && !redirecting && callbackUrlLoaded) {
      // Add a slight delay to ensure session is fully processed
      setRedirecting(true);
      
      // Log session state for debugging
      console.log('Redirecting with session:', {
        hasUser: !!session?.user,
        hasToken: !!session?.accessToken,
        callbackUrl
      });
      
      setTimeout(() => {
        try {
          router?.push?.(callbackUrl);
        } catch (e) {
          console.error('Router push failed:', e);
          window.location.href = callbackUrl;
        }
      }, 500);
    }
  }, [session, router, callbackUrl, redirecting, callbackUrlLoaded]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left section - Brand/imagery - RESPONSIVE */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-col justify-between relative overflow-hidden">
        {/* Improved background pattern - more subtle waves instead of grid */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="signInGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#signInGradient)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#signInGradient)" opacity="0.5" />
          </svg>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center mb-6">
            <Image 
              src="/images/logo.svg" 
              alt={t('logo')}
              width={40} 
              height={40} 
              className="mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10 object-contain filter invert" 
            />
            <h1 className="text-lg md:text-xl font-bold">{t('appName')}</h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('welcomeBack')}</h2>
          <p className="text-sm md:text-base opacity-80">{t('signInDescription')}</p>
        </div>          <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName')}</p>
          <p className="opacity-60">{t('privacy_policy')} • {t('terms_of_service')}</p>
        </div>
      </div>
      
      {/* Right section - Sign in form - OPTIMIZED FOR RESPONSIVE */}
      <div className="flex-1 flex justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10 auth-container">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mt-2 sm:mt-4 mb-auto">
          {/* Mobile logo (shown only on mobile) */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center responsive-fade-in">
              <Image src="/images/logo.svg" alt={t('logo')} width={40} height={40} className="mr-2.5 sm:mr-3 w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName')}</h1>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 auth-form transition-all duration-300 ease-in-out ${
            credentialsCorrect && !error // Apply border if credentialsCorrect is true AND there's no error
              ? 'border-2 border-green-500 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800'
              : 'border border-gray-200 dark:border-gray-700'
          }`}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1 auth-heading">{t('signIn')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm auth-description">{t('signInDescription')}</p>
            </div>
            
            {error && (
              <div role="alert" className="mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-200 dark:border-red-700 flex items-center text-xs sm:text-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}
            {showSuccess && (
              <div role="alert" className="mb-6 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md dark:bg-green-900/30 dark:text-green-200 dark:border-green-700 flex items-center text-xs sm:text-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {t('loginSuccess')} {t('redirecting')}
              </div>
            )}

            <form onSubmit={handleSubmit} className={`responsive-fade-in ${redirecting ? 'opacity-70 transition-opacity' : ''}`}>
              <div className="mb-5">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('username')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    data-error={t('fieldRequired')}
                    className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('usernamePlaceholder')}
                    onInvalid={(e) => {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const errorMsg = target.getAttribute('data-error') || t('fieldRequired');
                      target.setCustomValidity(errorMsg);
                    }}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('password')}
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-error={t('fieldRequired')}
                    className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('passwordPlaceholder')}
                    onInvalid={(e) => {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const errorMsg = target.getAttribute('data-error') || t('fieldRequired');
                      target.setCustomValidity(errorMsg);
                    }}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <SimpleVerification 
                  onVerified={(verified: boolean) => {
                    if (verified !== isVerified) { 
                      setIsVerified(verified);
                      if (verified) {
                        if (error === t('verificationRequired')) {
                          setError(''); 
                        }
                      }
                    }
                  }}
                  autoStart={true} 
                />
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  disabled={loading || !isVerified}
                  className={`w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-md text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200 ${
                    loading || !isVerified ? 'opacity-70 cursor-not-allowed' : 'hover-lift'
                  } transform active:translate-y-0`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('loading')}
                    </div>
                  ) : t('signIn')}
                </button>
              </div>
            </form>
          
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  {t('or')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <GoogleSignInButton callbackUrl={callbackUrl} className="w-full py-2 sm:py-2.5 text-sm sm:text-base" />
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dontHaveAccount')}{' '}
                <Link 
                  href={`/auth/signup${window?.location?.search || ''}`} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {t('signUp')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
