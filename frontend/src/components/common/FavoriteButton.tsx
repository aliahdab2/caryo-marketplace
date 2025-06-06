"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { addToFavorites, removeFromFavorites, isFavorited } from '@/services/favorites';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FavoriteButtonProps } from '@/types/components'; // Import shared props

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  className = '',
  size = 'md',
  variant = 'filled',
  onToggle,
  initialFavorite = false
}) => {
  const { t } = useTranslation('common');
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate the listing ID
  useEffect(() => {
    if (!listingId) {
      console.error('[FAVORITE] Missing listing ID');
    } else {
      console.log(`[FAVORITE] FavoriteButton initialized for listing ID: ${listingId}`);
    }
  }, [listingId]);

  // Clean up animation timeout on unmount
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

  // Log session information whenever it changes
  useEffect(() => {
    console.log('[FAVORITE] Session information:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasToken: !!session?.accessToken,
      expires: session?.expires ? new Date(session.expires).toISOString() : 'N/A',
      tokenLength: session?.accessToken ? session.accessToken.length : 0
    });
  }, [session]);

  // Memoize the checkFavoriteStatus function
  const checkFavoriteStatus = useCallback(async () => {
    if (!listingId || !session?.user || !session?.accessToken) {
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await isFavorited(listingId, undefined, session);
      console.log(`[FAVORITE] Status check result: ${JSON.stringify(result)}`);
      setIsFavorite(result.isFavorite);
    } catch (err) {
      console.error('[FAVORITE] Error checking favorite status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, session]);

  // Check favorite status when component mounts or when session/listingId changes
  useEffect(() => {
    if (!listingId || !session?.user || !session?.accessToken) {
      return;
    }
    
    checkFavoriteStatus();
    
    // Refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      if (session?.user) {
        checkFavoriteStatus();
      }
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [listingId, session, checkFavoriteStatus]);

  const startAnimation = () => {
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    // Start new animation
    setIsAnimating(true);
    
    // Set timeout to end animation
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 300);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent clicking if already loading
    if (isLoading) {
      return;
    }
    
    // Check for valid session
    if (!session?.user || !session?.accessToken) {
      const callbackUrl = encodeURIComponent(window.location.href);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}&from=favorite-button`);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      startAnimation();
      
      const wasAlreadyFavorite = isFavorite;
      
      if (wasAlreadyFavorite) {
        // Remove from favorites
        console.log('[FAVORITE] Removing from favorites:', listingId);
        await removeFromFavorites(listingId, undefined, session);
        setIsFavorite(false);
        if (onToggle) onToggle(false);
      } else {
        // Add to favorites
        console.log('[FAVORITE] Adding to favorites:', listingId);
        await addToFavorites(listingId, undefined, session);
        setIsFavorite(true);
        if (onToggle) onToggle(true);
      }
    } catch (error) {
      console.error('[FAVORITE] Error toggling favorite:', error);
      
      // Don't show error to user - silently recover
      // Just verify the actual state
      try {
        const actualState = await isFavorited(listingId, undefined, session);
        setIsFavorite(actualState.isFavorite);
      } catch {
        // If we can't verify, don't change the state
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`rounded-full flex items-center justify-center shadow-sm 
        ${sizeClasses[size]} ${variantClasses[variant]} ${className}
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
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 transition-colors duration-200"
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={isFavorite ? "0" : "2"}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      )}
      
      {error && (
        <span className="sr-only">{error}</span>
      )}
    </button>
  );
};

export default FavoriteButton;
