/**
 * Form field processing and categorization
 * 
 * Smart field processing based on field type and content requirements
 */

import { sanitizeInput } from '../sanitization/index';
import { convertArabicNumerals } from '../numeral/arabic';

// Import security patterns for direct use
const SECURITY_PATTERNS = {
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  HTML_TAGS: /<[^>]*>/g,
  JS_PROTOCOLS: /javascript:|vbscript:|data:/gi,
  CONTROL_CHARS: /[\x00-\x1F\x7F]/g,
} as const;

// Field categorization for optimized processing
export const FORM_FIELD_CATEGORIES = {
  // Safe dropdown fields from database/config (no sanitization needed)
  DROPDOWN: ['make', 'model', 'currency', 'governorateSlug', 'locationSlug', 'transmission', 'fuelType'] as const,
  
  // Numeric fields that accept Arabic numerals and need conversion
  NUMERIC: ['price', 'year', 'mileage'] as const,
  
  // Free text fields that need sanitization
  TEXT: ['title', 'description', 'contactName', 'contactPhone', 'state'] as const
} as const;

// TypeScript types for field categories
export type DropdownField = typeof FORM_FIELD_CATEGORIES.DROPDOWN[number];
export type NumericField = typeof FORM_FIELD_CATEGORIES.NUMERIC[number];
export type TextField = typeof FORM_FIELD_CATEGORIES.TEXT[number];
export type FormFieldName = DropdownField | NumericField | TextField;

// Cache for field categories to improve performance
const fieldCategoryCache = new Map<string, 'DROPDOWN' | 'NUMERIC' | 'TEXT' | 'UNKNOWN'>();

/**
 * Determine the category of a form field (with caching)
 */
export function getFieldCategory(fieldName: string): 'DROPDOWN' | 'NUMERIC' | 'TEXT' | 'UNKNOWN' {
  // Check cache first
  if (fieldCategoryCache.has(fieldName)) {
    return fieldCategoryCache.get(fieldName)!;
  }
  
  let category: 'DROPDOWN' | 'NUMERIC' | 'TEXT' | 'UNKNOWN';
  
  if (FORM_FIELD_CATEGORIES.DROPDOWN.includes(fieldName as DropdownField)) {
    category = 'DROPDOWN';
  } else if (FORM_FIELD_CATEGORIES.NUMERIC.includes(fieldName as NumericField)) {
    category = 'NUMERIC';
  } else if (FORM_FIELD_CATEGORIES.TEXT.includes(fieldName as TextField)) {
    category = 'TEXT';
  } else {
    category = 'UNKNOWN';
  }
  
  // Cache the result
  fieldCategoryCache.set(fieldName, category);
  return category;
}

/**
 * Process form field value based on field type for optimal performance
 */
export function processFormFieldValue(fieldName: string, value: string): string {
  if (!value || typeof value !== 'string') return '';
  
  const category = getFieldCategory(fieldName);
  
  try {
    switch (category) {
      case 'DROPDOWN':
        // Dropdown fields: use value directly (already safe from database/config)
        return value;
        
      case 'NUMERIC':
        // Numeric fields: sanitize + convert Arabic numerals
        const numericSanitized = sanitizeInput(value, 'basic');
        return convertArabicNumerals(numericSanitized);
        
      case 'TEXT':
        // Text fields: use basic sanitization to preserve spaces during typing
        // Only remove dangerous content, preserve normal spacing
        let textSanitized = value;
        textSanitized = textSanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, '');
        textSanitized = textSanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
        textSanitized = textSanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
        textSanitized = textSanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
        // Only remove excessive whitespace (3+ consecutive spaces) but preserve normal spacing
        textSanitized = textSanitized.replace(/ {3,}/g, '  ');
        // Convert whitespace-only strings to empty strings
        return textSanitized.trim() === '' ? '' : textSanitized;
        
      case 'UNKNOWN':
      default:
        // Fallback: use basic sanitization for safety
        let fallbackSanitized = value;
        fallbackSanitized = fallbackSanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, '');
        fallbackSanitized = fallbackSanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
        fallbackSanitized = fallbackSanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
        fallbackSanitized = fallbackSanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
        return fallbackSanitized;
    }
  } catch (error) {
    console.error(`Error processing field ${fieldName}:`, error);
    // Return original value if processing fails
    return value;
  }
}

/**
 * Batch process multiple form field values (optimized)
 */
export function processFormFields(fields: Record<string, string>): Record<string, string> {
  const processed: Record<string, string> = {};
  
  // Process fields in batches for better performance
  const fieldEntries = Object.entries(fields);
  
  for (const [fieldName, value] of fieldEntries) {
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

/**
 * Clear the field category cache (useful for testing or when categories change)
 */
export function clearFieldCategoryCache(): void {
  fieldCategoryCache.clear();
}
