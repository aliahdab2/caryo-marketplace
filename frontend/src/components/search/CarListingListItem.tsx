"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdLocationOn, MdLocalGasStation, MdSpeed, MdSettings, MdCalendarToday, MdPerson, MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { CarListingCardData } from '@/components/listings/CarListingCard';
import { transformMinioUrl } from '@/utils/mediaUtils';
import { formatCurrency } from '@/utils/currency';
import { timeAgo } from '@/utils/dateUtils';

interface CarListingListItemProps {
  listing: CarListingCardData;
  onFavoriteToggle: (isFavorite: boolean) => void;
  initialFavorite?: boolean;
  t?: (key: string, fallback?: string) => string;
  isRTL?: boolean;
}

const CarListingListItem: React.FC<CarListingListItemProps> = ({
  listing,
  onFavoriteToggle,
  initialFavorite = false,
  t = (key: string, fallback?: string) => fallback || key,
  isRTL = false
}) => {
  const [isFavorite, setIsFavorite] = React.useState(initialFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    onFavoriteToggle(newFavoriteState);
  };

  const primaryImage = listing.media?.find(m => m.isPrimary)?.url || listing.media?.[0]?.url;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className={`flex flex-row p-3 gap-3 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Image */}
          <div className="relative w-64 h-40 flex-shrink-0">
            <Image
              src={primaryImage ? transformMinioUrl(primaryImage) : '/images/logo.png'}
              alt={listing.title}
              fill
              className="object-cover rounded-lg"
              unoptimized
            />
            {/* Favorite button */}
            <button
              onClick={handleFavoriteClick}
              className={`
                absolute top-2 ${isRTL ? 'left-2' : 'right-2'} 
                w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 
                flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-800 
                transition-colors duration-200
              `}
              aria-label={isFavorite ? t('removeFromFavorites', 'Remove from favorites') : t('addToFavorites', 'Add to favorites')}
            >
              {isFavorite ? (
                <MdFavorite className="w-5 h-5 text-red-500" />
              ) : (
                <MdFavoriteBorder className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={`flex justify-between items-start mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                {listing.title}
              </h3>
              <p className={`text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {formatCurrency(listing.price)}
              </p>
            </div>

            {/* Vehicle details */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2 text-sm text-gray-600 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                <MdCalendarToday className="w-4 h-4 flex-shrink-0" />
                <span>{listing.year}</span>
              </div>
              
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                <MdSpeed className="w-4 h-4 flex-shrink-0" />
                <span>{listing.mileage?.toLocaleString()} {t('km', 'km')}</span>
              </div>
              
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                <MdLocalGasStation className="w-4 h-4 flex-shrink-0" />
                <span>{listing.fuelType || t('notSpecified', 'N/A')}</span>
              </div>
              
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                <MdSettings className="w-4 h-4 flex-shrink-0" />
                <span>{listing.transmission || t('notSpecified', 'N/A')}</span>
              </div>
            </div>

            {/* Location and seller info */}
            <div className={`flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                  <MdLocationOn className="w-4 h-4 flex-shrink-0" />
                  <span>{isRTL ? listing.governorateNameAr : listing.governorateNameEn}</span>
                </div>
                
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                  <MdPerson className="w-4 h-4 flex-shrink-0" />
                  <span>{listing.sellerUsername}</span>
                </div>
              </div>
              
              <span className={isRTL ? 'text-left' : 'text-right'}>{timeAgo(listing.createdAt, isRTL ? 'ar' : 'en')}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CarListingListItem;
