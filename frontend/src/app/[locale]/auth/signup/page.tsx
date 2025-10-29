"use client";

import { useTranslation } from "react-i18next";
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useEffect, Suspense } from "react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useRTL } from '@/hooks/useRTL';

// Lazy load the signup form for better performance
const SignupForm = dynamic(() => import('@/components/auth/SignupForm'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export default function SignUpPage() {
  const { t } = useTranslation('auth');
  const { currentLang, isRTL } = useLanguageSwitching();
  const { dir, flexDirection, textAlign, marginStart, spaceX } = useRTL();
  const searchParams = useSearchParams();

  // Get callback URL and clean it if it's nested
  const getCleanCallbackUrl = () => {
    const callbackUrl = searchParams.get('callbackUrl');
    if (!callbackUrl) return '/dashboard';

    // If the callback URL is another auth page with a callback, extract the original
    try {
      const decodedUrl = decodeURIComponent(callbackUrl);
      if (decodedUrl.includes('/auth/') && decodedUrl.includes('callbackUrl=')) {
        const url = new URL(decodedUrl);
        const nestedCallback = url.searchParams.get('callbackUrl');
        return nestedCallback ? decodeURIComponent(nestedCallback) : '/dashboard';
      }
      return decodedUrl;
    } catch {
      return '/dashboard';
    }
  };

  // Clear any existing session errors when user visits signup page
  useEffect(() => {
    // Clear any failed authentication state that might be blocking the signup
    signOut({ redirect: false });
  }, []);

  return (
    <div className={`min-h-screen flex flex-col md:${flexDirection} bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 animate-fade-in`} dir={dir} data-rtl={isRTL ? 'true' : 'false'} data-lang={currentLang}>
      {/* Left section - Enhanced Brand/imagery */}
      <div className={`hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-col relative overflow-hidden shadow-2xl ${isRTL ? 'md:order-2' : 'md:order-1'}`}>
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
        <div className={`z-10 p-6 md:p-8 lg:p-10 flex flex-col animate-slide-in-left`} dir={dir}>
          <div className="flex items-center mb-6 gap-3 md:gap-4">
            <NextImage
              src="/images/logo.svg"
              alt={t('logo')}
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 object-contain brightness-0 invert opacity-95"
              priority
            />
            <h1 className="text-xl md:text-2xl font-bold tracking-wide">{t('appName')}</h1>
          </div>

          <div className="space-y-3 mb-6">
            <h2 className={`text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent`}>
              {t('joinUs')}
            </h2>
            <p className="text-sm md:text-base opacity-90 leading-relaxed max-w-sm">
              {t('earlyAccessDescription', 'Get early access to Syria\'s newest car marketplace')}
            </p>
          </div>

          {/* Enhanced Feature highlights with compact layout */}
          <div className="space-y-2.5">
            {/* Early Access */}
            <div className="group cursor-pointer">
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-md">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                </div>
                <div className={`flex-1 ${textAlign}`}>
                  <h3 className="text-base font-semibold text-white mb-0.5 group-hover:text-green-200 transition-colors duration-300">{t('earlyAccess', 'Early Access')}</h3>
                  <p className="text-xs text-white/70 group-hover:text-white/90 transition-colors duration-300">{t('earlyAccessDesc', 'Be among the first users of our platform')}</p>
                </div>
              </div>
            </div>

            {/* Secure by Design */}
            <div className="group cursor-pointer">
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-md">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                </div>
                <div className={`flex-1 ${textAlign}`}>
                  <h3 className="text-base font-semibold text-white mb-0.5 group-hover:text-blue-200 transition-colors duration-300">{t('secureByDesign', 'Secure by Design')}</h3>
                  <p className="text-xs text-white/70 group-hover:text-white/90 transition-colors duration-300">{t('secureByDesignDesc', 'Built with security and privacy in mind')}</p>
                </div>
              </div>
            </div>

            {/* Founding Member */}
            <div className="group cursor-pointer">
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-md">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className={`flex-1 ${textAlign}`}>
                  <h3 className="text-base font-semibold text-white mb-0.5 group-hover:text-purple-200 transition-colors duration-300">{t('foundingMember', 'Founding Member')}</h3>
                  <p className="text-xs text-white/70 group-hover:text-white/90 transition-colors duration-300">{t('foundingMemberDesc', 'Help shape the future of car trading in Syria')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Security Badges */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <span className="text-xs text-white/80">{isRTL ? 'منصة آمنة ومشفرة' : 'Secure & Encrypted'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <span className="text-xs text-white/80">{isRTL ? 'تحقق من البريد' : 'Email Verified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-md flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <span className="text-xs text-white/80">{isRTL ? 'حماية البيانات' : 'Data Protected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Enhanced Sign up form */}
      <div className={`flex-1 flex flex-col justify-center px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 auth-container ${isRTL ? 'md:order-1' : 'md:order-2'} animate-slide-in-right`}>
        <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
          {/* Enhanced Mobile logo with animation */}
          <div className="flex md:hidden items-center justify-center mb-4 sm:mb-6">
            <div className={`flex items-center animate-fade-in-up group ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="relative">
                <NextImage
                  src="/images/logo.svg"
                  alt={t('logo')}
                  width={44}
                  height={44}
                  className={`w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 ${marginStart('3')} sm:${marginStart('4')}`}
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
          <div className="mb-4 text-center">
            <div className={`flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 mb-4 ${spaceX('2')}`}>
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{t('secure', 'Secure')}</span>
              <span>•</span>
              <span>{t('stepOf', 'Step {{current}} of {{total}}', { current: 1, total: 4 })}</span>
            </div>
          </div>

          {/* Enhanced Signup Form with Suspense */}
          <Suspense fallback={
            <div className={`flex items-center justify-center py-12 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className={`${marginStart('3')} text-gray-600 dark:text-gray-400`}>{t('loadingForm', 'Loading form...')}</span>
            </div>
          }>
            <SignupForm callbackUrl={getCleanCallbackUrl()} />
          </Suspense>

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className={`flex flex-col md:flex-row items-center justify-center text-xs text-gray-500 dark:text-gray-400 gap-4 md:gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <svg className={`w-4 h-4 ${marginStart('1')} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                {t('sslSecured', 'SSL Secured')}
              </div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <svg className={`w-4 h-4 ${marginStart('1')} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                {t('dataProtected', 'Data Protected')}
              </div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <svg className={`w-4 h-4 ${marginStart('1')} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
