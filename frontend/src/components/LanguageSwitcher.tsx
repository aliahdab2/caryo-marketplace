"use client";

import { useLanguage } from '@/components/LanguageProvider';
import { useTranslation } from 'react-i18next';
import { useState, useRef } from 'react';

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Function to handle clicks outside the dropdown
  const handleClickOutside = () => {
    // Small delay to allow the click event on menu items to register first
    setTimeout(() => setIsOpen(false), 100);
  };
  
  // Function to handle language change
  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
    setIsOpen(false);
  };
  
  return (
    <div 
      className="relative inline-block" 
      ref={dropdownRef}
      onBlur={handleClickOutside}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{locale === 'ar' ? 'العربية' : 'English'}</span>
        <svg className={`w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute mt-1 right-0 rtl:right-auto rtl:left-0 w-28 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-10 animate-fadeIn">
          <div className="py-1" role="listbox">
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`block w-full text-right px-4 py-2 text-sm ${locale === 'ar' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              role="option"
              aria-selected={locale === 'ar'}
            >
              العربية
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`block w-full text-left px-4 py-2 text-sm ${locale === 'en' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              role="option"
              aria-selected={locale === 'en'}
            >
              English
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
