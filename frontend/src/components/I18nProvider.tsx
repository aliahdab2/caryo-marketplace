"use client";

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/utils/i18n';
import { I18nextProvider } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This effect ensures that the component only renders on the client side
    // to avoid hydration mismatches with i18next
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 
      localStorage.getItem('NEXT_LOCALE') || 
      'ar';
    
    // Set the i18next language to match the saved locale
    i18n.changeLanguage(savedLocale).then(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    // Return null or a simple loading state until the component mounts
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
