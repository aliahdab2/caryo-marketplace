"use client";

import { signOut, useSession } from "next-auth/react";
import { useAuthUser } from "@/hooks/useAuthSession";
import Link from "next/link";
import { useLazyTranslation } from '../../hooks/useLazyTranslation';
import { formatNumber } from "../../utils/localization";
import { useEffect, useState } from "react";
import { 
  MdStarBorder, 
  MdEmail, 
  MdNotifications, 
  MdDirectionsCar, 
  MdAddCircleOutline,
  MdEditNote,
  MdLogout,
  MdArrowForward
} from "react-icons/md";
import { api } from "@/services/api";
import { getMyListings } from "@/services/listings";
import { Listing } from "@/types/listings";
import { RecentListingsTable } from '@/components/listings';

// Move namespaces outside component to prevent recreation on every render
const DASHBOARD_NAMESPACES = ['dashboard', 'common', 'listings', 'search'];

export default function Dashboard() {
  const user = useAuthUser();
  const { data: session } = useSession();
  const { t, i18n, ready } = useLazyTranslation(DASHBOARD_NAMESPACES);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  


  // Fetch favorites and alerts count when component mounts or session changes
  useEffect(() => {
    let mounted = true;

    const loadCounts = async () => {
      if (!user) {
        setFavoritesCount(0);
        setAlertsCount(0);
        setIsLoading(false);
        return;
      }

      try {
        // Import required services
        const { apiRequest } = await import('@/services/auth/session-manager');
        const { getUserSavedSearches } = await import('@/services/savedSearches');
        
        // Fetch favorites count
        const favoritesUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/favorites`;
        const favoritesResponse = await apiRequest(favoritesUrl, { 
          method: 'GET'
        });

        if (favoritesResponse.ok) {
          const text = await favoritesResponse.text();
          let data;
          try {
            data = text ? JSON.parse(text) : [];
          } catch (e) {
            console.error('[DASHBOARD] Error parsing favorites JSON:', e);
            data = [];
          }

          if (mounted) {
            // Handle different response formats
            if (Array.isArray(data)) {
              setFavoritesCount(data.length);
            } else if (data && Array.isArray(data.favorites)) {
              setFavoritesCount(data.favorites.length);
            } else if (data && Array.isArray(data.data)) {
              setFavoritesCount(data.data.length);
            } else {
              setFavoritesCount(0);
            }
          }
        }

        // Fetch alerts count - only if we have a session with access token
        if (session?.accessToken) {
          try {
            const token = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
            const savedSearches = await getUserSavedSearches(token);
            if (mounted) {
              setAlertsCount(savedSearches.length);
            }
          } catch (error) {
            console.error('[DASHBOARD] Error fetching alerts:', error);
            if (mounted) {
              setAlertsCount(0);
            }
          }
        } else {
          console.log('[DASHBOARD] No session or access token available for alerts');
          if (mounted) {
            setAlertsCount(0);
          }
        }

      } catch (error) {
        console.error('[DASHBOARD] Error fetching counts:', error);
        if (mounted) {
          setFavoritesCount(0);
          setAlertsCount(0);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadCounts();

    return () => {
      mounted = false;
    };
  }, [user, session]);

  // Load recent listings using real data
  useEffect(() => {
    const loadRecentListings = async () => {
      if (!user) {
        setRecentListings([]);
        setListingsLoading(false);
        return;
      }

      try {
        setListingsLoading(true);
        
        // Fetch real listings from the API
        const myListings = await getMyListings();
        
        // Sort by creation date (newest first) and take the first 5
        const sortedListings = myListings
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setRecentListings(sortedListings);
      } catch (error) {
        // Use proper error logging instead of console.error
        if (process.env.NODE_ENV === 'development') {
          console.error('[DASHBOARD] Failed to load recent listings:', error);
        }
        setRecentListings([]);
      } finally {
        setListingsLoading(false);
      }
    };

    loadRecentListings();
  }, [user]);

  if (!ready) {
    return <div>Loading translations...</div>;
  }

  // Dashboard overview stats with real favorites and alerts count
  const stats = [
    {
      title: t('activeListings'),
      value: String(recentListings.filter(listing => listing.status === 'active').length),
      icon: <MdDirectionsCar className="text-2xl md:text-3xl" />,
      color: 'blue',
      link: '/dashboard/listings'
    },
    {
      title: t('alerts', { ns: 'search' }),
      value: isLoading ? '...' : String(alertsCount),
      icon: <MdNotifications className="text-2xl md:text-3xl" />,
      color: 'green',
      link: '/saved/alerts'
    },
    {
      title: t('messages'),
      value: formatNumber(12, i18n.language),
      icon: <MdEmail className="text-2xl md:text-3xl" />,
      color: 'purple',
      link: '/dashboard/messages'
    },
    {
      title: t('favorites'),
      value: isLoading ? '...' : String(favoritesCount),
      icon: <MdStarBorder className="text-2xl md:text-3xl" />,
      color: 'amber',
      link: '/favorites'
    }
  ];



  // Get card color style
  const getCardColorStyle = (color: string) => {
    const colorStyles = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        iconBg: 'bg-blue-100 dark:bg-blue-800',
        shadow: 'shadow-blue-100 dark:shadow-blue-900/10'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        iconBg: 'bg-green-100 dark:bg-green-800',
        shadow: 'shadow-green-100 dark:shadow-green-900/10'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        iconBg: 'bg-purple-100 dark:bg-purple-800',
        shadow: 'shadow-purple-100 dark:shadow-purple-900/10'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        iconBg: 'bg-amber-100 dark:bg-amber-800',
        shadow: 'shadow-amber-100 dark:shadow-amber-900/10'
      }
    };
    
    return colorStyles[color as keyof typeof colorStyles] || colorStyles.blue;
  };



  return (
    <div>
      {/* Page Header with welcome message */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('welcome')}
          {user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('overviewSubtitle')}
        </p>
      </div>
      
      {/* Dashboard Stats - Redesigned cards with modern appearance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, index) => {
          const colorStyle = getCardColorStyle(stat.color);
          
          return (
            <Link 
              key={index}
              href={stat.link}
              className={`${colorStyle.bg} border ${colorStyle.border} rounded-xl p-5 
                        transition-all duration-300 hover:shadow-lg ${colorStyle.shadow}
                        hover:translate-y-[-2px] group`}
            >
              <div className="flex items-start">
                <div className={`${colorStyle.iconBg} p-3 rounded-lg ${colorStyle.text}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                    {stat.title}
                  </h3>
                  <div className="flex items-end mt-2">
                    <span className={`text-2xl md:text-3xl font-bold ${colorStyle.text}`}>
                      {stat.value}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end mt-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 opacity-70 mr-1.5 group-hover:mr-2.5 transition-all">
                  {t('viewDetails')}
                </span>
                <MdArrowForward className={`opacity-0 group-hover:opacity-100 transition-opacity ${colorStyle.text}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Listings - Using shared component */}
      <RecentListingsTable
        listings={recentListings}
        loading={listingsLoading}
        showActions={true}
        showViewAllLink={true}
        maxRows={5}
        onDelete={async (id: string) => {
          await api.delete(`/api/listings/${id}`);
          setRecentListings(prev => prev.filter(listing => listing.id !== id));
        }}
        className="mb-8"
      />

      {/* Quick Actions - Modern action cards */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
          {t('quickActions')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link 
            href="/dashboard/listings/new"
            className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700
                     hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center mb-4 
                          group-hover:scale-110 transition-transform">
              <MdAddCircleOutline className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>
            <h3 className="font-medium text-lg text-blue-700 dark:text-blue-400">
              {t('createListing')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('createListingDesc')}
            </p>
          </Link>
          
          <Link 
            href="/dashboard/profile"
            className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700
                     hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center group"
          >
            <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center mb-4 
                          group-hover:scale-110 transition-transform">
              <MdEditNote className="text-purple-600 dark:text-purple-400 text-2xl" />
            </div>
            <h3 className="font-medium text-lg text-purple-700 dark:text-purple-400">
              {t('editProfile')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('editProfileDesc')}
            </p>
          </Link>
          
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-red-300 dark:border-red-700
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-center group"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center mb-4 
                          group-hover:scale-110 transition-transform">
              <MdLogout className="text-red-600 dark:text-red-400 text-2xl" />
            </div>
            <h3 className="font-medium text-lg text-red-700 dark:text-red-400">
              {t('headerLogout', { ns: 'common' })}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('logoutDesc')}
            </p>
          </button>
        </div>
      </div>

    </div>
  );
}
