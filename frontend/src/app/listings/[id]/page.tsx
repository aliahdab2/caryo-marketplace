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
import CarFeatures from './components/CarFeatures';

export default function ListingDetailPage() {
  const { t, i18n } = useTranslation('listings');
  const params = useParams();
  const router = useRouter();
  
  // Debug translations
  console.log('Current i18n state:', {
    language: i18n.language,
    availableNamespaces: i18n.options.ns,
    isInitialized: i18n.isInitialized,
    loadedNamespaces: i18n.reportNamespaces?.getUsedNamespaces(),
    hasListingsNS: i18n.hasResourceBundle(i18n.language, 'listings'),
    currentNS: i18n.options.defaultNS
  });
  // Safely extract id from params
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params?.id[0] : undefined;
  
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  
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
            <h2 className="text-lg sm:text-xl font-bold">{t('error')}</h2>
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
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{t('notFound')}</p>
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

        {/* Image Gallery - Full Width */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-64 sm:h-80 md:h-96 lg:h-[500px]">
              <CarMediaGallery 
                media={convertedMedia}
                initialIndex={0}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Header Section with Timestamp & Location */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {t('posted')}: {listing.createdAt ? formatDate(listing.createdAt, i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : t('recently')}
              </span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                {listing.governorate?.nameEn || listing.location?.city || t('locationNotSpecified')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Listing Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {listing.title}
              </h1>
            </div>

            {/* Price Section */}
            <div className="mb-6">
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {listing.price && formatNumber(listing.price, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })}
              </div>
              {listing.price && (
                <div className="text-base text-gray-600 dark:text-gray-400 mb-3">
                  ({formatNumber(listing.price * 0.8, i18n.language, { currency: listing.currency || 'USD', style: 'currency' })} {t('excludingVAT')})
                </div>
              )}
            </div>

            {/* Seller Section */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left side - Seller info */}
                <div>
                  <div className="text-base text-gray-600 dark:text-gray-400 mb-2">
                    {t('soldBy')}:
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white mr-2">
                      {listing.seller?.name || t('sellerNotSpecified')}
                    </span>
                    {listing.seller?.type === 'dealer' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {t('dealer')}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Right side - Contact buttons */}
                <div className="flex flex-col gap-3 lg:w-80">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {t('sendMessage')}
                  </button>
                  <button 
                    onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                    className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                    disabled={!listing.seller?.phone}
                  >
                    <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {!listing.seller?.phone 
                      ? t('phoneNotAvailable')
                      : showPhoneNumber 
                        ? listing.seller.phone
                        : t('showPhoneNumber')
                    }
                  </button>
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
                  {t('description')}
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

            {/* Equipment/Accessories Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('equipment')}
              </h2>
              
              {/* Placeholder content for future equipment/accessories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Sample equipment items - these would come from database */}
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('winterTires')}</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('motorHeater')}</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('boseSound')}</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('leatherSeats')}</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('adaptiveCruise')}</span>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('parkingSensors')}</span>
                </div>
              </div>
              
              {/* Placeholder notice */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                  <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('equipmentComingSoon')}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Save Button */}
              <div className="flex justify-end">
                <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {t('save')}
                </button>
              </div>

              {/* Side Ad Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('carInsurance')}
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                    <li>• {t('quickQuote')}</li>
                    <li>• {t('competitivePrices')}</li>
                    <li>• {t('comprehensiveCoverage')}</li>
                  </ul>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors">
                    {t('seeYourPriceNow')}
                  </button>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('additionalActions')}
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    {t('shareVehicle')}
                  </button>
                  <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('compareVehicles')}
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
