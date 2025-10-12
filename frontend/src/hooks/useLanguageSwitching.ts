"use client";

import { usePathname } from 'next/navigation';
import { isValidLocale } from '@/app/i18n/config';

/**
 * Custom hook for language switching logic
 * Consolidates common language switching functionality across components
 */
export function useLanguageSwitching() {
  const pathname = usePathname();

  // Extract current locale from URL path instead of relying on i18n.language
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLang = (pathSegments.length > 0 && isValidLocale(pathSegments[0])) 
    ? pathSegments[0] 
    : 'en';

  // Get the opposite language
  const oppositeLanguage = currentLang === 'en' ? 'ar' : 'en';

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
   * Switch to target language with reliable navigation
   * @param targetLang - Target language code
   * @param debug - Whether to log debug information
   */
  const switchLanguage = (targetLang: string, debug = false) => {
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
        newPath
      });
    }

    // Use window.location.href for reliable navigation in protected routes
    window.location.href = newPath;
  };

  return {
    currentLang,
    oppositeLanguage,
    buildLanguageUrl,
    switchLanguage,
    isCurrentLanguage: (lang: string) => lang === currentLang
  };
}
