"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ComponentProps } from '@/types/components';

type ToggleLanguageSwitcherProps = ComponentProps;

export default function ToggleLanguageSwitcher({ className }: ToggleLanguageSwitcherProps) {
  const { i18n } = useTranslation();
  
  // Handle language change using i18next directly
  const handleLanguageChange = async (lang: string) => {
    if (lang === i18n.language) {
      return; // Already selected
    }

    try {
      // i18next handles persistence automatically via its detection config
      await i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <div className={`inline-flex items-center ${className || ''}`}>
      {/* Underline Style */}
      <div className="relative flex items-center gap-4 rtl:gap-4">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`relative pb-1 text-sm font-medium transition-colors duration-200 px-2 ${
            i18n.language === 'en'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          aria-label="Switch to English"
        >
          English
          {i18n.language === 'en' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 transform transition-all duration-300 ease-in-out" />
          )}
        </button>
        
        <button
          onClick={() => handleLanguageChange('ar')}
          className={`relative pb-1 text-sm font-medium transition-colors duration-200 px-2 ${
            i18n.language === 'ar'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          aria-label="Switch to Arabic"
        >
          العربية
          {i18n.language === 'ar' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 transform transition-all duration-300 ease-in-out" />
          )}
        </button>
      </div>
    </div>
  );
}