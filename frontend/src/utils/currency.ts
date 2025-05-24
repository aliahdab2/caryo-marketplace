"use client";

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'SYP', name: 'Syrian Pound' },
  { code: 'USD', name: 'US Dollar' }
];

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = 'SYP';

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (e.g., USD, EUR)
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format a currency amount for display
 * @param amount The amount to format
 * @param currency The currency code
 * @returns Formatted amount with currency symbol
 */
export function formatAmount(amount: string | number, currency: string = DEFAULT_CURRENCY): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return formatCurrency(num, currency);
}
