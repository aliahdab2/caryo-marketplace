"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { SupportedLanguage } from '@/utils/i18nExports';

/**
 * Custom hook for automatic language detection based on browser settings
 * This runs once on app initialization and sets the language automatically
 */
export function useAutomaticLanguageDetection() {
  const { changeLanguage, locale } = useLanguage();

  useEffect(() => {
    // Only run automatic detection if no language has been explicitly set
    const hasManuallySetLanguage = localStorage.getItem('caryo-language-manually-set');
    
    if (!hasManuallySetLanguage) {
      // Get browser language preference
      const browserLanguage = navigator.language || navigator.languages?.[0];
      
      // Determine the appropriate language based on browser settings
      let detectedLanguage: SupportedLanguage = 'en'; // Default fallback
      
      if (browserLanguage) {
        // Check if browser language starts with Arabic locale codes
        if (browserLanguage.startsWith('ar')) {
          detectedLanguage = 'ar';
        }
        // Add more language detections as needed
        // else if (browserLanguage.startsWith('fr')) {
        //   detectedLanguage = 'fr';
        // }
      }
      
      // Only change language if it's different from current
      if (locale !== detectedLanguage) {
        console.log(`Auto-detecting language: ${detectedLanguage} (browser: ${browserLanguage})`);
        changeLanguage(detectedLanguage);
        
        // Mark that we've performed automatic detection
        localStorage.setItem('caryo-language-auto-detected', 'true');
      }
    }
  }, [changeLanguage, locale]);
}

/**
 * Hook to manually override automatic language detection
 * Call this when user explicitly changes language in settings
 */
export function useManualLanguageOverride() {
  const { changeLanguage } = useLanguage();

  const setLanguageManually = (language: SupportedLanguage) => {
    // Set flag that user has manually chosen a language
    localStorage.setItem('caryo-language-manually-set', 'true');
    localStorage.setItem('caryo-preferred-language', language);
    changeLanguage(language);
  };

  return { setLanguageManually };
}
