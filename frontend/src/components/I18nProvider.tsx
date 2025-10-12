"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import i18n from '@/utils/i18nExports';
import { I18nextProvider } from 'react-i18next';
import { isValidLocale } from '@/app/i18n/config';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

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
        
        // Set the document attributes based on language
        document.documentElement.lang = currentLocale;
        document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
        
        // Make sure i18next is initialized
        if (!i18n.isInitialized) {
          await new Promise((resolve) => {
            i18n.on('initialized', resolve);
          });
        }
        
        // Change language and load resources
        await i18n.changeLanguage(currentLocale);
        
        // Explicitly load all namespaces
        await i18n.loadNamespaces(['common', 'listings', 'errors']);
        
        setMounted(true);
      } catch (error) {
        console.error('Error initializing i18n:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeI18n();
  }, [pathname]); // Re-run when pathname changes

  if (!mounted || isLoading) {
    // Return a lightweight loading indicator that doesn't block rendering
    return <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 animate-pulse"></div>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}