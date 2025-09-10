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
import { createLogger } from '@/utils/logger';

/**
 * Form validation constants for multi-step forms
 *
 * These constants define which fields are required at each step of the listing form:
 * - REQUIRED_FIELDS_BY_STEP: Fields required for final submission
 * - BLOCKING_REQUIRED_FIELDS_BY_STEP: Fields required for navigation (subset of required fields)
 *
 * Field validation messages use the flat key structure: validation.${fieldName}Required
 * Example: validation.makeRequired, validation.modelRequired, validation.yearRequired
 * Fallback: validation.fieldRequired (generic message)
 *
 * This follows the project's translation guidelines to avoid hardcoded mappings
 * and ensure consistent i18n key structure across the application.
 */
import {
  REQUIRED_FIELDS_BY_STEP,
  BLOCKING_REQUIRED_FIELDS_BY_STEP
} from '@/utils/constants/formValidation';

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
 * Extracts field name and value from various input types
 */
export function extractFieldData(
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
  fieldName?: string
): { name: string; value: string } {
  if (typeof e === 'string') {
    return {
      name: fieldName!,
      value: e
    };
  }
  
  return {
    name: e.target.name,
    value: e.target.value
  };
}

/**
 * Generic form change handler that processes field changes and handles dependencies
 */
export function createFormChangeHandler<TFormData>(
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>,
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  processFormFieldValue: (name: string, value: string) => string,
  fieldHandlers: Record<string, (value: string) => void> = {}
) {
  return (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
    fieldName?: string
  ) => {
    const { name, value } = extractFieldData(e, fieldName);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: processFormFieldValue(name, value)
    }));
    
    // Handle dependent field logic
    const fieldHandler = fieldHandlers[name];
    if (fieldHandler) {
      fieldHandler(value);
    }
    
    // Clear field-specific errors
    setFormErrors(prev => {
      if (!prev[name]) return prev;
      
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };
}

/**
 * Creates a standardized error handler
 */
export function createErrorHandler(
  setError: (error: string) => void,
  logger?: { error: (message: string, error: Error) => void }
) {
  return (error: Error, context?: string) => {
    const message = error.message || 'An error occurred';
    if (logger && context) {
      logger.error(`${context}:`, error);
    }
    setError(message);
  };
}

/**
 * Utility to safely update form data with additional fields
 */
export function updateFormDataSafely<TFormData>(
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>,
  updates: Partial<TFormData>,
  logger?: { debug: (message: string, data: unknown) => void }
) {
  setFormData(prev => {
    const updatedData = { ...prev, ...updates };
    if (logger) {
      logger.debug('Form data updated:', updates);
    }
    return updatedData;
  });
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
 * Form field validation with contextual error messages
 */
export function validateFormField(
  fieldName: string,
  value: string,
  required: boolean = false,
  t?: (key: string, fallback: string) => string
): { isValid: boolean; error?: string } {
  // Check required fields with contextual messages
  const stringValue = typeof value === 'string' ? value : String(value || '');
  if (required && (!stringValue || stringValue.trim().length === 0)) {
    // Use translation if available, otherwise provide contextual message
    if (t) {
      // Try to get field-specific required message
      const fieldKey = `validation.${fieldName}Required`;
      const genericKey = 'validation.fieldRequired';
      return {
        isValid: false,
        error: t(fieldKey, t(genericKey, `${fieldName} is required`))
      };
    }

    // Provide contextual error message based on field name
    const fieldDisplayName = fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase

    return {
      isValid: false,
      error: `${fieldDisplayName} is required`
    };
  }
  
  // If not required and empty, it's valid
  if (!stringValue || stringValue.trim().length === 0) {
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
 * Comprehensive form validation with translation support
 */
export function validateForm(
  data: Partial<ListingFormData>,
  t?: (key: string, fallback: string) => string
): FormErrors {
  const errors: FormErrors = {};

  // Required fields validation
  const requiredFields = ['make', 'model', 'year', 'price', 'title', 'mileage'];

  for (const field of requiredFields) {
    const value = data[field as keyof ListingFormData] as string;
    const validation = validateFormField(field, value, true, t);

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

// Constants now imported from shared location



// Note: calculateStepCompletion moved to stepCompletionUtils.ts to avoid circular imports

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
// Logger (gated by env)
const formLogger = createLogger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_WIZARD === 'true',
  level: 'debug',
  prefix: 'FORM_UTILS'
});

// Removed unused function applyRequiredFieldErrors

type ValidationMode = 'final' | 'navigation' | 'accessibility';



function getRequiredFieldsForMode(step: number, mode: ValidationMode): Array<keyof ListingFormData> {
  if (mode === 'final') return REQUIRED_FIELDS_BY_STEP[step] || [];
  return BLOCKING_REQUIRED_FIELDS_BY_STEP[step] || [];
}

export const validateStep = (
  step: number,
  formData: ListingFormData,
  t: (key: string, fallback: string) => string,
  options?: { mode?: ValidationMode }
): FormErrors => {
  const errors: FormErrors = {};
  const mode: ValidationMode = options?.mode || 'final';

  switch (step) {
    case 1: // Vehicle Identity (Make, Model, Year)
      {
        // Required fields
        const tmp: FormErrors = {};
        const requiredFields = getRequiredFieldsForMode(step, mode);
        for (const field of requiredFields) {
          const value = formData[field];
          const validation = validateFormField(field as string, value as string, true, t);
          if (!validation.isValid) {
            tmp[field] = validation.error || t('validation.fieldRequired', 'This field is required');
          }
        }
        Object.assign(errors, tmp);
      }
      if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1920 || Number(formData.year) > new Date().getFullYear())) {
        errors.year = t('listings:newListingValidationYearInvalid', 'Please enter a valid year');
      }
      break;
      
    case 2: // Vehicle Details (Mileage, Engine, etc.)
      {
        const requiredFields = getRequiredFieldsForMode(step, mode);
        for (const field of requiredFields) {
          const value = formData[field];
          const validation = validateFormField(field as string, value as string, true, t);
          if (!validation.isValid) {
            errors[field] = validation.error || t('validation.fieldRequired', 'This field is required');
          }
        }
      }
      // Mileage validation: if provided, should be valid
      if (formData.mileage && formData.mileage.trim().length > 0 && (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0)) {
        errors.mileage = t('listings:newListingValidationMileageInvalid', 'Mileage must be a valid number');
      }
      break;
      
    case 3: // Content & Media (Title, Description, Photos)
      {
        const requiredFields = getRequiredFieldsForMode(step, mode);
        for (const field of requiredFields) {
          const value = formData[field];
          const validation = validateFormField(field as string, value as string, true, t);
          if (!validation.isValid) {
            errors[field] = validation.error || t('validation.fieldRequired', 'This field is required');
          }
        }
      }
      break;
      
    case 4: // Pricing & Contact (Price, Location, Contact, Images)
      {
        const requiredFields = getRequiredFieldsForMode(step, mode);
        for (const field of requiredFields) {
          const value = formData[field];
          const validation = validateFormField(field as string, value as string, true, t);
          if (!validation.isValid) {
            errors[field] = validation.error || t('validation.fieldRequired', 'This field is required');
          }
        }
      }
      if (formData.price && isNaN(Number(formData.price))) {
        errors.price = t('listings:newListingValidationPriceInvalid', 'Price must be a valid number');
      } else if (formData.price && Number(formData.price) <= 0) {
        errors.price = t('listings:newListingValidationPricePositive', 'Price must be greater than zero');
      }
      
      // Contact validation
      // Phone must be 6-15 digits
      if (formData.contactPhone && formData.contactPhone.trim().length > 0) {
        const phoneDigitsOnly = formData.contactPhone.replace(/\D/g, '');
        if (!/^\d{6,15}$/.test(phoneDigitsOnly)) {
          errors.contactPhone = t('listings:newListingValidationPhoneInvalid', 'Please enter a valid phone number');
        }
      }
      
      // Check for images - either new uploaded images or existing images (for edit mode)
      const imagesCount = formData.images?.length || 0;
      const existingImagesCount = formData.existingImageUrls?.length || 0;
      const totalImages = imagesCount + existingImagesCount;
      
      formLogger.debug('[validateStep] Step 4 image validation', {
        imagesCount,
        existingImagesCount,
        totalImages
      } as unknown as string);
      
      if (totalImages === 0) {
        formLogger.debug('[validateStep] No images found, adding error');
        errors.images = t('listings:newListingValidationImagesRequired', 'At least one image is required');
      } else if (imagesCount > 10) {
        formLogger.warn('[validateStep] Too many new images', imagesCount as unknown as string);
        errors.images = t('listings:newListingValidationTooManyImages', 'Maximum 10 images allowed');
      } else {
        formLogger.debug('[validateStep] Image validation passed', String(totalImages));
      }
      break;
      
    default:
      break;
  }
  
  return errors;
};