import { Metadata } from 'next';
import { headers } from 'next/headers';
import NotFoundContent from '@/components/layout/NotFoundContent';
import { isValidLocale, defaultLocale, type Locale } from '../i18n/config';

export const metadata: Metadata = {
  title: 'Page Not Found — Caryo',
  description: 'The page you are looking for could not be found.',
};

/**
 * In-locale 404 boundary. This one renders inside [locale]/layout.tsx, so the
 * i18n provider is available and NotFoundContent translates from the `common`
 * namespace. The map below only covers the first paint, before that namespace
 * has loaded.
 *
 * Next.js does not pass params to a not-found boundary, so the locale comes
 * from the x-locale header that proxy.ts forwards — the same source the root
 * layout uses for lang/dir.
 *
 * Because proxy.ts prefixes a locale onto any unprefixed path, this is the
 * boundary almost every 404 actually reaches.
 */
const FIRST_PAINT: Record<Locale, { heading: string; message: string; goHome: string; searchListings: string }> = {
  en: {
    heading: 'Page Not Found',
    message: 'The page you are looking for could not be found.',
    goHome: 'Go Home',
    searchListings: 'Search Listings',
  },
  ar: {
    heading: 'الصفحة غير موجودة',
    message: 'تعذّر العثور على الصفحة التي تبحث عنها.',
    goHome: 'الذهاب إلى الرئيسية',
    searchListings: 'ابحث في الإعلانات',
  },
};

export default async function LocaleNotFound() {
  const headerLocale = (await headers()).get('x-locale');
  const locale: Locale = headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale;

  return <NotFoundContent fallback={FIRST_PAINT[locale]} />;
}
