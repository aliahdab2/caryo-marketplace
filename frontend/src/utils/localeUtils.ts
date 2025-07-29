import { useLanguage } from '@/components/EnhancedLanguageProvider';

/**
 * Hook to get the current locale efficiently
 * This is optimized to prevent unnecessary re-renders
 */
export function useCurrentLocale() {
  const { locale } = useLanguage();
  return locale;
}

/**
 * Get locale from URL pathname as a fallback
 * This is useful for components that need locale but don't want to use the hook
 */
export function getLocaleFromPathname(pathname: string): string {
  const pathParts = pathname.split('/').filter(Boolean);
  const firstSegment = pathParts[0];
  
  if (firstSegment === 'en' || firstSegment === 'ar') {
    return firstSegment;
  }
  
  return 'ar'; // Default to Arabic
}

/**
 * Create a locale-aware URL without using hooks
 * This is useful for router.push calls that don't need reactive updates
 */
export function createLocaleAwareUrl(path: string, locale: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${cleanPath}`;
} 