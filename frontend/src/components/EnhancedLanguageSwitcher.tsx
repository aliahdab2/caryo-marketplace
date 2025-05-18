"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from './EnhancedLanguageProvider';
import { SupportedLanguage } from '@/utils/i18n';
import { useTranslation } from '@/utils/useTranslation';

interface LanguageSwitcherProps {
  /** Optional additional CSS classes */
  className?: string;
  
  /** Whether to show language names (defaults to true) */
  showNames?: boolean;
  
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Enhanced language switcher component with dropdown
 */
export default function EnhancedLanguageSwitcher({ 
  className = '', 
  showNames = true,
  size = 'medium'
}: LanguageSwitcherProps) {
  const { locale, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const languageButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Size-specific classes
  const sizeClasses = {
    small: {
      button: 'text-xs py-1 px-2',
      dropdown: 'w-24',
      item: 'py-1 px-2 text-xs'
    },
    medium: {
      button: 'text-sm py-1.5 px-3',
      dropdown: 'w-32',
      item: 'py-2 px-3 text-sm'
    },
    large: {
      button: 'text-base py-2 px-4',
      dropdown: 'w-40', 
      item: 'py-2.5 px-4 text-base'
    }
  };
  
  // Language options with localized names
  const languages = [
    { code: 'en' as SupportedLanguage, name: t('languages.english') },
    { code: 'ar' as SupportedLanguage, name: t('languages.arabic') }
  ];
  
  // Find current language info
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, dropdownRef]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isOpen && ['Escape', 'Tab'].includes(e.key)) {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Focus on first or last option based on arrow key
        const focusIndex = e.key === 'ArrowDown' ? 0 : languageButtonsRef.current.length - 1;
        languageButtonsRef.current[focusIndex]?.focus();
      }
    }
  };
  
  // Handle keyboard navigation within the dropdown
  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number, lang: SupportedLanguage) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLanguageChange(lang);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      
      // Calculate the next index to focus on
      const nextIndex = e.key === 'ArrowDown' 
        ? (index + 1) % languageButtonsRef.current.length 
        : (index - 1 + languageButtonsRef.current.length) % languageButtonsRef.current.length;
      
      languageButtonsRef.current[nextIndex]?.focus();
    }
  };
  
  // Changing language
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setIsOpen(false);
    if (lang !== locale) {
      await changeLanguage(lang);
    }
    // Return focus to the main button
    buttonRef.current?.focus();
  };
  
  // Preload language resources on hover
  const handleLanguageHover = (lang: SupportedLanguage) => {
    if (lang !== locale) {
      try {
        import(`../../public/locales/${lang}/common.json`);
      } catch {
        // Ignore errors
      }
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        id="enhanced-language-button"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md ${sizeClasses[size].button} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? "enhanced-language-menu" : undefined}
        aria-label={t('selectLanguage')}
      >
        <div className="relative">
          {locale === 'en' ? (
            <span role="img" aria-hidden="true" className="text-base">
              🇬🇧
            </span>
          ) : (
            <span role="img" aria-hidden="true" className="text-base">
              🇦🇪
            </span>
          )}
        </div>
        {showNames && (
          <>
            <span className="font-medium">
              {currentLanguage.name}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
      
      {isOpen && (
        <div 
          id="enhanced-language-menu"
          className={`absolute mt-1 ${sizeClasses[size].dropdown} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 overflow-hidden animate-fadeIn`}
          style={{ [isRTL ? 'right' : 'left']: 0 }}
          role="listbox"
          aria-labelledby="enhanced-language-button"
          aria-orientation="vertical"
        >
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              ref={(el) => { languageButtonsRef.current[index] = el; }}
              className={`block w-full text-left ${sizeClasses[size].item} ${locale === lang.code ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => handleLanguageChange(lang.code)}
              onMouseEnter={() => handleLanguageHover(lang.code)}
              onKeyDown={(e) => handleOptionKeyDown(e, index, lang.code)}
              role="option"
              aria-selected={locale === lang.code}
              tabIndex={0}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium mr-2 rtl:ml-2 rtl:mr-0">
                    {lang.code.toUpperCase()}
                  </span>
                  <span>{lang.name}</span>
                </div>
                {locale === lang.code && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
