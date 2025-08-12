"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../../utils/localization";
import { Listing } from "../../types/listings";
import { 
  MdDirectionsCar, 
  MdEditNote,
  MdDelete,
  MdArrowForward,
  MdCalendarToday,
  MdAddCircleOutline
} from "react-icons/md";
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';

interface RecentListingsTableProps {
  listings: Listing[];
  loading?: boolean;
  showActions?: boolean;
  showViewAllLink?: boolean;
  maxRows?: number;
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
  className?: string;
}

export default function RecentListingsTable({
  listings,
  loading = false,
  showActions = true,
  showViewAllLink = true,
  maxRows,
  onDelete,
  onRefresh,
  className = ""
}: RecentListingsTableProps) {
  const { t, i18n } = useTranslation(["dashboard", "listings", "common"]);
  
  // Delete confirmation hook
  const deleteConfirmation = useDeleteConfirmation({
    namespace: 'listings',
    onDelete: async (id: string) => {
      if (onDelete) {
        await onDelete(id);
      }
    },
    onError: (error) => {
      console.error('Failed to delete listing:', error);
    }
  });

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
      case 'sold':
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          text: 'text-gray-800 dark:text-gray-400',
          dotColor: 'bg-gray-500'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          text: 'text-gray-800 dark:text-gray-400',
          dotColor: 'bg-gray-500'
        };
    }
  };

  // Handle delete listing
  const handleDelete = (id: string) => {
    const listing = listings.find(l => l.id === id);
    deleteConfirmation.openSingleDelete(id, listing?.title);
  };

  // Limit listings if maxRows is specified
  const displayListings = maxRows ? listings.slice(0, maxRows) : listings;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="flex flex-wrap justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <MdDirectionsCar className="mr-2 text-primary" />
          {t('recentListings')}
        </h2>
        {showViewAllLink && (
          <Link 
            href="/dashboard/listings"
            className="text-primary hover:text-primary-dark flex items-center text-sm font-medium transition-colors"
          >
            {t('viewAll')}
            <MdArrowForward className="ml-1 rtl:rotate-180" />
          </Link>
        )}
      </div>
      
      <div className="min-w-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : displayListings.length === 0 ? (
          <div className="p-8 text-center">
            <MdDirectionsCar className="mx-auto text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('noListings')}</p>
            <Link 
              href="/dashboard/listings/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <MdAddCircleOutline className="mr-2" />
              {t('createListing')}
            </Link>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-20">{t('image')}</th>
                <th className="py-3 px-4 w-2/5">{t('title')}</th>
                <th className="py-3 px-4 w-24">{t('price')}</th>
                <th className="py-3 px-4 w-32">{t('date')}</th>
                <th className="py-3 px-4 w-24">{t('status')}</th>
                {showActions && (
                  <th className="py-3 px-4 w-24">{t('actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayListings.map((listing) => {
                const statusStyle = getStatusStyle(listing.status || 'pending');
                const currency = (listing.currency ?? 'USD') as string;
                
                return (
                  <tr 
                    key={listing.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3 rtl:ml-3 rtl:mr-0 border border-gray-200 dark:border-gray-600 shadow-sm">
                        {listing.image ? (
                          <Image 
                            src={listing.image} 
                            alt={listing.title}
                            width={64}
                            height={64}
                            className="h-16 w-16 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${listing.image ? 'hidden' : ''}`}>
                          <MdDirectionsCar size={24} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {listing.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <span className="inline-flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z"/>
                            </svg>
                            {(() => {
                              const isArabic = i18n.language === 'ar';
                              const city = isArabic ? listing.location?.cityAr : listing.location?.city;
                              const governorate = isArabic ? listing.governorate?.nameAr : listing.governorate?.nameEn;
                              
                              if (city && governorate) {
                                return `${city}، ${governorate}`;
                              } else if (city) {
                                return city;
                              } else if (governorate) {
                                return governorate;
                              } else if (listing.location?.country) {
                                return listing.location.country;
                              } else {
                                return t('listings:locationNotSpecified');
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-700 dark:text-gray-300 font-medium">
                      {formatNumber(listing.price, i18n.language, { 
                        style: 'currency', 
                        currency: currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </td>
                    <td className="py-4 px-5 text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                      <div className="flex items-center">
                        <MdCalendarToday className="mr-1.5 text-gray-400" size={14} />
                        {formatDate(listing.createdAt, i18n.language, { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor} mr-1.5`}></span>
                        {listing?.status 
                          ? t(`listings:listingStatus${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}`)
                          : t('listings:listingStatusPending')
                        }
                      </span>
                    </td>
                    {showActions && (
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse rtl:gap-3">
                          <Link
                            href={`/dashboard/listings/edit/${listing.id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label={t('edit')}
                            title={t('edit')}
                          >
                            <MdEditNote size={22} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(listing.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            aria-label={t('delete')}
                            title={t('delete')}
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal {...deleteConfirmation.modalProps} />
    </div>
  );
}
