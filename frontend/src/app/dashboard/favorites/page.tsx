'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { getFavorites } from '@/services/favorites';
import { Listing, ListingWithLanguage, LocalizedField } from '@/types/listings'; // Ensure Listing is imported
import { Lang, CURRENCY_CONFIG } from '@/types/i18n';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session } from 'next-auth';
import Spinner from '@/components/ui/Spinner';

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
  const searchParams = useSearchParams();
  const [favorites, setFavorites] = useState<ListingWithLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const { t, i18n, ready: i18nReady } = useLazyTranslation(['favorites', 'listings', 'common', 'auth', 'errors']);
  const currentLanguage = i18n.language as Lang; // Ensure currentLanguage is of type Lang

  console.log('FavoritesPage: Render. Status:', status, 'Session:', session ? { user: !!session.user, token: !!session.accessToken, error: session.error, expires: session.expires } : 'No session');

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

  // Format price according to current language
  const formatPrice = (price: number | undefined, language: string): string => {
    if (price === undefined || price === null) {
      return t('common:priceNotAvailable');
    }
    
    const langKey = language as Lang;
    const config = CURRENCY_CONFIG[langKey] || CURRENCY_CONFIG.en; // Default to English if langKey is not valid
      
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency
    }).format(price);
  };

  const loadFavorites = useCallback(async (currentSession: Session | null) => {
    console.log('loadFavorites: Starting load attempt...', {
      retryCount,
      hasSession: !!currentSession,
      sessionStatus: status,
      hasToken: !!currentSession?.accessToken,
      tokenLength: currentSession?.accessToken?.length,
      tokenPrefix: currentSession?.accessToken ? currentSession.accessToken.substring(0, 10) : 'none',
      tokenExpiry: currentSession?.expires
    });

    // First, check if the token has expired
    if (currentSession?.expires) {
      const expiryDate = new Date(currentSession.expires);
      if (expiryDate.getTime() <= Date.now()) {
        console.log('Token has expired, attempting refresh...');
        try {
          await updateSession();
          // After update, if we still have an expired token, we need to sign out
          if (new Date(currentSession.expires).getTime() <= Date.now()) {
            console.error('Token refresh failed - token still expired');
            setIsLoading(false);
            setAuthError('Session expired. Please sign in again.');
            signOut({ 
              callbackUrl: '/auth/signin?source=tokenExpired',
              redirect: true
            });
            return;
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
          setIsLoading(false);
          setAuthError('Failed to refresh session.');
          return;
        }
      }
    }

    // Check if we need to request a new session
    if (status === 'authenticated' && (!currentSession || !currentSession.accessToken)) {
      if (retryCount < MAX_RETRIES) {
        console.log(`loadFavorites: No token available, attempting session refresh... (Retry ${retryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(prev => prev + 1);
        try {
          await updateSession(); // Try to refresh the session
          return; // Let the useEffect trigger another load attempt
        } catch (error) {
          console.error('Failed to update session:', error);
          if (retryCount >= MAX_RETRIES - 1) {
            setIsLoading(false);
            setAuthError('Unable to refresh session. Please sign in again.');
            signOut({ 
              callbackUrl: '/auth/signin?source=refreshFailed',
              redirect: true
            });
            return;
          }
        }
      } else {
        console.error('loadFavorites: Max retries reached, redirecting to sign in');
        setIsLoading(false);
        setAuthError('Session expired. Please sign in again.');
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
      // Safe access to currentSession properties
      const sessionDebugInfo = {
        userId: currentSession?.user?.id,
        tokenExists: !!currentSession?.accessToken,
        tokenPrefix: currentSession?.accessToken 
          ? `${currentSession.accessToken.substring(0, 10)}...` 
          : 'N/A'
      };
      
      console.log('loadFavorites: Calling getFavorites with session:', sessionDebugInfo);
      const response = await getFavorites(undefined, currentSession);
      console.log('loadFavorites: Favorites data received:', response);
      if (response && response.favorites) {
        setFavorites(response.favorites as ListingWithLanguage[]);
        setAuthError(null);
        setRetryCount(0);
        console.log('loadFavorites: Favorites loaded successfully:', { count: response.favorites.length, total: response.total });
      } else {
        console.warn('loadFavorites: No favorites data in response or response is undefined', response);
        setFavorites([]);
      }
    } catch (error: unknown) { // Changed from any to unknown
      console.error('loadFavorites: Error loading favorites:', error);
      if (error instanceof Error && error.message === 'UNAUTHORIZED') { // Type check for Error
        console.warn('loadFavorites: Received UNAUTHORIZED. Setting empty favorites. User might need to re-login.');
        setAuthError('errors:favorites.unauthorized');
        setFavorites([]);
      } else {
        setAuthError('errors:favorites.loadingFailed');
        setFavorites([]);
      }
    } finally {
      setIsLoading(false);
      console.log('loadFavorites: Finished loading attempt.');
    }
  }, [retryCount, status, updateSession]); // Removed updateSession and i18n.language if t is stable or its changes are handled by i18nReady in useEffect

  useEffect(() => {
    const source = searchParams ? searchParams.get('source') : null;
    console.log('FavoritesPage useEffect: Running. Status:', status, 'IsRedirecting:', isRedirecting, 'Source:', source);
    console.log('FavoritesPage useEffect: Session details:', session ? { user: !!session.user, token: !!session.accessToken, error: session.error, expires: session.expires, tokenLength: session.accessToken?.length } : 'No session data');

    if (isRedirecting) {
      console.log('FavoritesPage useEffect: Currently redirecting, skipping further processing.');
      return;
    }

    if (status === 'loading' || !i18nReady) {
      console.log('FavoritesPage useEffect: Session or i18n loading. Waiting...');
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      console.log('FavoritesPage useEffect: User is unauthenticated. Redirecting to signin.');
      setAuthError(null);
      setIsRedirecting(true);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard/favorites')}&source=favoritesPageRedirect`);
      return;
    }

    if (status === 'authenticated') {
      console.log('FavoritesPage useEffect: User is authenticated.');
      setAuthError(null);

      if (session?.error === "RefreshAccessTokenError") {
        console.error("FavoritesPage useEffect: RefreshAccessTokenError detected. User needs to re-authenticate.");
        setAuthError("errors:session.refreshFailed");
        setIsLoading(false);
        return;
      }

      if (session?.expires) {
        const expirationDate = new Date(session.expires);
        if (expirationDate.getTime() < Date.now()) {
          console.warn("FavoritesPage useEffect: Session token has expired based on client-side check. Needs refresh or re-login.");
          setAuthError("errors:session.expired");
          setIsLoading(false);
          return;
        }
      }
      
      if (session?.accessToken) {
        console.log('FavoritesPage useEffect: Access token IS available. Proceeding to load favorites.');
        loadFavorites(session); // Pass the current session directly
      } else {
        console.warn('FavoritesPage useEffect: Authenticated, but access token is NOT available. Retry count:', retryCount);
        if (retryCount < MAX_RETRIES) {
          console.log(`FavoritesPage useEffect: Triggering retry ${retryCount + 1} for loading favorites.`);
          setIsLoading(true); 
          // updateSession(); // Consider calling updateSession here to try to refresh the token
        } else {
          console.error('FavoritesPage useEffect: Max retries reached for acquiring access token.');
          setAuthError('errors:favorites.sessionTokenMissingMaxRetries');
          setIsLoading(false);
        }
      }
    }
  }, [status, session, router, isRedirecting, searchParams, loadFavorites, retryCount, i18nReady, updateSession]); // Added updateSession to dependency array if it's called

  const handleRetry = () => {
    console.log('handleRetry: User clicked Try Again.');
    setAuthError(null);
    setIsLoading(true);
    setRetryCount(0);
    if (status === 'authenticated' && session) {
      console.log('handleRetry: Attempting to load favorites again with current session.');
      loadFavorites(session);
    } else if (status === 'unauthenticated') {
      console.log('handleRetry: User unauthenticated, redirecting to signin.');
      setIsRedirecting(true);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/dashboard/favorites')}&source=favoritesPageRetryRedirect`);
    } else {
      console.warn('handleRetry: Cannot retry, session status is:', status, 'or session is null.');
      setAuthError('errors:favorites.retryFailedNoSession');
      setIsLoading(false);
    }
  };

  if (!i18nReady || (isLoading && !authError)) {
    console.log('FavoritesPage: Displaying loading spinner (i18n not ready or isLoading true, no authError).');
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
        {i18nReady && <p className="mt-4 text-gray-600">{t('common:loadingFavorites')}</p>}
      </div>
    );
  }

  if (authError) {
    console.log('FavoritesPage: Displaying AuthError message:', authError);
    // Log the current session state for debugging
    console.log('Current session state:', {
      status,
      hasToken: !!session?.accessToken,
      tokenLength: session?.accessToken?.length,
      tokenPrefix: session?.accessToken ? session.accessToken.substring(0, 10) : 'none',
      error: session?.error,
      expires: session?.expires
    });

    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Authentication Error</h1>
        <p className="mb-4">Your session appears to have expired or is invalid. Please try again or sign in.</p>
        <p className="mb-4 text-sm text-gray-500">Error details: {authError}</p>
        {session?.error && <p className="mb-4 text-sm text-yellow-500">Additional info: {session.error}</p>}
        <div className="space-y-4">
          <button 
            onClick={handleRetry}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={() => signOut({ 
              callbackUrl: '/auth/signin?source=favoritesPageSignOut',
              redirect: true 
            })}
            className="w-full sm:w-auto px-6 py-2 ml-0 sm:ml-2 mt-2 sm:mt-0 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Sign Out and Sign In Again
          </button>
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

  // Simplified return for now, focusing on auth flow
  if (!isLoading && favorites.length === 0) {
    console.log('FavoritesPage: Displaying NoFavorites message (simplified).');
    const isRTL = currentLanguage === 'ar';
    
    return (
      <div className="container mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className={`text-3xl font-bold mb-8 ${isRTL ? 'text-right' : 'text-center'}`}>
          {t('favorites:title')}
        </h1>
        <p className={`${isRTL ? 'text-right' : 'text-center'} text-gray-600`}>
          {t('favorites:noFavorites')}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className={`text-3xl font-bold mb-8 ${currentLanguage === 'ar' ? 'text-right' : 'text-center'}`}>
        {t('favorites:title')}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favorites.map((listing) => (
          <div 
            key={listing.id}
            className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow"
          >
            <LocalizedText
              content={getLocalizedContent(listing, 'title', currentLanguage)}
              language={currentLanguage}
              className="text-xl font-bold mb-2"
            />
            <p className="text-gray-600">
              {formatPrice(listing.price, currentLanguage)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;