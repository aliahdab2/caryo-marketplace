"use client";

import React from 'react';
import { MdDirectionsCar } from 'react-icons/md';
import SmoothTransition from '@/components/ui/SmoothTransition';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import CarListingListItem from '@/components/search/CarListingListItem';
import CarListingSkeleton from '@/components/ui/CarListingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { PageResponse, CarListing } from '@/services/api';

export type ViewMode = 'grid' | 'list';

interface CarListingsGridProps {
  carListings: PageResponse<CarListing> | null;
  isLoadingListings: boolean;
  isManualSearch: boolean;
  listingsError: string | null;
  executeSearch: (isManualSearch: boolean) => void;
  viewMode: ViewMode;
  isRTL?: boolean;
  t: (key: string, fallback?: string) => string;
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

const CarListingsGrid: React.FC<CarListingsGridProps> = ({
  carListings,
  isLoadingListings,
  isManualSearch,
  listingsError,
  executeSearch,
  viewMode = 'grid',
  isRTL = false,
  t,
  user = null
}) => {
  const containerClassName = viewMode === 'grid' 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    : "flex flex-col gap-4";

  return (
    <SmoothTransition
      isLoading={isLoadingListings}
      className={containerClassName}
      loadingType={isManualSearch ? 'overlay' : 'full'}
      minimumLoadingTime={isManualSearch ? 100 : 200}
      loadingComponent={
        isManualSearch ? (
          // Subtle spinner for manual searches
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          // Full skeleton loading for automatic changes
          <>
            {Array.from({ length: 8 }).map((_, index) => (
              <CarListingSkeleton key={index} />
            ))}
          </>
        )
      }
    >
      {listingsError ? (
        <div className="col-span-full flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">
              {t('errorLoadingResults', 'Error loading results')}
            </div>
            <div className="text-gray-600 text-sm">
              {typeof listingsError === 'string' ? listingsError : 'An error occurred'}
            </div>
            <button
              onClick={() => executeSearch(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('tryAgain', 'Try again')}
            </button>
          </div>
        </div>
      ) : carListings && carListings.content.length > 0 ? (
        carListings.content.map((listing) => {
          // Transform backend CarListing to CarListingCardData format
          const cardData: CarListingCardData = {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            year: listing.modelYear,
            mileage: listing.mileage,
            transmission: typeof listing.transmission === 'object' ? listing.transmission?.displayNameEn : listing.transmission,
            fuelType: typeof listing.fuelType === 'object' ? listing.fuelType?.displayNameEn : listing.fuelType,
            transmissionNameEn: listing.transmissionNameEn,
            transmissionNameAr: listing.transmissionNameAr,
            fuelTypeNameEn: listing.fuelTypeNameEn,
            fuelTypeNameAr: listing.fuelTypeNameAr,
            createdAt: listing.createdAt,
            sellerUsername: listing.sellerUsername,
            governorateNameEn: listing.governorateNameEn,
            governorateNameAr: listing.governorateNameAr,
            governorateDetails: listing.governorateDetails,
            media: listing.media?.map(m => ({
              url: m.url,
              isPrimary: m.isPrimary,
              contentType: m.contentType,
              type: m.mediaType || (m.contentType?.toLowerCase().includes('video') ? 'video' : 'image')
            }))
          };

          return (
            <div key={listing.id} className="animate-fadeIn">
              {viewMode === 'grid' ? (
                <CarListingCard
                  listing={cardData}
                  onFavoriteToggle={(_isFavorite) => {
                    // Handle favorite toggle if needed
                  }}
                  initialFavorite={false}
                  user={user}
                />
              ) : (
                <CarListingListItem
                  listing={cardData}
                  onFavoriteToggle={(_isFavorite) => {
                    // Handle favorite toggle if needed
                  }}
                  initialFavorite={false}
                  t={t}
                  isRTL={isRTL}
                  user={user}
                />
              )}
            </div>
          );
        })
      ) : (
        // No results state
        <div className="col-span-full">
          <EmptyState
            type="search"
            title={t('noResultsFound', 'No cars found')}
            message={t('tryDifferentFilters', 'Try adjusting your search filters to see more results.')}
            actionButton={{
              text: t('clearAllFilters', 'Clear all filters'),
              onClick: () => {
                // Reload page to clear filters
                window.location.href = '/search';
              },
              icon: <MdDirectionsCar className="w-4 h-4" />
            }}
          />
        </div>
      )}
    </SmoothTransition>
  );
};

export default CarListingsGrid;
