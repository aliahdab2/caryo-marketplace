'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { usePublicDealerProfile, usePublicDealerListings } from '@/hooks/queries/usePublicDealer';
import type { PublicDealerProfile } from '@/types/dealer';
import type { Listing } from '@/types/listings';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { ErrorDisplay, LoadingSkeleton } from '@/components/common';
import {
  PhoneIcon,
  LocationIcon,
  CheckBadgeIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  BuildingIcon,
} from '@/components/icons';

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
  const listingsContent = listingsQuery.data?.content;
  const stats = profile?.stats;

  const socialLinks = parseJson<{ facebook?: string; instagram?: string; whatsapp?: string }>(profile?.socialLinks);
  const workingHours = parseJson<Record<string, string>>(profile?.workingHours);

  const listingCards = useMemo(() => {
    if (!listingsContent) return [];
    return listingsContent.map((listing: Listing): CarListingCardData => ({
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
  }, [listingsContent]);

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
          <Image
            src={profile.bannerUrl}
            alt={`${profile.businessName} banner`}
            fill
            sizes="100vw"
            className="object-cover"
            priority // Preload for LCP optimization
            quality={85}
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
                      <Image 
                        src={profile.logoUrl} 
                        alt={`${profile.businessName} logo`} 
                        fill 
                        sizes="96px"
                        className="object-cover"
                        quality={80}
                      />
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
              ) : listingCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <BuildingIcon aria-label="No listings" />
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
