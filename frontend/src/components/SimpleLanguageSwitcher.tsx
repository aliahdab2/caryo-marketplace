"use client";

import { ComponentProps } from "@/types/components";
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { SupportedLanguage } from '@/utils/i18nExports';
import { useManualLanguageOverride } from '@/hooks/useAutomaticLanguageDetection';

type SimpleLanguageSwitcherProps = ComponentProps;

export default function SimpleLanguageSwitcher({ className }: SimpleLanguageSwitcherProps) {
  const { locale, changeLanguage } = useLanguage();
  const { setLanguageManually } = useManualLanguageOverride();

  // Function to handle language change
  const handleLanguageChange = (lang: SupportedLanguage) => {
    // Only proceed if language is actually different
    if (lang === locale) {
      return;
    }

    try {
      // Mark that the user has manually chosen a language
      setLanguageManually(lang);
      
      // Change the language
      changeLanguage(lang);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
          locale === 'en'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        English
      </button>
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
          locale === 'ar'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        العربية
      </button>
    </div>
  );
}
