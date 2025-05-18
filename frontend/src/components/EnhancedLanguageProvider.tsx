/* eslint-disable no-console */
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import i18n, {
  SupportedLanguage,
  LANGUAGES,
  changeLanguage as i18nChangeLanguage
} from '@/utils/i18n';
// No need to use translationLoader as we're importing translations statically

// Helper function to check if a language is supported
function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return Object.values(LANGUAGES).includes(lang as SupportedLanguage);
}

// Define default language - Arabic
const DEFAULT_LANGUAGE: SupportedLanguage = LANGUAGES.AR;

/**
 * Language direction information interface
 */
interface LanguageDirectionInfo {
  /** The text direction (rtl or ltr) */
  dir: 'rtl' | 'ltr';
  
  /** Whether the language is RTL */
  isRTL: boolean;
  
  /** CSS class for text direction */
  dirClass: 'text-right' | 'text-left';
  
  /** CSS class for flex direction */
  flexClass: 'flex-row-reverse' | 'flex-row';
  
  /** CSS class for reverse flex */
  reverseFlexClass: 'flex-row' | 'flex-row-reverse';
}

/**
 * Language context interface
 */
interface LanguageContextType {
  /** Current active language code */
  locale: SupportedLanguage;
  
  /** Function to change the current language */
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  
  /** Language direction information */
  direction: LanguageDirectionInfo;
  
  /** Whether the active language is RTL */
  isRTL: boolean;
  
  /** Whether the language provider has initialized */
  isReady: boolean;
  
  /** Preload resources for a specific language */
  preloadLanguage: (lang: SupportedLanguage) => Promise<void>;
}

// Create default direction information for initial context
const defaultDirection: LanguageDirectionInfo = {
  dir: DEFAULT_LANGUAGE === 'ar' ? 'rtl' : 'ltr',
  isRTL: DEFAULT_LANGUAGE === 'ar',
  dirClass: DEFAULT_LANGUAGE === 'ar' ? 'text-right' : 'text-left',
  flexClass: DEFAULT_LANGUAGE === 'ar' ? 'flex-row-reverse' : 'flex-row',
  reverseFlexClass: DEFAULT_LANGUAGE === 'ar' ? 'flex-row' : 'flex-row-reverse',
};

const defaultLanguageContext: LanguageContextType = {
  locale: DEFAULT_LANGUAGE,
  changeLanguage: async () => {},
  direction: defaultDirection,
  isRTL: DEFAULT_LANGUAGE === 'ar',
  isReady: false,
  preloadLanguage: async () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

/**
 * Hook to access language context
 * @returns Language context for the current application state
 */
export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Enhanced language provider component that manages:
 * - Language state and switching
 * - Direction (RTL/LTR) settings
 * - Document attributes
 * - Cookie/localStorage persistence
 * - Lazy loading of translations
 */
export default function LanguageProvider({ children }: LanguageProviderProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState<boolean>(false);
  
  // Helper function to detect browser language preference
  const detectBrowserLanguage = (): SupportedLanguage => {
    if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
    
    // First try navigator.languages (array of user's preferred languages)
    if (navigator.languages && navigator.languages.length) {
      for (const lang of navigator.languages) {
        const langCode = lang.split('-')[0].toLowerCase();
        if (isSupportedLanguage(langCode)) {
          return langCode;
        }
      }
    }
    
    // Fallback to navigator.language (primary language)
    if (navigator.language) {
      const langCode = navigator.language.split('-')[0].toLowerCase();
      if (isSupportedLanguage(langCode)) {
        return langCode;
      }
    }
    
    // If we can't detect a supported language, use default
    return DEFAULT_LANGUAGE;
  };
  
  // Helper function to calculate direction information
  const calculateDirection = (lang: SupportedLanguage): LanguageDirectionInfo => {
    const isRTL = lang === 'ar';
    return {
      dir: isRTL ? 'rtl' : 'ltr',
      isRTL: isRTL,
      dirClass: isRTL ? 'text-right' : 'text-left',
      flexClass: isRTL ? 'flex-row-reverse' : 'flex-row',
      reverseFlexClass: isRTL ? 'flex-row' : 'flex-row-reverse',
    };
  };
  
  // Compute direction information based on current locale
  const direction = useMemo(() => calculateDirection(locale), [locale]);
  
  // Initialize language from i18n on mount
  useEffect(() => {
    try {
      // Get language from various sources in priority order:
      // 1. Cookie (most reliable with Next.js)
      // 2. localStorage
      // 3. i18n.language
      // 4. Browser language preferences
      // 5. DEFAULT_LANGUAGE as final fallback
      let currentLang: string | null = null;
      
      // Check for cookie
      if (typeof document !== 'undefined') {
        const getCookie = (name: string): string | null => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) {
            const cookieValue = parts.pop()?.split(';').shift();
            return cookieValue || null;
          }
          return null;
        };
        
        currentLang = getCookie('NEXT_LOCALE');
      }
      
      // If no cookie, check localStorage
      if (!currentLang && typeof localStorage !== 'undefined') {
        try {
          currentLang = localStorage.getItem('NEXT_LOCALE');
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Error reading from localStorage:', e);
        }
      }
      
      // If still no language, use i18n language
      if (!currentLang) {
        currentLang = i18n.language;
      }
      
      // If still no valid language, try browser preferences
      if (!currentLang || !isSupportedLanguage(currentLang)) {
        currentLang = detectBrowserLanguage();
      }
      
      // Validate language
      const validLang: SupportedLanguage = isSupportedLanguage(currentLang) 
        ? currentLang as SupportedLanguage
        : DEFAULT_LANGUAGE;
        
      // Set the language in state
      setLocale(validLang);
      
      // Make sure i18n is using the same language
      if (i18n.language !== validLang) {
        i18n.changeLanguage(validLang);
      }
      
      // No need for lazy loading translations
      
      // Apply language settings to document elements
      if (typeof document !== 'undefined') {
        document.documentElement.lang = validLang;
        document.documentElement.dir = validLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('lang', validLang); // For better accessibility
        
        // Add language-specific class to body
        document.body.classList.forEach(cls => {
          if (cls.startsWith('lang-')) {
            document.body.classList.remove(cls);
          }
        });
        document.body.classList.add(`lang-${validLang}`);
      }
      
      setIsReady(true);
    } catch (err) {
      console.error('Error initializing language:', err);
      
      try {
        // Apply default language in i18n for fallback
        i18n.changeLanguage(DEFAULT_LANGUAGE);

        // Set default language cookie
        if (typeof document !== 'undefined') {
          // Use cookies-js for setting cookie as fallback
          document.cookie = `NEXT_LOCALE=${DEFAULT_LANGUAGE}; path=/; max-age=${365 * 24 * 60 * 60}`;
          
          // Also set localStorage as another backup
          try {
            localStorage.setItem('NEXT_LOCALE', DEFAULT_LANGUAGE);
          } catch (localStorageErr) {
            console.warn('Failed to set localStorage fallback:', localStorageErr);
          }
          
          // Apply document attributes for default language
          document.documentElement.lang = DEFAULT_LANGUAGE;
          document.documentElement.dir = DEFAULT_LANGUAGE === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.setAttribute('lang', DEFAULT_LANGUAGE);
          
          // Apply language class to body
          document.body.classList.forEach(cls => {
            if (cls.startsWith('lang-')) {
              document.body.classList.remove(cls);
            }
          });
          document.body.classList.add(`lang-${DEFAULT_LANGUAGE}`);
        }
        
        // Default to fallback language if there's an error
        setLocale(DEFAULT_LANGUAGE);
        console.info(`Successfully reverted to default language (${DEFAULT_LANGUAGE}) after initialization error`);
      } catch (fallbackErr) {
        console.error('Critical error: Failed to apply default language after initialization error:', fallbackErr);
      } finally {
        // Make sure we set ready state no matter what
        setIsReady(true);
      }
    }
    
    // Return cleanup function
    return () => {
      // Any cleanup if needed when component unmounts
    };
  }, []);
  
  /**
   * Change the active language
   * @param lang Language code to switch to
   */
  const changeLanguage = useCallback(async (lang: SupportedLanguage): Promise<void> => {
    // Early return if language is the same or not supported
    if (lang === locale || !isSupportedLanguage(lang)) {
      return;
    }
    
    try {
      // Change language in i18n
      await i18nChangeLanguage(lang);
      
      // Update cookies with 1 year expiration (365 days)
      setCookie('NEXT_LOCALE', lang, { 
        maxAge: 365 * 24 * 60 * 60,
        path: '/' // Ensure cookie is available for all paths
      });
      
      // Update localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('NEXT_LOCALE', lang);
      }
      
      // Update document attributes
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('lang', lang); // For better accessibility
        
        // Remove previous language class and add new one
        document.body.classList.forEach(cls => {
          if (cls.startsWith('lang-')) {
            document.body.classList.remove(cls);
          }
        });
        document.body.classList.add(`lang-${lang}`);
      }
      
      // Update state
      setLocale(lang);
      
      // Hard refresh to ensure proper language rendering
      // This is necessary for RTL/LTR layout changes
      router.refresh();
    } catch (error) {
      console.error('Error changing language:', error);
      
      // Fallback to default language
      if (lang !== DEFAULT_LANGUAGE) {
        try {
          console.info(`Language change to ${lang} failed. Falling back to default language (${DEFAULT_LANGUAGE})`);
          
          // Change language in i18n to the default
          await i18nChangeLanguage(DEFAULT_LANGUAGE);
          
          // Update cookies with the default language
          setCookie('NEXT_LOCALE', DEFAULT_LANGUAGE, { 
            maxAge: 365 * 24 * 60 * 60,
            path: '/' 
          });
          
          // Update localStorage with default
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('NEXT_LOCALE', DEFAULT_LANGUAGE);
          }
          
          // Update document attributes with default language
          if (typeof document !== 'undefined') {
            document.documentElement.lang = DEFAULT_LANGUAGE;
            document.documentElement.dir = DEFAULT_LANGUAGE === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.setAttribute('lang', DEFAULT_LANGUAGE);
            
            // Update language classes for the default language
            document.body.classList.forEach(cls => {
              if (cls.startsWith('lang-')) {
                document.body.classList.remove(cls);
              }
            });
            document.body.classList.add(`lang-${DEFAULT_LANGUAGE}`);
          }
          
          // Update state with default language
          setLocale(DEFAULT_LANGUAGE);
          
          // Display some kind of notification to the user
          console.warn(`Switched to ${DEFAULT_LANGUAGE} as fallback language`);
        } catch (fallbackError) {
          console.error('Critical error: Failed to fall back to default language:', fallbackError);
        }
      }
    }
  }, [locale, router]);
  
  // Preload language resources with useCallback for stability
  const handlePreloadLanguage = useCallback(async (lang: SupportedLanguage): Promise<void> => {
    if (isSupportedLanguage(lang)) {
      try {
        // Dynamic import of the language file
        await import(`../../public/locales/${lang}/common.json`);
      } catch (err) {
        console.error(`Failed to preload language ${lang}:`, err);
        
        // Try to load default language as fallback if the requested language failed
        if (lang !== DEFAULT_LANGUAGE) {
          try {
            console.info(`Falling back to default language (${DEFAULT_LANGUAGE})`);
            await import(`../../public/locales/${DEFAULT_LANGUAGE}/common.json`);
          } catch (fallbackErr) {
            console.error(`Failed to load fallback language ${DEFAULT_LANGUAGE}:`, fallbackErr);
          }
        }
      }
    }
  }, []);
  
  // Context value - memoized to prevent unnecessary re-renders
  const contextValue = useMemo<LanguageContextType>(() => ({
    locale,
    changeLanguage,
    direction,
    isRTL: direction.isRTL,
    isReady,
    preloadLanguage: handlePreloadLanguage,
  }), [locale, changeLanguage, direction, isReady, handlePreloadLanguage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}
