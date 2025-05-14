"use client";

import { SupportedLanguage, LANGUAGES } from './i18n';
import i18n from './i18n';

/**
 * Get the active language from i18n
 * @returns The current language code
 */
function getActiveLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || LANGUAGES.EN;
}

/**
 * Interface for language direction information
 */
export interface LanguageDirectionInfo {
  /** The text direction (rtl or ltr) */
  dir: 'rtl' | 'ltr';
  
  /** Whether the language is RTL */
  isRTL: boolean;
  
  /** CSS class for text direction */
  dirClass: 'text-right' | 'text-left';
  
  /** CSS class for flex direction */
  flexClass: 'flex-row-reverse' | 'flex-row';
  
  /** CSS class for reverse flex */
  reverseFlexClass: 'flex-row' | 'flex-row-reverse';
}

/**
 * Get language direction information for a specific language
 * @param lang The language code to check
 * @returns Language direction information
 */
export function getLanguageDirection(lang?: SupportedLanguage): LanguageDirectionInfo {
  // Default to current language if not specified
  const languageToCheck = lang || getActiveLanguage();
  
  const isRTL = languageToCheck === 'ar';
  
  return {
    dir: isRTL ? 'rtl' : 'ltr',
    isRTL: isRTL,
    dirClass: isRTL ? 'text-right' : 'text-left',
    flexClass: isRTL ? 'flex-row-reverse' : 'flex-row',
    reverseFlexClass: isRTL ? 'flex-row' : 'flex-row-reverse',
  };
}

/**
 * React hook to get current language direction information
 * @returns Language direction information for the current language
 */
export function useLanguageDirection(): LanguageDirectionInfo {
  return getLanguageDirection();
}

/**
 * Helper to determine if the given language is RTL
 * @param lang The language code to check
 * @returns Whether the language is RTL
 */
export function isRTL(lang?: SupportedLanguage): boolean {
  const languageToCheck = lang || getActiveLanguage();
  return languageToCheck === 'ar';
}

/**
 * Apply direction-specific styling based on current language
 * @param ltrValue Value to use when language is LTR
 * @param rtlValue Value to use when language is RTL
 * @returns The appropriate value based on current language direction
 */
export function directionValue<T>(ltrValue: T, rtlValue: T): T {
  return isRTL() ? rtlValue : ltrValue;
}
