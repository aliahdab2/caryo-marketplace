"use client";

import { useLanguage } from '@/components/LanguageProvider';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();
  
  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 sm:py-2 px-3 sm:px-4 pr-7 sm:pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium transition-colors"
        aria-label="Select language"
      >
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center px-1.5 sm:px-2 text-gray-700 dark:text-gray-300">
        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}
