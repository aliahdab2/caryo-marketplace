"use client";

import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from 'next/navigation';
import { isValidLocale } from '@/app/i18n/config';
import { MdLanguage } from "react-icons/md";

export default function NavbarLanguageSwitcher() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current locale from URL path instead of relying on i18n.language
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLang = (pathSegments.length > 0 && isValidLocale(pathSegments[0])) 
    ? pathSegments[0] 
    : 'en';
    
  // Get the opposite language
  const oppositeLanguage = currentLang === 'en' ? 'ar' : 'en';
  const oppositeLanguageLabel = oppositeLanguage === 'en' ? 'EN' : 'AR';

  const handleLanguageSwitch = async () => {
    try {
      // Extract current path without locale (reuse already parsed pathSegments)
      let pathWithoutLocale = '/';
      
      // If first segment is a locale, remove it
      if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
        pathWithoutLocale = '/' + pathSegments.slice(1).join('/');
      } else {
        pathWithoutLocale = pathname;
      }
      
      // Navigate to new locale path
      const newPath = `/${oppositeLanguage}${pathWithoutLocale}`;
      console.log(`🔄 Language switch debug:`, {
        currentPath: pathname,
        currentLang,
        oppositeLanguage,
        pathSegments,
        pathWithoutLocale,
        newPath
      });
      
      // Try window.location.href as fallback for reliability
      window.location.href = newPath;
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <button
      onClick={handleLanguageSwitch}
      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
      aria-label={`Switch to ${oppositeLanguage === 'en' ? 'English' : 'العربية'}`}
      title={`Switch to ${oppositeLanguage === 'en' ? 'English' : 'العربية'}`}
    >
      <MdLanguage className="h-5 w-5 mb-1 flex-shrink-0" />
      <span className="text-xs leading-tight font-medium">{oppositeLanguageLabel}</span>
    </button>
  );
}