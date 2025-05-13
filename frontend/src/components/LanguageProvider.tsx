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
    try {
      const savedLocale = getCookie('NEXT_LOCALE') || 
                          (typeof localStorage !== 'undefined' ? localStorage.getItem('NEXT_LOCALE') : null) || 
                          'ar';
      
      setLocale(savedLocale as string);
      
      // Apply language settings to document elements
      if (typeof document !== 'undefined') {
        document.documentElement.lang = savedLocale as string;
        document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
      }
    } catch (err) {
      console.error('Error initializing language:', err);
      // Default to Arabic if there's an error
      setLocale('ar');
    }
  }, []);

  const changeLanguage = (lang: string) => {
    if (lang !== locale) {
      try {
        // Update state first for immediate UI feedback
        setLocale(lang);
        
        // Save preference in cookie
        setCookie('NEXT_LOCALE', lang, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
        
        // Save in localStorage if available
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('NEXT_LOCALE', lang);
        }
        
        // Update HTML attributes if in browser environment
        if (typeof document !== 'undefined') {
          // Update language and direction attributes
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        }
        
        // Change i18next language
        import('@/utils/i18n')
          .then(({ default: i18n }) => {
            return i18n.changeLanguage(lang).then(() => {
              // Make sure to reload resources
              return i18n.reloadResources([lang], ['common']);
            });
          })
          .then(() => {
            // After loading translations, refresh the UI
            router.refresh();
          })
          .catch(err => {
            console.error('Error changing language in i18next:', err);
            router.refresh(); // Refresh anyway to apply other changes
          });
      } catch (err) {
        console.error('Error changing language:', err);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
