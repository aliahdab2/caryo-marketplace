"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation resources
import enCommon from "../../public/locales/en/common.json";
import arCommon from "../../public/locales/ar/common.json";

// Get the current language from cookie or localStorage if available
const getCurrentLanguage = (): string => {
  if (typeof document !== 'undefined') {
    // Check cookie first
    const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
    if (match) return match[2];
    
    // Then check localStorage
    const localLang = localStorage.getItem('NEXT_LOCALE');
    if (localLang) return localLang;
    
    // If no saved preference, check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ar' || browserLang === 'en') {
      return browserLang;
    }
  }
  return 'ar'; // Default to Arabic
};

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: {
        common: enCommon,
        translation: enCommon, // Add translation namespace as an alias to common
      },
      ar: {
        common: arCommon,
        translation: arCommon, // Add translation namespace as an alias to common
      },
    },
    ns: ['common', 'translation'],
    defaultNS: 'common',
    lng: getCurrentLanguage(), // Get initial language dynamically
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false, // Not needed for React
    },
    detection: {
      order: ["cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["cookie", "localStorage"],
      lookupCookie: "NEXT_LOCALE",
      lookupLocalStorage: "NEXT_LOCALE",
    }
  });

export default i18n;
