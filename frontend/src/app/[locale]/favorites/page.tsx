"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserFavorites } from '@/services/favorites';
import { formatDate, formatNumber } from '@/utils/localization';
import FavoriteButton from '@/components/common/FavoriteButton';
import { Listing } from '@/types/listings';

export default function FavoritesPage() {
  const { t, i18n } = useTranslation(['common']);
  const status = useAuthStatus();
  const router = useRouter();
  
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (status.isUnauthenticated) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Fetch favorites when auth status is confirmed
    if (status.isAuthenticated) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserFavorites();
      
      // Ensure we have valid data
      if (Array.isArray(data)) {
        setFavorites(data);
      } else {
        console.error('Invalid data format for favorites:', data);
        setFavorites([]);
        setError(t('error.invalidData', { ns: 'common' }));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(t('error.loadingFavorites', { ns: 'common' }));
      // Set empty array to prevent null/undefined errors
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = (isFavorite: boolean) => {
    if (!isFavorite) {
      // If removed from favorites, remove from the list
      setFavorites(favorites.filter(listing => listing.id.toString() !== listing.id.toString()));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('favorites.title', { ns: 'common' })}</h1>
      
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4">{t('loading', { ns: 'common' })}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button 
              onClick={fetchFavorites}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
            >
              {t('retry', { ns: 'common' })}
            </button>
          </div>
        </div>
      )}
      
      {!isLoading && !error && favorites.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('favorites.emptyTitle', { ns: 'common' })}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('favorites.emptyDescription', { ns: 'common' })}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('favorites.browseCars', { ns: 'common' })}
          </Link>
        </div>
      )}
      
      {!isLoading && !error && favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <Image
                  src={listing.image || '/images/placeholder.png'}
                  alt={listing.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <FavoriteButton
                    listingId={listing.id.toString()}
                    initialFavorite={true}
                    onToggle={handleFavoriteToggle}
                  />
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {listing.title}
                </h3>
                
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                  {formatNumber(listing.price, i18n.language)}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div>{listing.year}</div>
                  <div>{listing.mileage?.toLocaleString()} {t('listing.km', { ns: 'common' })}</div>
                  {listing.transmission && <div>{listing.transmission}</div>}
                  {listing.fuelType && <div>{listing.fuelType}</div>}
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDate(listing.createdAt, i18n.language)}</span>
                </div>
                
                <Link
                  href={`/listings/${listing.id}`}
                  className="mt-4 w-full block text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300"
                >
                  {t('listing.viewDetails', { ns: 'common' })}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 