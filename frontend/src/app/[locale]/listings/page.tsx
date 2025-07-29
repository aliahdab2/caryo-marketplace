"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useOptimizedFiltering } from '@/hooks/useOptimizedFiltering';
import SmoothTransition from '@/components/ui/SmoothTransition';
import { Listing, ListingFilters } from '@/types/listings';
import { getListings } from '@/services/listings';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';

// Corrected Filters interface
interface Filters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minYear?: number;
  maxYear?: number;
  location?: string;
  brand?: string;
  model?: string;
  sellerTypeId?: number;
}

// Move namespaces outside component to prevent recreating on every render
const TRANSLATION_NAMESPACES = ['listings', 'errors'];

const ListingsPage = () => {
  const { t } = useLazyTranslation(TRANSLATION_NAMESPACES);
  const searchParams = useSearchParams();
  
  // Build filters from URL params
  const initialFilters: Filters = {
    page: parseInt(searchParams?.get('page') || '1', 10),
    limit: parseInt(searchParams?.get('limit') || '12', 10),
    search: searchParams?.get('search') || undefined,
    category: searchParams?.get('category') || undefined,
    minPrice: searchParams?.get('minPrice') ? parseFloat(searchParams?.get('minPrice') || '') : undefined,
    maxPrice: searchParams?.get('maxPrice') ? parseFloat(searchParams?.get('maxPrice') || '') : undefined,
    condition: searchParams?.get('condition') || undefined,
    sortBy: searchParams?.get('sortBy') || 'createdAt',
    sortOrder: (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'desc',
    minYear: searchParams?.get('minYear') ? parseInt(searchParams?.get('minYear') || '', 10) : undefined,
    maxYear: searchParams?.get('maxYear') ? parseInt(searchParams?.get('maxYear') || '', 10) : undefined,
    location: searchParams?.get('location') || undefined,
    brand: searchParams?.get('brand') || undefined,
    model: searchParams?.get('model') || undefined,
    sellerTypeId: searchParams?.get('sellerTypeId') ? parseInt(searchParams?.get('sellerTypeId') || '', 10) : undefined,
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState<number>(initialFilters.page || 1);
  
  // Update filters when URL changes
  useEffect(() => {
    const updatedFilters: Filters = {
      page: parseInt(searchParams?.get('page') || '1', 10),
      limit: parseInt(searchParams?.get('limit') || '12', 10),
      search: searchParams?.get('search') || undefined,
      category: searchParams?.get('category') || undefined,
      minPrice: searchParams?.get('minPrice') ? parseFloat(searchParams?.get('minPrice') || '') : undefined,
      maxPrice: searchParams?.get('maxPrice') ? parseFloat(searchParams?.get('maxPrice') || '') : undefined,
      condition: searchParams?.get('condition') || undefined,
      sortBy: searchParams?.get('sortBy') || 'createdAt',
      sortOrder: (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'desc',
      minYear: searchParams?.get('minYear') ? parseInt(searchParams?.get('minYear') || '', 10) : undefined,
      maxYear: searchParams?.get('maxYear') ? parseInt(searchParams?.get('maxYear') || '', 10) : undefined,
      location: searchParams?.get('location') || undefined,
      brand: searchParams?.get('brand') || undefined,
      model: searchParams?.get('model') || undefined,
      sellerTypeId: searchParams?.get('sellerTypeId') ? parseInt(searchParams?.get('sellerTypeId') || '', 10) : undefined,
    };
    
    setFilters(updatedFilters);
    setCurrentPage(updatedFilters.page);
  }, [searchParams]);

  // Convert filters to API format
  const apiFilters: ListingFilters = {
    page: currentPage,
    limit: filters.limit,
    searchTerm: filters.search,
    minPrice: filters.minPrice?.toString(),
    maxPrice: filters.maxPrice?.toString(),
    minYear: filters.minYear?.toString(),
    maxYear: filters.maxYear?.toString(),
    location: filters.location,
    brand: filters.brand,
    model: filters.model,
    sellerTypeId: filters.sellerTypeId
  };

  // Use optimized filtering hook
  const { data: listingsData, isLoading, error } = useOptimizedFiltering(
    apiFilters,
    getListings,
    {
      immediate: true
    }
  );

  // Extract listings from the response
  const listings = listingsData?.listings || [];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div className="text-center py-12">
      <div className="text-red-500 text-lg mb-4">
        {t('errors.failedToLoadData', 'Failed to load listings')}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {t('common.retry', 'Retry')}
      </button>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-gray-500 text-lg mb-4">
        {t('listings.noListingsFound', 'No listings found')}
      </div>
      <p className="text-gray-400">
        {t('listings.tryAdjustingFilters', 'Try adjusting your search filters')}
      </p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('listings.title', 'Car Listings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('listings.subtitle', 'Browse our collection of cars')}
        </p>
      </div>

      <SmoothTransition
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
      >
        {error ? (
          <ErrorComponent />
        ) : !listings || listings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing: Listing) => (
              <CarListingCard
                key={listing.id}
                listing={listing as CarListingCardData}
              />
            ))}
          </div>
        )}
      </SmoothTransition>
    </div>
  );
};

export default ListingsPage; 