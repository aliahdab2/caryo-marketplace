/**
 * Formats a date object or date string into a locale-specific string.
 *
 * @param date The Date object or date string to format.
 * @param locale The locale string (e.g., 'en-US', 'ar-EG').
 * @param options Optional Intl.DateTimeFormatOptions to customize formatting.
 * @returns A string representing the formatted date.
 */
export const formatDate = (
  date: Date | string | undefined | null,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string => {
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

    // Use only safe, basic options to avoid any compatibility issues
    let formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    // Handle specific cases based on options passed
    if (options) {
      if ('dateStyle' in options) {
        const dateStyle = options.dateStyle;
        if (dateStyle === 'medium') {
          formatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          };
        } else if (dateStyle === 'short') {
          formatOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          };
        } else {
          // full or long
          formatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          };
        }
      } else {
        // Manually set only the basic options we know are safe
        formatOptions = {};
        if (options.year) formatOptions.year = options.year;
        if (options.month) formatOptions.month = options.month;
        if (options.day) formatOptions.day = options.day;
        
        // If no basic options were set, use defaults
        if (!formatOptions.year && !formatOptions.month && !formatOptions.day) {
          formatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          };
        }
      }
    }
    
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, 'with options:', options);
    // Fallback to basic formatting
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date as Date;
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(dateObj);
    } catch (fallbackError) {
      console.error('Fallback date formatting also failed:', fallbackError);
      return '';
    }
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
