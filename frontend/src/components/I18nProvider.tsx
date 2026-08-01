"use client";

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import i18n, { waitForI18nInitialized } from '@/utils/i18nExports';
import { I18nextProvider } from 'react-i18next';
import { isValidLocale } from '@/app/i18n/config';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const currentLocaleRef = useRef<string>('');

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        setIsLoading(true);

        // Extract locale from URL path (first segment)
        const pathSegments = pathname.split('/').filter(Boolean);
        let currentLocale = 'en'; // default

        if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
          currentLocale = pathSegments[0];
        }

        // Only re-initialize if locale actually changed
        if (currentLocaleRef.current === currentLocale && mounted) {
          setIsLoading(false);
          return;
        }

        currentLocaleRef.current = currentLocale;

        // Set the document attributes based on language
        document.documentElement.lang = currentLocale;
        document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';

        // Make sure i18next is initialized before touching language state
        await waitForI18nInitialized(i18n);

        // Change language and load resources only if needed
        if (i18n.language !== currentLocale) {
          await i18n.changeLanguage(currentLocale);
        }

        // NOTE: We no longer bulk-load all namespaces here.
        // Each page/component lazy-loads its own namespaces via useTranslation(['namespace'])
        // or useLazyTranslation(['namespace']). This reduces initial load from 17+ files to 1-2.
        // Only 'common' namespace is loaded initially (configured in i18n.ts).

        setMounted(true);
      } catch (error) {
        console.error('Error initializing i18n:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeI18n();
  }, [pathname, mounted]); // Added mounted dependency for optimization

  // Children must render during SSR and first paint: replacing them with a
  // loader here suppressed server-side rendering for the entire app (crawlers
  // saw an empty shell). useSuspense is false and every t() call carries a
  // fallback value, so rendering before i18n finishes loading is safe — the
  // loading bar overlays the page instead of replacing it.
  return (
    <I18nextProvider i18n={i18n}>
      {(!mounted || isLoading) && (
        <div data-testid="loading-bar" className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 animate-pulse"></div>
      )}
      {children}
    </I18nextProvider>
  );
}