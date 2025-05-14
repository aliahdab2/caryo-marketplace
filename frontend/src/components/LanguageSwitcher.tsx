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
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200"
        aria-label={t('common.selectLanguage', 'Select language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 110 16 8 8 0 010-16zm2.544 12h-1.933v2.759l.078-.009c.203-.216.403-.463.613-.729.423-.536.776-1.106 1.072-1.678l.17-.343zm-3.076 0H7.464a10.86 10.86 0 001.889 2.743c.025.003.01.01.062.013l.053.003V14zm6 0h-1.68c-.325.8-.748 1.569-1.266 2.293a6.779 6.779 0 002.274-1.508c.184-.184.357-.373.517-.576l.156-.209zm-9.255 0H4.531c.203.286.427.54.673.785.66.66 1.432 1.17 2.274 1.508a11.194 11.194 0 01-1.094-1.896L6.214 14zm10.546-3.429h-2.202a10.059 10.059 0 01-.28 1.914l-.098.372h1.97c.294-.6.49-1.287.579-1.986l.031-.3zm-3.346 0H10.61v2.286h2.381a9.081 9.081 0 00.39-1.89l.03-.396zm-3.945 0h-2.88c.04.735.16 1.386.335 1.989l.092.297h2.453v-2.286zm-4.025 0H3.241c.058.7.224 1.4.49 2.024l.12.262h1.97a10.112 10.112 0 01-.35-1.89l-.028-.396zm7.535-3.428h-2.367v2.286h2.8a9.002 9.002 0 00-.341-1.986l-.092-.3zm3.177 0h-1.984c.175.619.294 1.238.354 1.89l.029.396h2.204a6.767 6.767 0 00-.469-1.977l-.134-.31zm-6.687 0H7.015a9.176 9.176 0 00-.394 1.89l-.031.396h2.878V7.143zm-3.64 0H3.845a6.727 6.727 0 00-.566 1.944l-.037.342h2.204c.036-.667.131-1.294.284-1.914l.098-.372zm4.783-3.902V6h1.916a10.725 10.725 0 00-1.867-2.753l-.049-.006zm1.873.444c.44.61.814 1.251 1.118 1.914l.173.401h1.704a6.895 6.895 0 00-.683-.796 6.767 6.767 0 00-2.312-1.519zM9.468 6V3.241l-.075.003c-.013.001-.002.002-.016.004-.211.224-.45.473-.668.751a10.578 10.578 0 00-1.073 1.657L7.466 6h2.002zM7.515 3.685a6.767 6.767 0 00-2.781 2.04L4.52 6h1.703c.33-.806.763-1.582 1.291-2.315z" fill="currentColor" fillRule="evenodd"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute mt-2 right-0 rtl:right-auto rtl:left-0 w-36 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-10 transform transition-all duration-200 ease-out">
          <div className="py-1" role="listbox">
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`flex items-center w-full px-3 py-2 text-sm ${
                locale === 'ar' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={locale === 'ar'}
            >
              {locale === 'ar' && (
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
              <span>{t('common.languages.arabic')}</span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center w-full px-3 py-2 text-sm ${
                locale === 'en' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={locale === 'en'}
            >
              {locale === 'en' && (
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
              <span>{t('common.languages.english')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
