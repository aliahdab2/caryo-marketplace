"use client";

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook that returns a price formatter based on the current language and currency
 * @param currency - Currency code (defaults to SAR)
 * @returns Intl.NumberFormat instance configured for the specified currency
 */
export function useCurrencyFormatter(currency = 'SAR') {
  const { i18n } = useTranslation();
  
  return useMemo(() => {
    return new Intl.NumberFormat(
      i18n.language === 'ar' ? 'ar-SA' : 'en-US', 
      { 
        style: 'currency', 
        currency 
      }
    );
  }, [i18n.language, currency]);
}

/**
 * Format a number as currency without React hooks
 * @param amount - Amount to format
 * @param currency - Currency code (defaults to SAR)
 * @param locale - Locale for formatting (defaults to en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'SAR', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'USD', name: 'US Dollar' }
];

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = 'SAR';
