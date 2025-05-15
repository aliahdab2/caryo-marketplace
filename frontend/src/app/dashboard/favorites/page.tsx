"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types/listing';
import { getFavorites, removeFromFavorites } from '@/services/favorites';
import { formatDate, formatNumber } from '@/utils/localization';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MdFavorite,
  MdDirectionsCar,
  MdLocationOn,
  MdCalendarToday,
  MdDelete
} from 'react-icons/md';

export default function FavoritesPage() {
  const { t, i18n } = useTranslation('common');
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await getFavorites();
      setFavorites(data);
      setError(null);
    } catch (err) {
      setError(t('error.loadingFavorites'));
      console.error('Error loading favorites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (listingId: string) => {
    try {
      await removeFromFavorites(listingId);
      setFavorites(prev => prev.filter(fav => fav.id !== listingId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      // Show error toast or message
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadFavorites}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <MdFavorite className="mr-2 text-primary" />
            {t('dashboard.favorites')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {favorites.length} {t('listings.itemsFound')}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MdFavorite className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {t('favorites.noFavorites')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('favorites.startBrowsing')}
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <MdDirectionsCar className="mr-2" />
            {t('favorites.browseCars')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((listing) => (
            <div
              key={listing.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group"
            >
              <div className="relative">
                <Link href={`/listings/${listing.id}`}>
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                    <Image
                      src={listing.image || "/images/vehicles/car-default.svg"}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveFromFavorites(listing.id)}
                  className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                  title={t('favorites.remove')}
                >
                  <MdDelete size={20} />
                </button>
              </div>

              <div className="p-4">
                <Link href={`/listings/${listing.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                </Link>

                <p className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-3">
                  {formatNumber(listing.price, i18n.language, { 
                    style: 'currency', 
                    currency: listing.currency || 'SYP' 
                  })}
                </p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {listing.location && (
                    <div className="flex items-center">
                      <MdLocationOn className="mr-1" />
                      <span>
                        {listing.location.city}
                        {listing.location.country && `, ${listing.location.country}`}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <MdCalendarToday className="mr-1" />
                    <span>
                      {formatDate(new Date(listing.createdAt), i18n.language, { 
                        dateStyle: 'medium' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 