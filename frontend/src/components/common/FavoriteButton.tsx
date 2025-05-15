"use client";

import React, { useState, useEffect } from 'react';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '@/services/favorites';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline';
  onToggle?: (isFavorite: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  className = '',
  size = 'md',
  variant = 'filled',
  onToggle
}) => {
  const { t } = useTranslation('common');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

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
    const checkFavoriteStatus = async () => {
      if (!session?.user) {
        // If user is not logged in, always show as not a favorite
        setIsFavorite(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const result = await checkIsFavorite(listingId);
        setIsFavorite(result);
      } catch (err) {
        console.error('Error checking favorite status:', err);
        // Don't show error for checking status, just default to not favorite
        setIsFavorite(false);
        // setError(t('error.checkFavorite'));
      } finally {
        setIsLoading(false);
      }
    };

    checkFavoriteStatus();
  }, [listingId, session, t]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Stop event propagation if button is inside a link/card
    e.stopPropagation();
    
    if (!session?.user) {
      // Redirect to login if user is not authenticated
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (isFavorite) {
        await removeFromFavorites(listingId);
        setIsFavorite(false);
        if (onToggle) onToggle(false);
      } else {
        await addToFavorites(listingId);
        setIsFavorite(true);
        if (onToggle) onToggle(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      
      // Only show error message briefly
      setError(isFavorite ? t('error.removeFavorite') : t('error.addFavorite'));
      
      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`rounded-full flex items-center justify-center transition-all duration-200 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
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
          className={`h-5 w-5 ${isFavorite ? 'fill-current' : 'stroke-current fill-none'}`}
          viewBox="0 0 24 24"
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
