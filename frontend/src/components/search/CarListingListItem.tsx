"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdLocationOn, MdLocalGasStation, MdSettings, MdDateRange } from 'react-icons/md';
import FavoriteButton from '@/components/common/FavoriteButton';
import { CarListingCardData } from '@/components/listings/CarListingCard';
import { transformMinioUrl } from '@/utils/mediaUtils';
import { formatCurrency } from '@/utils/currency';
import { timeAgo } from '@/utils/dateUtils';
import { useLanguageDirection } from '@/utils/languageDirection';
import YearBadge from '@/components/ui/YearBadge';

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
  isRTL: _propIsRTL = false // Keep prop for backward compatibility but don't rely on it
}) => {
  // Determine RTL internally like the grid component does
  const { isRTL } = useLanguageDirection();
  
  // Use year or modelYear - prioritize modelYear as it's more specific
  const displayYear = listing.modelYear || listing.year;

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
      `transmissions${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`,
      `search:transmissions${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`,
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
      `fuelTypes${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`,
      `search:fuelTypes${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`,
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



  const primaryImage = listing.media?.find(m => m.isPrimary)?.url || listing.media?.[0]?.url;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100/60 dark:border-gray-800/60 transition-all duration-500 overflow-hidden group hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1">
      <Link href={`/listings/${listing.id}`} className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-3xl">
        <div className={`flex flex-col lg:flex-row p-5 lg:p-7 gap-5 lg:gap-7 ${isRTL ? 'rtl' : 'ltr'} items-stretch`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Image & Favorite */}
          <div className="relative w-full lg:w-72 h-48 lg:h-52 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <Image
              src={primaryImage ? transformMinioUrl(primaryImage) : '/images/logo.png'}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              unoptimized
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Favorite Button - Same as grid mode */}
            <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-10`} onClick={(e) => e.stopPropagation()}>
              <FavoriteButton
                listingId={listing.id.toString()}
                variant="filled"
                size="sm"
                className="shadow-md hover:shadow-lg"
                initialFavorite={initialFavorite}
                onToggle={onFavoriteToggle}
              />
            </div>
            
            {/* Year Badge */}
            <YearBadge 
              year={displayYear} 
              size="lg" 
              position="bottom-left" 
              zIndex={20}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Title & Price */}
            <div className={`flex flex-col lg:flex-row lg:items-start justify-between mb-5 gap-3 lg:gap-6`}>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3 className={`text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                  <span className="block group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">{listing.title}</span>
                </h3>
              </div>
              <div className={`flex-shrink-0 ${isRTL ? 'lg:mr-0' : 'lg:ml-0'}`}>
                <div className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(listing.price)}
                </div>
              </div>
            </div>

            {/* Location & Date */}
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}> 
              {(listing.governorateNameEn || listing.governorateNameAr || listing.governorateDetails) && (
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-xl`}>
                  <MdLocationOn className="w-4 h-4 flex-shrink-0 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl">
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {timeAgo(listing.createdAt, isRTL ? 'ar' : 'en')}
                </span>
              </div>
            </div>

            {/* Vehicle details */}
            <div className={`flex flex-wrap gap-2 md:gap-3`}> 
              {listing.year && (
                <div className={`flex items-center flex-row gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2.5 rounded-xl border border-purple-100 dark:border-purple-800/30 flex-shrink-0`}> 
                  <MdDateRange className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
                    {listing.year}
                  </span>
                </div>
              )}
              <div className={`flex items-center flex-row gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 rounded-xl border border-blue-100 dark:border-blue-800/30 flex-shrink-0`}> 
                <MdLocalGasStation className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                  {getFuelTypeText(listing.fuelType)}
                </span>
              </div>
              <div className={`flex items-center flex-row gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex-shrink-0`}> 
                <MdSettings className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                  {getTransmissionText(listing.transmission)}
                </span>
              </div>
              <div className={`flex items-center flex-row gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2.5 rounded-xl border border-orange-100 dark:border-orange-800/30 flex-shrink-0`}> 
                <div className="w-4 h-4 flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-sm"></div>
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300 whitespace-nowrap">
                  {listing.mileage ? listing.mileage.toLocaleString() : t('search:notSpecified', 'N/A')} {t('search:km', 'km')}
                </span>
              </div>
            </div>

            {/* ...no CTA button... */}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CarListingListItem;
