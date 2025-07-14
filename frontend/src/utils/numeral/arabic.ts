/**
 * Arabic numeral conversion utilities
 * 
 * Converts Arabic-Indic numerals to Western numerals for form processing
 */

// Pre-compiled regex for performance
const ARABIC_NUMERALS_PATTERN = /[٠-٩]/g;

// Mapping of Arabic-Indic numerals to Western numerals
const ARABIC_TO_WESTERN_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
} as const;

/**
 * Convert Arabic-Indic numerals to Western numerals
 * 
 * @param input - String that may contain Arabic numerals
 * @returns String with Arabic numerals converted to Western numerals
 */
export function convertArabicNumerals(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input.replace(ARABIC_NUMERALS_PATTERN, (match) => {
    return ARABIC_TO_WESTERN_MAP[match] || match;
  });
}

/**
 * Check if string contains Arabic numerals
 */
export function hasArabicNumerals(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return ARABIC_NUMERALS_PATTERN.test(input);
}

/**
 * Extract numeric value from string with Arabic numeral support
 */
export function extractNumericValue(input: string): number {
  if (!input || typeof input !== 'string') return NaN;
  
  const converted = convertArabicNumerals(input);
  const numeric = converted.replace(/[^0-9.-]/g, '');
  return parseFloat(numeric) || NaN;
}

/**
 * Validate if string represents a valid number (including Arabic numerals)
 */
export function isValidNumericString(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const converted = convertArabicNumerals(input);
  const numeric = converted.replace(/[^0-9.-]/g, '');
  return !isNaN(parseFloat(numeric)) && isFinite(parseFloat(numeric));
}
