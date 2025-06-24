"use client";

import { ComponentProps } from "@/types/components";
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { SupportedLanguage } from '@/utils/i18nExports';
import { useManualLanguageOverride } from '@/hooks/useAutomaticLanguageDetection';

type LanguageSwitcherProps = ComponentProps;

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, changeLanguage } = useLanguage();
  const { setLanguageManually } = useManualLanguageOverride();
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const languageButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Function to handle clicks outside the dropdown with debounce
  const handleClickOutside = (event: MouseEvent) => {
    // Check if click target is descendant of dropdown
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      // Small timeout to prevent flickering and race conditions
      setTimeout(() => {
        setIsOpen(false);
      }, 50);
    }
  };
  
  // Add event listener for clicks outside when dropdown is open
  useEffect(() => {
    // Use a small delay to attach the listener to prevent immediate closing
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isOpen) {
      timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup on unmount or when isOpen changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
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
  
  // Function to handle language change with improved stability
  const handleLanguageChange = (lang: SupportedLanguage) => {
    // First close the dropdown and blur all elements to prevent focus issues
    setIsOpen(false);
    
    // Only proceed if language is actually different to avoid unnecessary page refreshes
    if (lang === locale) {
      buttonRef.current?.focus();
      return;
    }
    
    // Add a loading indicator class to the body to indicate language switching
    if (typeof document !== 'undefined') {
      document.body.classList.add('language-switching');
    }
    
    // Use a longer delay to ensure UI elements have settled
    setTimeout(() => {
      try {
        // Mark that the user has manually chosen a language
        setLanguageManually(lang);
        
        // Change the language
        changeLanguage(lang);
        
        // Return focus to the main button
        buttonRef.current?.focus();
      } catch (error) {
        console.error('Failed to switch language:', error);
      } finally {
        // Remove loading indicator
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document.body.classList.remove('language-switching');
          }, 500); // Additional delay to ensure loading state is visible
        }
      }
    }, 150); // Longer delay for stability
  };
  
  return (
    <div 
      className={`relative inline-block ${className || ''}`} 
      ref={dropdownRef}
    >
      <button 
        id="language-button"
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          setIsOpen(!isOpen);
        }}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200 mobile-touch-friendly"
        aria-label={t('selectLanguage', 'Select language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? "language-menu" : undefined}
      >
        <div className="relative">
          {/* Simplified globe icon */}
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-[8px] font-bold uppercase text-gray-700 dark:text-gray-300">
            {locale}
          </span>
        </div>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Desktop dropdown */}
          <div 
            id="language-menu-desktop"
            className="hidden sm:block absolute mt-2 right-0 rtl:right-auto rtl:left-0 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-button"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling
          >
            <div className="py-1" role="listbox">
              <button
                ref={(el) => { languageButtonsRef.current[0] = el; }}
                onClick={() => handleLanguageChange('ar')}
                onKeyDown={(e) => handleOptionKeyDown(e, 0, 'ar')}
                className={`flex items-center w-full px-4 py-3 text-sm ${
                  locale === 'ar' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={locale === 'ar'}
                tabIndex={0}
              >
                <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium mr-3 rtl:ml-3 rtl:mr-0">العربية</span>
                <span>{t('languages.arabic')}</span>
                {locale === 'ar' && (
                  <svg className="ml-auto w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                )}
              </button>
              <button
                ref={(el) => { languageButtonsRef.current[1] = el; }}
                onClick={() => handleLanguageChange('en')}
                onKeyDown={(e) => handleOptionKeyDown(e, 1, 'en')}
                className={`flex items-center w-full px-4 py-3 text-sm ${
                  locale === 'en' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={locale === 'en'}
                tabIndex={0}
              >
                <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium mr-3 rtl:ml-3 rtl:mr-0">EN</span>
                <span>{t('languages.english')}</span>
                {locale === 'en' && (
                  <svg className="ml-auto w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile bottom sheet */}
          <div 
            id="language-menu-mobile"
            className="sm:hidden mobile-dropdown bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            </div>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 id="language-sheet-title" className="text-lg font-medium text-center text-gray-900 dark:text-white">
                {t('selectLanguage', 'Select Language')}
              </h3>
            </div>
            <div className="p-2" role="listbox">
              <button
                ref={(el) => { languageButtonsRef.current[0] = el; }}
                onClick={() => handleLanguageChange('ar')}
                onKeyDown={(e) => handleOptionKeyDown(e, 0, 'ar')}
                className={`flex items-center w-full px-4 py-4 text-sm ${
                  locale === 'ar' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={locale === 'ar'}
                tabIndex={0}
              >
                <span className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium mr-4 rtl:ml-4 rtl:mr-0">العربية</span>
                <span className="text-base">{t('languages.arabic')}</span>
                {locale === 'ar' && (
                  <svg className="ml-auto w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                )}
              </button>
              <button
                ref={(el) => { languageButtonsRef.current[1] = el; }}
                onClick={() => handleLanguageChange('en')}
                onKeyDown={(e) => handleOptionKeyDown(e, 1, 'en')}
                className={`flex items-center w-full px-4 py-4 text-sm ${
                  locale === 'en' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={locale === 'en'}
                tabIndex={0}
              >
                <span className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium mr-4 rtl:ml-4 rtl:mr-0">EN</span>
                <span className="text-base">{t('languages.english')}</span>
                {locale === 'en' && (
                  <svg className="ml-auto w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                )}
              </button>
              {/* Add some padding to bottom for safe area */}
              <div className="h-6"></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
