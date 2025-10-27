"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from 'next/link';
import Image from 'next/image';
import useLazyTranslation from "@/hooks/useLazyTranslation";

// Move namespaces outside component to prevent recreation on every render
const NAMESPACES = ['auth', 'common'];

const CheckEmailPage: React.FC = () => {
  // Lazy load the namespaces
  useLazyTranslation(NAMESPACES);

  const { t, i18n } = useTranslation(['auth', 'common']);
  const _router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // RTL support
  const isRTL = i18n.language?.startsWith('ar');
  const dir = isRTL ? 'rtl' : 'ltr';

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
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" dir={dir}>
      {/* Left section - Brand/imagery */}
      <div className={`hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-col justify-between relative overflow-hidden ${isRTL ? 'md:order-2' : 'md:order-1'}`}>
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
          <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Image 
              src="/images/logo.svg" 
              alt={t('logo')}
              width={40} 
              height={40} 
              className={`${isRTL ? 'ml-2 md:ml-3' : 'mr-2 md:mr-3'} w-8 h-8 md:w-10 md:h-10 object-contain filter invert`}
            />
            <h1 className="text-lg md:text-xl font-bold">{t('appName')}</h1>
          </div>
          {/* Left panel keeps branding only to avoid duplicating the main title */}
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName')}</p>
          <p className="opacity-60">{t('privacyPolicy', 'Privacy Policy')} • {t('termsOfService', 'Terms of Service')}</p>
        </div>
      </div>
      
      {/* Right section - Check email content */}
      <div className={`flex-1 flex justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10 ${isRTL ? 'md:order-1' : 'md:order-2'}`}>
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Image src="/images/logo.svg" alt={t('logo')} width={40} height={40} className={`${isRTL ? 'ml-2.5 sm:ml-3' : 'mr-2.5 sm:mr-3'} w-8 h-8 sm:w-10 sm:h-10`} />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName')}</h1>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                <svg className="w-10 h-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t('checkYourEmail', 'Check Your Email')}</h2>
              <p className="text-blue-100 text-sm">
                {t('almostThere', 'You\'re almost there!')}
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Email display */}
              {email ? (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('emailSentTo', 'Email sent to:')}</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 break-all">{email}</p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('verificationEmailSentDescription', 'Check your email for the verification link')}
                  </p>
                </div>
              )}

              {/* Resend Section */}
              <div className="text-center mb-6">
                {resendError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {resendError}
                  </div>
                )}

                {resendSuccess && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    {t('verificationEmailSent', 'Email sent!')}
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {t('didntReceiveEmail', 'Didn\'t receive the email?')}
                </p>

                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCooldown > 0 || !email}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline transition-colors"
                >
                  {resendLoading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('sending', 'Sending...')}
                    </span>
                  ) : resendCooldown > 0 ? (
                    `${t('resendIn', 'Resend in')} ${resendCooldown}s`
                  ) : (
                    t('resendEmail', 'Resend verification email')
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t('or', 'or')}
                  </span>
                </div>
              </div>

              {/* Actions - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={`/${i18n.language}/auth/signin`}
                  className={`flex justify-center items-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  {t('signIn', 'Sign In')}
                </Link>
                
                <Link
                  href={`/${i18n.language}`}
                  className={`flex justify-center items-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  {t('home', 'Home')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailPage;