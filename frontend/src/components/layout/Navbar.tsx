"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import ToggleLanguageSwitcher from "@/components/ToggleLanguageSwitcher";
import SignInButton from "@/components/auth/SignInButton";
import { useAuthUser } from "@/hooks/useAuthSession";
import { MdLogout, MdPerson, MdSettings, MdDashboard, MdAdd, MdEmail, MdBookmark, MdDirectionsCar, MdSearch } from "react-icons/md";
import { NAVIGATION_ROUTES } from "@/utils/navigationUtils";
import type { ComponentProps } from "@/types/components";

export default function Navbar({ className }: ComponentProps) {
  const user = useAuthUser(); // Use optimized hook instead of full session
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoSrc] = useState("/images/logo.svg");
  const [logoError, setLogoError] = useState(false);
  const { t } = useTranslation('common');
  
  // Ref for user dropdown menu to handle clicks outside
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      // Don't fallback to Next.js logo anymore
      console.error("Logo image failed to load");
      setLogoError(true);
    }
  };

  return (
    <nav className={`bg-white shadow-md dark:bg-gray-900 mobile-prevent-scroll ${className || ''}`}>
      <div className="w-full max-w-[94%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[88%] lg:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 tablet-nav-improvements">
        <div className="flex items-center justify-between h-16 xs:h-17 sm:h-18 md:h-20 landscape-mobile-nav">
          
          {/* Left Side - Logo (Like Blocket) */}
          <div className="flex items-center flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center nav-focus-visible"
              aria-label={t('header.home')}
            >
              <Image 
                className="h-9 w-auto xs:h-10 sm:h-11 md:h-12" 
                src={logoSrc} 
                alt="" 
                width={48} 
                height={48}
                onError={handleLogoError}
              />
              <span className="ml-2 xs:ml-2 rtl:mr-2 rtl:xs:mr-2 rtl:ml-0 text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white logo-text">
                Caryo
              </span>
            </Link>
          </div>

          {/* Right Side - Navigation + Login/User Menu (Language Auto-Detected) */}
          <div className="hidden sm:flex sm:items-center sm:space-x-2 md:space-x-3 rtl:space-x-reverse flex-shrink-0">
            {/* Navigation Items - Larger like Blocket */}
            <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse" role="navigation" aria-label="Main navigation">
              {/* Post Ad Button - Horizontal layout like Blocket */}
              <Link
                href={user ? "/dashboard/listings/new" : "/auth/signin"}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center transition-colors min-w-[100px] max-w-[120px] h-12 shadow-sm"
              >
                <MdAdd className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{t('header.postAd')}</span>
              </Link>
              
              {/* Listings - Larger style like Blocket */}
              <Link 
                href={NAVIGATION_ROUTES.SEARCH} 
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
              >
                <MdDirectionsCar className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-xs leading-tight font-medium whitespace-nowrap">{t('header.listings')}</span>
              </Link>
              
              {/* Messages - Larger style like Blocket */}
              <Link 
                href={user ? "/dashboard/messages" : "/auth/signin"}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
              >
                <MdEmail className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-xs leading-tight font-medium whitespace-nowrap">{t('header.messages')}</span>
              </Link>
              
              {/* Saved Searches - Larger style like Blocket */}
              <Link 
                href={user ? "/dashboard/saved-searches" : "/auth/signin"}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
              >
                <MdBookmark className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-xs leading-tight font-medium whitespace-nowrap">{t('header.savedSearches')}</span>
              </Link>
              
              {/* Advanced Search - Larger style like Blocket */}
              <Link 
                href={NAVIGATION_ROUTES.SEARCH}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
              >
                <MdSearch className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-xs leading-tight font-medium whitespace-nowrap">{t('header.advancedSearch')}</span>
              </Link>
            </div>
            
            {/* User Menu / Login Button - Closer to navigation */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  id="user-menu-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  aria-expanded={userMenuOpen ? "true" : "false"}
                  aria-haspopup="menu"
                  aria-controls="user-menu"
                  aria-label="User account menu"
                >
                  <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full h-7 w-7 sm:h-8 sm:w-8 shadow-sm ring-2 ring-white dark:ring-gray-800">
                    {user?.image ? (
                      <Image 
                        src={user.image} 
                        alt={user?.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full h-full w-full object-cover"
                      />
                    ) : (
                      <MdPerson className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[80px] lg:max-w-[120px] truncate">
                      {user?.name || user?.email?.split('@')[0] || "User"}
                    </span>
                  </div>
                  <svg 
                    className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* User dropdown menu with animation */}
                <div 
                  id="user-menu"
                  role="menu"
                  aria-labelledby="user-menu-button"
                  className={`absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 origin-top-right transition-all duration-200 ease-in-out ${
                    userMenuOpen 
                      ? 'opacity-100 transform scale-100 animate-fadeIn' 
                      : 'opacity-0 transform scale-95 pointer-events-none'
                  }`}
                >
                  <div className="px-4 py-3 border-b dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <Link 
                      href="/dashboard" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <MdDashboard className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      {t('header.dashboard')}
                    </Link>
                    
                    <Link 
                      href="/dashboard/messages" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <MdEmail className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      {t('header.messages')}
                    </Link>
                    
                    <Link 
                      href="/dashboard/saved-searches" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <MdBookmark className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      {t('header.savedSearches')}
                    </Link>
                    
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <MdSettings className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      {t("dashboard.accountSettings")}
                    </Link>
                    
                    {/* Language Switcher in user menu */}
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
                      <ToggleLanguageSwitcher />
                    </div>
                  </div>
                  
                  <div className="py-1 border-t dark:border-gray-700">
                    <button
                      onClick={async () => { 
                        await signOut({ redirect: false }); 
                        setUserMenuOpen(false); 
                        window.location.href = '/'; 
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors whitespace-nowrap"
                      role="menuitem"
                    >
                      <MdLogout className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4" aria-hidden="true" />
                      {t('header.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <SignInButton className="text-xs xs:text-sm" />
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors mobile-touch-target nav-focus-visible"
              aria-expanded={mobileMenuOpen ? "true" : "false"}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
            >
              <span className="sr-only">{mobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}</span>
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

      {/* Mobile menu with improved animations and structure */}
      <div 
        id="mobile-menu"
        className={`sm:hidden mobile-menu-transition transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100 visible mobile-menu-enter-active' 
            : 'max-h-0 opacity-0 invisible mobile-menu-enter'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {/* Post Ad - First item like Blocket (Prominent button) */}
          <Link 
            href={user ? "/dashboard/listings/new" : "/auth/signin"}
            className="mobile-nav-link bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center px-4 py-3 rounded-md text-sm font-medium transition-colors shadow-sm mx-3 mb-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            <MdAdd className="h-6 w-6 mb-1.5" />
            <span className="text-sm font-medium">{t('header.postAd')}</span>
          </Link>
          
          {/* Navigation Links in Blocket order - Larger grid */}
          <div className="grid grid-cols-2 gap-2 px-3 py-3">
            <Link 
              href={NAVIGATION_ROUTES.SEARCH}
              className="mobile-nav-link flex flex-col items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MdDirectionsCar className="h-6 w-6 mb-1.5" />
              <span className="text-xs text-center leading-tight font-medium">{t('header.listings')}</span>
            </Link>
            <Link 
              href={NAVIGATION_ROUTES.SEARCH}
              className="mobile-nav-link flex flex-col items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MdSearch className="h-6 w-6 mb-1.5" />
              <span className="text-xs text-center leading-tight font-medium">{t('header.advancedSearch')}</span>
            </Link>
            <Link 
              href={user ? "/dashboard/messages" : "/auth/signin"}
              className="mobile-nav-link flex flex-col items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MdEmail className="h-6 w-6 mb-1.5" />
              <span className="text-xs text-center leading-tight font-medium">{t('header.messages')}</span>
            </Link>
            <Link 
              href={user ? "/dashboard/saved-searches" : "/auth/signin"}
              className="mobile-nav-link flex flex-col items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MdBookmark className="h-6 w-6 mb-1.5" />
              <span className="text-xs text-center leading-tight font-medium">{t('header.savedSearches')}</span>
            </Link>
          </div>
          
          {/* User Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {user ? (
              <div className="space-y-1">
                {/* User Info */}
                <div className="px-3 py-3 bg-white dark:bg-gray-900 rounded-md mx-3 mb-2">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full h-10 w-10 shadow-sm">
                        {user?.image ? (
                          <Image 
                            src={user.image} 
                            alt={user?.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full h-full w-full object-cover"
                          />
                        ) : (
                          <MdPerson className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mobile-text-truncate">
                        {user?.name || user?.email?.split('@')[0] || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mobile-text-truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* User Menu Items */}
                <Link 
                  href="/dashboard"
                  className="mobile-nav-link flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors nav-focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MdDashboard className="mr-3 h-5 w-5" />
                  {t('header.dashboard')}
                </Link>
                <Link 
                  href="/dashboard/settings"
                  className="mobile-nav-link flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors nav-focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MdSettings className="mr-3 h-5 w-5" />
                  {t("dashboard.accountSettings")}
                </Link>
                
                {/* Language Switcher in mobile menu for logged-in users */}
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                  <ToggleLanguageSwitcher />
                </div>
                
                <button
                  onClick={async () => {
                    await signOut({ redirect: false });
                    setMobileMenuOpen(false);
                    window.location.href = '/';
                  }}
                  className="mobile-nav-link w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors nav-focus-visible"
                >
                  <MdLogout className="mr-3 h-5 w-5" />
                  {t('header.logout')}
                </button>
              </div>
            ) : (
              <div className="px-3 py-2">
                <SignInButton 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full justify-center py-2 text-base mobile-touch-target"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
