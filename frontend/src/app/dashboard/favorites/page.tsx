'use client';

/**
 * Favorites Page Component
 * 
 * Features:
 * - Displays user's favorite listings with proper image display via transformMinioUrl
 * - Supports sorting by date, price, and year
 * - Pagination with "Load More" functionality
 * - Robust session validation and error handling
 * - Bilingual support (English/Arabic) with RTL layout
 * - Responsive grid layout matching listings page design
 * - Premium empty state with clear user guidance
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { getUserFavorites } from '@/services/favorites';
import { Listing, ListingWithLanguage, LocalizedField } from '@/types/listings';
import { Lang } from '@/types/i18n';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import Image from 'next/image';
import FavoriteButton from '@/components/common/FavoriteButton';
import { formatDate, formatNumber } from '@/utils/localization';
import { transformMinioUrl } from '@/utils/mediaUtils';

// Component for displaying localized text with proper RTL support
interface LocalizedTextProps {
  content: string;
  language: string;
  className?: string;
}

const LocalizedText: React.FC<LocalizedTextProps> = ({ content, language, className = '' }) => {
  const isRTL = language === 'ar';
  
  return (
    <div 
      className={`${className} ${isRTL ? 'text-right' : 'text-left'}`} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {content}
    </div>
  );
};

const FavoritesPage: React.FC = () => {
  // Explicitly type useSession hook with SessionContextValue for clarity if needed, though usually inferred
  const { data: session, status, update: updateSession } = useSession({ required: false });
  const router = useRouter();
  const [favorites, setFavorites] = useState<ListingWithLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'year'>('date');
  const [visibleCount, setVisibleCount] = useState<number>(8); // Number of initially visible favorites
  const MAX_RETRIES = 3;

  const { t, i18n, ready: i18nReady } = useLazyTranslation(['favorites', 'listings', 'common', 'auth', 'errors']);
  const currentLanguage = i18n.language as Lang; // Ensure currentLanguage is of type Lang

  // Helper function to get localized content
  const getLocalizedContent = (
    item: ListingWithLanguage,
    field: LocalizedField,
    language: string // Keep as string for flexibility, cast to Lang where needed
  ): string => {
    const currentLang = language as Lang;
    if (currentLang === 'en' || currentLang === 'ar') {
      const key = `${field}_${currentLang}` as keyof ListingWithLanguage;
      const localizedValue = item[key];
      if (typeof localizedValue === 'string') return localizedValue;
    }
    
    const englishKey = `${field}_en` as keyof ListingWithLanguage;
    const englishValue = item[englishKey];
    if (typeof englishValue === 'string') return englishValue;
    
    // Fallback to the direct field on the base Listing type if it exists (e.g., item.title)
    // This assumes LocalizedField (e.g., 'title') is also a valid key on the base Listing.
    const defaultKey = field as keyof Listing; 
    const defaultValue = item[defaultKey];

    // Ensure the fallback value is a string.
    if (typeof defaultValue === 'string') return defaultValue;
    
    // If the field is 'title', and item.title (from base Listing) is a string, use it.
    // This is a more explicit fallback if the dynamic key access fails.
    if (field === 'title' && typeof item.title === 'string') return item.title;
    // Add similar explicit fallbacks for other LocalizedFields if necessary.

    return ''; // Final fallback to an empty string if no suitable value is found
  };

  // Sort favorites based on selected criteria
  const sortedFavorites = useMemo(() => {
    if (!favorites.length) return [];
    
    return [...favorites].sort((a, b) => {
      if (sortBy === 'date') {
        // Sort by created date (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === 'price') {
        // Sort by price (lowest first)
        return (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'year') {
        // Sort by year (newest first)
        return (b.year || 0) - (a.year || 0);
      }
      return 0;
    });
  }, [favorites, sortBy]);

  const loadFavorites = useCallback(async (currentSession: Session | null) => {
    // First, check if the token has expired
    if (currentSession?.expires) {
      const expiryDate = new Date(currentSession.expires);
      if (expiryDate.getTime() <= Date.now()) {
        try {
          await updateSession();
          // After update, if we still have an expired token, we need to sign out
          if (new Date(currentSession.expires).getTime() <= Date.now()) {
            setIsLoading(false);
            setAuthError('errors:session.expired');
            signOut({ 
              callbackUrl: '/auth/signin?source=tokenExpired',
              redirect: true
            });
            return;
          }
        } catch {
          setIsLoading(false);
          setAuthError('errors:session.refreshFailed');
          return;
        }
      }
    }

    // Check if we need to request a new session
    if (status === 'authenticated' && (!currentSession || !currentSession.accessToken)) {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        try {
          await updateSession(); // Try to refresh the session
          return; // Let the useEffect trigger another load attempt
        } catch {
          if (retryCount >= MAX_RETRIES - 1) {
            setIsLoading(false);
            setAuthError('errors:session.refreshFailed');
            signOut({ 
              callbackUrl: '/auth/signin?source=refreshFailed',
              redirect: true
            });
            return;
          }
        }
      } else {
        setIsLoading(false);
        setAuthError('errors:session.maxRetries');
        signOut({ 
          callbackUrl: '/auth/signin?source=maxRetries',
          redirect: true
        });
        return;
      }
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      console.log('Fetching favorites with session:', currentSession?.user?.email);
      const response = await getUserFavorites(undefined, currentSession);
      console.log('Got favorites response:', response);
      
      if (response && Array.isArray(response.favorites)) {
        const validFavorites = response.favorites.filter(favorite => favorite && favorite.id);
        console.log('Valid favorites:', validFavorites);
        setFavorites(validFavorites as ListingWithLanguage[]);
        setAuthError(null);
        setRetryCount(0);
      } else {
        console.warn('Unexpected favorites response format:', response);
        setFavorites([]);
      }
    } catch (error: unknown) {
      // Import and use isAuthenticationError from favorites service
      const { isAuthenticationError } = await import('@/services/favorites');
      
      if (isAuthenticationError(error)) {
        setAuthError('favorites:authRequired');
      } else {
        setAuthError('favorites:errorLoading');
      }
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [retryCount, status, updateSession]);

  useEffect(() => {
    if (isRedirecting) {
      return;
    }

    if (status === 'loading' || !i18nReady) {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setAuthError(null);
      setIsRedirecting(true);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard/favorites')}`);
      return;
    }

    if (status === 'authenticated') {
      setAuthError(null);

      if (session?.error === "RefreshAccessTokenError") {
        setAuthError("errors:session.refreshFailed");
        setIsLoading(false);
        return;
      }

      if (session?.expires) {
        const expirationDate = new Date(session.expires);
        if (expirationDate.getTime() < Date.now()) {
          setAuthError("errors:session.expired");
          setIsLoading(false);
          return;
        }
      }
      
      if (session?.accessToken) {
        loadFavorites(session); // Pass the current session directly
      } else {
        if (retryCount < MAX_RETRIES) {
          setIsLoading(true);
        } else {
          setAuthError('errors:favorites.sessionTokenMissingMaxRetries');
          setIsLoading(false);
        }
      }
    }
  }, [status, session, router, isRedirecting, loadFavorites, retryCount, i18nReady, updateSession]);

  const handleRetry = () => {
    setAuthError(null);
    setIsLoading(true);
    setRetryCount(0);
    if (status === 'authenticated' && session) {
      loadFavorites(session);
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard/favorites')}`);
    } else {
      setAuthError('errors:favorites.retryFailedNoSession');
      setIsLoading(false);
    }
  };

  // Reset visibleCount when favorites list changes
  useEffect(() => {
    setVisibleCount(8);
  }, [favorites.length]);

  if (!i18nReady || (isLoading && !authError)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
        {i18nReady && <p className="mt-4 text-gray-600">{t('common:loadingFavorites')}</p>}
      </div>
    );
  }

  if (authError) {
    const isRTL = currentLanguage === 'ar';
    
    return (
      <div className="container mx-auto px-4 py-8 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('errors:auth.title')}</h1>
          <p className="mb-4 text-gray-700 dark:text-gray-300">{t('errors:auth.sessionExpired')}</p>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{t(authError)}</p>
          {session?.error && (
            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">{t('errors:auth.additionalInfo', { details: session.error })}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button 
              onClick={handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {t('common:tryAgain')}
            </button>
            <button 
              onClick={() => signOut({ 
                callbackUrl: '/auth/signin?source=favoritesPageSignOut',
                redirect: true 
              })}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {t('auth:signOutAndSignIn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Commenting out the section that uses undefined variables like totalFavorites, sortBy, etc.
  /*
  if (!isLoading && favorites.length === 0) {
    console.log('FavoritesPage: Displaying NoFavorites message.');
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">{t('favorites:title')}</h1>
        <p className="text-center text-gray-600">{t('favorites:noFavorites')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('favorites:title')} ({totalFavorites})</h1>
        <div>
          <label htmlFor="sort-favorites" className="mr-2">{t('common:sortBy')}:</label>
          <select 
            id="sort-favorites" 
            className="border rounded p-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'year')}
          >
            <option value="date">{t('common:dateAdded')}</option>
            <option value="price">{t('common:price')}</option>
            <option value="year">{t('common:year')}</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedFavorites.map((listing) => (
          <ListingCard 
            key={listing.id} 
            listing={listing} 
            language={currentLanguage} 
            isFavorite={true} // All listings on this page are favorites
            onToggleFavorite={() => {}}
            // onToggleFavorite={() => handleRemoveFromFavorites(listing.id.toString())} 
          />
        ))}
      </div>
    </div>
  );
  */

  // Premium empty state with illustration and clear call-to-action
  if (!isLoading && favorites.length === 0) {
    const isRTL = currentLanguage === 'ar';
    
    return (
      <div className="container mx-auto px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('favorites:title')}
            </h1>
            
            <Link 
              href="/listings" 
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('favorites:browseCars')}
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center">
              {/* Left side - Illustration */}
              <div className="w-full md:w-5/12 p-8 md:p-12">
                <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-3 w-16 h-16 mb-6 flex items-center justify-center mx-auto md:mx-0">
                  <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h2 className={`text-3xl font-bold mb-4 text-center md:text-left ${isRTL ? 'md:text-right' : ''} text-gray-900 dark:text-white`}>
                  {t('favorites:emptyStateTitle')}
                </h2>
                
                <p className={`text-gray-600 dark:text-gray-300 mb-8 text-center md:text-left ${isRTL ? 'md:text-right' : ''}`}>
                  {t('favorites:emptyStateMessage')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link 
                    href="/listings" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('favorites:discoverCars')}
                  </Link>
                  
                  <Link 
                    href="/guide" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('favorites:howItWorks')}
                  </Link>
                </div>
              </div>
              
              {/* Right side - Image/Illustration */}
              <div className="w-full md:w-7/12 h-64 md:h-auto">
                <div className="h-full w-full bg-gradient-to-tr from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-purple-900/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative max-w-xs mx-auto">
                      <div className="w-64 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg transform -rotate-6 absolute z-0"></div>
                      <div className="w-64 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg transform rotate-3 absolute z-10"></div>
                      <div className="w-64 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative z-20 flex items-center justify-center p-4">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-gray-800 dark:text-gray-200 font-semibold">{t('favorites:startBrowsing')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom quick tips section */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
                <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('favorites:quickTips')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('favorites:tip1')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('favorites:tip2')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Premium favorites view with enhanced UI and features
  const isRTL = currentLanguage === 'ar';
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header section with stats and actions */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('favorites:title')}
              </h1>
              <p className={`text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('favorites:savedCount', { count: favorites.length })}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center">
                <label htmlFor="sort-favorites" className="mr-2 text-gray-600 dark:text-gray-400 text-sm">
                  {t('common:sortBy')}:
                </label>
                <select 
                  id="sort-favorites" 
                  className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'year')}
                >
                  <option value="date">{t('common:dateAdded')}</option>
                  <option value="price">{t('common:price')}</option>
                  <option value="year">{t('common:year')}</option>
                </select>
              </div>
              <Link 
                href="/listings" 
                className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('favorites:browseCars')}
              </Link>
              
              {favorites.length > 1 && (
                <Link 
                  href="/compare" 
                  className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t('favorites:compare')}
                </Link>
              )}
              
              <button 
                onClick={handleRetry}
                className="p-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center shadow-sm"
                title={t('favorites:refreshList')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedFavorites.slice(0, visibleCount).map((listing) => (
            <div 
              key={listing.id}
              className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
            >
              {/* Favorite button */}
              <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  listingId={listing.id.toString()}
                  variant="filled"
                  size="sm"
                  className="shadow-md"
                  initialFavorite={true}
                  onToggle={async (isFavorite: boolean) => {
                    if (!isFavorite) {
                      // If removed from favorites, refresh the list
                      setIsLoading(true);
                      try {
                        const response = await getUserFavorites(undefined, session);
                        if (response && response.favorites) {
                          setFavorites(response.favorites as ListingWithLanguage[]);
                        }
                      } catch {
                        setAuthError('favorites:errorRefreshing');
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                />
              </div>
              
              {/* Badge for special listings (if applicable) */}
              {listing.badge && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {listing.badge}
                  </span>
                </div>
              )}
              
              <Link href={`/listings/${listing.id}`} className="block h-full">
                {/* Image section */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {listing.media && listing.media.length > 0 ? (
                    <Image
                      src={transformMinioUrl(listing.media[0].url)}
                      alt={getLocalizedContent(listing, 'title', currentLanguage)}
                      className="w-full h-full object-cover transition duration-500 ease-in-out group-hover:scale-110"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/images/vehicles/car-default.svg"
                      alt={getLocalizedContent(listing, 'title', currentLanguage)}
                      className="w-full h-full object-contain p-4 transition duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  )}
                  
                  {/* Image count indicator */}
                  {listing.media && listing.media.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5 text-white text-xs font-medium flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {listing.media.length}
                    </div>
                  )}
                </div>
                
                {/* Content section */}
                <div className="p-4 flex flex-col h-[calc(100%-192px)]">
                  <div className="mb-auto">
                    {/* Brand/model display */}
                    {(listing.brand || listing.model) && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1.5 font-medium">
                        {listing.brand || ''} {listing.model || ''}
                      </div>
                    )}
                    
                    {/* Title */}
                    <LocalizedText
                      content={getLocalizedContent(listing, 'title', currentLanguage)}
                      language={currentLanguage}
                      className="text-lg font-semibold mb-2 text-gray-900 dark:text-white line-clamp-2"
                    />
                    
                    {/* Price */}
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                      {formatNumber(listing.price, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
                    </p>
                    
                    {/* Key specifications */}
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      {listing.year && (
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <svg className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{listing.year}</span>
                        </div>
                      )}
                      
                      {listing.mileage && (
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <svg className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{listing.mileage.toLocaleString()} km</span>
                        </div>
                      )}
                      
                      {listing.transmission && (
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <svg className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>{listing.transmission}</span>
                        </div>
                      )}
                      
                      {listing.fuelType && (
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <svg className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{listing.fuelType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {listing.createdAt && formatDate(listing.createdAt, currentLanguage)}
                    </div>
                    
                    {listing.location?.city && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{listing.location.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* If there are more favorites to load, show a "Load more" option */}
        {sortedFavorites.length > visibleCount && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setVisibleCount(prevCount => Math.min(prevCount + 8, sortedFavorites.length))}
              className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm inline-flex items-center"
            >
              {t('favorites:loadMore')}
              <svg className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;