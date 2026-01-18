"use client";

import Skeleton from '@/components/ui/Skeleton';

import React, { useState } from 'react';
import Link from 'next/link';
import { MdDirectionsCar } from 'react-icons/md';
import { CarListing } from '@/services/publicApi';
import ViewModeToggle, { ViewMode } from '@/components/search/ViewModeToggle';
import CarListingListItem from '@/components/search/CarListingListItem';
import { CarListingCardData } from '@/components/listings/CarListingCard';
import HoverImageNavigation from '@/components/ui/HoverImageNavigation';
import YearBadge from '@/components/ui/YearBadge';



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
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);


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
          // Loading skeleton using primitive Skeleton component
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <Skeleton className="h-52 w-full rounded-none" />
              <div className="p-5">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/3 mb-4" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))
        ) : latestCars.length > 0 ? (
          latestCars.map((car, index) => {
            // Use real media from API, fallback to placeholder if empty
            const hasMedia = car.media && car.media.length > 0;
            const displayMedia = hasMedia 
              ? car.media.map((m, i) => ({
                  url: m.url,
                  isPrimary: i === 0,
                  contentType: 'image', // Default to image if generic
                  isVideo: m.type === 'VIDEO'
                }))
              : [{
                  url: '/images/placeholder-car.jpg', // Placeholder
                  isPrimary: true,
                  contentType: 'image',
                  isVideo: false
                }];

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
                media: displayMedia.map(m => ({
                  url: m.url,
                  isPrimary: m.isPrimary,
                  contentType: m.contentType,
                  type: 'image' as const
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
              <Link
                key={car.id}
                href={`/listings/${car.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out group cursor-pointer border border-gray-100 dark:border-gray-700"
              >
                <div className="relative h-52">
                  <HoverImageNavigation
                    media={displayMedia}
                    alt={car.title}
                    className="w-full h-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 3} // Prioritize loading for first 3 cars
                    onImageError={(e) => {
                      e.currentTarget.src = "/images/logo.png";
                    }}
                    onVideoPlayingChange={(isPlaying) => {
                      setPlayingVideoIndex(isPlaying ? index : null);
                    }}
                  />

                  {/* Year Badge - Hidden when video is playing */}
                  {playingVideoIndex !== index && (
                    <YearBadge
                      year={car.modelYear}
                      size="md"
                      position="bottom-left"
                      zIndex={30}
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {car.title}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    ${car.price.toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 flex-shrink-0"
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
                      <span className="truncate">{car.locationDetails?.displayNameEn || car.governorateDetails?.displayNameEn || "Unknown"}</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{car.mileage ? car.mileage.toLocaleString() : 0} km</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                        />
                      </svg>
                      <span className="truncate">{typeof car.fuelType === 'object' ? (car.fuelType as { displayNameEn?: string })?.displayNameEn : car.fuelType || "N/A"}</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 flex-shrink-0"
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
                      <span className="truncate">{typeof car.transmission === 'object' ? (car.transmission as { displayNameEn?: string })?.displayNameEn : car.transmission || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </Link>
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
