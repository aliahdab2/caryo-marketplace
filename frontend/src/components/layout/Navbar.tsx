"use client";

import { handleLogout } from "@/utils/auth";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import SignInButton from "@/components/auth/SignInButton";
import NavbarLanguageSwitcher from "@/components/layout/NavbarLanguageSwitcher";
import { useOptimizedUser } from "@/hooks/useOptimizedSession";
import { MdLogout, MdPerson, MdSettings, MdDashboard, MdAdd, MdMail, MdMailOutline, MdBookmark, MdSearch, MdNotificationsNone, MdNotifications } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { NAVIGATION_ROUTES } from "@/utils/navigationUtils";
import type { ComponentProps } from "@/types/components";

export default function Navbar({ className }: ComponentProps) {
  const user = useOptimizedUser(); // Use optimized hook instead of full session
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoSrc] = useState("/images/logo.svg");
  const [logoError, setLogoError] = useState(false);
  const { t } = useTranslation(['common', 'search']);

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
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/85 dark:bg-gray-900/90 shadow-sm transition-all duration-300 ${className || ''}`}>
      <div className="w-full max-w-[94%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[88%] lg:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 tablet-nav-improvements">
        <div className="flex items-center justify-between h-16 xs:h-17 sm:h-18 md:h-20 landscape-mobile-nav">

          {/* Left Side - Logo (Like Blocket) */}
          <div className="flex items-center flex-shrink-0">
            <Link
              href="/"
              className="flex items-center nav-focus-visible group"
              aria-label={t('headerHome')}
            >
              <div className="transform group-hover:scale-105 transition-transform duration-200">
                <Image
                  className="h-9 w-auto xs:h-10 sm:h-11 md:h-12"
                  src={logoSrc}
                  alt=""
                  width={48}
                  height={48}
                  onError={handleLogoError}
                />
              </div>
              <span className="ml-2 xs:ml-2 rtl:mr-2 rtl:xs:mr-2 rtl:ml-0 text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white logo-text">
                Caryo
              </span>
            </Link>
          </div>

          {/* Right Side - Navigation + Login/User Menu (Language Auto-Detected) */}
          <div className="hidden sm:flex sm:items-center sm:space-x-1 md:space-x-2 rtl:space-x-reverse flex-shrink-0">
            {/* Navigation Items - Larger like Blocket */}
            <div className="flex items-center space-x-1 md:space-x-3 rtl:space-x-reverse" role="navigation" aria-label="Main navigation">
              {/* Post Ad Button - Horizontal layout like Blocket */}
              <Link
                href={user ? "/dashboard/dealer/stock/new" : "/auth/signin"}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 min-w-[110px] h-11"
              >
                <MdAdd className="h-5 w-5 mr-1.5 flex-shrink-0" />
                <span className="whitespace-nowrap">{t('headerPostAd')}</span>
              </Link>

              {/* Messages - Larger style like Blocket */}
              <Link
                href={user ? "/dashboard/dealer/leads" : "/auth/signin"}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-800 hover:scale-105 min-w-[70px] h-14 ${
                  pathname?.startsWith('/dashboard/dealer/leads')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {pathname?.startsWith('/dashboard/dealer/leads') ? (
                  <MdMail className="h-6 w-6 mb-0.5 flex-shrink-0" />
                ) : (
                  <MdMailOutline className="h-6 w-6 mb-0.5 flex-shrink-0" />
                )}
                <span className="text-[10px] font-medium text-center w-full">{t('headerMessages')}</span>
              </Link>

              {/* Saved Searches - Larger style like Blocket */}
              <Link
                href={user ? "/saved/alerts" : "/auth/signin"}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-800 hover:scale-105 min-w-[70px] h-14 group ${
                  pathname?.startsWith('/saved')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                title="Saved Searches & Alerts"
              >
                {pathname?.startsWith('/saved') ? (
                  <MdNotifications className="h-6 w-6 mb-0.5 flex-shrink-0" />
                ) : (
                  <MdNotificationsNone className="h-6 w-6 mb-0.5 flex-shrink-0" />
                )}
                <span className="text-[10px] font-medium text-center w-full">{t('headerSavedSearches')}</span>
              </Link>

              {/* Search - Simplified */}
              <Link
                href={NAVIGATION_ROUTES.SEARCH}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-800 hover:scale-105 min-w-[70px] h-14 ${
                  pathname?.startsWith('/search')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {pathname?.startsWith('/search') ? (
                  <FiSearch className="h-6 w-6 mb-0.5 flex-shrink-0" />
                ) : (
                  <MdSearch className="h-6 w-6 mb-0.5 flex-shrink-0" />
                )}
                <span className="text-[10px] font-medium text-center w-full">{t('search:search')}</span>
              </Link>
            </div>

            {/* Language Switcher - Next to Sign In */}
            <div className="flex items-center">
              <NavbarLanguageSwitcher />
            </div>

            {/* User Menu / Login Button - Closer to navigation */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="user-menu-button"
                  data-testid="user-menu-trigger"
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
                      {t('headerDashboard')}
                    </Link>

                    <Link
                      href="/dashboard/dealer/leads"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        pathname?.startsWith('/dashboard/dealer/leads')
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      {pathname?.startsWith('/dashboard/dealer/leads') ? (
                        <MdMail className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      ) : (
                        <MdMailOutline className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      )}
                      {t('headerMessages')}
                    </Link>

                    <Link
                      href="/saved/alerts"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        pathname?.startsWith('/saved')
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      {pathname?.startsWith('/saved') ? (
                        <MdNotifications className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      ) : (
                        <MdBookmark className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      )}
                      {t('headerSavedSearches')}
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                      role="menuitem"
                    >
                      <MdSettings className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      {t("accountSettings")}
                    </Link>
                  </div>

                  <div className="py-1 border-t dark:border-gray-700">
                    <button
                      data-testid="logout-button"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await handleLogout('/');
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors whitespace-nowrap"
                      role="menuitem"
                    >
                      <MdLogout className="mr-3 rtl:ml-3 rtl:mr-0 h-4 w-4" aria-hidden="true" />
                      {t('headerLogout')}
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
              aria-label={mobileMenuOpen ? t('headerCloseMenu') : t('headerOpenMenu')}
            >
              <span className="sr-only">{mobileMenuOpen ? t('headerCloseMenu') : t('headerOpenMenu')}</span>
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
            href={user ? "/dashboard/dealer/stock/new" : "/auth/signin"}
            className="mobile-nav-link bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center px-4 py-3 rounded-md text-sm font-medium transition-colors shadow-sm mx-3 mb-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            <MdAdd className="h-6 w-6 mb-1.5" />
            <span className="text-sm font-medium">{t('headerPostAd')}</span>
          </Link>

          {/* Navigation Links in Blocket order - Larger grid */}
          <div className="grid grid-cols-2 gap-2 px-3 py-3">
            <Link
              href={NAVIGATION_ROUTES.SEARCH}
              className={`mobile-nav-link flex flex-col items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/search')
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {pathname?.startsWith('/search') ? (
                <FiSearch className="h-6 w-6 mb-1.5" />
              ) : (
                <MdSearch className="h-6 w-6 mb-1.5" />
              )}
              <span className="text-xs text-center leading-tight font-medium w-full px-1">{t('search:search')}</span>
            </Link>
            <Link
              href={user ? "/dashboard/dealer/leads" : "/auth/signin"}
              className={`mobile-nav-link flex flex-col items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/dashboard/dealer/leads')
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {pathname?.startsWith('/dashboard/dealer/leads') ? (
                <MdMail className="h-6 w-6 mb-1.5" />
              ) : (
                <MdMailOutline className="h-6 w-6 mb-1.5" />
              )}
              <span className="text-xs text-center leading-tight font-medium w-full px-1">{t('headerMessages')}</span>
            </Link>
            <Link
              href={user ? "/saved/alerts" : "/auth/signin"}
              className={`mobile-nav-link flex flex-col items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/saved')
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {pathname?.startsWith('/saved') ? (
                <MdNotifications className="h-6 w-6 mb-1.5" />
              ) : (
                <MdBookmark className="h-6 w-6 mb-1.5" />
              )}
              <span className="text-xs text-center leading-tight font-medium w-full px-1">{t('headerSavedSearches')}</span>
            </Link>
          </div>

          {/* User Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Language Switcher for Mobile */}
            <div className="px-3 py-2 mb-2">
              <NavbarLanguageSwitcher />
            </div>

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
                  {t('headerDashboard')}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="mobile-nav-link flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors nav-focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MdSettings className="mr-3 h-5 w-5" />
                  {t("accountSettings")}
                </Link>

                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await handleLogout('/');
                  }}
                  className="mobile-nav-link w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors nav-focus-visible"
                >
                  <MdLogout className="mr-3 h-5 w-5" />
                  {t('headerLogout')}
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
