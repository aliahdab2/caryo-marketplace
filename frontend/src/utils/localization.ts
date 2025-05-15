/**
 * Formats a date object into a locale-specific string.
 *
 * @param date The Date object to format.
 * @param locale The locale string (e.g., 'en-US', 'ar-EG').
 * @param options Optional Intl.DateTimeFormatOptions to customize formatting.
 * @returns A string representing the formatted date.
 */
export const formatDate = (
  date: Date,
  locale: string,
  options?: any
): string => {
  try {
    // Handle dateStyle option separately, as it might cause issues in some environments
    if (options && options.dateStyle) {
      const dateStyleOptions: any = { ...options };
      const dateStyle = dateStyleOptions.dateStyle;
      delete dateStyleOptions.dateStyle;
      
      // Convert dateStyle to standard options
      if (dateStyle === 'full' || dateStyle === 'long') {
        dateStyleOptions.year = 'numeric';
        dateStyleOptions.month = 'long';
        dateStyleOptions.day = 'numeric';
        dateStyleOptions.weekday = 'long';
      } else if (dateStyle === 'medium') {
        dateStyleOptions.year = 'numeric';
        dateStyleOptions.month = 'short';
        dateStyleOptions.day = 'numeric';
      } else if (dateStyle === 'short') {
        dateStyleOptions.year = 'numeric';
        dateStyleOptions.month = 'numeric';
        dateStyleOptions.day = 'numeric';
      }
      
      return new Intl.DateTimeFormat(locale, dateStyleOptions).format(date);
    }
    
    // Default options
    const defaultDateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(options || {}),
    };
    
    return new Intl.DateTimeFormat(locale, defaultDateOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback to a simple date string or handle error as appropriate
    return date.toLocaleDateString(locale); // Basic fallback
  }
};

/**
 * Formats a number into a locale-specific string (e.g., for currency or general numbers).
 *
 * @param number The number to format.
 * @param locale The locale string (e.g., 'en-US', 'ar-EG').
 * @param options Optional Intl.NumberFormatOptions to customize formatting (e.g., style: 'currency', currency: 'USD').
 * @returns A string representing the formatted number.
 */
export const formatNumber = (
  num: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string => {
  // Default options can be set here if desired
  const defaultNumberOptions: Intl.NumberFormatOptions = {
    ...options,
  };
  try {
    return new Intl.NumberFormat(locale, defaultNumberOptions).format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    // Fallback to a simple number string or handle error as appropriate
    return num.toString(); // Basic fallback
  }
};

// Example Usage (conceptual, not for direct execution here):
/*
import { useTranslation } from 'react-i18next';
import { formatDate, formatNumber } from './localization'; // Adjust path as needed

const MyComponent = () => {
  const { i18n } = useTranslation();
  const currentDate = new Date();
  const somePrice = 12345.67;

  const formattedDate = formatDate(currentDate, i18n.language);
  const formattedPrice = formatNumber(somePrice, i18n.language, {
    style: 'currency',
    currency: i18n.language === 'ar' ? 'SAR' : 'USD', // Example: Dynamic currency
  });

  return (
    <div>
      <p>Date: {formattedDate}</p>
      <p>Price: {formattedPrice}</p>
    </div>
  );
};
*/
