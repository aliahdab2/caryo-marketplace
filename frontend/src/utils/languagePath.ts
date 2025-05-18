"use client";

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { SupportedLanguage } from '@/utils/i18n';

/**
 * Interface for language path management options
 */
interface LanguagePathConfig {
  /** Whether to include language in URL paths */
  includeLanguageInPath: boolean;
  
  /** Whether to redirect to localized paths */
  redirectToLocalizedPath: boolean;
  
  /** Paths that should be excluded from language prefixing */
  excludePaths: string[];
  
  /** Default path to redirect to if no language is specified */
  defaultRedirectPath: string;
}

/**
 * Default configuration for language path management
 */
const DEFAULT_CONFIG: LanguagePathConfig = {
  includeLanguageInPath: true,
  redirectToLocalizedPath: true,
  excludePaths: ['/api', '/_next', '/static', '/images', '/favicon.ico'],
  defaultRedirectPath: '/',
};

/**
 * Hook to manage language-related path operations
 * @param config Configuration options for language path management
 * @returns Functions for language path management
 */
export function useLanguagePath(config: Partial<LanguagePathConfig> = {}) {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  
  // Merge provided config with defaults
  const mergedConfig: LanguagePathConfig = { ...DEFAULT_CONFIG, ...config };
  
  /**
   * Check if the current path should be excluded from language handling
   * @param path Path to check
   * @returns Whether the path is excluded
   */
  const isExcludedPath = useCallback((path: string): boolean => {
    return mergedConfig.excludePaths.some(excludePath => path.startsWith(excludePath));
  }, [mergedConfig.excludePaths]);
  
  /**
   * Check if a path segment is a supported language code
   * @param segment Path segment to check
   * @returns Whether the segment is a supported language
   */
  const isSupportedLanguagePathSegment = useCallback((segment: string): boolean => {
    return ['en', 'ar'].includes(segment);
  }, []);
  
  /**
   * Get path with or without language prefix
   * @param path Input path
   * @param lang Language code
   * @returns Path with appropriate language handling
   */
  const getPathWithLanguage = useCallback((path: string, lang: SupportedLanguage): string => {
    // If path shouldn't include language, return as is
    if (!mergedConfig.includeLanguageInPath || isExcludedPath(path)) {
      return path;
    }
    
    // Normalize path and check if it already has a language prefix
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const pathParts = normalizedPath.split('/').filter(Boolean);
    
    // Check if first segment is a language code
    if (pathParts.length > 0 && isSupportedLanguagePathSegment(pathParts[0])) {
      // Replace existing language segment with new language
      pathParts[0] = lang;
      return `/${pathParts.join('/')}`;
    }
    
    // Add language prefix to path
    return `/${lang}${normalizedPath}`;
  }, [mergedConfig.includeLanguageInPath, isExcludedPath, isSupportedLanguagePathSegment]);
  
  // Effect to handle path redirection based on language
  useEffect(() => {
    if (!pathname || !mergedConfig.redirectToLocalizedPath || isExcludedPath(pathname)) {
      return;
    }
    
    const pathParts = pathname.split('/').filter(Boolean);
    const firstSegment = pathParts[0];
    
    // If first segment is not a language code, redirect to localized path
    if (!isSupportedLanguagePathSegment(firstSegment)) {
      router.replace(getPathWithLanguage(pathname, locale));
    }
    // If first segment is a language code but doesn't match current language
    else if (firstSegment !== locale) {
      const restOfPath = `/${pathParts.slice(1).join('/')}`;
      router.replace(getPathWithLanguage(restOfPath, locale));
    }
  }, [pathname, locale, router, getPathWithLanguage, isExcludedPath, isSupportedLanguagePathSegment, mergedConfig.redirectToLocalizedPath]);
  
  /**
   * Get a localized URL based on the current language
   * @param path Path to localize
   * @param lang Optional language override
   * @returns Localized URL
   */
  const getLocalizedUrl = (path: string, lang?: SupportedLanguage): string => {
    return getPathWithLanguage(path, lang || locale);
  };
  
  return {
    getLocalizedUrl,
    currentLanguagePath: getPathWithLanguage(pathname, locale),
  };
}
