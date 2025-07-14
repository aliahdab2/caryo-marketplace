/**
 * Main utils module index
 * 
 * Clean modular exports for development phase
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
  FORM_FIELD_CATEGORIES,
  processFormFieldValue,
  getFieldCategory,
  processFormFields,
  requiresArabicConversion,
  requiresSanitization
} from './forms/processing';

// Type exports
export type { SanitizationLevel } from './sanitization/core';
export type { FormFieldName, DropdownField, NumericField, TextField } from './forms/processing';
