"use client";

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { formatDate, formatNumber } from '@/utils/localization';
import { CarListing } from '@/services/publicApi';
import { transformMinioUrl, processVideoForGallery, isVideoMedia } from '@/utils/mediaUtils';
import FavoriteButton from '@/components/common/FavoriteButton';
import { useOptimizedUser } from '@/hooks/useOptimizedSession';
import { Listing } from '@/types/listings';

// Component imports for the new enhanced layout
import BreadcrumbNavigation from './components/BreadcrumbNavigation';
import CarMediaGallery from '@/components/CarMediaGallery/CarMediaGallery';
import { CarMedia } from '@/components/CarMediaGallery/types';
import CarFacts from './components/CarFacts';
import CarFeatures from './components/CarFeatures';
import SellerInfo from './components/SellerInfo';
import ContactSellerModal from '@/components/messaging/ContactSellerModal';
import SignInPromptModal from '@/components/auth/SignInPromptModal';
import MobileStickyActionBar from './components/MobileStickyActionBar';

interface ListingDetailClientProps {
  initialListing: CarListing;
}

export default function ListingDetailClient({ initialListing }: ListingDetailClientProps) {
  const { t } = useTranslation(['listings', 'messages']);
  const { locale } = useLanguageSwitching();
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const user = useOptimizedUser();

  const listing = initialListing;

  // Convert listing media to CarMedia format using useMemo for performance
  const convertedMedia = useMemo(() => {
    const media: CarMedia[] = listing.media?.map(item => {
      // Determine if this is a video using shared utility
      const isVideo = isVideoMedia(item);

      // For videos, process with enhanced utility
      let thumbnailUrl: string | undefined = undefined;
      if (isVideo) {
        const videoInfo = processVideoForGallery(item.url);
        thumbnailUrl = videoInfo.thumbnailUrl || undefined;
      }

      return {
        type: isVideo ? 'video' : 'image',
        url: transformMinioUrl(item.url),
        alt: listing.title || (isVideo ? 'Car video' : 'Car image'),
        width: 800,
        height: 600,
        ...(thumbnailUrl && { thumbnailUrl })
      };
    }) || [];

    return media;
  }, [listing]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 xs:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation listing={listing} />

        {/* Image Gallery - Full Width with Modern Styling */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-72 sm:h-80 md:h-96 lg:h-[500px]">
              <CarMediaGallery
                media={convertedMedia}
                initialIndex={0}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Simple Header - Blocket Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Minimal top info bar */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {t('posted')}: {listing.createdAt ? formatDate(listing.createdAt, locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : t('recently')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {listing.governorateDetails?.displayNameEn || listing.locationDetails?.displayNameEn || t('locationNotSpecified')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FavoriteButton
                    listingId={listing.id.toString()}
                    variant="outline"
                    size="sm"
                    className="text-gray-500 hover:text-red-500"
                    initialFavorite={false}
                    user={user}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {t('save')}
                  </span>
                </div>
              </div>

              {/* Clean Title - Blocket Style */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {listing.title}
              </h1>

              {/* Prominent Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-4 mb-2">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    {listing.price && formatNumber(listing.price, locale, { currency: 'SYP', style: 'currency' })}
                  </div>
                </div>
              </div>

            </div>

            {/* Car Facts */}
            <CarFacts listing={listing} />

            {/* Description */}
            {listing.description && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
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

            {/* Equipment/Accessories - Simple Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('equipment')}
              </h2>

              {/* Equipment List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Sample equipment items */}
                <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('winterTires')}</span>
                </div>

                <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('motorHeater')}</span>
                </div>

                <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('boseSound')}</span>
                </div>

                <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-3 rtl:ml-3 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('leatherSeats')}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                {t('equipmentComingSoon')}
              </div>
            </div>
          </div>

          {/* Right Column - Clean Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Seller Info Card */}
              <SellerInfo 
                listing={listing as unknown as Listing}
                onContact={() => {
                  if (user) {
                    setShowContactModal(true);
                  } else {
                    setShowSignInPrompt(true);
                  }
                }}
                onCall={() => setShowPhoneNumber(!showPhoneNumber)}
              />
              {/* Simple Actions Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-3">
                  <button className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    {t('shareVehicle')}
                  </button>
                  <button className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('compareVehicles')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <MobileStickyActionBar 
        onMessage={() => {
          if (user) {
            setShowContactModal(true);
          } else {
            setShowSignInPrompt(true);
          }
        }}
        onCall={() => setShowPhoneNumber(!showPhoneNumber)}
        isRTL={locale === 'ar'}
      />

      {/* Add bottom padding on mobile to prevent content being hidden by sticky bar */}
      <div className="h-20 lg:hidden" />

      {/* Contact Seller Modal - Only for authenticated users */}
      {user && (
        <ContactSellerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          sellerName={listing.sellerUsername || 'Seller'}
        />
      )}

      {/* Sign In Prompt Modal - For unauthenticated users */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        action={t('messages:contactSeller')}
      />
    </div>
  );
}
