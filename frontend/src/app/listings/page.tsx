import Image from 'next/image';
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { Listing } from '@/types/listing';
import { getListings, ListingFilters } from '@/services/listings';
import { formatDate, formatNumber } from '@/utils/localization';
import ResponsiveCard from '@/components/responsive/ResponsiveCard';
import FavoriteButton from '@/components/common/FavoriteButton';
import { fluidValue, useBreakpoint, responsiveSpace } from '@/utils/responsive';

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
}

const ListingsPage = () => {
  const { t, i18n } = useTranslation(['common']);
  // const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryQuery = searchParams.get('category');
  // const breakpoint = useBreakpoint();

  const initialFilters: Filters = {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '12', 10),
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined, // Corrected here
    condition: searchParams.get('condition') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt', // Default sortBy
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc', // Default sortOrder
    minYear: searchParams.get('minYear') ? parseInt(searchParams.get('minYear')!, 10) : undefined,
    maxYear: searchParams.get('maxYear') ? parseInt(searchParams.get('maxYear')!, 10) : undefined,
    location: searchParams.get('location') || undefined,
  };

  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState<number>(initialFilters.page || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
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
      // These are not in ListingFilters type but mock service might use them if passed
      // For a real API, ensure ListingFilters includes them if supported
      ...(filters.category && { category: filters.category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
    };

    getListings(apiFilters)
      .then(data => {
        setListings(data.listings);
        setTotalListings(data.total);
        setTotalPages(Math.ceil(data.total / (filters.limit || 12)));
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching listings:", err);
        setError(t('error.loadingListings'));
        setIsLoading(false);
      });
  }, [filters, currentPage, t]);

  // Track the previous URL to avoid unnecessary updates
  const prevUrlRef = React.useRef<string | null>(null);
  
  useEffect(() => {
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

    const newUrl = `/listings?${queryParams.toString()}`;
    
    // Only update URL if it has changed, preventing infinite loops
    if (newUrl !== prevUrlRef.current) {
      prevUrlRef.current = newUrl;
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, currentPage, router]);

  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key !== 'page') {
        setCurrentPage(1); 
        // newFilters.page = 1; // No need to set newFilters.page, currentPage change triggers fetch
      }
      return newFilters;
    });
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const ListingsGrid = ({ listingsToDisplay }: { listingsToDisplay: Listing[] }) => {
    if (isLoading) {
      return <div className="text-center py-10">{t('listings.loadingListings')}</div>;
    }
    if (error) {
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    if (listingsToDisplay.length === 0) {
      return <div className="text-center py-10">{t('listings.noListingsFound')}</div>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listingsToDisplay.map((listing) => (
          <div key={listing.id} className="relative bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton
                listingId={listing.id.toString()}
                variant="filled"
                size="sm"
                className="shadow-md hover:shadow-lg"
                mockMode={true} 
                initialFavorite={false}
                onToggle={(isFavorite) => {
                  console.log(`Listing ${listing.id} favorite status: ${isFavorite}`);
                }}
              />
            </div>
            <Link href={`/listings/${listing.id}`} className="block group">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={listing.media && listing.media.length > 0 ? listing.media[0].url : '/images/vehicles/car-default.svg'}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-primary-500 transition-colors">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 capitalize">
                  {listing.category?.name || t('listings.noCategory')}
                </p>
                <h4 className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {formatNumber(listing.price, i18n.language, { style: 'currency', currency: listing.currency || 'SYP' })}
                </h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p className="truncate">
                    {listing.location?.city || t('listings.unknownLocation')}
                    {listing.location?.country ? `, ${listing.location.country}` : ''}
                  </p>
                  <p>{t('listings.postedOn')}: {listing.createdAt ? (
                    formatDate(listing.createdAt, i18n.language, { dateStyle: 'medium' }) || t('listings.addedRecently')
                  ) : t('listings.addedRecently')}</p>
                  {listing.updatedAt && listing.updatedAt !== listing.createdAt && (
                    <p>{t('listings.updatedOn')}: {formatDate(new Date(listing.updatedAt), i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    );
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const locations = ['All Locations', 'Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Tartus'];

  return (
    <div className="container mx-auto px-2 xs:px-3 sm:px-4 py-4 sm:py-8 max-w-full sm:max-w-7xl">
      <div 
        className="border-b border-gray-200 dark:border-gray-700" 
        style={{ 
          marginBottom: responsiveSpace(1, 2, 'rem'),
          paddingBottom: responsiveSpace(0.75, 1.25, 'rem')
        }}
      >
        <h1 
          className="font-bold text-gray-900 dark:text-white"
          style={{ 
            fontSize: fluidValue(1.5, 2.25, 375, 1280, 'rem'),
            lineHeight: fluidValue(1.75, 2.5, 375, 1280, 'rem')
          }}
        >
          {categoryQuery 
            ? t('listings.categoryHeading', { category: categoryQuery }) 
            : t('header.listings')}
        </h1>
        <p 
          className="text-gray-600 dark:text-gray-400" 
          style={{ 
            fontSize: fluidValue(0.875, 1, 375, 1280, 'rem'),
            marginTop: fluidValue(0.25, 0.5, 375, 1280, 'rem')
          }}
        >
          {t('listings.pageDescription')}
        </p>
      </div>
      
      <div style={{ marginBottom: responsiveSpace(1.5, 2, 'rem') }}>
        <div 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm" 
          style={{
            borderRadius: fluidValue(0.5, 0.75, 375, 1280, 'rem'),
            padding: responsiveSpace(0.75, 1.5, 'rem')
          }}
        >
          <div style={{ marginBottom: responsiveSpace(1, 1.5, 'rem') }}>
            <label htmlFor="search" className="sr-only">{t('common.search')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
                <svg 
                  style={{ 
                    width: fluidValue(16, 20, 375, 1280, 'px'),
                    height: fluidValue(16, 20, 375, 1280, 'px')
                  }} 
                  className="text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg" 
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="form-control w-full pl-10 rtl:pl-4 rtl:pr-10 border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                style={{
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.5, 0.75, 'rem')} ${responsiveSpace(0.75, 1, 'rem')}`,
                  fontSize: fluidValue(0.875, 1, 375, 1280, 'rem')
                }}
                placeholder={t('listings.searchPlaceholder')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                aria-label={t('listings.searchPlaceholder')}
              />
            </div>
          </div>
          
          <div 
            className="grid grid-cols-2 md:grid-cols-4" 
            style={{ 
              gap: responsiveSpace(0.5, 1, 'rem')
            }}
          >
            <div>
              <label 
                htmlFor="minPrice" 
                className="block font-medium text-gray-700 dark:text-gray-300 rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  marginBottom: fluidValue(0.25, 0.375, 375, 1280, 'rem')
                }}
              >
                {t('listings.minPrice')}
              </label>
              <select
                id="minPrice"
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                aria-label={t('listings.minPrice')}
              >
                <option value="">{t('common.any')}</option>
                {[5000000, 7500000, 10000000, 15000000, 20000000].map((price) => (
                  <option key={price} value={price}>
                    {formatNumber(price, i18n.language, { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label 
                htmlFor="maxPrice" 
                className="block font-medium text-gray-700 dark:text-gray-300 rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  marginBottom: fluidValue(0.25, 0.375, 375, 1280, 'rem')
                }}
              >
                {t('listings.maxPrice')}
              </label>
              <select
                id="maxPrice"
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                aria-label={t('listings.maxPrice')}
              >
                <option value="">{t('common.any')}</option>
                {[10000000, 15000000, 20000000, 25000000, 30000000].map((price) => (
                  <option key={price} value={price}>
                    {formatNumber(price, i18n.language, { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label 
                htmlFor="minYear" 
                className="block font-medium text-gray-700 dark:text-gray-300 rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  marginBottom: fluidValue(0.25, 0.375, 375, 1280, 'rem')
                }}
              >
                {t('listings.minYear')}
              </label>
              <select
                id="minYear"
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.minYear || ''}
                onChange={(e) => handleFilterChange('minYear', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                aria-label={t('listings.minYear')}
              >
                <option value="">{t('common.any')}</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label 
                htmlFor="location" 
                className="block font-medium text-gray-700 dark:text-gray-300 rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  marginBottom: fluidValue(0.25, 0.375, 375, 1280, 'rem')
                }}
              >
                {t('common.location')}
              </label>
              <select
                id="location"
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.location || 'All Locations'}
                onChange={(e) => handleFilterChange('location', e.target.value === 'All Locations' ? undefined : e.target.value)}
                aria-label={t('common.location')}
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location === 'All Locations' ? t('common.allLocations') : location} 
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: responsiveSpace(1, 1.5, 'rem') }} className="flex justify-end rtl:justify-start">
            <button
              onClick={() => {
                setFilters(initialFilters);
                setCurrentPage(initialFilters.page || 1);
              }}
              className="inline-flex items-center border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              style={{
                fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.75, 1, 'rem')}`,
                borderRadius: fluidValue(0.25, 0.375, 375, 1280, 'rem')
              }}
              aria-label={t('common.reset')}
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      </div>
      
      <div 
        className="flex flex-col xs:flex-row justify-between items-start xs:items-center"
        style={{ 
          marginBottom: responsiveSpace(1, 1.5, 'rem') 
        }}
      >
        <div 
          className="text-gray-600 dark:text-gray-400 mb-2 xs:mb-0"
          style={{
            fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem')
          }}
        >
          {t('listings.showingResults', { count: totalListings })}
        </div>
        <div 
          className="text-gray-600 dark:text-gray-400"
          style={{
            fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem')
          }}
        >
          {t('listings.page')} {currentPage} {t('common.of')} {totalPages || 1}
        </div>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 xs:gap-5 md:gap-6">
          {Array(filters.limit || 8).fill(null).map((_, index) => (
            <div key={index} className="animate-pulse">
              <ResponsiveCard aspectRatio="landscape" className="bg-gray-200 dark:bg-gray-700">
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
              </ResponsiveCard>
            </div>
          ))}
        </div>
      }>
        <ListingsGrid listingsToDisplay={listings} />
      </Suspense>

      {totalPages > 1 && (
        <div style={{ marginTop: responsiveSpace(1.5, 2, 'rem') }} className="flex justify-center">
          <nav 
            className="relative z-0 inline-flex shadow-sm -space-x-px rtl:space-x-0 rtl:space-x-reverse rounded-md" 
            style={{
              borderRadius: fluidValue(0.25, 0.375, 375, 1280, 'rem')
            }}
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md rtl:rounded-l-none rtl:rounded-r-md border border-gray-300 bg-white font-medium ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              } dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700`}
              style={{
                fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.375, 0.5, 'rem')}`
              }}
              aria-label={t('pagination.previous')}
            >
              <svg 
                style={{
                  width: fluidValue(16, 20, 375, 1280, 'px'),
                  height: fluidValue(16, 20, 375, 1280, 'px')
                }}
                className="rtl:rotate-180" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                pageNum = start + i;
                if (pageNum > totalPages) return null;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`relative hidden xs:inline-flex items-center border ${
                    currentPage === pageNum
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  } font-medium`}
                  style={{
                    fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                    padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 1, 'rem')}`
                  }}
                  aria-current={currentPage === pageNum ? "page" : undefined}
                  aria-label={`${t('pagination.page')} ${pageNum}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <span 
              className="inline-flex xs:hidden relative items-center border border-gray-300 bg-white font-medium dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" 
              style={{
                fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.75, 1, 'rem')}`
              }}
              aria-current="page"
            >
              {currentPage}/{totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-r-md rtl:rounded-r-none rtl:rounded-l-md border border-gray-300 bg-white font-medium ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              } dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700`}
              style={{
                fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.375, 0.5, 'rem')}`
              }}
              aria-label={t('pagination.next')}
            >
              <svg 
                style={{
                  width: fluidValue(16, 20, 375, 1280, 'px'),
                  height: fluidValue(16, 20, 375, 1280, 'px')
                }}
                className="rtl:rotate-180" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default ListingsPage;
