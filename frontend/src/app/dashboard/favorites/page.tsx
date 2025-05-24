"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { getFavorites, removeFromFavorites } from '@/services/favorites';
import { Listing } from '@/types/listings';
import Image from 'next/image';
import { MdDirectionsCar } from 'react-icons/md';
import { formatCurrency } from '@/utils/currency';
import FavoriteButton from '@/components/common/FavoriteButton';
import Spinner from '@/components/ui/Spinner';

export default function FavoritesPage() {
  const { t } = useTranslation('common');
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'year'>('date');

  // Sort favorites based on the selected criteria
  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];
    
    if (sortBy === 'price') {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'year') {
      sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return sorted;
  }, [favorites, sortBy]);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getFavorites({ mockMode: true });
      setFavorites(response.favorites);
      setError(null);
    } catch (err) {
      setError(t('error.loadingFavorites'));
      console.error('Error loading favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleRemoveFromFavorites = async (listingId: string) => {
    try {
      await removeFromFavorites(listingId, { mockMode: true });
      setFavorites(prev => prev.filter(fav => fav.id !== listingId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      // Show error toast or message
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t('favorites.noFavorites')}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('favorites.title')}
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {t('favorites.sortBy')}:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'year')}
            className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
          >
            <option value="date">{t('favorites.sortOptions.date')}</option>
            <option value="price">{t('favorites.sortOptions.price')}</option>
            <option value="year">{t('favorites.sortOptions.year')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedFavorites.map((listing) => (
          <div
            key={listing.id}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 relative group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {(listing.image || (listing.media && listing.media[0])) ? (
                  <Image
                    src={listing.image || listing.media![0].url}
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
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(listing.price, listing.currency || 'USD')}
                </p>
              </div>
              <FavoriteButton
                listingId={listing.id.toString()}
                variant="filled"
                size="sm"
                initialFavorite={true}
                mockMode={true}
                onToggle={(isFavorite) => {
                  if (!isFavorite) {
                    handleRemoveFromFavorites(listing.id.toString());
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                {t('listings.year')}: <span className="text-gray-900 dark:text-white">{listing.year}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {t('listings.mileage')}: <span className="text-gray-900 dark:text-white">{listing.mileage.toLocaleString()}</span>
              </div>
              {listing.location && (
                <div className="col-span-2 text-gray-600 dark:text-gray-400 truncate">
                  {t('listings.location')}: <span className="text-gray-900 dark:text-white">
                    {listing.location.city}
                    {listing.location.country ? `, ${listing.location.country}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}