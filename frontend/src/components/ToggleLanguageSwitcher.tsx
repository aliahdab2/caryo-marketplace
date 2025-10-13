"use client";

import React from 'react';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import type { ComponentProps } from '@/types/components';

type ToggleLanguageSwitcherProps = ComponentProps;

export default function ToggleLanguageSwitcher({ className }: ToggleLanguageSwitcherProps) {
  const { switchLanguage, isCurrentLanguage } = useLanguageSwitching();
  
  // Handle language change using URL navigation
  const handleLanguageChange = (lang: string) => {
    if (isCurrentLanguage(lang)) {
      return; // Already selected
    }

    switchLanguage(lang);
  };

  return (
    <div className={`inline-flex items-center ${className || ''}`}>
      {/* Underline Style */}
      <div className="relative flex items-center gap-4 rtl:gap-4">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`relative pb-1 text-sm font-medium transition-colors duration-200 px-2 ${
            isCurrentLanguage('en')
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          aria-label="Switch to English"
        >
          English
          {isCurrentLanguage('en') && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 transform transition-all duration-300 ease-in-out" />
          )}
        </button>
        
        <button
          onClick={() => handleLanguageChange('ar')}
          className={`relative pb-1 text-sm font-medium transition-colors duration-200 px-2 ${
            isCurrentLanguage('ar')
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          aria-label="Switch to Arabic"
        >
          العربية
          {isCurrentLanguage('ar') && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 transform transition-all duration-300 ease-in-out" />
          )}
        </button>
      </div>
    </div>
  );
}