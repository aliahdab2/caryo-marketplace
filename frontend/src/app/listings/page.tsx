"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { Listing } from '@/types/listings';
import { getListings, ListingFilters } from '@/services/listings';
import { formatDate, formatNumber } from '@/utils/localization';
import FavoriteButton from '@/components/common/FavoriteButton';

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
}

const ListingsPage = () => {
  const { t, i18n } = useLazyTranslation(['listings', 'errors']);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilters: Filters = {
    page: parseInt(searchParams?.get('page') || '1', 10),
    limit: parseInt(searchParams?.get('limit') || '12', 10),
    search: searchParams?.get('search') || undefined,
    category: searchParams?.get('category') || undefined,
    minPrice: searchParams?.get('minPrice') ? parseFloat(searchParams?.get('minPrice') || '') : undefined,
    maxPrice: searchParams?.get('maxPrice') ? parseFloat(searchParams?.get('maxPrice') || '') : undefined,
    condition: searchParams?.get('condition') || undefined,
    sortBy: searchParams?.get('sortBy') || 'createdAt', // Default sortBy
    sortOrder: (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'desc', // Default sortOrder
    minYear: searchParams?.get('minYear') ? parseInt(searchParams?.get('minYear') || '', 10) : undefined,
    maxYear: searchParams?.get('maxYear') ? parseInt(searchParams?.get('maxYear') || '', 10) : undefined,
    location: searchParams?.get('location') || undefined,
    brand: searchParams?.get('brand') || undefined, // Directly include brand
    model: searchParams?.get('model') || undefined, // Directly include model
  };

  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState<number>(initialFilters.page || 1);
  // Initialize with loading=false to prevent immediate loading state on mount
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track whether this is the first load to handle transitions differently
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Add a new effect to update filters from URL when searchParams change
  useEffect(() => {
    // Update filters when URL changes
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
    };
    
    setFilters(updatedFilters);
    setCurrentPage(updatedFilters.page);
  }, [searchParams]);

  useEffect(() => {
    // Set loading state but delay it slightly to prevent quick flashes
    // Only delay if not the first load (coming from another page)
    let loadingTimeout: NodeJS.Timeout;
    
    if (!isFirstLoad) {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 100); // Small delay to prevent flash if data loads quickly
    } else {
      // On first load, set loading immediately
      setIsLoading(true);
    }
    
    setError(null);

    const apiFilters: ListingFilters = {
      page: currentPage,
      limit: filters.limit,
      searchTerm: filters.search,
      minPrice: filters.minPrice?.toString(),
      maxPrice: filters.maxPrice?.toString(),
      minYear: filters.minYear?.toString(),
      maxYear: filters.maxYear?.toString(),
      location: filters.location,
      brand: filters.brand, // Ensure brand is passed to the API
      model: filters.model  // Ensure model is passed to the API
    };

    getListings(apiFilters)
      .then(data => {
        // API should return correctly filtered data. No need for client-side re-filtering.
        setListings(data.listings);
        setIsLoading(false);
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
        if (loadingTimeout) clearTimeout(loadingTimeout);
      })
      .catch(err => {
        console.error("Error fetching listings:", err);
        setError(t('loadingListings'));
        setIsLoading(false);
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
        if (loadingTimeout) clearTimeout(loadingTimeout);
      });
      
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [filters, currentPage, t, isFirstLoad]);

  // Track the previous URL to avoid unnecessary updates
  const prevUrlRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    // Skip URL updates on first render
    if (isFirstLoad) {
      return;
    }
    
    const queryParams = new URLSearchParams();
    
    // Use currentPage for the 'page' query parameter
    queryParams.set('page', String(currentPage));
    if (filters.limit) queryParams.set('limit', String(filters.limit));
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.minPrice) queryParams.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) queryParams.set('maxPrice', String(filters.maxPrice));
    if (filters.condition) queryParams.set('condition', filters.condition);
    if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
    if (filters.minYear) queryParams.set('minYear', String(filters.minYear));
    if (filters.maxYear) queryParams.set('maxYear', String(filters.maxYear));
    if (filters.location) queryParams.set('location', filters.location);
    if (filters.brand) queryParams.set('brand', filters.brand);
    if (filters.model) queryParams.set('model', filters.model);

    const newUrl = `/listings?${queryParams.toString()}`;
    
    // Only update URL if it has changed, preventing infinite loops
    if (newUrl !== prevUrlRef.current) {
      prevUrlRef.current = newUrl;
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, currentPage, router, isFirstLoad]);

  // Show loading state

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 xs:gap-5 md:gap-6">
        {Array(filters.limit || 8).fill(null).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="w-full aspect-video bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                <div className="p-3 sm:p-4 flex-grow">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-1/2"></div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-500">
        <div className="text-center">
          <svg 
            className="w-12 h-12 mx-auto mb-4 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (listings.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <svg 
            className="w-12 h-12 mx-auto mb-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
          <p className="text-lg">{t('noListingsFound')}</p>
        </div>
      </div>
    );
  }

  // Show listings grid
  return (
    <div className="min-h-[60vh]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="relative bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton
                listingId={listing.id.toString()}
                variant="filled"
                size="sm"
                className="shadow-md hover:shadow-lg"
                initialFavorite={false}
                onToggle={() => {
                  // Handle favorite toggle if needed
                }}
              />
            </div>
            <Link href={`/listings/${listing.id}`} className="block group">
              <div className="relative h-48 w-full overflow-hidden">
                {listing.media && listing.media.length > 0 ? (
                  <Image
                    src={listing.media.find(m => m.isPrimary)?.url || listing.media[0].url}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <Image
                    src="/images/vehicles/car-default.svg"
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                  {formatNumber(listing.price, i18n.language)}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div>{listing.year}</div>
                  <div>{listing.mileage} km</div>
                  <div>{listing.transmission}</div>
                  <div>{listing.fuelType}</div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(listing.createdAt, i18n.language)}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListingsPage;
