"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/images/logo.svg");
  const [logoError, setLogoError] = useState(false);
  const { t } = useTranslation('common');

  // Handle logo loading only once
  const handleLogoError = () => {
    if (!logoError) {
      // Don't fallback to Next.js logo anymore
      console.error("Logo image failed to load");
      setLogoError(true);
    }
  };

  return (
    <nav className="bg-white shadow-md dark:bg-gray-900">
      <div className="max-w-full sm:max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image 
                className="h-7 w-auto sm:h-8" 
                src={logoSrc} 
                alt="AutoTrader Marketplace" 
                width={32} 
                height={32}
                onError={handleLogoError}
              />
              <span className="ml-2 rtl:mr-2 rtl:ml-0 text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                AutoTrader
              </span>
            </Link>
            <div className="hidden md:ml-4 lg:ml-6 md:flex md:space-x-4 lg:space-x-8 rtl:space-x-reverse">
              <Link 
                href="/" 
                className="border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800 inline-flex items-center px-1 pt-1 border-b-2 text-xs md:text-sm lg:text-base font-medium dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                {t('header.home')}
              </Link>
              <Link 
                href="/listings" 
                className="border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800 inline-flex items-center px-1 pt-1 border-b-2 text-xs md:text-sm lg:text-base font-medium dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                {t('header.listings')}
              </Link>
              <Link 
                href="/about" 
                className="border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800 inline-flex items-center px-1 pt-1 border-b-2 text-xs md:text-sm lg:text-base font-medium dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                {t('header.about')}
              </Link>
              <Link 
                href="/contact" 
                className="border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800 inline-flex items-center px-1 pt-1 border-b-2 text-xs md:text-sm lg:text-base font-medium dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                {t('header.contact')}
              </Link>
            </div>
          </div>
          <div className="hidden md:ml-4 lg:ml-6 md:flex md:items-center">
            {/* Language Switcher in desktop view */}
            <div className="mr-4 rtl:mr-0 rtl:ml-4">
              <LanguageSwitcher />
            </div>
            
            {session ? (
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  {t('header.dashboard')}
                </Link>
                <div className="relative ml-3 rtl:ml-0 rtl:mr-3">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                      {session.user?.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-x-2 sm:space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => signIn()}
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('auth.signin')}
                </button>
                <Link 
                  href="/auth/signup" 
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('auth.signup')}
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-1 rtl:-ml-1 rtl:mr-0 flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={mobileMenuOpen ? "true" : "false"}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden transform ${mobileMenuOpen ? 'max-h-screen opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            href="/"
            className="block pl-3 pr-4 py-2.5 sm:py-3 border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent text-sm sm:text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('header.home')}
          </Link>
          <Link 
            href="/listings"
            className="block pl-3 pr-4 py-2.5 sm:py-3 border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent text-sm sm:text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('header.listings')}
          </Link>
          <Link 
            href="/about"
            className="block pl-3 pr-4 py-2.5 sm:py-3 border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent text-sm sm:text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('header.about')}
          </Link>
          <Link 
            href="/contact"
            className="block pl-3 pr-4 py-2.5 sm:py-3 border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent text-sm sm:text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('header.contact')}
          </Link>
          
          {/* Language Switcher in mobile menu */}
          <div className="px-4 py-3">
            <LanguageSwitcher />
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {session ? (
              <div className="space-y-3">
                <div className="px-4">
                  <p className="text-base font-medium text-gray-800 dark:text-white">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[280px]">
                    {session.user?.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <Link 
                    href="/dashboard"
                    className="block pl-3 pr-4 py-2 border-l-4 rtl:border-l-0 rtl:border-r-4 rtl:pr-3 rtl:pl-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('header.dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 rtl:border-l-0 rtl:border-r-4 rtl:pr-3 rtl:pl-4 border-transparent text-base font-medium text-red-600 hover:bg-gray-50 hover:border-red-300 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-4">
                <button
                  onClick={() => {
                    signIn();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center px-4 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('auth.signin')}
                </button>
                <Link 
                  href="/auth/signup"
                  className="block w-full text-center px-4 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 border border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('auth.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
