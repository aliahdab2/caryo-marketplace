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

export default function DealerProfileClient({ dealerId, initialProfile }: DealerProfileClientProps) {
  const { t } = useTranslation(['common', 'listings']);
  const [page, setPage] = useState(0);

  // Use initial profile data from server component if available (prevents flash of loading state)
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

  // Note: 404 errors are handled by the server component (page.tsx) using notFound()
  // This error handler is for network errors or other client-side issues during revalidation
  if (profileQuery.isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          error={t('common:errorLoadingData', 'Error loading data. Please try again.')}
          retry={() => profileQuery.refetch()}
        />
      </div>
    );
  }

  // Show loading skeleton if no profile data yet (e.g., during client-side navigation)
  if (profileQuery.isLoading || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        {profile.bannerUrl ? (
          <div className="h-40 w-full bg-gray-100 dark:bg-gray-700">
            <img
              src={profile.bannerUrl}
              alt={profile.businessName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.businessName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                  {profile.businessName?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {profile.businessName}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats?.totalListings ?? 0} {t('listings', 'Listings')} · {t('memberSince', 'Member since')} {profile.memberSince ? new Date(profile.memberSince).getFullYear() : ''}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {profile.businessPhone ? (
              <a
                href={`tel:${profile.businessPhone}`}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
              >
                {t('callDealer', 'Call Dealer')}
              </a>
            ) : null}
            <Link
              href="#dealer-listings"
              className="px-4 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 text-sm font-medium"
            >
              {t('viewAllListings', 'View all listings')}
            </Link>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div id="dealer-listings" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('aboutDealer', 'About')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {profile.description || t('noDescription', 'No description provided.')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dealerListings', 'Listings')}
            </h2>

            {listingsQuery.isLoading ? (
              <LoadingSkeleton lines={4} />
            ) : listingsQuery.isError ? (
              <ErrorDisplay
                error={t('common:errorLoadingData', 'Error loading data. Please try again.')}
                retry={() => listingsQuery.refetch()}
              />
            ) : listings.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('noListings', 'No listings available.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listingCards.map((listing) => (
                  <CarListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {listingsQuery.data && listingsQuery.data.totalPages > 1 ? (
              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                  disabled={page <= 0}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                >
                  {t('previous', 'Previous')}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('page', 'Page')} {page + 1} / {listingsQuery.data.totalPages}
                </span>
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                  disabled={page >= listingsQuery.data.totalPages - 1}
                  onClick={() => setPage((prev) => Math.min(prev + 1, listingsQuery.data.totalPages - 1))}
                >
                  {t('next', 'Next')}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('dealerInfo', 'Dealer Info')}
            </h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {profile.tradingAddress ? (
                <div>{profile.tradingAddress}</div>
              ) : null}
              {profile.businessPhone ? (
                <div>{profile.businessPhone}</div>
              ) : null}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('workingHours', 'Working Hours')}
            </h2>
            {workingHours ? (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="capitalize">{day}</span>
                    <span>{hours}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('noWorkingHours', 'No working hours provided.')}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('contact', 'Contact')}
            </h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {socialLinks?.facebook ? <a className="hover:underline" href={socialLinks.facebook}>Facebook</a> : null}
              {socialLinks?.instagram ? <a className="hover:underline" href={socialLinks.instagram}>Instagram</a> : null}
              {socialLinks?.whatsapp ? <a className="hover:underline" href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}>WhatsApp</a> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
