"use client";

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/utils/i18nExports';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        setIsLoading(true);
        
        // Get the saved locale from cookie or localStorage
        const savedLocale = document.cookie
          .split('; ')
          .find(row => row.startsWith('NEXT_LOCALE='))
          ?.split('=')[1] || 
          localStorage.getItem('NEXT_LOCALE');
        
        // Use the detected language or default to 'ar'
        const initialLocale = savedLocale || 
          (navigator.language.startsWith('ar') ? 'ar' : 
           navigator.language.startsWith('en') ? 'en' : 'ar');
        
        // Set the document attributes based on language
        document.documentElement.lang = initialLocale;
        document.documentElement.dir = initialLocale === 'ar' ? 'rtl' : 'ltr';
        
        // Make sure i18next is initialized
        if (!i18n.isInitialized) {
          await new Promise((resolve) => {
            i18n.on('initialized', resolve);
          });
        }
        
        // Change language and load resources
        await i18n.changeLanguage(initialLocale);
        
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
  }, []);

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
