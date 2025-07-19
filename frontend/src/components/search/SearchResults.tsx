"use client";

import React from 'react';
import { MdDirectionsCar, MdFavoriteBorder } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import SmoothTransition from '@/components/ui/SmoothTransition';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { CarListing, PageResponse } from '@/services/api';

// Move namespaces outside component to prevent recreation on every render
const SEARCH_NAMESPACES = ['common', 'search'];

interface SearchResultsProps {
  carListings: PageResponse<CarListing> | null;
  isLoading: boolean;
  isManualSearch: boolean;
  error: string | null;
  onRetry: () => void;
  onFavoriteToggle?: (listingId: string, isFavorite: boolean) => void;
  className?: string;
}

// Loading skeleton component for better UX
const LoadingSkeleton = React.memo(() => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-w-16 aspect-h-12 bg-gray-300 h-48"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
      <div className="h-5 bg-gray-300 rounded w-1/2"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

const SearchResults = React.memo<SearchResultsProps>(({
  carListings,
  isLoading,
  isManualSearch,
  error,
  onRetry,
  onFavoriteToggle,
  className = ""
}) => {
  const { t } = useLazyTranslation(SEARCH_NAMESPACES);

  return (
    <div className={className}>
      {/* Results Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {carListings?.totalElements 
              ? `${carListings.totalElements.toLocaleString()} ${t('search.results', 'results')}` 
              : t('search.loading', 'Loading...')
            }
          </p>
        </div>
        
        <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
          <MdFavoriteBorder className="mr-2 h-4 w-4" />
          {t('search.saveSearch', 'Save search')}
        </button>
      </div>

      {/* Car Listings Grid with Smooth Transitions */}
      <SmoothTransition
        isLoading={isLoading}
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
                <LoadingSkeleton key={index} />
              ))}
            </>
          )
        }
      >
        {error ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">
                {t('search.errorLoadingResults', 'Error loading results')}
              </div>
              <div className="text-gray-600 text-sm">
                {typeof error === 'string' ? error : 'An error occurred'}
              </div>
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('search.tryAgain', 'Try again')}
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
                  onFavoriteToggle={(isFavorite) => {
                    onFavoriteToggle?.(listing.id.toString(), isFavorite);
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search.noResultsFound', 'No cars found')}</h3>
            <p className="text-gray-600">{t('search.tryDifferentFilters', 'Try adjusting your search filters to see more results.')}</p>
          </div>
        )}
      </SmoothTransition>

      {/* Pagination */}
      {carListings && carListings.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              disabled={carListings.page === 0}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {carListings.page + 1} of {carListings.totalPages}
            </span>
            <button
              disabled={carListings.last}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results summary */}
      {carListings && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {carListings.content.length} of {carListings.totalElements} cars
        </div>
      )}
    </div>
  );
});

SearchResults.displayName = 'SearchResults';

export default SearchResults;
