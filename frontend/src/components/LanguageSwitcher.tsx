"use client";

import { useLanguage } from '@/components/LanguageProvider';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import i18n from '@/utils/i18n';

export default function LanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Function to handle clicks outside the dropdown
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };
  
  // Add event listener for clicks outside when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Function to handle language change
  const handleLanguageChange = (lang: string) => {
    setIsOpen(false); // Close dropdown first
    
    // Small delay before changing language to allow UI to update
    setTimeout(() => {
      if (lang !== locale) {
        changeLanguage(lang);
      }
    }, 10);
  };
  
  return (
    <div 
      className="relative inline-block" 
      ref={dropdownRef}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{locale === 'ar' ? t('common.languages.arabic') : t('common.languages.english')}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute mt-2 right-0 rtl:right-auto rtl:left-0 w-36 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-10 transform transition-all duration-200 ease-out">
          <div className="py-1" role="listbox">
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`flex items-center w-full px-4 py-2.5 text-sm ${
                locale === 'ar' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={locale === 'ar'}
            >
              {locale === 'ar' && (
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
              <span className={locale === 'ar' ? 'mr-2' : ''}>{t('common.languages.arabic')}</span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center w-full px-4 py-2.5 text-sm ${
                locale === 'en' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={locale === 'en'}
            >
              {locale === 'en' && (
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
              <span className={locale === 'en' ? 'mr-2' : ''}>{t('common.languages.english')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
