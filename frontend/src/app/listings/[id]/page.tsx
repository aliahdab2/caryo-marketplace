"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { formatDate, formatNumber } from '../../../utils/localization';
import { getListingById } from '@/services/listings';
import { Listing } from '@/types/listings';

// Component imports for the new enhanced layout
import BreadcrumbNavigation from './components/BreadcrumbNavigation';
import CarMediaGallery from '@/components/CarMediaGallery/CarMediaGallery';
import { CarMedia } from '@/components/CarMediaGallery/types';
import CarFacts from './components/CarFacts';
import FinancingCalculator from './components/FinancingCalculator';
import SellerInfo from './components/SellerInfo';
import CarFeatures from './components/CarFeatures';

export default function ListingDetailPage() {
  const { t, i18n } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  // Safely extract id from params
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params?.id[0] : undefined;
  
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch listing data from API
  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        if (!id) {
          throw new Error('Listing ID is required');
        }
        
        const listingData = await getListingById(id.toString());
        setListing(listingData);
        setError(null);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listing details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-3 xs:px-4 py-6 sm:py-8">
        <div className="flex justify-center items-center h-48 sm:h-64 md:h-80">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 xs:px-4 py-6 sm:py-8 max-w-3xl">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 rtl:ml-2 rtl:mr-0 sm:mr-3 sm:rtl:ml-3 sm:rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg sm:text-xl font-bold">{t('listings.error')}</h2>
          </div>
          <p className="mb-4 text-center text-sm sm:text-base">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/listings')}
              className="inline-flex items-center bg-blue-600 text-white py-2 px-4 text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-3 xs:px-4 py-6 sm:py-8">
        <div className="flex justify-center items-center h-48 sm:h-64 md:h-80">
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{t('listings.notFound')}</p>
        </div>
      </div>
    );
  }

  // Convert listing media to CarMedia format
  const convertedMedia: CarMedia[] = listing.media?.map(item => ({
    type: 'image', // Assuming all media are images for now
    url: item.url,
    alt: listing.title || 'Car image',
    width: 800,
    height: 600,
  })) || [];

  // Add fallback image if available and not already in media
  if (listing.image && !convertedMedia.some(item => item.url === listing.image)) {
    convertedMedia.push({
      type: 'image',
      url: listing.image,
      alt: listing.title || 'Car image',
      width: 800,
      height: 600,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 xs:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation listing={listing} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-64 sm:h-80 md:h-96">
                <CarMediaGallery 
                  media={convertedMedia}
                  initialIndex={0}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Title Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {listing.title}
              </h1>
              
              {/* Location + Date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm sm:text-base">
                    {listing.governorate?.nameEn || listing.location?.city || t('listings.locationNotSpecified')}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm sm:text-base">
                    {t('listings.posted')}: {listing.createdAt ? formatDate(listing.createdAt, i18n.language, { year: 'numeric', month: 'short', day: 'numeric' }) : t('listings.recently')}
                  </span>
                </div>
              </div>

              {/* Price Display */}
              <div className="mb-4">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {listing.price && formatNumber(listing.price, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('listings.financingAvailable')}
                </div>
              </div>
            </div>

            {/* Car Facts */}
            <CarFacts listing={listing} />

            {/* Description */}
            {listing.description && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('listings.description')}
                </h2>
                <div className="prose dark:prose-dark max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              </div>
            )}

            {/* Features */}
            <CarFeatures listing={listing} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Price & Financing Calculator */}
              <FinancingCalculator listing={listing} />

              {/* Seller Information */}
              <SellerInfo listing={listing} />

              {/* Additional Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('listings.additionalActions')}
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {t('listings.saveToFavorites')}
                  </button>
                  <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    {t('listings.shareVehicle')}
                  </button>
                  <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('listings.compareVehicles')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
