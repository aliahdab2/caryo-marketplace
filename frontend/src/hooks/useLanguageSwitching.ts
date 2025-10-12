"use client";

import { usePathname, useRouter } from 'next/navigation';
import { isValidLocale } from '@/app/i18n/config';

/**
 * Custom hook for comprehensive language switching and locale detection
 * Provides URL-based locale detection and related utilities
 */
export function useLanguageSwitching() {
  const pathname = usePathname();
  const router = useRouter();

  // Extract current locale from URL path instead of relying on i18n.language
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLang = (pathSegments.length > 0 && isValidLocale(pathSegments[0])) 
    ? pathSegments[0] 
    : 'en';

  // Derived properties
  const oppositeLanguage = currentLang === 'en' ? 'ar' : 'en';
  const isRTL = currentLang === 'ar';
  const isArabic = currentLang === 'ar';
  const isEnglish = currentLang === 'en';

  /**
   * Build URL for language switching
   * @param targetLang - Target language code
   * @returns New URL with target language
   */
  const buildLanguageUrl = (targetLang: string): string => {
    let pathWithoutLocale = '/';
    
    // If first segment is a locale, remove it
    if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
      pathWithoutLocale = '/' + pathSegments.slice(1).join('/');
    } else {
      pathWithoutLocale = pathname;
    }
    
    return `/${targetLang}${pathWithoutLocale}`;
  };

  /**
   * Switch to target language with auth-aware navigation
   * Uses different strategies based on authentication state and route type
   * @param targetLang - Target language code
   * @param debug - Whether to log debug information
   * @param forceReload - Force full page reload regardless of route type
   */
  const switchLanguage = (targetLang: string, debug = false, forceReload = false) => {
    if (targetLang === currentLang) {
      return; // Already on target language
    }

    const newPath = buildLanguageUrl(targetLang);
    
    if (debug) {
      console.log(`🔄 Language switch debug:`, {
        currentPath: pathname,
        currentLang,
        targetLang,
        pathSegments,
        newPath,
        forceReload
      });
    }

    if (forceReload) {
      // Force full reload if explicitly requested
      window.location.href = newPath;
      return;
    }

    // Use SPA navigation for all routes now that auth is server-side
    try {
      router.push(newPath);
    } catch (error) {
      console.warn('SPA navigation failed, falling back to full reload:', error);
      window.location.href = newPath;
    }
  };

  /**
   * Get localized text based on current language
   * @param arabicText - Arabic version of text
   * @param englishText - English version of text
   * @returns Appropriate text for current language
   */
  const getLocalizedText = (arabicText: string | null | undefined, englishText: string | null | undefined): string => {
    if (isArabic) {
      return arabicText || englishText || '';
    }
    return englishText || arabicText || '';
  };

  /**
   * Get navigation URL with current locale
   * @param path - Path without locale (e.g., '/dashboard')
   * @returns Localized path (e.g., '/ar/dashboard')
   */
  const getLocalizedPath = (path: string): string => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${currentLang}/${cleanPath}`;
  };

  return {
    // Core locale info
    currentLang,
    oppositeLanguage,
    
    // Boolean helpers
    isRTL,
    isArabic,
    isEnglish,
    isCurrentLanguage: (lang: string) => lang === currentLang,
    
    // Navigation functions
    buildLanguageUrl,
    switchLanguage,
    getLocalizedPath,
    
    // Content helpers
    getLocalizedText,
    
    // For compatibility with existing formatDate/formatNumber calls
    locale: currentLang
  };
}
