"use client";

import React, { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SimpleLanguageProviderProps {
  children: ReactNode;
}

/**
 * Simplified language provider that only handles:
 * - Document direction (RTL/LTR)
 * - Document language attribute
 * - Language change events
 *
 * All language detection and persistence is handled by i18next
 */
export default function SimpleLanguageProvider({ children }: SimpleLanguageProviderProps) {
  const { i18n } = useTranslation();

  // Update document attributes when language changes
  useEffect(() => {
    const updateDocumentAttributes = () => {
      if (typeof document === 'undefined') return;

      const isRTL = i18n.language === 'ar';

      // Update document attributes
      document.documentElement.lang = i18n.language;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

      // Add/remove RTL class for styling
      if (isRTL) {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
    };

    // Update on mount
    updateDocumentAttributes();

    // Listen for language changes
    i18n.on('languageChanged', updateDocumentAttributes);

    // Cleanup
    return () => {
      i18n.off('languageChanged', updateDocumentAttributes);
    };
  }, [i18n]);

  return <>{children}</>;
}
