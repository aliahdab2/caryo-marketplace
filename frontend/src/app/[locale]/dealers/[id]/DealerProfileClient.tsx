'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { usePublicDealerProfile, usePublicDealerListings } from '@/hooks/queries/usePublicDealer';
import type { PublicDealerProfile } from '@/types/dealer';
import type { Listing } from '@/types/listings';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { ErrorDisplay, LoadingSkeleton } from '@/components/common';

interface DealerProfileClientProps {
  dealerId: number;
  /** Pre-fetched profile data from the server component (for hydration) */
  initialProfile?: PublicDealerProfile;
}

const parseJson = <T,>(value?: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

// Icons
const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CheckBadgeIcon = () => (
  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default function DealerProfileClient({ dealerId, initialProfile }: DealerProfileClientProps) {
  const { t, i18n } = useTranslation(['dealer', 'common', 'listings']);
  const [page, setPage] = useState(0);
  const isRtl = i18n.language === 'ar';

  const profileQuery = usePublicDealerProfile(dealerId, { 
    enabled: Number.isFinite(dealerId),
    initialData: initialProfile,
  });
  const listingsQuery = usePublicDealerListings(dealerId, page, 12, { enabled: Number.isFinite(dealerId) });

  const profile = profileQuery.data;
  const listings = listingsQuery.data?.content ?? [];
  const stats = profile?.stats;

  const socialLinks = parseJson<{ facebook?: string; instagram?: string; whatsapp?: string }>(profile?.socialLinks);
  const workingHours = parseJson<Record<string, string>>(profile?.workingHours);

  const listingCards = useMemo(() => {
    return listings.map((listing: Listing): CarListingCardData => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      year: listing.modelYear,
      modelYear: listing.modelYear,
      mileage: listing.mileage,
      transmissionNameEn: listing.transmissionNameEn,
      transmissionNameAr: listing.transmissionNameAr,
      fuelTypeNameEn: listing.fuelTypeNameEn,
      fuelTypeNameAr: listing.fuelTypeNameAr,
      createdAt: listing.createdAt,
      sellerUsername: listing.sellerUsername,
      governorateNameEn: listing.governorateNameEn,
      governorateNameAr: listing.governorateNameAr,
      governorateDetails: listing.governorateDetails,
      media: listing.media?.map((media) => ({
        url: media.url,
        isPrimary: media.isPrimary,
        type: media.mediaType,
        contentType: media.contentType,
      })),
    }));
  }, [listings]);

  if (profileQuery.isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          error={t('common:errorLoadingData')}
          retry={() => profileQuery.refetch()}
        />
      </div>
    );
  }

  if (profileQuery.isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="container mx-auto px-4 -mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <LoadingSkeleton lines={6} />
          </div>
        </div>
      </div>
    );
  }

  const memberYear = profile.memberSince ? new Date(profile.memberSince).getFullYear() : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <div className="relative h-72 md:h-80 overflow-hidden">
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt={profile.businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Dealer Name on Banner */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                {profile.businessName}
              </h1>
              {profile.isVerified && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <CheckBadgeIcon />
                  <span className="text-white text-sm font-medium">{t('verified')}</span>
                </div>
              )}
            </div>
            {profile.tradingAddress && (
              <div className="flex items-center gap-2 text-white/90 mt-2">
                <LocationIcon />
                <span>{profile.tradingAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        {/* Main Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Logo & Info */}
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white dark:ring-gray-800">
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt={profile.businessName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                        {profile.businessName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  {profile.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 ring-2 ring-white dark:ring-gray-800">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('memberSince')} {memberYear}
                  </div>
                  {profile.specialties && profile.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.specialties.slice(0, 4).map((specialty) => (
                        <span
                          key={specialty}
                          className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {profile.businessPhone && (
                  <a
                    href={`tel:${profile.businessPhone}`}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <PhoneIcon />
                    <span>{t('callDealer')}</span>
                  </a>
                )}
                {socialLinks?.whatsapp && (
                  <a
                    href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.activeListings ?? 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('activeListings')}
                </div>
              </div>
              <div className="text-center border-x border-gray-200 dark:border-gray-700">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats?.soldCount ?? 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('carsSold')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {memberYear ? new Date().getFullYear() - memberYear : 0}+
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('yearsInBusiness')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full" />
                {t('aboutDealer')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {(isRtl && profile.descriptionAr) ? profile.descriptionAr : (profile.description || t('noDescription'))}
              </p>
            </div>

            {/* Listings Section */}
            <div id="dealer-listings" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  {t('dealerListings')}
                  {stats?.activeListings ? (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {stats.activeListings}
                    </span>
                  ) : null}
                </h2>
              </div>

              {listingsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-64 animate-pulse" />
                  ))}
                </div>
              ) : listingsQuery.isError ? (
                <ErrorDisplay
                  error={t('common:errorLoadingData')}
                  retry={() => listingsQuery.refetch()}
                />
              ) : listings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <CarIcon />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('noListings')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listingCards.map((listing) => (
                      <CarListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {listingsQuery.data && listingsQuery.data.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={page <= 0}
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                      >
                        {isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        {t('common:previous')}
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {page + 1} / {listingsQuery.data.totalPages}
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={page >= listingsQuery.data.totalPages - 1}
                        onClick={() => setPage((prev) => Math.min(prev + 1, listingsQuery.data.totalPages - 1))}
                      >
                        {t('common:next')}
                        {isRtl ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('contact')}
              </h3>
              
              <div className="space-y-4">
                {profile.businessPhone && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <PhoneIcon />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('common:phone')}</div>
                      <a href={`tel:${profile.businessPhone}`} className="font-medium hover:text-blue-600">
                        {profile.businessPhone}
                      </a>
                    </div>
                  </div>
                )}

                {profile.tradingAddress && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <LocationIcon />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('common:address')}</div>
                      <span className="font-medium">{profile.tradingAddress}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(socialLinks?.facebook || socialLinks?.instagram || socialLinks?.whatsapp) && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('followUs')}
                  </div>
                  <div className="flex items-center gap-3">
                    {socialLinks?.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                      >
                        <FacebookIcon />
                      </a>
                    )}
                    {socialLinks?.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                      >
                        <InstagramIcon />
                      </a>
                    )}
                    {socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                      >
                        <WhatsAppIcon />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Working Hours Card */}
            {workingHours && Object.keys(workingHours).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full" />
                  <ClockIcon />
                  {t('workingHours')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(workingHours).map(([day, hours]) => {
                    const isClosed = hours.toLowerCase() === 'closed' || hours === 'مغلق';
                    return (
                      <div 
                        key={day} 
                        className={`flex items-center justify-between text-sm ${
                          isClosed 
                            ? 'text-gray-400 dark:text-gray-500' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <span className="capitalize font-medium">{day}</span>
                        <span className={isClosed ? 'italic' : 'font-medium'}>{hours}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
