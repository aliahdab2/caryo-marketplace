"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

/**
 * DEVELOPER NOTE:
 * -----------------------------------------------------------------------------
 * When using translations with useTranslation('common'), use the direct key format:
 *
 * ✅ CORRECT: t('key')
 * ❌ INCORRECT: t('common.key')
 *
 * The namespace ('common') is already specified in useTranslation('common'),
 * so keys should be accessed directly without the namespace prefix.
 *
 * HTTP Backend: Using i18next-http-backend for dynamic loading of translation files
 * from /public/locales/ directory structure. This is the recommended approach for
 * production applications as it allows for lazy loading and better performance.
 * -----------------------------------------------------------------------------
 */

// Define supported languages
export const LANGUAGES = {
  EN: 'en',
  AR: 'ar'
} as const;

export type SupportedLanguage = typeof LANGUAGES[keyof typeof LANGUAGES];

/**
 * Gets the current language from various sources
 * Order: cookie -> Next.js route -> localStorage -> browser language -> default
 * @returns The detected language code ('en' or 'ar')
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  // Only run in browser environment
  if (typeof window !== 'undefined') {
    try {
      // Check cookie first - more reliable with Next.js
      const getCookie = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const cookieValue = parts.pop()?.split(';').shift();
          return cookieValue || null;
        }
        return null;
      };

      const cookieLang = getCookie('NEXT_LOCALE');
      if (cookieLang && isValidLanguage(cookieLang)) {
        return cookieLang as SupportedLanguage;
      }

      // Check URL/route for language (useful with Next.js i18n routing)
      const pathLang = window.location.pathname.split('/')[1];
      if (pathLang && isValidLanguage(pathLang)) {
        return pathLang as SupportedLanguage;
      }

      // Then check localStorage
      const localLang = localStorage.getItem('NEXT_LOCALE');
      if (localLang && isValidLanguage(localLang)) {
        return localLang as SupportedLanguage;
      }

      // If no saved preference, check browser language
      const browserLang = navigator.language.split('-')[0];
      if (isValidLanguage(browserLang)) {
        return browserLang as SupportedLanguage;
      }
    } catch (error) {
      console.warn("Error detecting language:", error);
      // Fall through to default
    }
  }

  return LANGUAGES.EN; // Default to English
};

/**
 * Validates if a language code is supported
 * @param lang Language code to validate
 * @returns Whether the language is supported
 */
function isValidLanguage(lang: string): lang is SupportedLanguage {
  return Object.values(LANGUAGES).includes(lang as SupportedLanguage);
}

/**
 * Gets the base URL for loading translations
 * This is critical for correct path resolution in development vs production
 */
/*
function getBaseUrl(): string {
  // For client-side code
  if (typeof window !== 'undefined') {
    // Return empty string to make paths relative to the current origin
    return '';
  }
  
  // For server-side code (SSR)
  // In a real deployment, you might need to handle this differently
  return process.env.NEXT_PUBLIC_APP_URL || '';
}
*/

/**
 * Manual reload of a namespace - useful for debugging
 * @param namespace The namespace to reload
 */
export const reloadNamespace = (namespace: string): void => {
  if (i18n.isInitialized) {
    i18n.reloadResources(i18n.language, namespace)
      .then(() => {
        console.log(`%c[i18n] Manually reloaded namespace: ${namespace}`, 'color: #4CAF50; font-weight: bold');
      })
      .catch(err => {
        console.error(`[i18n] Error reloading namespace ${namespace}:`, err);
      });
  } else {
    console.warn('[i18n] Cannot reload namespace before i18n is initialized');
  }
};

/**
 * Initialize i18next with the following features:
 * 1. HTTP Backend for loading translations from /public/locales/
 * 2. Language Detection for auto-detecting user's language
 * 3. React-i18next for React integration
 * 4. Support for lazy loading of translations
 */
i18n
  // Load translations via HTTP
  .use(HttpApi)
  // Detect user language
  .use(LanguageDetector)
  // Initialize React-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Enable async initialization (required for HTTP backend)
    initAsync: true,
    
    // Supported namespaces
    ns: ['common', 'translation', 'errors', 'listings', 'auth', 'home', 'dashboard'],
    defaultNS: 'common',
    
    // Supported languages
    fallbackLng: ['en'],
    supportedLngs: Object.values(LANGUAGES),
    
    // Detect language
    detection: {
      // Order to detect language
      order: ['cookie', 'path', 'localStorage', 'navigator'],
      // Cookie settings
      lookupCookie: 'NEXT_LOCALE',
      // localStorage settings
      lookupLocalStorage: 'NEXT_LOCALE',
      // Path settings (for Next.js i18n routing)
      lookupFromPathIndex: 0,
      // Cache settings
      caches: ['cookie', 'localStorage'],
    },
    
    // Enable lazy loading
    partialBundledLanguages: true,
    // Don't preload any languages
    preload: false,
    
    // HTTP backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
      allowMultiLoading: false,
      crossDomain: false,
      withCredentials: false,
      requestOptions: {
        cache: process.env.NODE_ENV === 'development' ? 'reload' : 'default', // Force reload in development
        credentials: 'same-origin',
        mode: 'cors',
      }
    },
    
    // React settings
    react: {
      // Don't wait for translations to render (lazy loading)
      useSuspense: false,
      // Don't load before initial render to prevent SSR issues
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      // Don't use Suspense for lazy loading
      transEmptyNodeValue: '',
    },
    
    // Disable interpolation by default for performance
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Adjust for client/server side rendering
    load: 'currentOnly',
  });

// Log internationalization events in development
if (process.env.NODE_ENV === 'development') {
  i18n.on('initialized', () => {
    console.log('[i18n Event] Initialized');
  });
  
  i18n.on('loaded', (loaded) => {
    console.log('[i18n Event] Resources loaded', loaded);
  });
  
  i18n.on('languageChanged', (lng) => {
    console.log(`[i18n Event] Language changed to ${lng}`);
  });
  
  i18n.on('added', (lng, ns) => {
    console.log(`[i18n Event] Namespace ${ns} added for language ${lng}`);
  });
  
  i18n.on('failed', (lng, ns, msg) => {
    console.error(`[i18n Event] Failed loading ${ns} for ${lng}:`, msg);
  });
}

/**
 * Helper function to change the application language
 * @param language The language code to change to
 * @returns Promise resolving when language is changed
 */
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  if (!isValidLanguage(language)) {
    console.error(`Invalid language code: ${language}`);
    return;
  }

  try {
    // Update cookie for persistence
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${language};path=/;max-age=31536000;SameSite=Lax`;
    }

    // Update localStorage (with error handling)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('NEXT_LOCALE', language);
      }
    } catch (e) {
      // localStorage might be unavailable in some contexts
      console.warn('Could not save language preference to localStorage', e);
    }

    // Change i18next language
    await i18n.changeLanguage(language);

    // Update document language attribute and direction
    if (typeof document !== 'undefined') {
      const isRTL = language === LANGUAGES.AR;
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

      // Dispatch an event so other components can react to the language change
      document.dispatchEvent(new CustomEvent('languagechange', {
        detail: { language, direction: isRTL ? 'rtl' : 'ltr' }
      }));
    }
  } catch (error) {
    console.error("Error changing language:", error);
  }
};

export default i18n;
