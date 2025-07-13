"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthUser } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import { FavoriteButtonProps } from '@/types/components';

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  className = '',
  size = 'md',
  variant = 'filled',
  onToggle,
  initialFavorite = false,
  showText = false
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const user = useAuthUser();
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckedRef = useRef(false);

  useEffect(() => {
    if (!listingId) {
      console.error('[FAVORITE] Missing listing ID');
    }
  }, [listingId]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variantClasses = {
    filled: isFavorite
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
    outline: isFavorite
      ? 'border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'border-2 border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500',
  };

  useEffect(() => {
    if (!user?.accessToken) {
      console.warn('[FAVORITE] No valid user session found');
    }
  }, [user]);

  // Parse API response for favorite status
  const parse = async (response: Response) => {
    try {
      const text = await response.text();
      if (!text || text.trim() === '') return { success: true };
      if (text === 'true') return true;
      if (text === 'false') return false;
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('[FAVORITE] Error parsing favorite status response:', parseError);
        return { error: 'Invalid JSON', success: false };
      }
    } catch (error) {
      console.error('[FAVORITE] Error processing response:', error);
      return { error: 'Failed to process response', success: false };
    }
  };

  // Check if the listing is favorited
  const checkFavoriteStatus = useCallback(async (force = false) => {
    if (!listingId) {
      setIsFavorite(false);
      return;
    }
    if (statusCheckedRef.current && !force) return;
    try {
      setIsLoading(true);
      const { apiRequest } = await import('@/services/auth/session-manager');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const url = `${API_URL}/api/favorites/check/${listingId}`;
      const response = await apiRequest(url, { method: 'GET' });
      if (response.ok) {
        const data = await parse(response);
        if (typeof data === 'boolean') setIsFavorite(data);
        else if (data && typeof data.isFavorite === 'boolean') setIsFavorite(data.isFavorite);
        else if (data && typeof data.favorited === 'boolean') setIsFavorite(data.favorited);
        else setIsFavorite(false);
        statusCheckedRef.current = true;
      } else {
        console.warn(`[FAVORITE] Server returned ${response.status} when checking favorite status`);
        setIsFavorite(false);
      }
    } catch (apiError) {
      console.warn('[FAVORITE] API request failed when checking favorite status:', apiError);
      setIsFavorite(false);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  // Initialize and refresh favorite status
  useEffect(() => {
    if (!listingId) {
      setIsFavorite(false);
      return;
    }
    if (!user?.accessToken) {
      setIsFavorite(false);
      statusCheckedRef.current = false;
      return;
    }
    checkFavoriteStatus(true);
    const refreshInterval = setInterval(() => {
      if (user) checkFavoriteStatus(true);
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, [listingId, user, checkFavoriteStatus]);

  // Re-check status when the component becomes visible again
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkFavoriteStatus(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [checkFavoriteStatus]);

  const startAnimation = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    setIsAnimating(true);
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 300);
  }, []); // No dependencies, so it's stable.

  // Effect to process pending favorite action after login
  useEffect(() => {
    const processPendingFavorite = async () => {
      if (user?.email && listingId) {
        const pendingActionJSON = localStorage.getItem('pendingFavoriteAction');
        if (pendingActionJSON) {
          let pendingAction;
          try {
            if (!pendingActionJSON || pendingActionJSON === 'null' || pendingActionJSON === '') {
              console.warn('[FAVORITE] Empty pendingFavoriteAction found');
              localStorage.removeItem('pendingFavoriteAction');
              return;
            }
            pendingAction = JSON.parse(pendingActionJSON);
          } catch (parseError) {
            console.error('[FAVORITE] Error parsing pendingFavoriteAction:', parseError);
            localStorage.removeItem('pendingFavoriteAction'); // Clear corrupted data
            return;
          }

          if (pendingAction.listingId === listingId) {
            localStorage.removeItem('pendingFavoriteAction'); // Remove immediately
            setIsLoading(true);
            startAnimation();

            try {
              // Import apiRequest for direct API calls
              const { apiRequest } = await import('@/services/auth/session-manager');
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
              const url = `${API_URL}/api/favorites/${listingId}`;
              
              if (pendingAction.action === 'add') {
                setIsFavorite(true); // Optimistic update
                if (onToggle) onToggle(true);
                await apiRequest(url, { method: 'POST' });
                console.log('[FAVORITE] Successfully processed pending add action');
              } else if (pendingAction.action === 'remove') {
                setIsFavorite(false); // Optimistic update
                if (onToggle) onToggle(false);
                await apiRequest(url, { method: 'DELETE' });
                console.log('[FAVORITE] Successfully processed pending remove action');
              } else {
                console.warn('[FAVORITE] Unknown pending action type:', pendingAction.action);
              }
            } catch (err) {
              console.error('[FAVORITE] Error executing pending favorite action:', err);
              // Explicitly call checkFavoriteStatus to sync to actual state after failure
              await checkFavoriteStatus(true);
              
              // Update UI based on the actual state
              if (onToggle) onToggle(isFavorite);
            } finally {
              setIsLoading(false);
            }
          } else if (pendingAction.listingId !== listingId) {
            // Action is for a different listing. Ignore it here.
            // It will be processed if the user navigates to that listing's page.
          } else {
            // Invalid action type or already processed, remove it
            console.warn('[FAVORITE] Invalid pending action found:', pendingAction);
            localStorage.removeItem('pendingFavoriteAction');
          }
        }
      }
    };

    processPendingFavorite();
  }, [user, listingId, onToggle, startAnimation, checkFavoriteStatus, isFavorite]); // Dependencies

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    // If not authenticated, store pending action and redirect to sign-in
    if (!user?.email || !user?.accessToken) {
      const pendingActionData = {
        listingId: listingId,
        action: isFavorite ? 'remove' : 'add',
        timestamp: Date.now(),
        error: 'Unauthenticated'
      };
      try {
        // Show brief loading state to indicate action is happening
        setIsLoading(true);
        
        localStorage.setItem('pendingFavoriteAction', JSON.stringify(pendingActionData));
        console.log('[FAVORITE] Stored pending action:', pendingActionData);
        
        // Store the current page URL to redirect back after sign-in
        const currentUrl = window.location.pathname + window.location.search + window.location.hash;
        console.log('[FAVORITE] Storing redirect URL:', currentUrl);
        
        // Small delay to show loading state, then redirect with returnUrl parameter
        setTimeout(() => {
          router.push(`/auth/signin?returnUrl=${encodeURIComponent(currentUrl)}`);
        }, 200);
      } catch (storageError) {
        console.error('[FAVORITE] Failed to store pending action:', storageError);
        // Still redirect to sign-in even if storage fails
        setIsLoading(false);
        router.push(`/auth/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      }
      return;
    }

    try {
      // Import apiRequest for direct API calls
      const { apiRequest } = await import('@/services/auth/session-manager');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const url = `${API_URL}/api/favorites/${listingId}`;

      setIsLoading(true);
      startAnimation();

      const wasAlreadyFavorite = isFavorite;

      try {
        if (wasAlreadyFavorite) {
          // Remove favorite
          await apiRequest(url, { method: 'DELETE' });
          setIsFavorite(false);
          if (onToggle) onToggle(false);
        } else {
          // Add favorite
          await apiRequest(url, { method: 'POST' });
          setIsFavorite(true);
          if (onToggle) onToggle(true);
        }
      } catch (apiError) {
        // Ensure consistent warning log format for test detection
        console.warn('[FAVORITE] API request failed when toggling favorite:', apiError);

        // Check if it's an authentication error
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        const isAuthError = errorMessage.toLowerCase().includes('auth') ||
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('401');

        // Always store pending action, regardless of error type
        const pendingActionData = {
          listingId: listingId,
          action: wasAlreadyFavorite ? 'remove' : 'add',
          timestamp: Date.now(),
          error: errorMessage
        };

        // Ensure localStorage is updated
        try {
          localStorage.setItem('pendingFavoriteAction', JSON.stringify(pendingActionData));
          console.log('[FAVORITE] Stored pending action:', pendingActionData);
        } catch (storageError) {
          console.error('[FAVORITE] Failed to store pending action:', storageError);
        }

        if (isAuthError) {
          // The apiRequest function will already handle redirection to login
          return;
        }

        // For non-auth errors, attempt to sync with actual state
        await checkFavoriteStatus(true);
      }
    } catch (error) {
      console.error(`[FAVORITE] Error toggling favorite for ${listingId}:`, error);

      // Attempt to sync with actual state
      await checkFavoriteStatus(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      disabled={isLoading || !listingId} // Disable if no listingId
      className={`${showText ? 'rounded-lg px-3' : 'rounded-full'} flex items-center justify-center shadow-sm 
        ${showText ? '' : sizeClasses[size]} ${variantClasses[variant]} ${className}
        ${isAnimating ? 'scale-110' : 'scale-100'} 
        transition-all duration-200 ease-in-out
        hover:scale-105 active:scale-95`}
      aria-label={isFavorite ? t('listings.removeFromFavorites') : t('listings.addToFavorites')}
      title={isFavorite ? t('listings.removeFromFavorites') : t('listings.addToFavorites')}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 transition-colors duration-200"
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          {showText && (
            <span className="ml-2 text-sm">
              {isFavorite ? t('listings.removeFromFavorites') : t('listings.addToFavorites')}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default FavoriteButton;
