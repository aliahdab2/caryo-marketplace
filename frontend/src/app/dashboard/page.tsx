"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../../utils/localization";
import { 
  MdStarBorder, 
  MdEmail, 
  MdVisibility, 
  MdDirectionsCar, 
  MdAddCircleOutline,
  MdEditNote,
  MdDelete,
  MdLogout,
  MdArrowForward,
  MdCalendarToday
} from "react-icons/md";
import Image from "next/image";

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, i18n } = useTranslation('common');

  // Dashboard overview stats with enhanced data structure
  const stats = [
    {
      title: t('dashboard.activeListings'),
      value: '3',
      icon: <MdDirectionsCar className="text-2xl md:text-3xl" />,
      color: 'blue',
      link: '/dashboard/listings'
    },
    {
      title: t('dashboard.views'),
      value: formatNumber(245, i18n.language),
      icon: <MdVisibility className="text-2xl md:text-3xl" />,
      color: 'green',
      link: '/dashboard/analytics'
    },
    {
      title: t('dashboard.messages'),
      value: formatNumber(12, i18n.language),
      icon: <MdEmail className="text-2xl md:text-3xl" />,
      color: 'purple',
      link: '/dashboard/messages'
    },
    {
      title: t('dashboard.favorites'),
      value: formatNumber(8, i18n.language),
      icon: <MdStarBorder className="text-2xl md:text-3xl" />,
      color: 'amber',
      link: '/dashboard/favorites'
    }
  ];

  // Recent listings with more detailed mock data
  const recentListings = [
    {
      id: "1",
      image: "/images/vehicles/car1.jpg",
      title: "Toyota Camry 2020",
      price: 25000,
      currency: "SYP",
      status: "active",
      created: new Date(2023, 4, 15),
      views: 120
    },
    {
      id: "2",
      image: "/images/vehicles/car1.jpg",
      title: "Honda Civic 2019",
      price: 18500,
      currency: "SYP",
      status: "active",
      created: new Date(2023, 4, 10),
      views: 85
    },
    {
      id: "3",
      image: "/images/vehicles/car1.jpg",
      title: "Mercedes E-Class 2018",
      price: 32000,
      currency: "SYP",
      status: "expired",
      created: new Date(2023, 3, 20),
      views: 210
    }
  ];

  // Helper function to get status styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-400',
          dotColor: 'bg-green-500'
        };
      case 'expired':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-400',
          dotColor: 'bg-red-500'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-400',
          dotColor: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          text: 'text-gray-800 dark:text-gray-400',
          dotColor: 'bg-gray-500'
        };
    }
  };

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
          {t('dashboard.welcome')}
          {session?.user?.name ? `, ${session.user.name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('dashboard.overviewSubtitle')}
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
                  {t('common.viewDetails')}
                </span>
                <MdArrowForward className={`opacity-0 group-hover:opacity-100 transition-opacity ${colorStyle.text}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Listings - Enhanced table with thumbnails and status indicators */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex flex-wrap justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <MdDirectionsCar className="mr-2 text-primary" />
            {t('dashboard.recentListings')}
          </h2>
          <Link 
            href="/dashboard/listings"
            className="text-primary hover:text-primary-dark flex items-center text-sm font-medium transition-colors"
          >
            {t('common.viewAll')}
            <MdArrowForward className="ml-1 rtl:rotate-180" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">{t('listings.image')}</th>
                <th className="py-3.5 px-5">{t('listings.title')}</th>
                <th className="py-3.5 px-5">{t('common.price')}</th>
                <th className="py-3.5 px-5">{t('listings.date')}</th>
                <th className="py-3.5 px-5">{t('listings.views')}</th>
                <th className="py-3.5 px-5">{t('listings.status')}</th>
                <th className="py-3.5 px-5">{t('listings.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentListings.map((listing) => {
                const statusStyle = getStatusStyle(listing.status);
                
                return (
                  <tr 
                    key={listing.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden relative">
                        {/* This would be an actual image in production */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <MdDirectionsCar size={24} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-medium text-gray-900 dark:text-white">
                      {listing.title}
                    </td>
                    <td className="py-4 px-5 text-gray-700 dark:text-gray-300 font-medium">
                      {formatNumber(listing.price, i18n.language, { style: 'currency', currency: listing.currency })}
                    </td>
                    <td className="py-4 px-5 text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                      <div className="flex items-center">
                        <MdCalendarToday className="mr-1.5 text-gray-400" size={14} />
                        {formatDate(listing.created, i18n.language, { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <MdVisibility className="mr-1.5 text-gray-400" size={16} />
                        {formatNumber(listing.views, i18n.language)}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor} mr-1.5`}></span>
                        {t(`listings.${listing.status}`)}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <button 
                          onClick={() => router.push(`/dashboard/listings/edit/${listing.id}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          aria-label={t('common.edit')}
                          title={t('common.edit')}
                        >
                          <MdEditNote size={22} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          aria-label={t('common.delete')}
                          title={t('common.delete')}
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions - Modern action cards */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
          {t('dashboard.quickActions')}
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
              {t('dashboard.createListing')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('dashboard.createListingDesc')}
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
              {t('dashboard.editProfile')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('dashboard.editProfileDesc')}
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
              {t('header.logout')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('dashboard.logoutDesc')}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
