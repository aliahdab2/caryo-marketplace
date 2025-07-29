"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { authService } from "@/services/auth";
import SuccessAlert from "@/components/ui/SuccessAlert";
import SimpleVerification from '@/components/auth/SimpleVerification';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import Image from 'next/image';
import Link from 'next/link';

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const router = useRouter();
  const { t } = useTranslation('auth');

  // Extract callback URL from search params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      const callback = searchParams.get('callbackUrl');
      
      // Prefer returnUrl over callbackUrl for better compatibility
      const redirectTarget = returnUrl || callback || '/dashboard';
      
      try {
        if (redirectTarget.startsWith('/')) {
          setCallbackUrl(redirectTarget);
        } else {
          const url = new URL(decodeURIComponent(redirectTarget));
          if (url.origin === window.location.origin) {
            // Include the full path and any query parameters
            setCallbackUrl(url.pathname + url.search + url.hash);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Error parsing redirect URL:', e);
          setCallbackUrl('/dashboard');
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    if (!username || !email || !password || !confirmPassword) {
      setError(t('fieldRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }
    
    if (!isVerified) {
      setError(t('verificationRequired', "Verification required before signup"));
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signup({
        username,
        email,
        password,
        confirmPassword,
      });

      setSuccessMessage(result.message || t('signupSuccess'));
      
      // Short delay to show the success message before signing in
      setTimeout(async () => {
        try {
          const signInResult = await signIn("credentials", {
            redirect: false,
            username,
            password,
            callbackUrl,
          });

          if (signInResult?.error) {
            setError(signInResult.error);
            setLoading(false);
          } else if (signInResult?.ok) {
            // Use the URL from the sign-in result if available, otherwise fall back to callbackUrl
            const redirectUrl = signInResult.url || callbackUrl;
            router.push(redirectUrl);
          }
        } catch {
          setError(t('errorOccurred'));
          setLoading(false);
        }
      }, 1500);
    } catch (err) {
      let message = t('registrationFailed', "Registration failed. Please try again.");
      if (typeof err === "object" && err !== null) {
        if (
          "data" in err &&
          typeof (err as Record<string, unknown>).data === "object" &&
          (err as { data?: { message?: string } }).data?.message
        ) {
          message = String((err as { data?: { message?: string } }).data?.message);
        } else if ("message" in err && typeof (err as { message?: string }).message === "string") {
          message = (err as { message?: string }).message!;
        }
      }
      setError(message);
      setLoading(false);
      if (process.env.NODE_ENV !== 'test') {
        console.error("Registration error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left section - Brand/imagery */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="signUpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#signUpGradient)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#signUpGradient)" opacity="0.5" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="z-10 p-6 md:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 relative flex-shrink-0">
              <Image 
                src="/images/logo.svg" 
                alt={t('logo')} 
                width={40} 
                height={40} 
                className="mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10 object-contain filter invert" 
              />
            </div>
            <h1 className="text-lg md:text-xl font-bold">{t('appName')}</h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('joinUs')}</h2>
          <p className="text-sm md:text-base opacity-80">{t('createAccountDescription')}</p>
          
          <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/5">
            <div className="flex items-start mb-3">
              <div className="mr-2.5 mt-0.5 text-blue-200 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-xs leading-relaxed">
                {t('benefitSafety')}
              </p>
            </div>
            <div className="flex items-start">
              <div className="mr-2.5 mt-0.5 text-blue-200 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-xs leading-relaxed">
                {t('benefitExperience')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName')}</p>
          <p className="opacity-60">{t('privacy_policy')} • {t('terms_of_service')}</p>
        </div>
      </div>
      
      {/* Right section - Sign up form */}
      <div className="flex-1 flex justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10 auth-container">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mt-2 sm:mt-4 mb-auto">
          {/* Mobile logo (shown only on mobile) */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center responsive-fade-in">
              <Image 
                src="/images/logo.svg" 
                alt={t('logo', 'Caryo Logo')} 
                width={40} 
                height={40} 
                className="mr-2.5 sm:mr-3 w-8 h-8 sm:w-10 sm:h-10 object-contain" 
              />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName')}</h1>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 lg:p-10 auth-form">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1 auth-heading">{t('sign_up')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm auth-description">{t('createAccountDescription')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className={`responsive-fade-in ${loading ? 'opacity-70 transition-opacity' : ''}`} data-testid="signup-form">
              
              {/* Display animated success alert when registration is successful - placed at top of form but fixed positioned */}
              <div style={{ height: 0, overflow: "visible", position: "relative" }}>
                <SuccessAlert
                  message={successMessage}
                  visible={!!successMessage}
                  onComplete={() => setSuccessMessage("")}
                  autoHideDuration={3500}
                />
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
                    disabled={loading}
                    className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('signupUsernamePlaceholder')}
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('email')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('password')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    id="password"
                    data-testid="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('passwordRequirement')}
                </p>
              </div>
              
              <div className="mb-5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('confirmPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    data-testid="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('confirmPasswordPlaceholder', "Confirm your password")}
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <SimpleVerification
                  onVerified={(verified: boolean) => {
                    if (verified !== isVerified) {
                      setIsVerified(verified);
                      if (verified) {
                        if (error && error.includes("verification")) {
                          setError("");
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
                  title={!isVerified ? t('verificationRequired') : ""}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('loading')}
                    </div>
                  ) : (
                    t('sign_up')
                  )}
                </button>
                
                {!isVerified && (
                  <div className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                    {t('pleaseVerifyFirst')}
                  </div>
                )}
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
              <GoogleSignInButton callbackUrl="/dashboard" className="w-full py-2 sm:py-2.5 text-sm sm:text-base" />
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('alreadyHaveAccount')}{" "}
                <Link
                  href="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {t('signin')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
