"use client";

// Re-export all the values we need from i18n.ts to ensure they're available
// to the rest of the application

import i18nInstance, { 
  LANGUAGES, 
  SupportedLanguage, 
  changeLanguage as i18nChangeLanguage,
  getCurrentLanguage,
  reloadNamespace
} from './i18n';

// Re-export all values
export { 
  LANGUAGES, 
  i18nChangeLanguage as changeLanguage,
  getCurrentLanguage,
  reloadNamespace
};

// Re-export types
export type { SupportedLanguage };

// Re-export the default i18n instance
export default i18nInstance;
