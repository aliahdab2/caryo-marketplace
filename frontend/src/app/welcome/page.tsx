"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from 'next/link';
import Image from 'next/image';
import useLazyTranslation from "@/hooks/useLazyTranslation";

// Move namespaces outside component to prevent recreation on every render
const WELCOME_NAMESPACES = ['auth', 'common'];

const WelcomePage: React.FC = () => {
  // Lazy load the auth and common namespaces
  useLazyTranslation(WELCOME_NAMESPACES);

  const { t } = useTranslation(['auth', 'common']);
  const _router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Get username from URL params
    const usernameParam = searchParams.get('username');
    if (usernameParam) {
      setUsername(decodeURIComponent(usernameParam));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left section - Brand/imagery */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#welcomeGradient)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#welcomeGradient)" opacity="0.5" />
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
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('auth:welcomeToCaryo')}</h2>
          <p className="text-sm md:text-base opacity-80">{t('auth:readyToExplore')}</p>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName')}</p>
          <p className="opacity-60">{t('privacy_policy')} • {t('terms_of_service')}</p>
        </div>
      </div>
      
      {/* Right section - Welcome content */}
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
            {/* Welcome Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {username ? t('auth:welcomeUser', { username }) : t('auth:welcomeToCaryo')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('auth:accountCreatedSuccess')}
              </p>
            </div>

            {/* Next Steps */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t('auth:whatCanYouDo')}</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {t('auth:browseCars')}</li>
                <li>• {t('auth:saveFavorites')}</li>
                <li>• {t('auth:contactSellers')}</li>
                <li>• {t('auth:createListings')}</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t('auth:startBrowsing')}
              </Link>
              
              <Link
                href="/dashboard"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t('auth:goToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
