"use client";

import { ComponentProps } from "@/types/components";
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { SupportedLanguage } from '@/utils/i18nExports';
import { useManualLanguageOverride } from '@/hooks/useAutomaticLanguageDetection';

type ToggleLanguageSwitcherProps = ComponentProps;

export default function ToggleLanguageSwitcher({ className }: ToggleLanguageSwitcherProps) {
  const { locale, changeLanguage } = useLanguage();
  const { setLanguageManually } = useManualLanguageOverride();

  // Handle language change
  const handleLanguageChange = (lang: SupportedLanguage) => {
    if (lang === locale) {
      return;
    }

    try {
      setLanguageManually(lang);
      changeLanguage(lang);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <div className={`inline-flex items-center ${className || ''}`}>
      {/* Underline Style */}
      <div className="relative flex items-center space-x-6">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`relative pb-1 text-sm font-medium transition-colors duration-200 ${
            locale === 'en'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          aria-label="Switch to English"
        >
          English
          {locale === 'en' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 transform transition-all duration-300 ease-in-out" />
          )}
        </button>
        
        <button
          onClick={() => handleLanguageChange('ar')}
          className={`relative pb-1 text-sm font-medium transition-colors duration-200 ${
            locale === 'ar'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          aria-label="Switch to Arabic"
        >
          العربية
          {locale === 'ar' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 transform transition-all duration-300 ease-in-out" />
          )}
        </button>
      </div>
    </div>
  );
}
