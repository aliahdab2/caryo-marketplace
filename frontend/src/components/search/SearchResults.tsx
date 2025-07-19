"use client";

import React, { useRef, useEffect, useState } from 'react';
import { MdFavoriteBorder, MdViewModule, MdViewList, MdSort } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useAnnouncements } from '@/hooks/useAccessibility';
import SmoothTransition from '@/components/ui/SmoothTransition';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { CarListing, PageResponse } from '@/services/api';
import { EnhancedLoadingState, EnhancedErrorState, ProgressBar } from '@/components/ui/EnhancedUX';

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
  // 🚀 UX Enhancement: New props for enhanced UX
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  searchQuery?: string;
}

// Enhanced Loading skeleton component for better UX - Memoized for performance
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
  className = "",
  viewMode = 'grid',
  onViewModeChange,
  sortBy = 'relevance',
  onSortChange,
  searchQuery
}) => {
  const { t } = useLazyTranslation(SEARCH_NAMESPACES);
  const { announce } = useAnnouncements();
  
  // 🚀 UX Enhancement: State for enhanced features
  const [retryCount, setRetryCount] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 🚀 UX Enhancement: Announce results updates
  useEffect(() => {
    if (!isLoading && carListings?.content?.length) {
      const resultCount = carListings.content.length;
      const totalCount = carListings.totalElements;
      const message = searchQuery
        ? t('search.resultsAnnouncement', `Found ${totalCount} cars for "${searchQuery}", showing ${resultCount}`)
        : t('search.resultsAnnouncementNoQuery', `Found ${totalCount} cars, showing ${resultCount}`);
      announce(message);
    } else if (!isLoading && carListings?.content?.length === 0 && searchQuery) {
      announce(t('search.noResultsAnnouncement', `No cars found for "${searchQuery}"`));
    }
  }, [carListings?.content?.length, carListings?.totalElements, isLoading, searchQuery, announce, t]);

  // 🚀 UX Enhancement: Enhanced retry functionality
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
      announce(t('search.retrySuccess', 'Retry successful, results reloaded'));
    } catch (_err) {
      announce(t('search.retryFailed', 'Retry failed, please try again'));
    }
  };

  // 🚀 UX Enhancement: Progress calculation for pagination
  const progressPercentage = carListings && carListings.totalElements > 0 
    ? Math.round(((carListings.page + 1) * carListings.size / carListings.totalElements) * 100)
    : 0;

  return (
    <div ref={resultsRef} className={className}>
      {/* Enhanced Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {searchQuery 
                ? t('search.resultsTitle', `Search Results for "${searchQuery}"`)
                : t('search.allCarsTitle', 'All Cars')
              }
            </h2>
            
            {/* Save Search Button */}
            <button 
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label={t('search.saveSearch', 'Save search')}
            >
              <MdFavoriteBorder className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{t('search.saveSearch', 'Save search')}</span>
            </button>
          </div>
          
          {/* Progress Bar for pagination */}
          {carListings && carListings.totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t('search.page', `Page ${carListings.page + 1} of ${carListings.totalPages}`)}</span>
              <ProgressBar 
                progress={progressPercentage} 
                className="flex-1 max-w-32"
              />
              <span>{progressPercentage}%</span>
            </div>
          )}
          
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {carListings?.totalElements 
              ? `${carListings.totalElements.toLocaleString()} ${t('search.results', 'results')}` 
              : isLoading 
                ? t('search.loading', 'Loading...')
                : ''
            }
          </p>
        </div>

        {/* View Mode and Sort Controls */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={t('search.gridView', 'Grid view')}
                aria-pressed={viewMode === 'grid'}
              >
                <MdViewModule className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={t('search.listView', 'List view')}
                aria-pressed={viewMode === 'list'}
              >
                <MdViewList className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sort Dropdown */}
          {onSortChange && (
            <div className="flex items-center gap-2">
              <MdSort className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label={t('search.sortBy', 'Sort by')}
              >
                <option value="relevance">{t('search.sortRelevance', 'Most Relevant')}</option>
                <option value="price_low">{t('search.sortPriceLow', 'Price: Low to High')}</option>
                <option value="price_high">{t('search.sortPriceHigh', 'Price: High to Low')}</option>
                <option value="year_new">{t('search.sortYearNew', 'Year: Newest First')}</option>
                <option value="year_old">{t('search.sortYearOld', 'Year: Oldest First')}</option>
                <option value="mileage_low">{t('search.sortMileageLow', 'Mileage: Low to High')}</option>
                <option value="date_new">{t('search.sortDateNew', 'Recently Added')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Car Listings Grid with Enhanced Smooth Transitions */}
      <SmoothTransition
        isLoading={isLoading}
        className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'flex flex-col gap-4'
          }
        `}
        loadingType={isManualSearch ? 'overlay' : 'full'}
        minimumLoadingTime={isManualSearch ? 100 : 200}
        loadingComponent={
          isManualSearch ? (
            // Enhanced spinner for manual searches
            <div className="col-span-full flex items-center justify-center py-8">
              <EnhancedLoadingState 
                type="dots"
                message={t('search.searching', 'Searching...')}
                size="sm"
              />
            </div>
          ) : (
            // Enhanced skeleton loading for automatic changes
            <>
              {Array.from({ length: 8 }).map((_, index) => (
                <LoadingSkeleton key={index} />
              ))}
            </>
          )
        }
      >
        {error ? (
          <div className="col-span-full">
            <EnhancedErrorState
              type="network"
              title={t('search.errorLoadingResults', 'Error loading results')}
              message={typeof error === 'string' ? error : t('search.genericError', 'An error occurred')}
              onRetry={retryCount < 3 ? handleRetry : undefined}
            />
          </div>
        ) : carListings && carListings.content.length > 0 ? (
          carListings.content.map((listing, _index) => {
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
              <div 
                key={listing.id} 
                className={`
                  animate-fadeIn transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                  ${viewMode === 'list' ? 'max-w-none' : ''}
                `}
              >
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
          // Enhanced No results state
          <div className="col-span-full">
            <EnhancedErrorState
              type="not-found"
              title={t('search.noResultsFound', 'No cars found')}
              message={searchQuery 
                ? t('search.noResultsMessage', `No cars match your search for "${searchQuery}". Try adjusting your filters or search terms.`)
                : t('search.tryDifferentFilters', 'Try adjusting your search filters to see more results.')
              }
            />
          </div>
        )}
      </SmoothTransition>

      {/* Enhanced Pagination */}
      {carListings && carListings.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              disabled={carListings.page === 0}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('search.previousPage', 'Previous page')}
            >
              {t('search.previous', 'Previous')}
            </button>
            <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md">
              {t('search.pageInfo', `Page ${carListings.page + 1} of ${carListings.totalPages}`)}
            </span>
            <button
              disabled={carListings.last}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('search.nextPage', 'Next page')}
            >
              {t('search.next', 'Next')}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Results summary */}
      {carListings && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('search.showingResults', `Showing ${carListings.content.length} of ${carListings.totalElements} cars`)}
          </p>
          {carListings.totalElements > carListings.content.length && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {t('search.useFilters', 'Use filters to narrow down your search')}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

SearchResults.displayName = 'SearchResults';

export default SearchResults;
