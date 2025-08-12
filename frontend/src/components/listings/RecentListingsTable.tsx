"use client";

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
  MdAddCircleOutline,
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdSpeed
} from "react-icons/md";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import { useDeleteConfirmation } from "../../hooks/useDeleteConfirmation";

interface RecentListingsTableProps {
  listings: Listing[];
  loading?: boolean;
  showActions?: boolean;
  showViewAllLink?: boolean;
  maxRows?: number;
  onDelete?: (id: string) => Promise<void>;
  className?: string;
}

export default function RecentListingsTable({
  listings,
  loading = false,
  showActions = true,
  showViewAllLink = true,
  maxRows,
  onDelete,
  className = ""
}: RecentListingsTableProps) {
  const { t, i18n } = useTranslation(['listings', 'common']);
  
  // Delete confirmation hook
  const deleteConfirmation = useDeleteConfirmation({
    namespace: 'listings',
    onDelete: onDelete || (async () => {}),
    onError: (error) => {
      console.error('Failed to delete listing:', error);
      // Could add toast notification here in the future
    }
  });

  // Helper functions
  const formatLocation = (listing: Listing) => {
    const isArabic = i18n.language === 'ar';
    const city = isArabic ? listing.location?.cityAr : listing.location?.city;
    const governorate = isArabic ? listing.governorate?.nameAr : listing.governorate?.nameEn;
    
    if (city && governorate) {
      return `${city}، ${governorate}`;
    } else if (city) {
      return city;
    } else if (governorate) {
      return governorate;
    } else {
      return listing.location?.country || '';
    }
  };

  const formatListingDate = (listing: Listing) => {
    const dateToFormat = listing.createdAt || listing.listingDate;
    if (dateToFormat) {
      return formatDate(dateToFormat, i18n.language, { dateStyle: 'medium' });
    }
    return null;
  };

  const getStatusStyle = (status: string) => {
    const statusStyles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    };
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;
  };

  const formatCurrencyDisplay = (price: number, currency: string) => {
    // For USD, show icon + number without $ symbol
    if (currency === 'USD') {
      const formattedNumber = formatNumber(price, i18n.language, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `$ ${formattedNumber}`;
    }
    
    // For other currencies, show number + currency code
    const formattedNumber = formatNumber(price, i18n.language, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return `${formattedNumber} ${currency}`;
  };

  // Handle delete listing
  const handleDelete = (id: string) => {
    const listing = listings.find(l => l.id === id);
    deleteConfirmation.openSingleDelete(id, listing?.title);
  };

  // Limit listings if maxRows is specified
  const displayListings = maxRows ? listings.slice(0, maxRows) : listings;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Clean Header */}
      <div className="bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
              <MdDirectionsCar className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('listings:recentListings')}
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {listings.length} {listings.length === 1 ? t('listings:listing') : t('listings:listings')}
                {maxRows && listings.length > maxRows && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {" "}({t('showing')} {displayListings.length} {t('recent')})
                  </span>
                )}
              </p>
            </div>
          </div>
          {showViewAllLink && (
            <Link 
              href="/dashboard/listings"
              className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
            >
              {t('viewAll', { ns: 'common' })}
              <MdArrowForward className="ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180 w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          // Clean Loading State
          <div className="space-y-3">
            {[...Array(Math.min(3, maxRows || 3))].map((_, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayListings.length === 0 ? (
          // Clean Empty State
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <MdDirectionsCar className="text-gray-400 dark:text-gray-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('listings:noListings')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {t('noListingsDesc') || 'You haven\'t created any listings yet. Start by creating your first listing!'}
            </p>
            <Link 
              href="/dashboard/listings/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
            >
              <MdAddCircleOutline className="mr-2 w-4 h-4" />
              {t('listings:createListing')}
            </Link>
          </div>
        ) : (
          // Modern Card-Based Layout
          <div className="space-y-4">
            {displayListings.map((listing) => {
              const currency = (listing.currency ?? 'USD') as string;
              const hasValidPrice = listing.price && listing.price > 0;
              const hasValidMileage = listing.mileage && listing.mileage > 0;
              
              return (
                <div 
                  key={listing.id} 
                  className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md overflow-hidden"
                >
                  <div className="p-4">
                 <div className="flex items-start space-x-4 rtl:space-x-reverse">
                   {/* Clean Image Section */}
                   <div className="relative flex-shrink-0">
                     <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500">
                       {listing.image ? (
                         <Image 
                           src={listing.image} 
                           alt={listing.title || 'Vehicle image'}
                           width={96}
                           height={96}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             target.style.display = 'none';
                             target.nextElementSibling?.classList.remove('hidden');
                           }}
                           priority={false}
                         />
                       ) : null}
                       <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${listing.image ? 'hidden' : ''}`}>
                         <MdDirectionsCar size={32} />
                       </div>
                     </div>
                     {/* Simple Status Badge */}
                     <div className="absolute -top-1 -right-1">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(listing.status || 'pending')}`}>
                         {listing?.status 
                           ? t(`listings:listingStatus${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}`)
                           : t('listings:listingStatusPending')
                         }
                       </span>
                     </div>
                   </div>

                   {/* Content Section */}
                   <div className="flex-1 min-w-0">
                     {/* Top Row: Title and Price */}
                     <div className="flex items-start justify-between mb-3">
                       <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 mr-3 rtl:mr-0 rtl:ml-3">
                         {listing.title}
                       </h3>
                       {hasValidPrice && (
                         <div className="text-right flex-shrink-0">
                           <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                             {formatCurrencyDisplay(listing.price, currency)}
                           </div>
                         </div>
                       )}
                     </div>

                     {/* Middle Row: Car Details (Year & Mileage) */}
                     <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                       <span className="flex items-center">
                         <MdCalendarToday className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-purple-500" />
                         {listing.year || listing.modelYear}
                       </span>
                       {hasValidMileage && (
                         <span className="flex items-center ml-4 rtl:ml-0 rtl:mr-4">
                           <MdSpeed className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-orange-500" />
                           {listing.mileage.toLocaleString()}
                         </span>
                       )}
                     </div>

                     {/* Bottom Row: Location and Date */}
                     <div className="flex items-center justify-between">
                       <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                         <div className="flex items-center">
                           <MdLocationOn className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-blue-500" />
                           <span className="truncate">
                             {formatLocation(listing)}
                           </span>
                         </div>
                         {formatListingDate(listing) && (
                           <div className="flex items-center ml-4 rtl:ml-0 rtl:mr-4">
                             <MdAccessTime className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-green-500" />
                             <span>
                               {formatListingDate(listing)}
                             </span>
                           </div>
                         )}
                       </div>

                       {/* Actions */}
                       {showActions && (
                         <div className="flex items-center space-x-2 rtl:space-x-reverse">
                           <Link
                             href={`/dashboard/listings/edit/${listing.id}`}
                             className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors duration-200"
                             title={t('edit', { ns: 'common' })}
                           >
                             <MdEditNote size={20} />
                           </Link>
                           <button 
                             onClick={() => handleDelete(listing.id)}
                             className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors duration-200"
                             title={t('delete', { ns: 'common' })}
                           >
                             <MdDelete size={20} />
                           </button>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal {...deleteConfirmation.modalProps} />
    </div>
  );
}
