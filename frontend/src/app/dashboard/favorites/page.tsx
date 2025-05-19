"use client";

import { useEffect, useState, useMemo } from 'react';
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
  MdDelete,
  MdSpeed,
} from 'react-icons/md';

export default function FavoritesPage() {
  const { t, i18n } = useTranslation('common');
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for sorting
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'year'>('date');

  // Apply sorting to the favorites list
  const sortedFavorites = useMemo(() => {
    // Create a new array to sort
    const sorted = [...favorites];
    
    // Apply sorting
    if (sortBy === 'price') {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'year') {
      sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return sorted;
  }, [favorites, sortBy]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await getFavorites({ mockMode: true });
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
      await removeFromFavorites(listingId, { mockMode: true });
      setFavorites(prev => prev.filter(fav => fav.id !== listingId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      // Show error toast or message
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <span className="text-gray-500 dark:text-gray-400 text-lg">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">{error}</p>
        <button
          onClick={loadFavorites}
          className="mt-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 shadow"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <section className="w-full bg-gray-50 dark:bg-gray-900 py-12 px-2 md:px-0">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <MdFavorite className="text-primary text-4xl" />
              {t('favorites.title', 'My Favorites')}
            </h1>
            <span className="text-lg text-gray-500 dark:text-gray-400 font-normal self-end mb-1 ml-2">
              {sortedFavorites.length > 0 && `(${sortedFavorites.length} ${t('favorites.itemCount', 'vehicles')})`}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {t('sortBy', 'Sort by')}:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'price' | 'year')}
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="date">{t('newest', 'Newest')}</option>
                <option value="price">{t('price', 'Price')}</option>
                <option value="year">{t('year', 'Year')}</option>
              </select>
            </div>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <MdFavorite className="mx-auto text-6xl text-primary/40 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              {t('favorites.noFavorites')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('favorites.startBrowsing')}
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            >
              <MdDirectionsCar className="mr-2 text-xl" />
              {t('favorites.browseCars')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedFavorites.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 relative group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {listing.image ? (
                      <Image
                        src={listing.image}
                        alt={listing.title || 'Car image'}
                        width={80}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <MdDirectionsCar className="text-3xl text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${listing.id}`}
                      className="block hover:text-primary transition-colors">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {listing.title}
                      </h3>
                    </Link>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mt-1 gap-2">
                      <MdLocationOn />
                      <span className="truncate">
                        {listing.location?.city}
                        {listing.location?.country && `, ${listing.location.country}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromFavorites(listing.id)}
                    className="ml-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition"
                    title={t('favorites.remove')}
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 m-0">
                    {formatNumber(listing.price, i18n.language, { style: 'currency', currency: listing.currency || 'SYP' })}
                  </h4>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MdSpeed />
                    {formatNumber(listing.mileage, i18n.language)} {t('km') || 'km'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MdCalendarToday />
                    {listing.createdAt ? (
                      formatDate(listing.createdAt, i18n.language, { dateStyle: 'medium' }) || t('listings.addedRecently')
                    ) : t('listings.addedRecently')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary-700 dark:text-primary-300 rounded font-medium">
                    {listing.condition === 'new' ? t('listings.conditions.new') : t('listings.conditions.used')}
                  </span>
                  {listing.category?.name && (
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded font-medium">
                      {listing.category.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}