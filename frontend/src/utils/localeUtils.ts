import { Metadata } from 'next';
import { isValidLocale, type Locale } from '@/app/i18n/config';

/**
 * Common interface for pages with locale params
 */
export interface LocalePageProps {
  params: Promise<{ locale: string; [key: string]: string | string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Extract and validate locale from params
 */
export async function extractLocale(params: Promise<{ locale: string; [key: string]: any }>): Promise<Locale> {
  const { locale } = await params;
  
  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }
  
  return locale;
}

/**
 * Generate locale-aware metadata
 */
export function generateLocaleMetadata(
  locale: Locale,
  title: string,
  description: string,
  path?: string
): Metadata {
  const isRTL = locale === 'ar';
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'ar' ? 'ar_SY' : 'en_US',
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
    alternates: path ? {
      languages: {
        'en': `/en${path}`,
        'ar': `/ar${path}`,
      },
    } : undefined,
    other: {
      'content-language': locale,
      'direction': isRTL ? 'rtl' : 'ltr',
    },
  };
}

/**
 * Parse search params into typed object
 */
export async function parseSearchParams<T = Record<string, any>>(
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
): Promise<T> {
  if (!searchParams) return {} as T;
  
  const params = await searchParams;
  const parsed: Record<string, any> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      // Handle arrays
      if (Array.isArray(value)) {
        parsed[key] = value;
      }
      // Handle comma-separated values
      else if (typeof value === 'string' && value.includes(',')) {
        parsed[key] = value.split(',').map(v => v.trim()).filter(Boolean);
      }
      // Handle single values
      else {
        parsed[key] = value;
      }
    }
  });
  
  return parsed as T;
}

/**
 * Generate locale-aware redirect URL
 */
export function generateLocaleRedirect(locale: Locale, path: string, searchParams?: URLSearchParams): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const query = searchParams?.toString();
  return `/${locale}${cleanPath}${query ? `?${query}` : ''}`;
}

/**
 * Common page wrapper that handles locale extraction and validation
 */
export async function withLocale<T extends LocalePageProps>(
  props: T,
  handler: (locale: Locale, props: T) => Promise<React.ReactNode>
): Promise<React.ReactNode> {
  try {
    const locale = await extractLocale(props.params);
    return await handler(locale, props);
  } catch (error) {
    console.error('Locale extraction error:', error);
    // Return 404 or error page
    throw error;
  }
}
