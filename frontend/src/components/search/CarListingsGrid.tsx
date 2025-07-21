"use client";

import React from 'react';
import { MdDirectionsCar } from 'react-icons/md';
import SmoothTransition from '@/components/ui/SmoothTransition';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import CarListingSkeleton from '@/components/ui/CarListingSkeleton';
import { PageResponse, CarListing } from '@/services/api';

interface CarListingsGridProps {
  carListings: PageResponse<CarListing> | null;
  isLoadingListings: boolean;
  isManualSearch: boolean;
  listingsError: string | null;
  executeSearch: (isManualSearch: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

const CarListingsGrid: React.FC<CarListingsGridProps> = ({
  carListings,
  isLoadingListings,
  isManualSearch,
  listingsError,
  executeSearch,
  t
}) => {
  return (
    <SmoothTransition
      isLoading={isLoadingListings}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
            transmission: listing.transmission,
            fuelType: listing.fuelType,
            createdAt: listing.createdAt,
            sellerUsername: listing.sellerUsername,
            governorateNameEn: listing.governorateNameEn,
            governorateNameAr: listing.governorateNameAr,
            media: listing.media?.map(m => ({
              url: m.url,
              isPrimary: m.isPrimary,
              contentType: m.contentType
            }))
          };

          return (
            <div key={listing.id} className="animate-fadeIn">
              <CarListingCard
                listing={cardData}
                onFavoriteToggle={(_isFavorite) => {
                  // Handle favorite toggle if needed
                }}
                initialFavorite={false}
              />
            </div>
          );
        })
      ) : (
        // No results state
        <div className="col-span-full text-center py-12">
          <MdDirectionsCar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noResultsFound', 'No cars found')}</h3>
          <p className="text-gray-600">{t('tryDifferentFilters', 'Try adjusting your search filters to see more results.')}</p>
        </div>
      )}
    </SmoothTransition>
  );
};

export default CarListingsGrid;
