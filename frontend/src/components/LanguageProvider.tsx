"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie, getCookie } from 'cookies-next';

interface LanguageContextType {
  locale: string;
  changeLanguage: (lang: string) => void;
}

const defaultLanguageContext: LanguageContextType = {
  locale: 'ar', // Default language is Arabic
  changeLanguage: () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<string>('ar'); // Default to Arabic

  // Initialize language from cookie or localStorage on mount
  useEffect(() => {
    const savedLocale = getCookie('NEXT_LOCALE') || localStorage.getItem('NEXT_LOCALE') || 'ar';
    setLocale(savedLocale as string);
    document.documentElement.lang = savedLocale as string;
    document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const changeLanguage = (lang: string) => {
    if (lang !== locale) {
      // Save preference in both cookie and localStorage
      setCookie('NEXT_LOCALE', lang, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
      localStorage.setItem('NEXT_LOCALE', lang);
      
      // Update state
      setLocale(lang);
      
      // Update HTML attributes
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      // Change i18next language - crucial step to make translations work
      import('@/utils/i18n').then(({ default: i18n }) => {
        i18n.changeLanguage(lang).then(() => {
          // Refresh the page to apply language change
          router.refresh();
        });
      });
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
