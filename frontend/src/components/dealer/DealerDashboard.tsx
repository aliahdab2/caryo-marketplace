'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { 
  MdDirectionsCar,
  MdAddCircleOutline,
  MdTrendingUp,
  MdMessage,
  MdCheckCircle,
  MdNotifications,
  MdStarBorder,
  MdArrowForward,
  MdStorefront
} from 'react-icons/md';
import Link from 'next/link';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { formatNumber } from '@/utils/localization';
import { ListingsView } from '@/components/listings';

// Import our new trial components
import TrialBanner from './TrialBanner';
import UpgradeModal from './UpgradeModal';

// Import React Query hooks
import { 
  useMyListings, 
  useFavorites, 
  useSavedSearches,
  useDealerTrialStatus,
  useCreateSubscription
} from '@/hooks/queries';

// Import common components
import { ErrorDisplay } from '@/components/common';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

export default function DealerDashboard() {
  const { t } = useTranslation(['dashboard', 'common', 'listings', 'search', 'upgradeModal']);
  const { currentLang } = useLanguageSwitching();
  const { user: session } = useOptimizedSession();

  // UI State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // React Query hooks for data fetching
  const { data: trialStatus } = useDealerTrialStatus();
  const { data: favoritesData = [] } = useFavorites();
  const { data: savedSearchesData = [] } = useSavedSearches();
  
  // Type assertions for array data
  const favorites = Array.isArray(favoritesData) ? favoritesData : [];
  const savedSearches = Array.isArray(savedSearchesData) ? savedSearchesData : [];
  const { 
    data: listings = [], 
    isLoading: listingsLoading,
    error: listingsError,
    refetch: refetchListings
  } = useMyListings();

  // Subscription mutation
  const subscriptionMutation = useCreateSubscription();

  // Computed values using useMemo
  const recentListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [listings]);

  const dashboardStats = useMemo(() => ({
    totalListings: listings.length,
    activeListings: listings.filter(l => l.status === 'active').length,
    views: 0, // TODO: replace with real analytics data
    inquiries: 0, // TODO: replace with real analytics data
    favorites: favorites.length,
    alerts: savedSearches.length
  }), [listings, favorites.length, savedSearches.length]);

  // Loading state - show skeleton while waiting for initial data
  // Using the same skeleton as loading.tsx for seamless transition
  // MOVED HERE: Always call hooks before early returns
  if (listingsLoading && (!listings || listings.length === 0)) {
    return <DashboardSkeleton />;
  }

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handleSelectPayment = async (tierId: string, _paymentMethod: string) => {
    try {
      const result = await subscriptionMutation.mutateAsync(tierId);
      if (result.success) {
        alert(`Subscription created! Transaction ID: ${result.transactionId}\n\n${result.paymentInstructions}`);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to create subscription. Please try again.');
    }
  };



  // Error state
  if (listingsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorDisplay error={listingsError} retry={refetchListings} />
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: t('activeListings'),
      value: dashboardStats.activeListings,
      total: dashboardStats.totalListings,
      icon: <MdDirectionsCar className="w-6 h-6" />,
      color: 'blue',
      href: `/${currentLang}/dashboard/dealer/stock`,
      showProgress: true
    },
    {
      title: t('alerts', { ns: 'search' }),
      value: dashboardStats.alerts,
      icon: <MdNotifications className="w-6 h-6" />,
      color: 'green',
      href: `/${currentLang}/saved/alerts`
    },
    {
      title: t('messages'),
      value: 12, // Keep hardcoded from original (replace with real data when available)
      icon: <MdMessage className="w-6 h-6" />,
      color: 'purple',
      href: `/${currentLang}/dashboard/dealer/leads`
    },
    {
      title: t('favorites'),
      value: dashboardStats.favorites,
      icon: <MdStarBorder className="w-6 h-6" />,
      color: 'amber',
      href: `/${currentLang}/favorites`
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('welcome', { name: session?.name || 'Dealer' })}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('overviewSubtitle')}
          </p>
        </div>

        {/* Trial Banner (NEW FEATURE) */}
        {trialStatus && (
          <TrialBanner 
            trialStatus={trialStatus}
            onUpgradeClick={handleUpgradeClick}
            className="mb-6 sm:mb-8"
          />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {trialStatus?.canCreateListings === false ? (
            <button
              onClick={handleUpgradeClick}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800/50 p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105 text-left relative group w-full"
            >
              <div className="absolute top-2 right-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {t('limitReached', { defaultValue: 'Limit Reached' })}
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
                <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex-shrink-0">
                  <MdAddCircleOutline className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {t('createListing')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {t('upgradeToCreateMore', { defaultValue: 'Upgrade your plan to create more listings' })}
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <Link
              href={`/${currentLang}/dashboard/dealer/stock/new`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                  <MdAddCircleOutline className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {t('createListing')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {t('createListingDesc')}
                  </p>
                </div>
              </div>
            </Link>
          )}

          <Link
            href={`/${currentLang}/dashboard/dealer/stock`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                <MdDirectionsCar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  {t('myListings')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {formatNumber(dashboardStats.totalListings, currentLang)} {t('listingsCount', { count: dashboardStats.totalListings })}
                </p>
              </div>
            </div>
          </Link>

          {/* Edit Dealer Profile */}
          <Link
            href={`/${currentLang}/dashboard/dealer/storefront`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
              <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                <MdStorefront className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  {t('editDealerProfile')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t('editDealerProfileDesc')}
                </p>
              </div>
            </div>
          </Link>

          {/* NEW: Upgrade Button (only if on trial) */}
          {trialStatus?.subscriptionTier === 'trial' && (
            <button
              onClick={handleUpgradeClick}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
                <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                  <MdTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                    {t('upgradeModal:title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {t('upgradeModal:subtitle')}
                  </p>
                </div>
              </div>
            </button>
          )}

          <Link
            href={`/${currentLang}/dashboard/settings`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
              <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex-shrink-0">
                <MdCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  {t('settings')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {t('settings.accountPreferences')}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards (ORIGINAL FUNCTIONALITY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(stat.value, currentLang)}
                    {stat.total && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-500">
                        /{formatNumber(stat.total, currentLang)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  {stat.icon}
                </div>
              </div>
              
              {/* Progress bar for listings (NEW FEATURE) */}
              {stat.showProgress && stat.total && (
                <div className="mt-4">
                  <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300 bg-current"
                      style={{ 
                        width: `${Math.min((stat.value / stat.total) * 100, 100)}%`,
                        opacity: 0.6
                      }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Recent Listings (ORIGINAL FUNCTIONALITY) */}
        {!listingsLoading && recentListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('recentListings')}
              </h2>
              <Link
                href={`/${currentLang}/dashboard/dealer/stock`}
                className="text-primary hover:underline flex items-center space-x-2 rtl:space-x-reverse"
              >
                <span>{t('viewAll')}</span>
                <MdArrowForward className="w-4 h-4" />
              </Link>
            </div>
            <ListingsView listings={recentListings} />
          </div>
        )}

        {/* Upgrade Modal (NEW FEATURE) */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentTier={trialStatus?.subscriptionTier || undefined}
          onSelectPayment={handleSelectPayment}
        />
      </div>
    </div>
  );
}