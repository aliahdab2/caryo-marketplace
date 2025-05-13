"use client";

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/utils/i18n';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This effect ensures that the component only renders on the client side
    // to avoid hydration mismatches with i18next
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
    
    // Set the i18next language to match the saved locale
    i18n.changeLanguage(initialLocale).then(() => {
      // Force reload resources
      i18n.reloadResources().then(() => {
        setMounted(true);
      });
    });
  }, []);

  if (!mounted) {
    // Return a lightweight loading indicator that doesn't block rendering
    return <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 animate-pulse"></div>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
