"use client";

import { useTranslation as useI18nTranslation } from 'react-i18next';
import enCommon from '../../public/locales/en/common.json';

/**
 * Type for recursive partial keys of translation namespace
 * This helps with type-safe translation key paths
 */
type TranslationPath<T> = T extends object
  ? { 
      [K in keyof T]: 
        K extends string 
          ? `${K}` | `${K}.${TranslationPath<T[K]>}` 
          : never 
    }[keyof T & string]
  : '';

/**
 * Type for common namespace keys
 */
export type CommonKeys = TranslationPath<typeof enCommon>;

/**
 * Enhanced useTranslation hook with type safety for keys
 * @returns Type-safe translation functions and i18n utilities
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation('common');
  
  /**
   * Type-safe translation function for common namespace
   * @param key Translation key with type checking
   * @param options Translation options including variables
   * @returns Translated text
   */
  const tSafe = (key: CommonKeys, options?: Record<string, unknown>): string => {
    return t(key, options);
  };
  
  /**
   * Check if a translation key exists
   * @param key Translation key to check
   * @returns Whether the key exists in the translation files
   */
  const hasTranslation = (key: string): boolean => {
    return i18n.exists(key, { ns: 'common' });
  };
  
  return { 
    t: tSafe, 
    i18n, 
    hasTranslation,
    changeLanguage: i18n.changeLanguage,
    language: i18n.language
  };
}
