"use client";
import Image from "next/image";
import Link from "next/link";
import { useLazyTranslation } from "@/hooks/useLazyTranslation";
import { useEffect, useState } from "react";
import HomeSearchBar from "@/components/search/HomeSearchBar";
import { getFeaturedListings } from "@/services/listings";
import { Listing } from "@/types/listings";
import { transformMinioUrl } from "@/utils/mediaUtils";

// Move namespaces outside component to prevent recreation on every render
const HOME_NAMESPACES = ['home', 'common'];

export default function Home() {
  const { t, ready } = useLazyTranslation(HOME_NAMESPACES); // Removed i18n as it's unused
  const [featuredCars, setFeaturedCars] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  useEffect(() => {
    const loadFeaturedCars = async () => {
      try {
        const listings = await getFeaturedListings();
        setFeaturedCars(listings);
      } catch (error) {
        console.error('Error loading featured cars:', error);
      } finally {
        setIsLoadingListings(false);
      }
    };

    loadFeaturedCars();
  }, []);

  const isLoadingTranslations = !ready;

  if (isLoadingTranslations) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading translations...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Section with full-width banner image */}
      <div className="relative h-[450px] xs:h-[500px] sm:h-[550px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070"
          alt="Car in motion on a scenic road"
          fill
          priority
          className="object-cover brightness-75"
          sizes="100vw"
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 hero-absolute-content">
          <div className="text-center mb-4 xs:mb-6">
            <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-white mb-2 xs:mb-3">
              {t('heroTitle', { ns: 'home'})}
            </h1>
            <p className="text-base xs:text-lg md:text-xl text-white">
              {t('heroSubtitle', { ns: 'home'})}
            </p>
          </div>

          {/* Use HomeSearchBar component with better mobile positioning */}
          <div className="w-full max-w-5xl hero-search-container mobile-dropdown-container">
            <HomeSearchBar />
          </div>
        </div>
      </div>

      {/* Featured Listings Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('featuredTitle', { ns: 'home'})}
          </h2>
          <Link
            href="/search"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
          >
            {t('viewAllListings', { ns: 'home'})}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          ) : featuredCars.length > 0 ? (
            featuredCars.map((car) => (
              <div
                key={car.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={transformMinioUrl(car.image || car.media?.[0]?.url || '') || "/images/logo.png"}
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
                      {car.location?.city || car.governorate?.nameEn || "Unknown"}
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
                      {car.fuelType || "N/A"}
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
                      {car.transmission || "N/A"}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/listings/${car.id}`}
                      className="w-full block text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300"
                    >
                      {t('listings.viewDetails', { ns: 'common'})}
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // No data state
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No featured cars available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            {t('whyChooseUsTitle', { ns: 'home'})}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center bg-blue-600 rounded-full w-16 h-16 mb-6 text-white text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t('whyChooseUsWideSelectionTitle', { ns: 'home'})}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('whyChooseUsWideSelectionDescription', { ns: 'home'})}</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center bg-blue-600 rounded-full w-16 h-16 mb-6 text-white text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t('whyChooseUsSecureTransactionsTitle', { ns: 'home'})}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('whyChooseUsSecureTransactionsDescription', { ns: 'home'})}</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center bg-blue-600 rounded-full w-16 h-16 mb-6 text-white text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t('whyChooseUsExpertSupportTitle', { ns: 'home'})}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('whyChooseUsExpertSupportDescription', { ns: 'home'})}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="bg-blue-600 rounded-xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('stayUpdated', { ns: 'home', defaultValue: 'Stay Updated on the Latest Deals'})}</h2> 
          <p className="max-w-2xl mx-auto mb-8">{t('newsletterDescription', { ns: 'home', defaultValue: 'Subscribe to our newsletter to receive the latest news, updates, and special offers directly in your inbox.'})}</p> 
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder={t('emailPlaceholder', { ns: 'home', defaultValue: 'Enter your email address'})}
              className="flex-grow px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100 transition-colors duration-300"
            >
              {t('subscribe', { ns: 'home', defaultValue: 'Subscribe'})}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
