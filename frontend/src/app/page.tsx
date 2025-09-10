"use client";
import Image from "next/image";
import { useLazyTranslation } from "@/hooks/useLazyTranslation";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HomeSearchBar from "@/components/search/HomeSearchBar";
import HomeCarListings from "@/components/home/HomeCarListings";


import { fetchLatestListingsPublic, subscribeToNewsletter } from "@/services/publicApi";
import { CarListing } from "@/services/publicApi";

// Move namespaces outside component to prevent recreation on every render
const HOME_NAMESPACES = ['home', 'common'];

export default function Home() {
  const { t, i18n, ready } = useLazyTranslation(HOME_NAMESPACES);
  const searchParams = useSearchParams();
  const _router = useRouter();
  const [latestCars, setLatestCars] = useState<CarListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const [newsletterSuccess, setNewsletterSuccess] = useState(false);


  // Handle URL cleanup
  useEffect(() => {
    const verified = searchParams.get('verified');
    const _username = searchParams.get('username');
    
    if (verified === 'true') {
      // Clean up URL params without showing overlay
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      url.searchParams.delete('username');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    const loadLatestCars = async () => {
      try {
        // Use public API to fetch latest listings
        const listings = await fetchLatestListingsPublic(6);
        setLatestCars(listings);
      } catch (error) {
        console.error('Error loading latest cars:', error);
      } finally {
        setIsLoadingListings(false);
      }
    };

    loadLatestCars();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setNewsletterMessage(t('validation.emailRequired', { ns: 'common', defaultValue: 'Email is required' }));
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');
    
    try {
      const response = await subscribeToNewsletter({
        email: newsletterEmail.trim(),
        preferredLanguage: i18n.language === 'ar' ? 'ar' : 'en',
        source: 'homepage'
      });

      if (response.success) {
        setNewsletterSuccess(true);
        setNewsletterMessage(t('newsletterSuccess', { ns: 'home', defaultValue: 'Please check your email to confirm your subscription!' }));
        setNewsletterEmail('');
      } else {
        setNewsletterSuccess(false);
        setNewsletterMessage(response.message);
      }
    } catch (_error) {
      setNewsletterSuccess(false);
      setNewsletterMessage(t('newsletterError', { ns: 'home', defaultValue: 'Failed to subscribe. Please try again.' }));
    } finally {
      setNewsletterLoading(false);
    }
  };

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
            <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-white mb-2 xs:mb-3">
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

      {/* Latest Cars Section */}
      <HomeCarListings
        latestCars={latestCars}
        isLoadingListings={isLoadingListings}
        t={(key: string, fallback?: string) => t(key, { ns: 'home', defaultValue: fallback })}
        isRTL={i18n.language === 'ar'}
      />

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
          
          {newsletterMessage && (
            <div className={`mb-6 p-3 rounded-md ${newsletterSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {newsletterMessage}
            </div>
          )}
          
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder={t('emailPlaceholder', { ns: 'home', defaultValue: 'Enter your email address'})}
              className="flex-grow px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              disabled={newsletterLoading}
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {newsletterLoading 
                ? t('subscribing', { ns: 'home', defaultValue: 'Subscribing...'})
                : t('subscribe', { ns: 'home', defaultValue: 'Subscribe'})
              }
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
