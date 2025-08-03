"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdLocationOn, MdLocalGasStation, MdSettings, MdFavorite, MdFavoriteBorder, MdDateRange } from 'react-icons/md';
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

  // Helper function to get translated transmission text
  const getTransmissionText = (transmission?: string) => {
    if (!transmission) return t('search:notSpecified', 'N/A');
    
    // Use bilingual fields directly from backend if available
    if (listing.transmissionNameEn || listing.transmissionNameAr) {
      return isRTL ? 
        (listing.transmissionNameAr || listing.transmissionNameEn || transmission) :
        (listing.transmissionNameEn || listing.transmissionNameAr || transmission);
    }
    
    // Fallback to translation lookup for backwards compatibility
    const normalized = transmission.toLowerCase();
    const keyPatterns = [
      `search.transmissions.${normalized}`,
      `common:search.transmissions.${normalized}`,
      `transmissions.${normalized}`,
      `${normalized}`
    ];
    
    for (const key of keyPatterns) {
      const translated = t(key, '');
      if (translated && translated !== key && translated !== '') {
        return translated;
      }
    }
    
    return transmission;
  };

  // Helper function to get translated fuel type text
  const getFuelTypeText = (fuelType?: string) => {
    if (!fuelType) return t('search:notSpecified', 'N/A');
    
    // Use bilingual fields directly from backend if available
    if (listing.fuelTypeNameEn || listing.fuelTypeNameAr) {
      return isRTL ? 
        (listing.fuelTypeNameAr || listing.fuelTypeNameEn || fuelType) :
        (listing.fuelTypeNameEn || listing.fuelTypeNameAr || fuelType);
    }
    
    // Fallback to translation lookup for backwards compatibility
    const normalized = fuelType.toLowerCase();
    const keyPatterns = [
      `search.fuelTypes.${normalized}`,
      `common:search.fuelTypes.${normalized}`,
      `fuelTypes.${normalized}`,
      `${normalized}`
    ];
    
    for (const key of keyPatterns) {
      const translated = t(key, '');
      if (translated && translated !== key && translated !== '') {
        return translated;
      }
    }
    
    return fuelType;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    onFavoriteToggle(newFavoriteState);
  };

  const primaryImage = listing.media?.find(m => m.isPrimary)?.url || listing.media?.[0]?.url;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className={`flex flex-row p-4 gap-5 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Image */}
          <div className="relative w-72 h-48 flex-shrink-0 group">
            <Image
              src={primaryImage ? transformMinioUrl(primaryImage) : '/images/logo.png'}
              alt={listing.title}
              fill
              className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            {/* Favorite button */}
            <button
              onClick={handleFavoriteClick}
              className={`
                absolute top-3 ${isRTL ? 'left-3' : 'right-3'} 
                w-9 h-9 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-800 
                transition-all duration-200 hover:scale-110
              `}
              aria-label={isFavorite ? t('search:removeFromFavorites', 'Remove from favorites') : t('search:addToFavorites', 'Add to favorites')}
            >
              {isFavorite ? (
                <MdFavorite className="w-5 h-5 text-red-500" />
              ) : (
                <MdFavoriteBorder className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            
            {/* Year badge */}
            <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'} bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm`}>
              {listing.year}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Header */}
            <div>
              <div className={`flex justify-between items-start mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-1 ${isRTL ? 'text-right' : 'text-left'} overflow-hidden`}>
                    <span className="block truncate">{listing.title}</span>
                  </h3>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                    {(listing.governorateNameEn || listing.governorateNameAr || listing.governorateDetails) && (
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-1 text-gray-500 dark:text-gray-400`}>
                        <MdLocationOn className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {(() => {
                            // Try direct fields first
                            if (listing.governorateNameEn || listing.governorateNameAr) {
                              return isRTL ? 
                                (listing.governorateNameAr || listing.governorateNameEn) : 
                                (listing.governorateNameEn || listing.governorateNameAr);
                            }
                            // Fallback to governorateDetails
                            if (listing.governorateDetails) {
                              return isRTL ? 
                                (listing.governorateDetails.displayNameAr || listing.governorateDetails.displayNameEn) : 
                                (listing.governorateDetails.displayNameEn || listing.governorateDetails.displayNameAr);
                            }
                            return '';
                          })()}
                        </span>
                      </div>
                    )}
                    {(listing.governorateNameEn || listing.governorateNameAr || listing.governorateDetails) && (
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                    )}
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {timeAgo(listing.createdAt, isRTL ? 'ar' : 'en')}
                    </span>
                  </div>
                </div>
                <div className={`${isRTL ? 'mr-4' : 'ml-4'} text-right`}>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(listing.price)}
                  </p>
                </div>
              </div>

              {/* Vehicle details */}
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4`}>
                {listing.year && (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg`}>
                    <MdDateRange className="w-4 h-4 flex-shrink-0 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {listing.year}
                    </span>
                  </div>
                )}
                
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg`}>
                  <MdLocalGasStation className="w-4 h-4 flex-shrink-0 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getFuelTypeText(listing.fuelType)}
                  </span>
                </div>
                
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg`}>
                  <MdSettings className="w-4 h-4 flex-shrink-0 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getTransmissionText(listing.transmission)}
                  </span>
                </div>

                {listing.mileage && (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg`}>
                    <div className="w-4 h-4 flex-shrink-0 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {listing.mileage.toLocaleString()} {t('search:km', 'km')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CarListingListItem;
