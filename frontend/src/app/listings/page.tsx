"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Define TypeScript interface for listings
interface Listing {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  location: string;
  image: string;
  fuelType: string;
  transmission: string;
}

// This is a placeholder component that will be updated with real data
// when the backend integration is complete
export default function ListingsPage() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    location: ''
  });
  
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const locations = ['All Locations', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'];
  const years = Array.from({ length: 2023 - 2000 + 1 }, (_, i) => 2023 - i);

  // Simulating data fetch - this will be replaced with actual API call
  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      // Mock data for demonstration
      const mockListings = Array.from({ length: 24 }, (_, i) => ({
        id: `car-${i+1}`,
        title: `${i % 3 === 0 ? 'Toyota Camry' : i % 3 === 1 ? 'Honda Accord' : 'BMW 3 Series'} ${i+1}`,
        price: Math.floor(10000 + Math.random() * 190000),
        year: Math.floor(2000 + Math.random() * 23),
        mileage: Math.floor(10000 + Math.random() * 100000),
        location: i % 5 === 0 ? 'Dubai' : i % 5 === 1 ? 'Abu Dhabi' : i % 5 === 2 ? 'Sharjah' : i % 5 === 3 ? 'Ajman' : 'Ras Al Khaimah',
        image: `/images/vehicles/car${(i % 5) + 1}.jpg`,
        fuelType: i % 3 === 0 ? 'Petrol' : i % 3 === 1 ? 'Diesel' : 'Electric',
        transmission: i % 2 === 0 ? 'Automatic' : 'Manual',
      }));
      
      setListings(mockListings);
      setFilteredListings(mockListings);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [category]);

  // Apply filters and search
  useEffect(() => {
    if (listings.length === 0) return;
    
    let result = [...listings];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(listing => 
        listing.title.toLowerCase().includes(term) || 
        listing.location.toLowerCase().includes(term)
      );
    }
    
    // Apply price filters
    if (filters.minPrice) {
      result = result.filter(listing => listing.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(listing => listing.price <= parseInt(filters.maxPrice));
    }
    
    // Apply year filters
    if (filters.minYear) {
      result = result.filter(listing => listing.year >= parseInt(filters.minYear));
    }
    if (filters.maxYear) {
      result = result.filter(listing => listing.year <= parseInt(filters.maxYear));
    }
    
    // Apply location filter
    if (filters.location && filters.location !== 'All Locations') {
      result = result.filter(listing => listing.location === filters.location);
    }
    
    setFilteredListings(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filters, listings]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container mx-auto px-2 xs:px-3 sm:px-4 py-4 sm:py-8 max-w-full sm:max-w-7xl">
      <div className="mb-4 sm:mb-8 border-b border-gray-200 pb-3 sm:pb-5">
        <h1 className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {category 
            ? t('listings.categoryHeading', { category: category }) 
            : t('header.listings')}
        </h1>
        <p className="text-sm xs:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          {t('listings.pageDescription')}
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-4 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="mb-4 sm:mb-6">
            <label htmlFor="search" className="sr-only">{t('common.search')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="form-control w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('listings.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('listings.minPrice')}
              </label>
              <select
                id="minPrice"
                className="form-control w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              >
                <option value="">{t('common.any')}</option>
                {[10000, 25000, 50000, 75000, 100000].map((price) => (
                  <option key={price} value={price}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(price)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('listings.maxPrice')}
              </label>
              <select
                id="maxPrice"
                className="form-control w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              >
                <option value="">{t('common.any')}</option>
                {[50000, 75000, 100000, 150000, 200000].map((price) => (
                  <option key={price} value={price}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(price)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="minYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('listings.minYear')}
              </label>
              <select
                id="minYear"
                className="form-control w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.minYear}
                onChange={(e) => handleFilterChange('minYear', e.target.value)}
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
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.location')}
              </label>
              <select
                id="location"
                className="form-control w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  minPrice: '',
                  maxPrice: '',
                  minYear: '',
                  maxYear: '',
                  location: ''
                });
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Results info */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('listings.showing')} <span className="font-medium">{filteredListings.length}</span> {t('listings.results')}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('listings.page')} {currentPage} {t('common.of')} {totalPages || 1}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{t('listings.noResults')}</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{t('listings.tryDifferentFilters')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((listing) => (
              <div 
                key={listing.id} 
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="relative">
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700">
                    {/* Image placeholder - would be an actual image in production */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  {listing.id.includes('1') && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-2 py-1 m-2 rounded-md text-sm font-semibold">
                      NEW
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{listing.title}</h2>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(listing.price)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{listing.year}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{listing.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                      <span>{listing.transmission}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.href = `/listings/${listing.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors duration-300 flex items-center justify-center"
                  >
                    {t('home.viewDetails')}
                    <svg className="w-4 h-4 ml-2 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex shadow-sm -space-x-px rounded-md" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  } dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700`}
                >
                  <svg className="h-5 w-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // If totalPages <= 5, show all pages
                  // If totalPages > 5, show a window around the current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    // Calculate a window of 5 pages centered around current if possible
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    pageNum = start + i;
                    if (pageNum > totalPages) return null;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      } text-sm font-medium`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  } dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700`}
                >
                  <svg className="h-5 w-5 rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
