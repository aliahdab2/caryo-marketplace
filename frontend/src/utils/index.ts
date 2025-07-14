/**
 * Main utils module index
 * 
 * Re-exports all utility functions maintaining backward compatibility
 */

// Sanitization utilities
export { 
  sanitizeInput, 
  smartSanitize, 
  sanitizeHtml,
  clearSanitizationCache,
  getSanitizationStats,
  resetSanitizationStats,
  getCacheHitRate
} from './sanitization';

// Arabic numeral utilities
export {
  convertArabicNumerals,
  hasArabicNumerals,
  extractNumericValue,
  isValidNumericString
} from './numeral/arabic';

// Form processing utilities
export {
  processFormFieldValue,
  getFieldCategory,
  processFormFields,
  requiresArabicConversion,
  requiresSanitization
} from './forms/processing';

// Re-export sanitizeInput with legacy names for backward compatibility
import { sanitizeInput } from './sanitization';
export { sanitizeInput as sanitizeFormField };
export { sanitizeInput as sanitizeUserInput };

// Type exports
export type { SanitizationLevel } from './sanitization/core';
export type { FormFieldName, DropdownField, NumericField, TextField } from './forms/processing';
