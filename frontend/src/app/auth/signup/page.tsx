"use client";

import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import SignupForm from '@/components/auth/SignupForm';
import NextImage from 'next/image';

export default function SignUpPage() {
  const { t } = useTranslation('auth');

  // Clear any existing session errors when user visits signup page
  useEffect(() => {
    // Clear any failed authentication state that might be blocking the signup
    signOut({ redirect: false });
  }, []);

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
              <NextImage
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

          {/* Feature highlights */}
          <div className="mt-8 space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">{t('benefitExperience')}</h3>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">{t('benefitSafety')}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="z-10 p-6 md:p-8 lg:p-10">
          <p className="text-xs leading-relaxed opacity-80">
            {t('benefitExperience')}
          </p>
        </div>
      </div>

      {/* Right section - Sign up form */}
      <div className="flex-1 flex justify-center items-start pt-4 md:pt-6 lg:pt-8 xl:pt-10 pb-4 md:pb-6 lg:pb-8 xl:pb-10 px-4 md:px-6 lg:px-8 xl:px-10 auth-container">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mt-0 mb-auto">
          {/* Mobile logo (shown only on mobile) */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center responsive-fade-in">
              <NextImage
                src="/images/logo.svg"
                alt={t('logo')}
                width={40}
                height={40}
                className="mr-2.5 sm:mr-3 w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName')}</h1>
            </div>
          </div>


          {/* Traditional Signup Form */}
          <SignupForm />

        </div>
      </div>
    </div>
  );
}
