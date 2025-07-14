/**
 * Form field processing and categorization
 * 
 * Smart field processing based on field type and content requirements
 */

import { sanitizeInput, smartSanitize } from '../sanitization/index';
import { convertArabicNumerals } from '../numeral/arabic';

// Field categorization for optimized processing
export const FORM_FIELD_CATEGORIES = {
  // Safe dropdown fields from database/config (no sanitization needed)
  DROPDOWN: ['make', 'model', 'currency', 'governorateId', 'transmission', 'fuelType'] as const,
  
  // Numeric fields that accept Arabic numerals and need conversion
  NUMERIC: ['price', 'year', 'mileage'] as const,
  
  // Free text fields that need sanitization
  TEXT: ['title', 'description', 'contactName', 'contactEmail', 'contactPhone'] as const
} as const;

// TypeScript types for field categories
export type DropdownField = typeof FORM_FIELD_CATEGORIES.DROPDOWN[number];
export type NumericField = typeof FORM_FIELD_CATEGORIES.NUMERIC[number];
export type TextField = typeof FORM_FIELD_CATEGORIES.TEXT[number];
export type FormFieldName = DropdownField | NumericField | TextField;

/**
 * Determine the category of a form field
 */
export function getFieldCategory(fieldName: string): 'DROPDOWN' | 'NUMERIC' | 'TEXT' | 'UNKNOWN' {
  if (FORM_FIELD_CATEGORIES.DROPDOWN.includes(fieldName as DropdownField)) {
    return 'DROPDOWN';
  }
  if (FORM_FIELD_CATEGORIES.NUMERIC.includes(fieldName as NumericField)) {
    return 'NUMERIC';
  }
  if (FORM_FIELD_CATEGORIES.TEXT.includes(fieldName as TextField)) {
    return 'TEXT';
  }
  return 'UNKNOWN';
}

/**
 * Process form field value based on field type for optimal performance
 */
export function processFormFieldValue(fieldName: string, value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  const category = getFieldCategory(fieldName);
  
  switch (category) {
    case 'DROPDOWN':
      // Dropdown fields: use value directly (already safe from database/config)
      return value;
      
    case 'NUMERIC':
      // Numeric fields: sanitize + convert Arabic numerals
      const sanitized = sanitizeInput(value, 'basic');
      return convertArabicNumerals(sanitized);
      
    case 'TEXT':
      // Text fields: use smart sanitization to handle script tags
      return smartSanitize(value);
      
    case 'UNKNOWN':
    default:
      // Fallback: use smart sanitization for safety
      return smartSanitize(value);
  }
}

/**
 * Batch process multiple form field values
 */
export function processFormFields(fields: Record<string, string>): Record<string, string> {
  const processed: Record<string, string> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    processed[fieldName] = processFormFieldValue(fieldName, value);
  }
  
  return processed;
}

/**
 * Check if field requires Arabic numeral conversion
 */
export function requiresArabicConversion(fieldName: string): boolean {
  return getFieldCategory(fieldName) === 'NUMERIC';
}

/**
 * Check if field requires sanitization
 */
export function requiresSanitization(fieldName: string): boolean {
  const category = getFieldCategory(fieldName);
  return category === 'TEXT' || category === 'NUMERIC' || category === 'UNKNOWN';
}
