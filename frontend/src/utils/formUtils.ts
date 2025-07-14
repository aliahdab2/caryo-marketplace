/**
 * Form utilities and helper functions
 * 
 * This module provides a streamlined interface for form handling and validation
 * while maintaining backward compatibility with existing code.
 * 
 * The implementation now uses a modular architecture for better maintainability:
 * - sanitization/ - Core sanitization logic with LRU cache and performance tracking
 * - numeral/ - Arabic numeral conversion utilities
 * - forms/ - Smart field processing based on field type
 */

import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';

// Import from modular structure
import { 
  sanitizeInput,
  convertArabicNumerals,
  processFormFieldValue,
  processFormFields,
  getFieldCategory,
  getSanitizationStats,
  clearSanitizationCache,
  smartSanitize,
  sanitizeHtml
} from './index';

// Re-export main functions for backward compatibility
export { 
  sanitizeInput,
  convertArabicNumerals,
  processFormFieldValue,
  processFormFieldValue as processField,
  getSanitizationStats as getPerformanceStats,
  clearSanitizationCache,
  smartSanitize,
  sanitizeHtml
};

/**
 * Legacy function names for backward compatibility
 */
export const sanitizeFormField = sanitizeInput;
export const sanitizeUserInput = sanitizeInput;

/**
 * Sanitize car listing data - backward compatibility function
 */
export function sanitizeListingData(data: Partial<ListingFormData>): Partial<ListingFormData> {
  return sanitizeFormData(data);
}

/**
 * Batch sanitize array of inputs
 */
export function batchSanitize(inputs: string[], level: 'basic' | 'standard' | 'strict' = 'standard'): string[] {
  return inputs.map(input => sanitizeInput(input, level));
}

/**
 * Sanitize search query with optional length limiting
 */
export function sanitizeSearchQuery(query: string, options?: { maxLength?: number }): string {
  if (!query || typeof query !== 'string') return '';
  
  let sanitized = smartSanitize(query.trim());
  
  // Apply length limiting if specified
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize user content - returns Promise for backward compatibility
 */
export async function sanitizeUserContent(
  content: string, 
  options?: { 
    level?: 'basic' | 'standard' | 'strict';
    maxLength?: number;
    isHtml?: boolean;
  }
): Promise<string> {
  const level = options?.level || 'standard';
  const maxLength = options?.maxLength;
  const isHtml = options?.isHtml || false;
  
  let result: string;
  
  if (isHtml) {
    result = await sanitizeHtml(content);
  } else {
    result = sanitizeInput(content, level);
  }
  
  // Apply length limiting if specified
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  
  return result;
}

/**
 * Main form data sanitization function
 */
export function sanitizeFormData(data: Partial<ListingFormData>): Partial<ListingFormData> {
  if (!data || typeof data !== 'object') return {};

  const sanitized: Record<string, unknown> = {};
  
  // Process each field based on its type
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        sanitized[key] = processFormFieldValue(key, value);
      } else {
        // Non-string values (numbers, booleans, objects) pass through
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as Partial<ListingFormData>;
}

/**
 * Batch sanitize multiple form fields
 */
export function sanitizeFields(fields: Record<string, string>): Record<string, string> {
  return processFormFields(fields);
}

/**
 * Smart field processing with category detection
 */
export function smartProcessField(fieldName: string, value: string): {
  value: string;
  category: string;
  requiresConversion: boolean;
  requiresSanitization: boolean;
} {
  const category = getFieldCategory(fieldName);
  const processedValue = processFormFieldValue(fieldName, value);
  
  return {
    value: processedValue,
    category,
    requiresConversion: category === 'NUMERIC',
    requiresSanitization: category !== 'DROPDOWN'
  };
}

/**
 * Form field validation
 */
export function validateFormField(
  fieldName: string, 
  value: string, 
  required: boolean = false
): { isValid: boolean; error?: string } {
  // Check required fields
  if (required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'This field is required' };
  }
  
  // If not required and empty, it's valid
  if (!value || value.trim().length === 0) {
    return { isValid: true };
  }
  
  const category = getFieldCategory(fieldName);
  
  switch (category) {
    case 'NUMERIC':
      // Validate numeric fields
      const converted = convertArabicNumerals(value);
      const numericValue = parseFloat(converted.replace(/[^0-9.-]/g, ''));
      if (isNaN(numericValue)) {
        return { isValid: false, error: 'Please enter a valid number' };
      }
      break;
      
    case 'TEXT':
      // Basic length validation for text fields
      if (value.length > 1000) {
        return { isValid: false, error: 'Text is too long' };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * Comprehensive form validation
 */
export function validateForm(data: Partial<ListingFormData>): FormErrors {
  const errors: FormErrors = {};
  
  // Required fields validation
  const requiredFields = ['make', 'model', 'year', 'price', 'title'];
  
  for (const field of requiredFields) {
    const value = data[field as keyof ListingFormData] as string;
    const validation = validateFormField(field, value, true);
    
    if (!validation.isValid) {
      errors[field as keyof FormErrors] = validation.error || 'Invalid value';
    }
  }
  
  return errors;
}

/**
 * Get performance statistics for debugging and optimization
 */
export function getFormUtilsStats() {
  return {
    sanitization: getSanitizationStats(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Legacy pattern matching for backward compatibility
 */
export const SECURITY_PATTERNS = {
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  EVENT_HANDLERS: /on\w+\s*=/gi,
  JS_PROTOCOLS: /javascript:|vbscript:|data:/gi,
  EXCESSIVE_WHITESPACE: /\s+/g,
  ARABIC_NUMERALS: /[٠-٩]/g,
  CONTROL_CHARS: /[\x00-\x1F\x7F]/g,
} as const;

// Export types
export type { SanitizationLevel, FormFieldName } from './index';

/**
 * Calculate progress percentage for multi-step forms
 */
export const calculateProgress = (currentStep: number, totalSteps: number): number => {
  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Validates email format
 */
const _isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate form step for multi-step listing form
 */
export const validateStep = (step: number, formData: ListingFormData, t: (key: string, fallback: string) => string): FormErrors => {
  const errors: FormErrors = {};
  
  switch (step) {
    case 1:
      if (!formData.title) errors.title = t('listings:newListing.validation.titleRequired', 'Title is required');
      if (!formData.description) errors.description = t('listings:newListing.validation.descriptionRequired', 'Description is required');
      if (!formData.price) errors.price = t('listings:newListing.validation.priceRequired', 'Price is required');
      if (formData.price && isNaN(Number(formData.price))) {
        errors.price = t('listings:newListing.validation.priceInvalid', 'Price must be a valid number');
      }
      if (formData.price && Number(formData.price) <= 0) {
        errors.price = t('listings:newListing.validation.pricePositive', 'Price must be greater than zero');
      }
      break;
      
    case 2:
      if (!formData.make) errors.make = t('listings:newListing.validation.makeRequired', 'Make is required');
      if (!formData.model) errors.model = t('listings:newListing.validation.modelRequired', 'Model is required');
      if (!formData.year) errors.year = t('listings:newListing.validation.yearRequired', 'Year is required');
      if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1)) {
        errors.year = t('listings:newListing.validation.yearInvalid', 'Please enter a valid year');
      }
      if (formData.mileage && isNaN(Number(formData.mileage))) {
        errors.mileage = t('listings:newListing.validation.mileageInvalid', 'Mileage must be a valid number');
      }
      break;
      
    case 3:
      if (!formData.contactName) errors.contactName = t('listings:newListing.validation.contactNameRequired', 'Contact name is required');
      if (!formData.contactPhone) errors.contactPhone = t('listings:newListing.validation.contactPhoneRequired', 'Contact phone is required');
      if (!formData.governorateId) errors.governorateId = t('listings:newListing.validation.governorateRequired', 'Governorate is required');
      if (formData.contactEmail && !_isValidEmail(formData.contactEmail)) {
        errors.contactEmail = t('listings:newListing.validation.emailInvalid', 'Please enter a valid email address');
      }
      break;
      
    case 4:
      if (formData.images.length === 0) {
        errors.images = t('listings:newListing.validation.imagesRequired', 'At least one image is required');
      }
      if (formData.images.length > 10) {
        errors.images = t('listings:newListing.validation.tooManyImages', 'Maximum 10 images allowed');
      }
      break;
      
    default:
      break;
  }
  
  return errors;
};
