"use client";

/**
 * Currency configuration for the Syrian marketplace.
 * 
 * This module provides comprehensive currency handling for the Caryo marketplace,
 * supporting both USD (primary for car sales) and SYP (local currency).
 */

/**
 * Currency interface for type safety
 */
export interface Currency {
  code: string;
  name: string;
  nameAr: string;
  symbol: string;
  decimalPlaces: number;
  description: string;
  isDefault?: boolean;
  isLocal?: boolean;
}

/**
 * Comprehensive list of supported currencies with metadata
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    symbol: '$',
    decimalPlaces: 2,
    description: 'US Dollar',
    isDefault: true,
    isLocal: false
  },
  {
    code: 'SYP',
    name: 'Syrian Pound',
    nameAr: 'ليرة سورية',
    symbol: 'SYR',
    decimalPlaces: 0,
    description: 'Syrian Pound',
    isDefault: false,
    isLocal: true
  }
];

/**
 * Currency codes only for simple operations
 */
export const CURRENCY_CODES = SUPPORTED_CURRENCIES.map(currency => currency.code);

/**
 * Default currency code - USD is most common for car sales in Syria
 */
export const DEFAULT_CURRENCY = 'USD';

/**
 * Local currency code for Syria
 */
export const LOCAL_CURRENCY = 'SYP';

/**
 * Currency map for quick lookups
 */
export const CURRENCY_MAP = new Map<string, Currency>(
  SUPPORTED_CURRENCIES.map(currency => [currency.code, currency])
);

/**
 * Validates if a currency code is supported
 * @param currencyCode The currency code to validate
 * @returns True if the currency is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return CURRENCY_MAP.has(currencyCode?.toUpperCase());
}

/**
 * Gets currency information by code
 * @param currencyCode The currency code
 * @returns Currency information or undefined if not supported
 */
export function getCurrency(currencyCode: string): Currency | undefined {
  return CURRENCY_MAP.get(currencyCode?.toUpperCase());
}

/**
 * Get the optimal locale for currency formatting
 * Maps generic language codes to specific locales with good currency support
 * @param locale The input locale string
 * @returns Optimized locale string for better currency formatting
 */
export function getOptimalLocale(locale: string): string {
  if (locale.startsWith('ar')) return 'ar-SY'; // Arabic (Syria)
  if (locale.startsWith('en')) return 'en-US'; // English (United States)
  return locale;
}

/**
 * Advanced currency formatting with Syrian marketplace customizations
 * Enhanced with proper Arabic locale support
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @param locale The locale to use for formatting
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string, 
  currency: string = DEFAULT_CURRENCY,
  locale: string = 'en-US',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  const currencyInfo = getCurrency(currency);
  if (!currencyInfo) {
    console.warn(`Unsupported currency: ${currency}. Using default: ${DEFAULT_CURRENCY}`);
    return formatCurrency(num, DEFAULT_CURRENCY, locale, options);
  }

  // Enhanced locale handling for bilingual support
  const formattingLocale = getOptimalLocale(locale);

  // Syrian marketplace-specific formatting
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: currencyInfo.decimalPlaces,
    maximumFractionDigits: currencyInfo.decimalPlaces,
    ...options
  };

  try {
    return new Intl.NumberFormat(formattingLocale, defaultOptions).format(num);
  } catch (error) {
    console.warn(`Error formatting currency with locale ${formattingLocale}: ${error}. Falling back to simple format.`);
    // Enhanced fallback with proper RTL symbol placement for Arabic
    const isArabic = locale.startsWith('ar');
    const formattedNumber = num.toLocaleString(formattingLocale);
    
    if (isArabic) {
      // For Arabic, place currency symbol after the number (RTL consideration)
      return `${formattedNumber} ${currencyInfo.symbol}`;
    } else {
      // For English, place currency symbol before the number
      return `${currencyInfo.symbol}${formattedNumber}`;
    }
  }
}

/**
 * Format currency amount for display with enhanced error handling and bilingual support
 * @param amount The amount to format
 * @param currency The currency code
 * @param locale The locale for formatting (supports 'en', 'ar', full locales)
 * @returns Formatted amount with currency symbol or error fallback
 */
export function formatAmount(
  amount: string | number, 
  currency: string = DEFAULT_CURRENCY,
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    console.warn(`Invalid amount for formatting: ${amount}`);
    return '';
  }

  return formatCurrency(num, currency, locale);
}

/**
 * Format currency for compact display (K, M abbreviations) with bilingual support
 * @param amount The amount to format
 * @param currency The currency code
 * @param locale The locale for formatting (supports 'en', 'ar', full locales)
 * @returns Compact formatted amount
 */
export function formatCurrencyCompact(
  amount: number | string,
  currency: string = DEFAULT_CURRENCY,
  locale: string = 'en-US'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  const currencyInfo = getCurrency(currency);
  if (!currencyInfo) return formatAmount(num, DEFAULT_CURRENCY, locale);

  // Use the standardized locale optimization
  const formattingLocale = getOptimalLocale(locale);

  const compactOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyInfo.code,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  };

  try {
    return new Intl.NumberFormat(formattingLocale, compactOptions).format(num);
  } catch (_error) {
    return formatAmount(num, currency, locale);
  }
}

/**
 * Parse currency string to number
 * @param currencyString The currency string to parse
 * @param currency The expected currency code
 * @returns Parsed number or NaN if invalid
 */
export function parseCurrency(currencyString: string, currency: string = DEFAULT_CURRENCY): number {
  if (!currencyString) return NaN;

  const currencyInfo = getCurrency(currency);
  if (!currencyInfo) return NaN;

  // Escape special regex characters in the symbol and replace the entire symbol
  const escapedSymbol = currencyInfo.symbol.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // Remove currency symbols and formatting
  const cleanString = currencyString
    .replace(new RegExp(escapedSymbol, 'g'), '')
    .replace(/[,\s]/g, '')
    .trim();

  return parseFloat(cleanString);
}

/**
 * Validates if an amount is valid for a given currency
 * @param amount The amount to validate
 * @param currency The currency code
 * @returns True if the amount is valid
 */
export function isValidAmount(amount: number | string, currency: string = DEFAULT_CURRENCY): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num < 0) return false;

  const currencyInfo = getCurrency(currency);
  if (!currencyInfo) return false;

  // Check decimal places
  const decimalPart = amount.toString().split('.')[1];
  if (decimalPart && decimalPart.length > currencyInfo.decimalPlaces) {
    return false;
  }

  return true;
}

/**
 * Gets recommended currency based on amount range (Syrian market specific)
 * @param _amount The amount to evaluate (currently unused, USD recommended for all ranges)
 * @returns Recommended currency code
 */
export function getRecommendedCurrency(_amount: number): string {
  // For Syrian car market, USD is recommended for all price ranges
  // This could be enhanced with more sophisticated logic based on amount
  return DEFAULT_CURRENCY;
}

/**
 * Gets currency symbol by code
 * @param currencyCode The currency code
 * @returns Currency symbol or code if not found
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  return currency?.symbol || currencyCode;
}

/**
 * Gets currency name by code with optional Arabic support
 * @param currencyCode The currency code
 * @param useArabic Whether to return Arabic name
 * @returns Currency name
 */
export function getCurrencyName(currencyCode: string, useArabic: boolean = false): string {
  const currency = getCurrency(currencyCode);
  if (!currency) return currencyCode;
  
  return useArabic ? currency.nameAr : currency.name;
}

/**
 * Utility to get all currency codes as array
 * @returns Array of supported currency codes
 */
export function getAllCurrencyCodes(): string[] {
  return CURRENCY_CODES;
}

/**
 * Utility to get default currency information
 * @returns Default currency object
 */
export function getDefaultCurrency(): Currency {
  return CURRENCY_MAP.get(DEFAULT_CURRENCY)!;
}

/**
 * Utility to get local currency information
 * @returns Local currency object
 */
export function getLocalCurrency(): Currency {
  return CURRENCY_MAP.get(LOCAL_CURRENCY)!;
}
