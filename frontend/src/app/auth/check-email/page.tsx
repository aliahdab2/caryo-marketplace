"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from 'next/link';
import Image from 'next/image';
import useLazyTranslation from "@/hooks/useLazyTranslation";

// Move namespaces outside component to prevent recreation on every render
const AUTH_NAMESPACES = ['auth'];

const CheckEmailPage: React.FC = () => {
  // Lazy load the auth namespace
  useLazyTranslation(AUTH_NAMESPACES);

  const { t } = useTranslation('auth');
  const _router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Extract email and username from URL params or localStorage
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const emailFromStorage = typeof window !== 'undefined' ? localStorage.getItem('signup-email') : null;
    const _usernameFromStorage = typeof window !== 'undefined' ? localStorage.getItem('signup-username') : null;

    const userEmail = emailFromUrl || emailFromStorage || '';
    setEmail(userEmail);

    // Clean up localStorage after using it (but keep for verify-email page)
    // We'll clean up in verify-email page after successful verification
  }, [searchParams]);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!email) {
      setResendError(t('validationEmailRequired'));
      return;
    }

    setResendLoading(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setResendCooldown(60); // 60 second cooldown
      } else {
        setResendError(data.message || t('resendFailed'));
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setResendError(t('resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left section - Brand/imagery */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="checkEmailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#checkEmailGradient)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#checkEmailGradient)" opacity="0.5" />
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
          {/* Left panel keeps branding only to avoid duplicating the main title */}
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName')}</p>
          <p className="opacity-60">{t('privacy_policy')} • {t('terms_of_service')}</p>
        </div>
      </div>
      
      {/* Right section - Check email content */}
      <div className="flex-1 flex justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center">
              <Image src="/images/logo.svg" alt={t('logo')} width={40} height={40} className="mr-2.5 sm:mr-3 w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName')}</h1>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200 dark:border-gray-700">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('checkYourEmail')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('verificationEmailSentTo')} <span className="font-medium text-gray-900 dark:text-white">{email}</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t('nextSteps')}</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {t('checkInboxAndSpam')}</li>
                <li>• {t('clickVerificationLink')}</li>
                <li>• {t('returnToSignIn')}</li>
              </ul>
            </div>

            {/* Resend Section */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('didntReceiveEmail')}
              </p>
              
              {resendError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-200 text-sm">
                  {resendError}
                </div>
              )}

              {resendSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-200 text-sm">
                  {t('verificationEmailSent')}
                </div>
              )}

              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('sending')}
                  </>
                ) : resendCooldown > 0 ? (
                  `${t('resendIn')} ${resendCooldown}s`
                ) : (
                  t('resendEmail')
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t('backToSignIn')}
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center py-2.5 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {t('backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailPage;