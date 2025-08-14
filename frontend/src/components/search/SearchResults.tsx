"use client";

import React, { useRef, useEffect } from 'react';
import { MdViewModule, MdViewList } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useLanguageDirection } from '@/utils/rtl';
import { useAnnouncements } from '@/hooks/useAccessibility';
import SmoothTransition from '@/components/ui/SmoothTransition';
import CarListingCard from '@/components/listings/CarListingCard';
import { CarListing, PageResponse } from '@/services/api';
import { EnhancedLoadingState, EnhancedErrorState } from '@/components/ui/EnhancedUX';
import EmptyState from '@/components/ui/EmptyState';
import SortDropdown from './SortDropdown';

interface SearchResultsProps {
  carListings: PageResponse<CarListing> | null;
  isLoading: boolean;
  isManualSearch: boolean;
  error: string | null;
  onRetry: () => void;
  onFavoriteToggle?: (listingId: string, isFavorite: boolean) => void;
  className?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  searchQuery?: string;
}

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
  sortBy = 'date_new',
  onSortChange,
  searchQuery
}) => {
  const { t } = useLazyTranslation('search');
  const { isRTL } = useLanguageDirection();
  const { announce } = useAnnouncements();
  const retryCount = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);



  // Announce results updates
  useEffect(() => {
    if (!isLoading && carListings?.content?.length) {
      const resultCount = carListings.content.length;
      const totalCount = carListings.totalElements;
      const message = searchQuery
        ? t('resultsAnnouncement', `Found ${totalCount} cars for "${searchQuery}", showing ${resultCount}`)
        : t('resultsAnnouncementNoQuery', `Found ${totalCount} cars, showing ${resultCount}`);
      announce(message);
    } else if (!isLoading && carListings?.content?.length === 0 && searchQuery) {
      announce(t('noResultsAnnouncement', `No cars found for "${searchQuery}"`));
    }
  }, [carListings, isLoading, searchQuery, t, announce]);

  // Announce view mode changes
  useEffect(() => {
    if (viewMode) {
      const viewModeText = viewMode === 'grid' 
        ? t('gridViewSelected', 'Grid view selected') 
        : t('listViewSelected', 'List view selected');
      announce(viewModeText);
    }
  }, [viewMode, announce, t]);

  // Enhanced retry functionality
  const handleRetry = async () => {
    retryCount.current = retryCount.current + 1;
    try {
      await onRetry();
      announce(t('retrySuccess', 'Retry successful, results reloaded'));
    } catch (_err) {
      announce(t('retryFailed', 'Retry failed, please try again'));
    }
  };

  // Helper function to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    // Try the key as is first
    let translated = t(key, '');
    if (translated && translated !== key) {
      return translated;
    }
    
    // Try with search namespace prefix
    const searchKey = `search:${key}`;
    translated = t(searchKey, '');
    if (translated && translated !== searchKey) {
      return translated;
    }
    
    // Try with common namespace prefix
    const commonKey = `common:${key}`;
    translated = t(commonKey, '');
    if (translated && translated !== commonKey) {
      return translated;
    }
    
    // Return fallback if no translation found
    return fallback;
  };

  return (
    <div ref={resultsRef} role="complementary" className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'}`}>
          {onSortChange && (
            <SortDropdown
              selectedSort={sortBy}
              onSortChange={onSortChange}
              onSearchTrigger={() => {}}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onViewModeChange && (
          <div 
            className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
            role="group"
            aria-labelledby="view-mode-label"
          >
            <span id="view-mode-label" className="sr-only">
              {getTranslation('viewModeControls', 'View mode controls')}
            </span>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-label={getTranslation('gridView', 'Grid view')}
              aria-pressed={viewMode === 'grid'}
            >
              <MdViewModule className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-label={getTranslation('listView', 'List view')}
              aria-pressed={viewMode === 'list'}
            >
              <MdViewList className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

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
          <div className="col-span-full flex items-center justify-center py-8">
            <EnhancedLoadingState 
              type="dots"
              message={t('searching', 'Searching...')}
              size="sm"
            />
          </div>
        }
      >
        {error ? (
          <div className="col-span-full">
            <EnhancedErrorState
              type="network"
              title={t('errorLoadingResults', 'Error loading results')}
              message={error}
              onRetry={retryCount.current < 3 ? handleRetry : undefined}
            />
          </div>
        ) : carListings?.content?.length ? (
          carListings.content.map((listing) => (
            <div 
              key={listing.id} 
              className={`
                animate-fadeIn transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                ${viewMode === 'list' ? 'max-w-none' : ''}
              `}
            >
              <CarListingCard
                listing={{
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
                }}
                onFavoriteToggle={(isFavorite) => {
                  onFavoriteToggle?.(listing.id.toString(), isFavorite);
                }}
                initialFavorite={false}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              type="search"
              title={t('noResultsFound', 'No cars found')}
              message={searchQuery 
                ? t('noResultsMessage', `No cars match your search for "${searchQuery}". Try adjusting your filters or search terms.`)
                : t('tryDifferentFilters', 'Try adjusting your search filters to see more results.')
              }
              actionButton={{
                text: t('clearAllFilters', 'Clear all filters'),
                onClick: () => {
                  // This could be handled by parent component
                  window.location.href = '/search';
                },
                icon: <MdViewModule className="w-4 h-4" />
              }}
            />
          </div>
        )}
      </SmoothTransition>
    </div>
  );
});

SearchResults.displayName = 'SearchResults';

export default SearchResults;