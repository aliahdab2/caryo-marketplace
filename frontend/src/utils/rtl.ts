/**
 * Consolidated RTL (Right-to-Left) utilities
 * 
 * This file consolidates all RTL-related logic to eliminate duplication
 * and provide a single source of truth for directional logic.
 */

"use client";

import { useEffect, useState } from 'react';
import { LANGUAGES, SupportedLanguage } from './i18n';
import i18n from './i18n';

/**
 * Get the active language from i18n
 * @returns The current language code
 */
function getActiveLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || LANGUAGES.EN;
}

/**
 * Checks if a language is RTL (Right-to-Left)
 * @param language The language code to check (optional, uses current language if not provided)
 * @returns Whether the language is RTL
 */
export function isRTL(language?: SupportedLanguage | string): boolean {
  const lang = language || getActiveLanguage();
  return lang === LANGUAGES.AR;
}

/**
 * Interface for comprehensive language direction information
 */
export interface DirectionInfo {
  /** The text direction (rtl or ltr) */
  dir: 'rtl' | 'ltr';
  
  /** Whether the language is RTL */
  isRTL: boolean;
  
  /** Whether the language is LTR */
  isLTR: boolean;
  
  /** CSS class for text direction */
  dirClass: 'text-right' | 'text-left';
  
  /** CSS class for flex direction */
  flexClass: 'flex-row-reverse' | 'flex-row';
  
  /** CSS class for reverse flex direction */
  reverseFlexClass: 'flex-row' | 'flex-row-reverse';
}

/**
 * Get comprehensive direction information for a language
 * @param lang The language code (optional, uses current language if not provided)
 * @returns Complete direction information object
 */
export function getDirectionInfo(lang?: SupportedLanguage | string): DirectionInfo {
  const languageToCheck = lang || getActiveLanguage();
  const rtl = isRTL(languageToCheck);
  
  return {
    dir: rtl ? 'rtl' : 'ltr',
    isRTL: rtl,
    isLTR: !rtl,
    dirClass: rtl ? 'text-right' : 'text-left',
    flexClass: rtl ? 'flex-row-reverse' : 'flex-row',
    reverseFlexClass: rtl ? 'flex-row' : 'flex-row-reverse',
  };
}

/**
 * Get RTL-aware CSS class names
 * @param baseClasses Base CSS classes that apply to all directions
 * @param ltrClasses Classes that only apply in LTR mode
 * @param rtlClasses Classes that only apply in RTL mode
 * @param language Current language code (optional, will use current language if not provided)
 * @returns Combined CSS classes based on current direction
 */
export function getDirectionalClasses(
  baseClasses: string = '',
  ltrClasses: string = '',
  rtlClasses: string = '',
  language?: SupportedLanguage | string
): string {
  const rtl = isRTL(language);
  return `${baseClasses} ${rtl ? rtlClasses : ltrClasses}`.trim();
}

/**
 * Apply direction-specific values based on current language
 * @param ltrValue Value to use when language is LTR
 * @param rtlValue Value to use when language is RTL
 * @param language Current language code (optional, will use current language if not provided)
 * @returns The appropriate value based on language direction
 */
export function directionValue<T>(
  ltrValue: T, 
  rtlValue: T, 
  language?: SupportedLanguage | string
): T {
  return isRTL(language) ? rtlValue : ltrValue;
}

/**
 * React hook for language direction with real-time updates
 * 
 * This hook provides comprehensive direction information and automatically
 * updates when the language changes or document direction changes.
 * 
 * @returns Direction information object with utilities
 */
export function useLanguageDirection(): DirectionInfo & {
  getClasses: (base?: string, ltr?: string, rtl?: string) => string;
  getValue: <T>(ltrValue: T, rtlValue: T) => T;
} {
  const [directionInfo, setDirectionInfo] = useState<DirectionInfo>(() => 
    getDirectionInfo()
  );

  useEffect(() => {
    const updateDirection = () => {
      setDirectionInfo(getDirectionInfo());
    };

    // Listen for language changes
    i18n.on('languageChanged', updateDirection);

    // Listen for document direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'dir') {
          updateDirection();
        }
      });
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['dir'] 
      });
    }

    return () => {
      i18n.off('languageChanged', updateDirection);
      observer.disconnect();
    };
  }, []);

  return {
    ...directionInfo,
    getClasses: (baseClasses = '', ltrClasses = '', rtlClasses = '') =>
      getDirectionalClasses(baseClasses, ltrClasses, rtlClasses),
    getValue: <T>(ltrValue: T, rtlValue: T) =>
      directionValue(ltrValue, rtlValue),
  };
}

/**
 * Hook to manage document direction (for compatibility)
 * @deprecated Use useLanguageDirection instead for better language integration
 */
export function useDirection() {
  const { dir, isRTL: rtl, isLTR: ltr, getClasses } = useLanguageDirection();
  
  return {
    direction: dir,
    isRTL: rtl,
    isLTR: ltr,
    getClasses,
  };
}

// Legacy exports for backward compatibility
export { getDirectionInfo as getLanguageDirection };
export { useLanguageDirection as useRTL };

/**
 * @deprecated Use isRTL from this module instead
 */
export { isRTL as isRTLLanguage };

/**
 * @deprecated Use directionValue from this module instead  
 */
export { directionValue as rtlValue };
