"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { getMyListingById } from '@/services/listings';
import type { Listing } from '@/types/listings';
import CarMediaGallery from '@/components/CarMediaGallery/CarMediaGallery';
import type { CarMedia } from '@/components/CarMediaGallery/types';
import { transformMinioUrl } from '@/utils/mediaUtils';
import Link from 'next/link';
import { MdDirectionsCar, MdAccessTime, MdLocationOn } from 'react-icons/md';
import { formatDate, formatNumber } from '@/utils/localization';
import Breadcrumb, { createDashboardBreadcrumb } from '@/components/ui/Breadcrumb';

export default function MyListingPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation(['listings', 'common']);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const id = params?.id;
        if (!id) {
          throw new Error('Missing listing id');
        }
        const data = await getMyListingById(id);
        if (mounted) setListing(data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load listing');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [params?.id]);

  const media: CarMedia[] = useMemo(() => {
    if (!listing?.media) return [];
    return listing.media.map(m => ({
      type: 'image',
      url: transformMinioUrl(m.url),
      alt: listing.title || 'Car image',
      width: 800,
      height: 600
    }));
  }, [listing]);

  const currency = (listing?.currency ?? 'USD') as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 xs:px-4 py-4 sm:py-6 max-w-7xl">
        <Breadcrumb
          items={createDashboardBreadcrumb({
            label: t('dashboard:myListings', 'My Listings'),
            translationKey: 'dashboard.myListings',
            translationNamespace: 'dashboard',
            href: '/dashboard/listings'
          }).concat([
            {
              label: listing?.title || t('listings:preview', 'Preview'),
            }
          ])}
        />

        {/* Removed back and My Listings buttons per request */}

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 text-sm">
            {t('listings:privatePreview', 'Private preview (visible only to you)')}
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
            <div className="text-gray-600 dark:text-gray-300">{t('common:loading', 'Loading...')}</div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-700 dark:text-red-300 text-lg mb-2">{t('common:error', 'Error')}</div>
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          </div>
        )}

        {!loading && !error && listing && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-72 sm:h-80 md:h-96 lg:h-[500px]">
                <CarMediaGallery media={media} initialIndex={0} className="w-full h-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <MdAccessTime className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        <span>
                          {listing.createdAt ? formatDate(listing.createdAt, i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : t('listings:recently')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MdLocationOn className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        <span>
                          {i18n.language === 'ar'
                            ? (listing.location?.cityAr || listing.governorate?.nameAr || t('listings:locationNotSpecified'))
                            : (listing.location?.city || listing.governorate?.nameEn || t('listings:locationNotSpecified'))}
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <MdDirectionsCar className="w-4 h-4" />
                      <span className="text-xs font-medium">{listing.status?.toUpperCase() || 'PENDING'}</span>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                    {listing.title}
                  </h1>

                  {listing.price && (
                    <div className="mb-6">
                      <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(listing.price, i18n.language)} {currency}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">{t('listings:vehicle')}</div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 text-blue-900 dark:text-blue-100 text-sm font-medium shadow-sm">
                      <MdDirectionsCar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">
                          {i18n.language === 'ar'
                            ? (listing.brand?.displayNameAr || listing.brandNameAr || listing.make)
                            : (listing.brand?.displayNameEn || listing.brandNameEn || listing.make)}
                        </span>
                        {(listing.model?.displayNameEn || listing.modelNameEn || listing.modelNameAr) && (
                          <>
                            <span className="text-blue-400 dark:text-blue-300">•</span>
                            <span className="font-medium opacity-90">
                              {i18n.language === 'ar' ? (listing.model?.displayNameAr || listing.modelNameAr) : (listing.model?.displayNameEn || listing.modelNameEn)}
                            </span>
                          </>
                        )}
                        {(listing.year || listing.modelYear) && (
                          <>
                            <span className="text-blue-400 dark:text-blue-300">•</span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded font-medium">
                              {listing.year || listing.modelYear}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple sidebar with navigation */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <Link
                    href={`/dashboard/listings/edit/${listing.id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                  >
                    {t('common:edit', 'Edit')}
                  </Link>
                  {listing.approved && (
                    <Link
                      href={`/listings/${listing.id}`}
                      className="block w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                    >
                      {t('listings:viewPublicPage', 'View public page (if approved)')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


