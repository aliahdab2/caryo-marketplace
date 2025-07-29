"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LocaleDetector() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Extract locale from URL pathname
    const urlLocale = pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1];
    
    if (urlLocale && (urlLocale === 'ar' || urlLocale === 'en')) {
      // Update HTML lang and dir attributes
      document.documentElement.lang = urlLocale;
      document.documentElement.dir = urlLocale === 'ar' ? 'rtl' : 'ltr';
      
      // Also set the cookie to match the URL
      document.cookie = `NEXT_LOCALE=${urlLocale}; path=/; max-age=31536000`;
    }
  }, [pathname]);
  
  return null; // This component doesn't render anything
} 