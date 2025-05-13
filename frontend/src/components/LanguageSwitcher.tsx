"use client";

import { useLanguage } from '@/components/LanguageProvider';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();
  const { t } = useTranslation('common');
  
  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {t('common.language')}:
      </span>
      <div className="relative inline-block">
        <select
          value={locale}
          onChange={(e) => changeLanguage(e.target.value)}
          className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
