"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOptimizedAuthStatus, useOptimizedUser } from '@/hooks/useOptimizedSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserFavorites, removeFromFavorites } from '@/services/favorites';
import { formatDate, formatNumber } from '@/utils/localization';
import FavoriteButton from '@/components/common/FavoriteButton';
import { Listing } from '@/types/listings';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { FaHeart, FaTrash } from 'react-icons/fa';
import Breadcrumb from '@/components/ui/Breadcrumb';

type FilterTab = 'all' | 'available' | 'removed';

export default function FavoritesPage() {
  const { t, i18n } = useTranslation(['favorites', 'common']);
  const { isAuthenticated, isLoading: isAuthLoading, status } = useOptimizedAuthStatus();
  const user = useOptimizedUser();
  const router = useRouter();
  
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!isAuthenticated && !isAuthLoading) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Fetch favorites when auth status is confirmed
    if (isAuthenticated) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading, router]);

  // Filter favorites based on active tab
  useEffect(() => {
    let filtered = favorites;
    
    switch (activeTab) {
      case 'available':
        // Show listings that are not explicitly sold or expired
        filtered = favorites.filter(listing => 
          !listing.status || 
          (listing.status !== 'sold' && listing.status !== 'expired')
        );
        break;
      case 'removed':
        filtered = favorites.filter(listing => listing.status === 'sold' || listing.status === 'expired');
        break;
      default:
        filtered = favorites;
    }
    
    setFilteredFavorites(filtered);
  }, [favorites, activeTab]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserFavorites();
      
      // Ensure we have valid data
      if (Array.isArray(data)) {
        setFavorites(data);
      } else if (data && Array.isArray(data.favorites)) {
        setFavorites(data.favorites);
      } else {
        console.error('Invalid data format for favorites:', data);
        setFavorites([]);
        setError(t('errorLoading'));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(t('errorLoading'));
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = (listingId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // If removed from favorites, remove from the list
      setFavorites(favorites.filter(listing => listing.id.toString() !== listingId));
    }
  };

  const handleRemoveAll = async () => {
    setShowDeleteModal(true);
  };

  const confirmRemoveAll = async () => {
    setIsRemovingAll(true);
    try {
      const removePromises = favorites.map(listing => 
        removeFromFavorites(listing.id.toString())
      );
      await Promise.all(removePromises);
      setFavorites([]);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error removing all favorites:', err);
      setError(t('errorRemoving'));
    } finally {
      setIsRemovingAll(false);
    }
  };

  const cancelRemoveAll = () => {
    setShowDeleteModal(false);
  };

  const getTabCount = (tab: FilterTab) => {
    switch (tab) {
      case 'available':
        return favorites.filter(listing => 
          !listing.status || 
          (listing.status !== 'sold' && listing.status !== 'expired')
        ).length;
      case 'removed':
        return favorites.filter(listing => listing.status === 'sold' || listing.status === 'expired').length;
      default:
        return favorites.length;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              {
                label: 'Dashboard',
                href: '/dashboard',
                translationKey: 'dashboard.dashboard',
                translationNamespace: 'dashboard'
              },
              {
                label: 'My Favorites',
                translationKey: 'title',
                translationNamespace: 'favorites'
              }
            ]}
          />
        </div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {t('title')}
        </h1>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
          {(['all', 'available', 'removed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
              <span className="ml-2 text-xs opacity-75">({getTabCount(tab)})</span>
            </button>
          ))}
        </div>

        {/* Item Count */}
        {!isLoading && !error && filteredFavorites.length > 0 && (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {t('itemCount', { count: filteredFavorites.length })}
          </div>
        )}


        
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingFavorites')}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 my-4 rounded-md">
            <div className="flex justify-between items-center">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
              <button 
                onClick={fetchFavorites}
                className="px-3 py-1 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-400 rounded text-sm"
              >
                {t('common:retry')}
              </button>
            </div>
          </div>
        )}
        
        {!isLoading && !error && filteredFavorites.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <EmptyState
              type="favorites"
              title={t('emptyTitle')}
              message={t('emptyMessage')}
              actionButton={{
                text: t('emptyBrowseListings'),
                href: '/search',
                icon: <FaHeart className="w-4 h-4" />
              }}
            />
          </div>
        )}
        
                {!isLoading && !error && filteredFavorites.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFavorites.map((listing) => (
                <div key={listing.id} className="relative bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
                  <Link href={`/listings/${listing.id}`} className="block group">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={(() => {
                          // Get the primary image or fallback to first image
                          const primaryImage = listing.media?.find(m => m.isPrimary)?.url || listing.media?.[0]?.url;
                          return primaryImage ? transformMinioUrl(primaryImage) : getDefaultImageUrl();
                        })()}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.src = getDefaultImageUrl();
                        }}
                      />
                      {/* Status badges */}
                      {(listing.status === 'sold' || listing.status === 'expired') && (
                        <div className="absolute top-2 left-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'sold'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {listing.status === 'sold' ? t('statusSold') : t('statusExpired')}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                        <FavoriteButton
                          listingId={listing.id.toString()}
                          variant="filled"
                          size="sm"
                          className="shadow-md hover:shadow-lg z-10"
                          initialFavorite={true}
                          onToggle={(isFavorite) => handleFavoriteToggle(listing.id.toString(), isFavorite)}
                          user={user}
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 capitalize">
                        {listing.location?.city || t('listings.locationNotSpecified', { ns: 'listings' })}
                      </p>
                      <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {formatNumber(listing.price, i18n.language, { style: 'currency', currency: listing.currency || 'SYP' })}
                      </h4>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p>
                          {t('listings.posted', { ns: 'listings' })}: {formatDate(new Date(listing.createdAt), i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            
            {/* Remove All Button - Now at the bottom */}
            <div className="mt-8 text-center">
              <button
                onClick={handleRemoveAll}
                disabled={isRemovingAll}
                className="inline-flex items-center px-6 py-3 border border-red-300 dark:border-red-600 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRemovingAll ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                    {t('removingAll')}
                  </>
                ) : (
                  <>
                    <FaTrash className="w-4 h-4 mr-2" />
                    {t('removeAll')}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={cancelRemoveAll}
          onConfirm={confirmRemoveAll}
          title={t('removeAllTitle', 'Remove All Favorites?')}
          message={t('removeAllMessage', 'Are you sure you want to remove all your favorite cars?')}
          isLoading={isRemovingAll}
          loadingText={t('removingAll')}
          confirmText={t('removeAll')}
          cancelText={t('common:cancel', 'Cancel')}
          type="danger"
        />
      </div>
    </div>
  );
}
