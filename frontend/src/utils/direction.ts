"use client";

import { LANGUAGES } from './i18n';
import { useEffect, useState } from 'react';

/**
 * Checks if a language is RTL (Right-to-Left)
 * @param language The language code to check
 * @returns Whether the language is RTL
 */
export function isRTL(language?: string): boolean {
  return language === LANGUAGES.AR;
}

/**
 * Get RTL-aware CSS class names
 * @param baseClasses Base CSS classes that apply to all directions
 * @param ltrClasses Classes that only apply in LTR mode
 * @param rtlClasses Classes that only apply in RTL mode
 * @param language Current language code (optional, will use document direction if not provided)
 * @returns Combined CSS classes based on current direction
 */
export function getDirectionalClasses(
  baseClasses: string = '',
  ltrClasses: string = '',
  rtlClasses: string = '',
  language?: string
): string {
  const rtl = language 
    ? isRTL(language) 
    : (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  
  return `${baseClasses} ${rtl ? rtlClasses : ltrClasses}`.trim();
}

/**
 * Hook to manage and get the current document direction
 * @returns Object with direction information and utilities
 */
export function useDirection() {
  // Default to document direction if available, otherwise assume LTR
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(
    typeof document !== 'undefined' 
      ? document.documentElement.dir as 'rtl' | 'ltr' || 'ltr'
      : 'ltr'
  );

  // Update direction when document changes
  useEffect(() => {
    const handleDirChange = () => {
      setDirection(document.documentElement.dir as 'rtl' | 'ltr' || 'ltr');
    };
    
    // Set initial direction
    handleDirChange();
    
    // Observe HTML element for direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'dir') {
          handleDirChange();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  return {
    direction,
    isRTL: direction === 'rtl',
    isLTR: direction === 'ltr',
    getClasses: (baseClasses: string = '', ltrClasses: string = '', rtlClasses: string = '') => 
      getDirectionalClasses(baseClasses, ltrClasses, rtlClasses),
  };
}
