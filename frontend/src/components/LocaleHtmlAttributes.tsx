"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isValidLocale } from '@/app/i18n/config';

export default function LocaleHtmlAttributes() {
  const pathname = usePathname();

  useEffect(() => {
    // Extract locale from URL path (first segment)
    const pathSegments = pathname.split('/').filter(Boolean);
    let currentLocale = 'en'; // default

    if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
      currentLocale = pathSegments[0];
    }

    // Update HTML attributes
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
  }, [pathname]);

  return null; // This component doesn't render anything
}
