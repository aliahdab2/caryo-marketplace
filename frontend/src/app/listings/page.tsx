"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ResponsiveCard from '@/components/responsive/ResponsiveCard';
import { fluidValue, useBreakpoint, responsiveSpace } from '@/utils/responsive';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

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
  listingDate: Date;
}

// This is a placeholder component that will be updated with real data
// when the backend integration is complete
export default function ListingsPage() {
  const { t, i18n } = useTranslation('common');
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const breakpoint = useBreakpoint();
  
  // Create a memoized number formatter based on the current language
  const priceFormatter = useMemo(() => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SY' : 'en-US', { 
      style: 'currency', 
      currency: 'SYP' 
    });
  }, [i18n.language]);
  
  // Create a memoized date formatter based on the current language
  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SY' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [i18n.language]);
  
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
  const locations = ['All Locations', 'Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'];
  const years = Array.from({ length: 2023 - 2000 + 1 }, (_, i) => 2023 - i);

  // Simulating data fetch - this will be replaced with actual API call
  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      // Mock data for demonstration
      const mockListings = Array.from({ length: 24 }, (_, i) => ({
        id: `car-${i+1}`,
        title: `${i % 3 === 0 ? 'Toyota Camry' : i % 3 === 1 ? 'Honda Accord' : 'BMW 3 Series'} ${i+1}`,
        price: Math.floor(5000000 + Math.random() * 20000000), // Syrian Pound values (millions)
        year: Math.floor(2000 + Math.random() * 23),
        listingDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
        mileage: Math.floor(10000 + Math.random() * 100000),
        location: i % 5 === 0 ? 'Damascus' : i % 5 === 1 ? 'Aleppo' : i % 5 === 2 ? 'Homs' : i % 5 === 3 ? 'Latakia' : 'Hama',
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
          {category 
            ? t('listings.categoryHeading', { category: category }) 
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
      
      {/* Search and Filters */}
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
                className="form-control w-full pl-10 rtl:pl-4 rtl:pr-10 border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                style={{
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.5, 0.75, 'rem')} ${responsiveSpace(0.75, 1, 'rem')}`,
                  fontSize: fluidValue(0.875, 1, 375, 1280, 'rem')
                }}
                placeholder={t('listings.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                aria-label={t('listings.minPrice')}
              >
                <option value="">{t('common.any')}</option>
                {[5000000, 7500000, 10000000, 12500000, 15000000].map((price) => (
                  <option key={price} value={price}>
                    {priceFormatter.format(price)}
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
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                aria-label={t('listings.maxPrice')}
              >
                <option value="">{t('common.any')}</option>
                {[7500000, 10000000, 15000000, 20000000, 25000000].map((price) => (
                  <option key={price} value={price}>
                    {priceFormatter.format(price)}
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
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.minYear}
                onChange={(e) => handleFilterChange('minYear', e.target.value)}
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
                className="form-control w-full border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rtl:text-right"
                style={{
                  fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                  padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                  borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem')
                }}
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                aria-label={t('common.location')}
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: responsiveSpace(1, 1.5, 'rem') }} className="flex justify-end rtl:justify-start">
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
              className="inline-flex items-center border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
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
      
      {/* Results info */}
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
          {t('listings.showing')} <span className="font-medium">{filteredListings.length}</span> {t('listings.results')}
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

      {loading ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 xs:gap-5 md:gap-6">
          {Array(8).fill(null).map((_, index) => (
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
      ) : filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900 dark:text-white">{t('listings.noResults')}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('listings.tryDifferentFilters')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 xs:gap-5 md:gap-6">
            {filteredListings
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((listing) => (
              <div key={listing.id}>
                <ResponsiveCard 
                  aspectRatio="landscape" 
                  hover 
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                      {/* Image placeholder - would be an actual image in production */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                    </div>
                    {listing.id.includes('1') && (
                      <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 bg-blue-600 text-white px-2 py-1 m-2 rounded-md text-xs font-semibold" style={{
                        fontSize: fluidValue(10, 14, 375, 1280, 'px')
                      }}>
                        {t('listings.new', 'NEW')}
                      </div>
                    )}
                  </div>
                <div className="p-3 sm:p-5">
                  <h2 style={{ fontSize: fluidValue(1, 1.125, 375, 1280, 'rem') }} className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-2">{listing.title}</h2>
                  <p style={{ fontSize: fluidValue(1.125, 1.25, 375, 1280, 'rem') }} className="font-bold text-blue-600 dark:text-blue-400 mb-2 sm:mb-3">
                    {priceFormatter.format(listing.price)}
                  </p>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-3 sm:mb-4 text-gray-600 dark:text-gray-300" style={{ 
                    fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                    gap: responsiveSpace(0.25, 0.5, 'rem'),
                    marginBottom: responsiveSpace(0.75, 1, 'rem')
                  }}>
                    <div className="flex items-center">
                      <svg style={{ 
                        width: fluidValue(14, 16, 375, 1280, 'px'),
                        height: fluidValue(14, 16, 375, 1280, 'px'),
                        marginRight: fluidValue(4, 6, 375, 1280, 'px')
                      }} className="text-gray-500 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{listing.year} {t('common.model')}</span>
                    </div>
                    <div className="flex items-center">
                      <svg style={{ 
                        width: fluidValue(14, 16, 375, 1280, 'px'),
                        height: fluidValue(14, 16, 375, 1280, 'px'),
                        marginRight: fluidValue(4, 6, 375, 1280, 'px')
                      }} className="text-gray-500 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{listing.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center">
                      <svg style={{ 
                        width: fluidValue(14, 16, 375, 1280, 'px'),
                        height: fluidValue(14, 16, 375, 1280, 'px'),
                        marginRight: fluidValue(4, 6, 375, 1280, 'px')
                      }} className="text-gray-500 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center">
                      <svg style={{ 
                        width: fluidValue(14, 16, 375, 1280, 'px'),
                        height: fluidValue(14, 16, 375, 1280, 'px'),
                        marginRight: fluidValue(4, 6, 375, 1280, 'px')
                      }} className="text-gray-500 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                      <span>{listing.transmission}</span>
                    </div>
                    <div className="flex items-center">
                      <svg style={{ 
                        width: fluidValue(14, 16, 375, 1280, 'px'),
                        height: fluidValue(14, 16, 375, 1280, 'px'),
                        marginRight: fluidValue(4, 6, 375, 1280, 'px')
                      }} className="text-gray-500 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{dateFormatter.format(listing.listingDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <svg style={{ 
                        width: fluidValue(14, 16, 375, 1280, 'px'),
                        height: fluidValue(14, 16, 375, 1280, 'px'),
                        marginRight: fluidValue(4, 6, 375, 1280, 'px')
                      }} className="text-gray-500 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{dateFormatter.format(listing.listingDate)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.href = `/listings/${listing.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300 flex items-center justify-center"
                    style={{
                      fontSize: fluidValue(0.75, 0.875, 375, 1280, 'rem'),
                      padding: `${responsiveSpace(0.375, 0.5, 'rem')} ${responsiveSpace(0.5, 0.75, 'rem')}`,
                      borderRadius: fluidValue(0.25, 0.375, 375, 1280, 'rem')
                    }}
                  >
                    {t('home.viewDetails')}
                    <svg style={{ 
                      width: fluidValue(14, 16, 375, 1280, 'px'),
                      height: fluidValue(14, 16, 375, 1280, 'px'),
                      marginLeft: fluidValue(4, 6, 375, 1280, 'px')
                    }} className="rtl:mr-1.5 rtl:ml-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                </ResponsiveCard>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                      className={`relative hidden xs:inline-flex items-center border ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
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
                
                {/* Mobile view - current page indicator */}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        </>
      )}
    </div>
  );
}
