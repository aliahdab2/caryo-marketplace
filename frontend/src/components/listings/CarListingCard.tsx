"use client";

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { formatDate, formatNumber } from '@/utils/localization';
import FavoriteButton from '@/components/common/FavoriteButton';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';

// Move namespaces outside component to prevent recreation on every render
const COMMON_NAMESPACES = ['common'];

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
  createdAt: string;
  sellerUsername?: string;
  governorateNameEn?: string;
  governorateNameAr?: string;
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
}

const CarListingCard: React.FC<CarListingCardProps> = ({ 
  listing, 
  onFavoriteToggle,
  initialFavorite = false 
}) => {
  const { i18n, t } = useLazyTranslation(COMMON_NAMESPACES);

  // Get the primary image or fallback to first image
  const primaryImage = listing.media?.find(m => m.isPrimary)?.url || listing.media?.[0]?.url;
  const imageUrl = primaryImage ? transformMinioUrl(primaryImage) : getDefaultImageUrl();
  
  // Use year or modelYear
  const displayYear = listing.year || listing.modelYear;

  return (
    <div className="relative bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
      {/* Favorite Button */}
      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
        <FavoriteButton
          listingId={listing.id.toString()}
          variant="filled"
          size="sm"
          className="shadow-md hover:shadow-lg"
          initialFavorite={initialFavorite}
          onToggle={onFavoriteToggle}
        />
      </div>

      <Link href={`/listings/${listing.id}`} className="block group">
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            onError={(e) => {
              e.currentTarget.src = getDefaultImageUrl();
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {listing.title}
          </h3>
          
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
            {formatNumber(listing.price, i18n.language)}
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
            {displayYear && <div>{displayYear}</div>}
            <div>{listing.mileage?.toLocaleString()} {t('listing.km', 'km')}</div>
            {listing.transmission && <div>{listing.transmission}</div>}
            {listing.fuelType && <div>{listing.fuelType}</div>}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(listing.createdAt, i18n.language)}
            {(listing.sellerUsername || listing.governorateNameEn || listing.governorateNameAr) && (
              <div className="mt-1">
                {listing.sellerUsername && `${t('listing.from', 'From')} ${listing.sellerUsername}`}
                {(listing.governorateNameEn || listing.governorateNameAr) && (
                  <span>
                    {listing.sellerUsername ? ' in ' : `${t('listing.from', 'From')} `}
                    {i18n.language === 'ar' ? listing.governorateNameAr : listing.governorateNameEn}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CarListingCard;
