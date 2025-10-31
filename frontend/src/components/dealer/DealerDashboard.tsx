'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { 
  MdDirectionsCar,
  MdAddCircleOutline,
  MdTrendingUp,
  MdMessage,
  MdWarning,
  MdCheckCircle,
  MdNotifications,
  MdStarBorder,
  MdArrowForward
} from 'react-icons/md';
import Link from 'next/link';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { formatNumber } from '@/utils/localization';
import { getMyListings } from '@/services/listings';
import { Listing } from '@/types/listings';
import { ListingsView } from '@/components/listings';

// Import our new trial components
import TrialBanner from './TrialBanner';
import UpgradeModal from './UpgradeModal';

// Import API services
import { 
  getDealerTrialStatus, 
  DealerFeatureNotAvailableError,
  createSubscription,
  type TrialStatus 
} from '@/services/dealerApi';

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  views: number;
  inquiries: number;
  favorites: number;
  alerts: number;
}

export default function DealerDashboard() {
  const { t } = useTranslation(['dashboard', 'common', 'listings', 'search']);
  const { currentLang } = useLanguageSwitching();
  const { user: session } = useOptimizedSession();

  // State management
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    views: 0,
    inquiries: 0,
    favorites: 0,
    alerts: 0
  });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load trial status (optional - graceful fallback if not available)
      try {
        const trialData = await getDealerTrialStatus();
        setTrialStatus(trialData);
      } catch (err) {
        // Expected: User may not be a dealer, or trial not set up yet
        // Dashboard works perfectly without trial features
        if (!(err instanceof DealerFeatureNotAvailableError)) {
          // Only log unexpected errors
          console.error('[DASHBOARD] Unexpected error loading trial status:', err);
        }
        // Silent fallback for DealerFeatureNotAvailableError
      }

      // Load real data from APIs (keeping original functionality)
      const [favoritesData, savedSearchesData] = await Promise.all([
        loadFavoritesCount(),
        loadSavedSearchesCount()
      ]);

      setDashboardStats(prev => ({
        ...prev,
        favorites: favoritesData,
        alerts: savedSearchesData
      }));

    } catch (err) {
      console.error('Error loading dealer data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load favorites count (from original dashboard)
  const loadFavoritesCount = async (): Promise<number> => {
    try {
      const { apiRequest } = await import('@/services/auth/session-manager');
      const favoritesUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/favorites`;
      const response = await apiRequest(favoritesUrl, { method: 'GET' });

      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        
        if (Array.isArray(data)) return data.length;
        if (data?.favorites) return data.favorites.length;
        if (data?.data) return data.data.length;
      }
      return 0;
    } catch (error) {
      console.error('[DASHBOARD] Error fetching favorites:', error);
      return 0;
    }
  };

  // Load saved searches count (from original dashboard)
  const loadSavedSearchesCount = async (): Promise<number> => {
    try {
      const { getUserSavedSearches } = await import('@/services/savedSearches');
      const savedSearches = await getUserSavedSearches();
      return savedSearches.length;
    } catch (error) {
      console.error('[DASHBOARD] Error fetching saved searches:', error);
      return 0;
    }
  };

  // Load recent listings (from original dashboard)
  useEffect(() => {
    const loadRecentListings = async () => {
      try {
        setListingsLoading(true);
        const myListings = await getMyListings();
        
        // Sort by creation date and take first 5
        const sortedListings = myListings
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setRecentListings(sortedListings);
        
        // Update stats with real listings data
        setDashboardStats(prev => ({
          ...prev,
          totalListings: myListings.length,
          activeListings: myListings.filter(l => l.status === 'active').length,
          // Mock data for views/inquiries (you can replace with real data later)
          views: Math.floor(Math.random() * 1000) + 100,
          inquiries: Math.floor(Math.random() * 50) + 5
        }));
      } catch (error) {
        console.error('[DASHBOARD] Failed to load recent listings:', error);
        setRecentListings([]);
      } finally {
        setListingsLoading(false);
      }
    };

    loadRecentListings();
  }, []);

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handleSelectPayment = async (tierId: string, paymentMethod: string) => {
    try {
      console.log('Selected payment:', { tierId, paymentMethod });
      const result = await createSubscription(tierId);
      if (result.success) {
        alert(`Subscription created! Transaction ID: ${result.transactionId}\n\n${result.paymentInstructions}`);
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to create subscription. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <MdWarning className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  {t('error.title')}
                </h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={loadDashboardData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('common.retry')}
                </button>
              </div>
            </div>
          </div>
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
      href: `/${currentLang}/dashboard/listings`,
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
      href: `/${currentLang}/dashboard/messages`
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
          <Link
            href={`/${currentLang}/dashboard/listings/new`}
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

          <Link
            href={`/${currentLang}/dashboard/listings`}
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

          {/* NEW: Upgrade Button (only if on trial) */}
          {trialStatus?.subscriptionTier === 'trial' && (
            <button
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200 hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 rtl:space-x-reverse">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg flex-shrink-0">
                  <MdTrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">
                    {t('upgrade.title')}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-90">
                    {t('upgrade.subtitle')}
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
                  <p className="text-sm opacity-80 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(stat.value, currentLang)}
                    {stat.total && (
                      <span className="text-sm font-normal opacity-60">
                        /{formatNumber(stat.total, currentLang)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg opacity-80">
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
                href={`/${currentLang}/dashboard/listings`}
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
          currentTier={trialStatus?.subscriptionTier}
          onSelectPayment={handleSelectPayment}
        />
      </div>
    </div>
  );
}