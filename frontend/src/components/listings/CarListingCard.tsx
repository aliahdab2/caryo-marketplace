"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { formatNumber } from '@/utils/localization';
import { timeAgo } from '@/utils/dateUtils';
import FavoriteButton from '@/components/common/FavoriteButton';
import { getDefaultImageUrl } from '@/utils/mediaUtils';
import { useLanguageDirection } from '@/utils/languageDirection';
import YearBadge from '@/components/ui/YearBadge';
import HoverImageNavigation from '@/components/ui/HoverImageNavigation';

// Move namespaces outside component to prevent recreation on every render
const COMMON_NAMESPACES = ['common', 'search'];

// Unified interface for car listing data
export interface CarListingCardData {
  id: string | number;
  title: string;
  price: number;
  year?: number;
  modelYear?: number;
  mileage: number;
  transmission?: string;
  fuelType?: string;
  // Bilingual transmission and fuel type display names
  transmissionNameEn?: string;
  transmissionNameAr?: string;
  fuelTypeNameEn?: string;
  fuelTypeNameAr?: string;
  createdAt: string;
  sellerUsername?: string;
  governorateNameEn?: string;
  governorateNameAr?: string;
  governorateDetails?: {
    id: number;
    displayNameEn: string;
    displayNameAr: string;
    slug: string;
    countryId: number;
    countryCode: string;
    countryNameEn: string;
    countryNameAr: string;
    region: string;
    latitude: number;
    longitude: number;
  };
  media?: Array<{
    url: string;
    isPrimary?: boolean;
    type?: string;
    contentType?: string;
  }>;
}

interface CarListingCardProps {
  listing: CarListingCardData;
  onFavoriteToggle?: (isFavorite: boolean) => void;
  initialFavorite?: boolean;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
    isAdmin?: boolean;
    accessToken?: string;
  } | null;
}

const CarListingCard: React.FC<CarListingCardProps> = ({
  listing,
  onFavoriteToggle,
  initialFavorite = false,
  user = null
}) => {
  const { i18n, t } = useLazyTranslation(COMMON_NAMESPACES);
  const { isRTL } = useLanguageDirection();

  // Use year or modelYear - prioritize modelYear as it's more specific
  const displayYear = listing.modelYear || listing.year;

  // State to track if video is currently playing
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Callback to handle video playing state changes
  const handleVideoPlayingChange = (playing: boolean) => {
    setIsVideoPlaying(playing);
  };

  // Helper function to get translated transmission text
  const getTransmissionText = (transmission?: string) => {
    if (!transmission) return '';

    // Use bilingual fields directly from backend if available
    if (listing.transmissionNameEn || listing.transmissionNameAr) {
      const isRTL = i18n.language === 'ar';
      return isRTL ?
        (listing.transmissionNameAr || listing.transmissionNameEn || transmission) :
        (listing.transmissionNameEn || listing.transmissionNameAr || transmission);
    }

    // Fallback to translation lookup for backwards compatibility
    const normalized = transmission.toLowerCase();
    const translatedKey = `transmissions${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`;
    const translated = t(translatedKey, { ns: 'search' });

    if (translated && translated !== translatedKey) {
      return translated;
    }

    return transmission;
  };

  // Helper function to get translated fuel type text
  const getFuelTypeText = (fuelType?: string) => {
    if (!fuelType) return '';

    // Use bilingual fields directly from backend if available
    if (listing.fuelTypeNameEn || listing.fuelTypeNameAr) {
      const isRTL = i18n.language === 'ar';
      return isRTL ?
        (listing.fuelTypeNameAr || listing.fuelTypeNameEn || fuelType) :
        (listing.fuelTypeNameEn || listing.fuelTypeNameAr || fuelType);
    }

    // Fallback to translation lookup for backwards compatibility
    const normalized = fuelType.toLowerCase();
    const translatedKey = `fuelTypes${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`;
    const translated = t(translatedKey, { ns: 'search' });

    if (translated && translated !== translatedKey) {
      return translated;
    }

    return fuelType;
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out h-full flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Favorite Button - Hidden when video is playing */}
      {!isVideoPlaying && (
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`} onClick={(e) => e.stopPropagation()}>
          <FavoriteButton
            listingId={listing.id.toString()}
            variant="filled"
            size="sm"
            className="shadow-md hover:shadow-lg"
            initialFavorite={initialFavorite}
            onToggle={onFavoriteToggle}
            user={user}
          />
        </div>
      )}

      <Link href={`/listings/${listing.id}`} className="flex flex-col h-full group">
        {/* Image with Hover Navigation */}
        <div className="relative h-52 w-full overflow-hidden">
          <HoverImageNavigation
            media={listing.media}
            alt={listing.title}
            className="w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            onImageError={(e) => {
              e.currentTarget.src = getDefaultImageUrl();
            }}
            onVideoPlayingChange={handleVideoPlayingChange}
          />

          {/* Year Badge - Hidden when video is playing */}
          {!isVideoPlaying && (
            <YearBadge
              year={displayYear}
              size="md"
              position="bottom-left"
              zIndex={30}
            />
          )}
        </div>

        {/* Content */}
        <div className={`p-4 flex-1 flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {listing.title}
          </h3>

          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
            {formatNumber(listing.price, i18n.language)}
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
            {displayYear && <div>{displayYear}</div>}
            <div>{listing.mileage?.toLocaleString()} {t('listing.km', 'km')}</div>
            {listing.transmission && <div>{getTransmissionText(listing.transmission)}</div>}
            {listing.fuelType && <div>{getFuelTypeText(listing.fuelType)}</div>}
          </div>

          {/* Spacer to push location info to bottom */}
          <div className="flex-1"></div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {timeAgo(listing.createdAt, i18n.language)}
            {(listing.governorateNameEn || listing.governorateNameAr || listing.governorateDetails) && (
              <div className="mt-1">

                {(() => {
                  // Try direct fields first
                  if (listing.governorateNameEn || listing.governorateNameAr) {
                    return i18n.language === 'ar' ? listing.governorateNameAr : listing.governorateNameEn;
                  }
                  // Fallback to governorateDetails
                  if (listing.governorateDetails) {
                    return i18n.language === 'ar' ?
                      (listing.governorateDetails.displayNameAr || listing.governorateDetails.displayNameEn) :
                      (listing.governorateDetails.displayNameEn || listing.governorateDetails.displayNameAr);
                  }
                  return '';
                })()}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CarListingCard;
