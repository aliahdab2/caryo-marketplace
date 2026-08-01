import { Metadata } from 'next';
import { headers } from 'next/headers';
import NotFoundContent from '@/components/layout/NotFoundContent';
import { isValidLocale, defaultLocale, type Locale } from './i18n/config';

export const metadata: Metadata = {
  title: 'Page Not Found — Caryo',
  description: 'The page you are looking for could not be found.',
};

/**
 * This boundary sits ABOVE the [locale] segment, so the i18n provider — which
 * lives in [locale]/layout.tsx — is not in its tree and translation JSON cannot
 * be loaded here. The strings are therefore resolved server-side from the
 * locale that proxy.ts forwarded on the x-locale header, mirroring how the root
 * layout resolves lang/dir.
 *
 * Most 404s never reach here: proxy.ts prefixes a locale onto unprefixed paths,
 * so an unknown path resolves inside [locale] and hits the fully translated
 * [locale]/not-found.tsx instead. This one covers the remainder — chiefly an
 * invalid locale segment, where [locale]/layout.tsx itself calls notFound().
 */
const FALLBACKS: Record<Locale, { heading: string; message: string; goHome: string; searchListings: string }> = {
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

export default async function NotFound() {
  const headerLocale = (await headers()).get('x-locale');
  const locale: Locale = headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale;

  return <NotFoundContent fallback={FALLBACKS[locale]} />;
}
