"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLazyTranslation } from "@/hooks/useLazyTranslation";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useDirection } from "@/utils/direction";
import HomeSearchBar from "@/components/search/HomeSearchBar";
import HomeCarListings from "@/components/home/HomeCarListings";


import { fetchLatestListingsPublic, subscribeToNewsletter } from "@/services/publicApi";
import { CarListing } from "@/services/publicApi";

// Move namespaces outside component to prevent recreation on every render
const HOME_NAMESPACES = ['home', 'common'];

export default function Home() {
  const { t, ready } = useLazyTranslation(HOME_NAMESPACES);
  const { currentLang } = useLanguageSwitching();
  const { isRTL } = useDirection();
  const searchParams = useSearchParams();
  const _router = useRouter();
  const [latestCars, setLatestCars] = useState<CarListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  
  // Ref to prevent duplicate fetches (React StrictMode calls useEffect twice)
  const hasFetchedListings = useRef(false);


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
    // Prevent duplicate fetches from React StrictMode
    if (hasFetchedListings.current) return;
    hasFetchedListings.current = true;
    
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
      setNewsletterMessage(t('validationEmailRequired', { ns: 'common', defaultValue: 'Email is required' }));
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');

    try {
      const response = await subscribeToNewsletter({
        email: newsletterEmail.trim(),
        preferredLanguage: currentLang === 'ar' ? 'ar' : 'en',
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
        
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 hero-absolute-content z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-8 xs:mb-10"
          >
            <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
              {t('heroTitle', { ns: 'home'})}
            </h1>

            <p className="text-lg xs:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow">
              {t('heroSubtitle', { ns: 'home'})}
            </p>
          </motion.div>

          {/* Use HomeSearchBar component with better mobile positioning */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-5xl hero-search-container mobile-dropdown-container"
          >
            <HomeSearchBar />
          </motion.div>
        </div>
      </div>

      {/* Latest Cars Section */}
      <HomeCarListings
        latestCars={latestCars}
        isLoadingListings={isLoadingListings}
        t={(key: string, fallback?: string) => t(key, { ns: 'home', defaultValue: fallback })}
        isRTL={isRTL}
      />

      {/* How It Works Section - Modern Icon-Based Cards */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            {t('whyChooseUsTitle', { ns: 'home'})}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Discover why thousands trust Caryo for their automotive needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 - Wide Selection */}
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-16 h-16 mb-6 text-white shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('whyChooseUsWideSelectionTitle', { ns: 'home'})}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('whyChooseUsWideSelectionDescription', { ns: 'home'})}</p>
              </div>
            </div>

            {/* Card 2 - Secure Transactions */}
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-600">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-16 h-16 mb-6 text-white shadow-lg group-hover:shadow-purple-500/50 transition-shadow duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('whyChooseUsSecureTransactionsTitle', { ns: 'home'})}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('whyChooseUsSecureTransactionsDescription', { ns: 'home'})}</p>
              </div>
            </div>

            {/* Card 3 - Expert Support */}
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-600">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 rounded-2xl w-16 h-16 mb-6 text-white shadow-lg group-hover:shadow-green-500/50 transition-shadow duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('whyChooseUsExpertSupportTitle', { ns: 'home'})}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('whyChooseUsExpertSupportDescription', { ns: 'home'})}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white dark:bg-black" aria-labelledby="newsletter-title">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-blue-100 dark:border-blue-800/20 text-center relative overflow-hidden shadow-xl shadow-blue-500/5">
            {/* Subtle decorative blob */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>

            <div className="relative z-10">
              <h2 id="newsletter-title" className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('stayUpdated', { ns: 'home'})}
              </h2>
              <p id="newsletter-description" className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
                {t('newsletterDescription', { ns: 'home'})}
              </p>

              {newsletterMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 inline-block px-4 py-2 rounded-lg text-sm font-medium ${newsletterSuccess ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}
                >
                  {newsletterMessage}
                </motion.div>
              )}

              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3" aria-describedby="newsletter-description">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  onInvalid={(e) => e.currentTarget.setCustomValidity(t('emailRequired', { ns: 'home' }))}
                  onInput={(e) => e.currentTarget.setCustomValidity('')}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="min-w-0 flex-auto rounded-xl border-0 bg-white/50 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-400 dark:focus:ring-blue-500 backdrop-blur-sm transition-all duration-200"
                  placeholder={t('emailPlaceholder', { ns: 'home' })}
                  disabled={newsletterLoading}
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 whitespace-nowrap"
                >
                  {newsletterLoading
                    ? t('subscribing', { ns: 'home', defaultValue: 'Subscribing...'})
                    : t('subscribe', { ns: 'home', defaultValue: 'Subscribe'})
                  }
                </button>
              </form>
              
              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                {t('newsletterSpamPromise', { ns: 'home', defaultValue: 'No spam, unsubscribe at any time.'})}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
