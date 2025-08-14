"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdDirectionsCar } from 'react-icons/md';
import { CarListing } from '@/services/publicApi';
import { transformMinioUrl } from '@/utils/mediaUtils';
import ViewModeToggle, { ViewMode } from '@/components/search/ViewModeToggle';
import CarListingListItem from '@/components/search/CarListingListItem';
import { CarListingCardData } from '@/components/listings/CarListingCard';

interface HomeCarListingsProps {
  latestCars: CarListing[];
  isLoadingListings: boolean;
  t: (key: string, fallback?: string) => string;
  isRTL?: boolean;
}

const HomeCarListings: React.FC<HomeCarListingsProps> = ({
  latestCars,
  isLoadingListings,
  t,
  isRTL = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const containerClassName = viewMode === 'grid'
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    : "flex flex-col gap-4";

  return (
    <section className="py-16 container mx-auto px-4">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('latestCarsTitle', 'Latest Cars')}
        </h2>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            t={(key: string, fallback?: string) => t(`search:${key}`, fallback)}
            isRTL={isRTL}
          />
        </div>
      </div>

      <div className={containerClassName}>
        {isLoadingListings ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
              <div className="p-5">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))
        ) : latestCars.length > 0 ? (
          latestCars.map((car) => {
            if (viewMode === 'list') {
              // Transform to CarListingCardData for list view
              const cardData: CarListingCardData = {
                id: car.id,
                title: car.title,
                price: car.price,
                year: car.modelYear || new Date().getFullYear(),
                mileage: car.mileage,
                transmission: typeof car.transmission === 'object' ? (car.transmission as { displayNameEn?: string })?.displayNameEn : car.transmission,
                fuelType: typeof car.fuelType === 'object' ? (car.fuelType as { displayNameEn?: string })?.displayNameEn : car.fuelType,
                createdAt: car.createdAt || new Date().toISOString(),
                sellerUsername: car.sellerUsername || 'Unknown',
                governorateNameEn: car.locationDetails?.displayNameEn || car.governorateDetails?.displayNameEn || "Unknown",
                governorateNameAr: car.locationDetails?.displayNameAr || car.governorateDetails?.displayNameAr || "غير معروف",
                media: car.media?.map(m => ({
                  url: m.url,
                  isPrimary: m.type === 'primary' || false,
                  contentType: m.type
                }))
              };

              return (
                <CarListingListItem
                  key={car.id}
                  listing={cardData}
                  onFavoriteToggle={(_isFavorite) => {
                    // Handle favorite toggle if needed
                  }}
                  initialFavorite={false}
                  t={t}
                  isRTL={isRTL}
                />
              );
            }

            // Grid view (original cards)
            return (
              <div
                key={car.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={transformMinioUrl(car.media?.[0]?.url || '') || "/images/logo.png"}
                    alt={car.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {car.title}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    ${car.price.toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {car.locationDetails?.displayNameEn || car.governorateDetails?.displayNameEn || "Unknown"}
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {car.mileage.toLocaleString()} km
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {typeof car.fuelType === 'object' ? (car.fuelType as { displayNameEn?: string })?.displayNameEn : car.fuelType || "N/A"}
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {typeof car.transmission === 'object' ? (car.transmission as { displayNameEn?: string })?.displayNameEn : car.transmission || "N/A"}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/listings/${car.id}`}
                      className="w-full block text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300"
                    >
                      {t('viewDetails', 'View Details')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          // No data state
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center">
              <MdDirectionsCar className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('noLatestCars', 'No new cars available at the moment.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCarListings;
