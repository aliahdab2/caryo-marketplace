/**
 * Form utilities and helper functions
 * 
 * Clean modular interface for form handling and validation.
 * 
 * Modular architecture:
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
  sanitizeHtml,
  FORM_FIELD_CATEGORIES
} from './index';

// Export main functions
export { 
  sanitizeInput,
  convertArabicNumerals,
  processFormFieldValue,
  getSanitizationStats,
  clearSanitizationCache,
  smartSanitize,
  sanitizeHtml,
  FORM_FIELD_CATEGORIES
};

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
      if (!formData.title || formData.title.trim().length === 0) {
        errors.title = t('listings:newListingValidationTitleRequired', 'Title is required');
      }
      if (!formData.description || formData.description.trim().length === 0) {
        errors.description = t('listings:newListingValidationDescriptionRequired', 'Description is required');
      }
      if (!formData.price || formData.price.trim().length === 0) {
        errors.price = t('listings:newListingValidationPriceRequired', 'Price is required');
      } else if (isNaN(Number(formData.price))) {
        errors.price = t('listings:newListingValidationPriceInvalid', 'Price must be a valid number');
      } else if (Number(formData.price) <= 0) {
        errors.price = t('listings:newListingValidationPricePositive', 'Price must be greater than zero');
      }
      break;
      
    case 2:
      if (!formData.make || formData.make.trim().length === 0) {
        errors.make = t('listings:newListingValidationMakeRequired', 'Make is required');
      }
      if (!formData.model || formData.model.trim().length === 0) {
        errors.model = t('listings:newListingValidationModelRequired', 'Model is required');
      }
      if (!formData.year || formData.year.trim().length === 0) {
        errors.year = t('listings:newListingValidationYearRequired', 'Year is required');
      } else if (isNaN(Number(formData.year)) || Number(formData.year) < 1920 || Number(formData.year) > new Date().getFullYear()) {
        errors.year = t('listings:newListingValidationYearInvalid', 'Please enter a valid year');
      }
      if (formData.mileage && formData.mileage.trim().length > 0 && (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0)) {
        errors.mileage = t('listings:newListingValidationMileageInvalid', 'Mileage must be a valid number');
      }
      break;
      
    case 3:
      if (!formData.contactName || formData.contactName.trim().length === 0) {
        errors.contactName = t('listings:newListingValidationContactNameRequired', 'Contact name is required');
      }
      if (!formData.contactPhone || formData.contactPhone.trim().length === 0) {
        errors.contactPhone = t('listings:newListingValidationContactPhoneRequired', 'Contact phone is required');
      }
      if (!formData.governorateSlug || formData.governorateSlug.trim().length === 0) {
        errors.governorateSlug = t('listings:newListingValidationGovernorateRequired', 'Governorate is required');
      }
      if (!formData.locationSlug || formData.locationSlug.trim().length === 0) {
        errors.locationSlug = t('listings:newListingValidationLocationRequired', 'Location is required');
      }
      if (formData.contactEmail && formData.contactEmail.trim().length > 0 && !_isValidEmail(formData.contactEmail)) {
        errors.contactEmail = t('listings:newListingValidationEmailInvalid', 'Please enter a valid email address');
      }
      break;
      
    case 4:
      if (!formData.images || formData.images.length === 0) {
        errors.images = t('listings:newListingValidationImagesRequired', 'At least one image is required');
      } else if (formData.images.length > 10) {
        errors.images = t('listings:newListingValidationTooManyImages', 'Maximum 10 images allowed');
      }
      break;
      
    default:
      break;
  }
  
  return errors;
};
