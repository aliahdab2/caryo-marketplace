"use client";

import { ComponentProps } from "@/types/components";
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { SupportedLanguage } from '@/utils/i18nExports';
import { useManualLanguageOverride } from '@/hooks/useAutomaticLanguageDetection';
import { useState, useRef, useEffect } from 'react';

type DropdownLanguageSwitcherProps = ComponentProps;

export default function DropdownLanguageSwitcher({ className }: DropdownLanguageSwitcherProps) {
  const { locale, changeLanguage } = useLanguage();
  const { setLanguageManually } = useManualLanguageOverride();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle language change
  const handleLanguageChange = (lang: SupportedLanguage) => {
    if (lang === locale) {
      setIsOpen(false);
      return;
    }

    try {
      setLanguageManually(lang);
      changeLanguage(lang);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`} ref={dropdownRef}>
      {/* Simple Globe icon */}
      <div className="text-gray-600 dark:text-gray-400">
        <span className="text-base" role="img" aria-label="Language">🌐</span>
      </div>
      
      {/* Custom dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer flex items-center justify-between min-w-[100px]"
          aria-label="اختر اللغة"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          type="button"
        >
          <span>{locale === 'ar' ? 'العربية' : 'English'}</span>
          <svg 
            className={`w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown options */}
        {isOpen && (
          <div 
            className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-100"
            role="listbox"
            aria-label="Language options"
          >
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`w-full px-3 py-2 text-sm text-left rtl:text-right text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 first:rounded-t-md last:rounded-b-md ${
                locale === 'ar' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''
              }`}
              role="option"
              aria-selected={locale === 'ar'}
            >
              العربية
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`w-full px-3 py-2 text-sm text-left rtl:text-right text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 first:rounded-t-md last:rounded-b-md ${
                locale === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''
              }`}
              role="option"
              aria-selected={locale === 'en'}
            >
              English
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
