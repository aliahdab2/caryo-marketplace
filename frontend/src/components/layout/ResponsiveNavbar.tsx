"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/components/EnhancedLanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { 
  ResponsiveContainer, 
  MobileOnly, 
  NotOnMobile 
} from "@/components/responsive";
import { useResponsive } from "@/utils/responsive";

export default function ResponsiveNavbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/images/logo.svg");
  const [logoError, setLogoError] = useState(false);
  const { t } = useTranslation('common');
  const { isMobile } = useResponsive();
  
  // Refs for dropdown menus
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);
  
  // Handle clicks outside the user menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);

  // Handle logo loading only once
  const handleLogoError = () => {
    if (!logoError) {
      console.error("Logo image failed to load");
      setLogoError(true);
    }
  };
  
  // Toggle functions
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white shadow-md dark:bg-gray-900 sticky top-0 z-50">
      <ResponsiveContainer>
        <div className="flex justify-between h-14 sm:h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image 
                className="h-7 w-auto sm:h-8" 
                src={logoSrc} 
                alt="Caryo Marketplace" 
                width={32} 
                height={32}
                onError={handleLogoError}
              />
              <span className="ml-2 rtl:mr-2 rtl:ml-0 text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Caryo
              </span>
            </Link>
            
            {/* Desktop Navigation Links */}
            <NotOnMobile>
              <div className="ml-4 lg:ml-6 flex space-x-4 lg:space-x-8 rtl:space-x-reverse">
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
            </NotOnMobile>
          </div>
          
          {/* Desktop Right Side - Auth, Language */}
          <NotOnMobile>
            <div className="flex items-center">
              {/* Language Switcher */}
              <div className="mr-4 rtl:mr-0 rtl:ml-4">
                <LanguageSwitcher />
              </div>
              
              {/* Auth Buttons */}
              {session ? (
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium dark:text-gray-300 dark:hover:text-white transition-colors"
                  >
                    {t('header.dashboard')}
                  </Link>
                  <div className="relative ml-3 rtl:ml-0 rtl:mr-3" ref={userMenuRef}>
                    <button 
                      onClick={toggleUserMenu}
                      className="flex items-center space-x-2 rtl:space-x-reverse focus:outline-none"
                    >
                      <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                        {session.user?.email}
                      </span>
                      <svg 
                        className={`h-5 w-5 text-gray-400 transform transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* User dropdown menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 animate-fadeIn">
                        <Link 
                          href="/dashboard" 
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t('header.dashboard')}
                        </Link>
                        <button
                          onClick={() => { signOut(); setUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {t('header.logout')}
                        </button>
                      </div>
                    )}
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
          </NotOnMobile>
          
          {/* Mobile Menu Button */}
          <MobileOnly>
            <div className="flex items-center">
              <LanguageSwitcher />
              <button
                onClick={toggleMobileMenu}
                className="ml-2 inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                aria-expanded={mobileMenuOpen ? "true" : "false"}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </MobileOnly>
        </div>
      </ResponsiveContainer>
      
      {/* Mobile Menu */}
      <MobileOnly>
        {mobileMenuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 shadow-lg animate-slideDown">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              onClick={closeMobileMenu}
            >
              {t('header.home')}
            </Link>
            <Link
              href="/listings"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              onClick={closeMobileMenu}
            >
              {t('header.listings')}
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              onClick={closeMobileMenu}
            >
              {t('header.about')}
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              onClick={closeMobileMenu}
            >
              {t('header.contact')}
            </Link>
            
            {/* Mobile Auth */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              {session ? (
                <>
                  <div className="px-3 mb-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {session.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    onClick={closeMobileMenu}
                  >
                    {t('header.dashboard')}
                  </Link>
                  <button
                    onClick={() => { signOut(); closeMobileMenu(); }}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    {t('header.logout')}
                  </button>
                </>
              ) : (
                <div className="px-3 space-y-2">
                  <button
                    onClick={() => { signIn(); closeMobileMenu(); }}
                    className="w-full block text-center px-4 py-2 rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {t('auth.signin')}
                  </button>
                  <Link
                    href="/auth/signup"
                    className="w-full block text-center px-4 py-2 rounded-md shadow-sm text-base font-medium text-blue-600 bg-white border border-blue-600 hover:bg-blue-50"
                    onClick={closeMobileMenu}
                  >
                    {t('auth.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </MobileOnly>
    </nav>
  );
}
