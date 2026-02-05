import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale } from './app/i18n/config';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/locales') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.map')
  ) {
    return;
  }

  // Check if the pathname already contains a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Extract the locale from the path to update the cookie for persistence
    const localeInPath = locales.find(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    const response = NextResponse.next();
    
    // Sync cookie with the URL locale so subsequent requests respect the switch
    if (localeInPath) {
      const currentCookie = request.cookies.get('NEXT_LOCALE')?.value;
      // Only set cookie if it's different to prevent redundant Set-Cookie headers
      if (currentCookie !== localeInPath) {
        response.cookies.set('NEXT_LOCALE', localeInPath, {
          path: '/',
          maxAge: 31536000, // 1 year
          sameSite: 'lax',
        });
      }
    }
    
    return response;
  }

  // Determine the preferred locale
  let locale = defaultLocale;

  // 1. Try to get locale from cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    // 2. Fallback to Accept-Language header
    const acceptLanguageHeader = request.headers.get('accept-language');
    if (acceptLanguageHeader) {
      const preferredLanguages = acceptLanguageHeader.split(',').map(lang => lang.split(';')[0].trim());
      for (const lang of preferredLanguages) {
        if (isValidLocale(lang)) {
          locale = lang;
          break;
        }
        // Also check for language codes like 'ar-SA' -> 'ar'
        const langCode = lang.split('-')[0];
        if (isValidLocale(langCode)) {
          locale = langCode;
          break;
        }
      }
    }
  }

  // Redirect to the determined locale
  const redirectUrl = new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url);
  
  // Set the locale cookie for future requests
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  });
  
  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api (API routes)
    // - locales (i18n translation files)
    '/((?!api|_next/static|_next/image|favicon.ico|locales).*)',
  ],
};
