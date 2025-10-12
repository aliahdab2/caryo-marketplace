"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import { isValidLocale } from '@/app/i18n/config';
import type { ComponentProps } from '@/types/components';

type LanguageSwitcherProps = ComponentProps;

const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  ar: { name: 'العربية', flag: '🇸🇾' }
} as const;

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current locale from URL path instead of relying on i18n.language
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLang = (pathSegments.length > 0 && isValidLocale(pathSegments[0])) 
    ? pathSegments[0] 
    : 'en';
  
  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };
  
  const handleLanguageChange = async (language: string) => {
    if (language === currentLang) {
      setIsOpen(false);
      return;
    }

    try {
      // Extract current path without locale (reuse already parsed pathSegments)
      let pathWithoutLocale = '/';
      
      // If first segment is a locale, remove it
      if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
        pathWithoutLocale = '/' + pathSegments.slice(1).join('/');
      } else {
        pathWithoutLocale = pathname;
      }
      
      // Navigate to new locale path
      const newPath = `/${language}${pathWithoutLocale}`;
      console.log(`Language switch: ${pathname} -> ${newPath}`);
      router.push(newPath);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };
  
  return (
    <div 
      className={`relative inline-block ${className || ''}`} 
      ref={dropdownRef}
    >
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200"
        aria-label={t('selectLanguage', 'Select language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="relative">
          {/* Globe icon */}
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-[8px] font-bold uppercase text-gray-700 dark:text-gray-300">
            {currentLang}
          </span>
        </div>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 z-50 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1" role="menu">
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`${
                    currentLang === code
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  role="menuitem"
                >
                  <span className="mr-3 text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {currentLang === code && (
                    <svg className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}