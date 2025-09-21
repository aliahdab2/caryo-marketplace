"use client";

import { useTranslation } from "react-i18next";
import { useEffect, Suspense } from "react";
import { signOut } from "next-auth/react";
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy load the signup form for better performance
const SignupForm = dynamic(() => import('@/components/auth/SignupForm'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export default function SignUpPage() {
  const { t } = useTranslation('auth');

  // Clear any existing session errors when user visits signup page
  useEffect(() => {
    // Clear any failed authentication state that might be blocking the signup
    signOut({ redirect: false });
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 animate-fade-in">
      {/* Left section - Enhanced Brand/imagery */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-col justify-between relative overflow-hidden shadow-2xl md:order-1">
        {/* Enhanced Background pattern with animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-800/20 animate-pulse"></div>
          <svg className="absolute w-full h-full opacity-10" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="signUpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#signUpGradient)" filter="url(#glow)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#signUpGradient)" opacity="0.6" />
            <circle cx="200" cy="200" r="100" fill="url(#signUpGradient)" opacity="0.1" />
            <circle cx="800" cy="600" r="150" fill="url(#signUpGradient)" opacity="0.05" />
          </svg>
        </div>

        {/* Enhanced Content with better animations */}
        <div className="z-10 p-6 md:p-8 lg:p-10 flex flex-col text-left animate-slide-in-left">
          <div className="flex items-center mb-8 group">
            <div className="h-12 w-12 relative flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300">
              <NextImage
                src="/images/logo.svg"
                alt={t('logo')}
                width={48}
                height={48}
                className="w-10 h-10 md:w-12 md:h-12 object-contain filter invert drop-shadow-lg mr-3 md:mr-4"
                priority
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide">{t('appName')}</h1>
          </div>
          
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-left bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {t('joinUs')}
            </h2>
            <p className="text-base md:text-lg opacity-90 leading-relaxed text-left max-w-sm">
              {t('earlyAccessDescription', 'Get early access to Syria\'s newest car marketplace')}
            </p>
          </div>

          {/* Enhanced Feature highlights with icons and animations */}
          <div className="space-y-6">
            <div className="flex items-start group hover:bg-white/5 rounded-lg p-3 -m-3 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5 shadow-lg group-hover:shadow-xl transition-shadow duration-300 mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">{t('earlyAccess', 'Early Access')}</h3>
                <p className="text-sm opacity-80">{t('earlyAccessDesc', 'Be among the first users of our platform')}</p>
              </div>
            </div>

            <div className="flex items-start group hover:bg-white/5 rounded-lg p-3 -m-3 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mt-0.5 shadow-lg group-hover:shadow-xl transition-shadow duration-300 mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">{t('secureByDesign', 'Secure by Design')}</h3>
                <p className="text-sm opacity-80">{t('secureByDesignDesc', 'Built with security and privacy in mind')}</p>
              </div>
            </div>

            <div className="flex items-start group hover:bg-white/5 rounded-lg p-3 -m-3 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mt-0.5 shadow-lg group-hover:shadow-xl transition-shadow duration-300 mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-white mb-1">{t('foundingMember', 'Founding Member')}</h3>
                <p className="text-sm opacity-80">{t('foundingMemberDesc', 'Help shape the future of car trading in Syria')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom content with launch messaging */}
        <div className="z-10 p-6 md:p-8 lg:p-10 text-left border-t border-white/10">
          <div className="flex justify-center mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">🚀</div>
              <div className="text-sm opacity-80">{t('launchingSoon', 'Launching Soon')}</div>
            </div>
          </div>
          <p className="text-xs leading-relaxed opacity-70">
            {t('newPlatform', 'Be among the first to join Syria\'s newest car marketplace')}
          </p>
        </div>
      </div>

      {/* Right section - Enhanced Sign up form */}
      <div className="flex-1 flex flex-col justify-center px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8 pb-8 md:pb-12 auth-container md:order-2 animate-slide-in-right">
        <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
          {/* Enhanced Mobile logo with animation */}
          <div className="flex md:hidden items-center justify-center mb-8 sm:mb-10">
            <div className="flex items-center animate-fade-in-up group">
              <div className="relative">
                <NextImage
                  src="/images/logo.svg"
                  alt={t('logo')}
                  width={44}
                  height={44}
                  className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 mr-3 sm:mr-4"
                  priority
                />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-colors duration-300"></div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {t('appName')}
              </h1>
            </div>
          </div>

          {/* Clean minimal header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{t('secure', 'Secure')}</span>
              <span>•</span>
              <span>Step 1 of 4</span>
            </div>
          </div>

          {/* Enhanced Signup Form with Suspense */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">{t('loadingForm', 'Loading form...')}</span>
            </div>
          }>
            <SignupForm />
          </Suspense>

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 space-y-2 md:space-y-0 md:space-x-6">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                {t('sslSecured', 'SSL Secured')}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                {t('dataProtected', 'Data Protected')}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                {t('instantSetup', 'Instant Setup')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
