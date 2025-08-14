/**
 * Consolidated formatting utilities for numbers, dates, and currency
 * 
 * This file consolidates all formatting functions to eliminate duplication
 * and provide a single source of truth for consistent formatting across the app.
 */

/**
 * Formats a number into a locale-specific string
 * 
 * @param num - The number to format
 * @param locale - The locale string (e.g., 'en-US', 'ar-EG')
 * @param options - Optional Intl.NumberFormatOptions for customization
 * @returns Formatted number string with error handling
 */
export function formatNumber(
  num: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    // Fallback to basic number string
    return num.toString();
  }
}

/**
 * Formats a date object or date string into a locale-specific string
 * 
 * @param date - The Date object or date string to format
 * @param locale - The locale string (e.g., 'en-US', 'ar-EG')
 * @param options - Optional Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string with error handling
 */
export function formatDate(
  date: Date | string | undefined | null,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    // Handle null, undefined or invalid dates
    if (!date) {
      return '';
    }

    // Convert string dates to Date objects
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '';
    }

    // Default options for Syrian marketplace
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date with time into a locale-specific string
 * 
 * @param date - The Date object or date string to format
 * @param locale - The locale string (e.g., 'en-US', 'ar-EG')
 * @param options - Optional Intl.DateTimeFormatOptions for customization
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | undefined | null,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return formatDate(date, locale, defaultOptions);
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 * 
 * @param dateString - The date string to format
 * @param locale - The locale string for localization (default: 'en')
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function timeAgo(dateString: string, locale: string = 'en'): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Time constants in milliseconds
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diff < minute) {
      return rtf.format(-Math.floor(diff / 1000), 'second');
    } else if (diff < hour) {
      return rtf.format(-Math.floor(diff / minute), 'minute');
    } else if (diff < day) {
      return rtf.format(-Math.floor(diff / hour), 'hour');
    } else if (diff < week) {
      return rtf.format(-Math.floor(diff / day), 'day');
    } else if (diff < month) {
      return rtf.format(-Math.floor(diff / week), 'week');
    } else if (diff < year) {
      return rtf.format(-Math.floor(diff / month), 'month');
    } else {
      return rtf.format(-Math.floor(diff / year), 'year');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
}

/**
 * Formats currency amount with proper locale support
 * 
 * @param amount - The amount to format
 * @param locale - The locale string
 * @param currency - The currency code (default: 'USD')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  locale: string,
  currency: string = 'USD',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const currencyOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };

  return formatNumber(amount, locale, currencyOptions);
}

/**
 * Formats a compact number (e.g., 1.2K, 3.4M)
 * 
 * @param num - The number to format
 * @param locale - The locale string
 * @returns Compact formatted number
 */
export function formatCompactNumber(num: number, locale: string): string {
  return formatNumber(num, locale, {
    notation: 'compact',
    maximumFractionDigits: 1
  });
}

/**
 * Formats a percentage with locale support
 * 
 * @param value - The decimal value (e.g., 0.25 for 25%)
 * @param locale - The locale string
 * @param options - Additional formatting options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: string,
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const percentageOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options
  };

  return formatNumber(value, locale, percentageOptions);
}
