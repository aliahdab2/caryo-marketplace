"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { formatDate, formatNumber } from '../../../utils/localization';
import { getListingById } from '@/services/listings';
import { Listing } from '@/types/listings';

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

  return (
    <div className="container mx-auto px-3 xs:px-4 py-6 sm:py-8 max-w-7xl">
      <button 
        onClick={() => router.back()}
        className="mb-4 sm:mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 rtl:mr-0 rtl:ml-1 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {t('back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-200 dark:bg-gray-700 h-64 sm:h-80 md:h-96 rounded-lg mb-3 sm:mb-4 relative overflow-hidden shadow-md">
            {listing?.image ? (
              <Image 
                src={listing.image} 
                alt={listing.title} 
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 sm:w-24 sm:h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-6 sm:mb-8">
            {listing?.media?.map((mediaItem, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-14 sm:h-20 rounded-md cursor-pointer hover:opacity-80 transition-opacity shadow-sm">
                {/* Placeholder for image thumbnail */}
              </div>
            )) || (
              <div className="bg-gray-200 dark:bg-gray-700 h-14 sm:h-20 rounded-md cursor-pointer hover:opacity-80 transition-opacity shadow-sm">
                {/* Placeholder for image thumbnail */}
              </div>
            )}
          </div>
          
          <div className="mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{listing?.title}</h1>
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between mt-2 sm:mt-3 gap-2">
              <h2 className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-bold">
                {listing?.price && formatNumber(listing.price, i18n.language, { currency: listing?.currency || 'USD', style: 'currency' })}
              </h2>
              <div className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start xs:self-auto">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 rtl:mr-0 rtl:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {listing?.createdAt ? (
                  formatDate(listing.createdAt, i18n.language, { dateStyle: 'medium' }) || t('listings.addedRecently')
                ) : t('listings.addedRecently')}
              </div>
            </div>
          </div>
          
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('listings.description')}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">{listing?.description}</p>
            </div>
          </div>
          
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('listings.features')}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              {listing?.features && listing.features.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-3">
                  {listing.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('listings.noFeaturesListed')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 lg:sticky lg:top-6">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t('listings.specifications')}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 rtl:ml-2 rtl:mr-0 sm:rtl:ml-3 sm:rtl:mr-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('year')}:</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{listing?.year}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 rtl:ml-2 rtl:mr-0 sm:rtl:ml-3 sm:rtl:mr-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('mileage')}:</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {listing?.mileage ? `${formatNumber(listing.mileage, i18n.language)} ${t('km')}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 rtl:ml-2 rtl:mr-0 sm:rtl:ml-3 sm:rtl:mr-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('location')}:</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {listing?.governorate?.nameEn || listing?.location?.city || t('listings.locationNotSpecified')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('listings.contactSeller')}
              </h3>
              
              <div className="space-y-3 mb-5">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                    {listing?.seller?.name || t('listings.sellerNotSpecified')}
                  </p>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 rtl:ml-1 rtl:mr-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {t('listings.respondsFast')}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 rtl:ml-1.5 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t('listings.contactNow')}
                </button>
                <button className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 rtl:ml-1.5 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('listings.schedule')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
