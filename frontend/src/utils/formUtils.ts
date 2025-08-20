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
  const requiredFields = ['make', 'model', 'year', 'price', 'title', 'mileage'];
  
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

/**
 * Calculate step completion status for visual indicators
 */
export function calculateStepCompletion(
  step: number, 
  formData: ListingFormData,
  t: (key: string, fallback: string) => string
): {
  completionStatus: 'complete' | 'incomplete' | 'not-started';
  missingFieldsCount: number;
  completedFieldsCount: number;
  totalFieldsCount: number;
  missingFieldNames: string[];
} {
  const requiredFields = REQUIRED_FIELDS_BY_STEP[step] || [];
  
  // Use all required fields for completion status
  const fieldsToCheck = requiredFields;
  
  let completedFields = 0;
  const missingFields: string[] = [];
  
  fieldsToCheck.forEach(field => {
    const value = formData[field];
    let hasValue = false;
    
    // Special handling for different field types
    if (field === 'images') {
      // Images field should be an array with at least one item
      hasValue = Array.isArray(value) && value.length > 0;
    } else if (typeof value === 'string') {
      // String fields - check if not empty after trimming
      hasValue = value.trim().length > 0;
    } else {
      // Other fields - check if truthy
      hasValue = Boolean(value);
    }
    
    if (hasValue) {
      completedFields++;
    } else {
      const fieldMeta = REQUIRED_FIELD_I18N[field as string];
      const fieldName = fieldMeta ? t(fieldMeta.key, fieldMeta.fallback) : field;
      missingFields.push(fieldName);
    }
  });
  
  const totalFields = fieldsToCheck.length;
  const missingFieldsCount = missingFields.length;
  
  let completionStatus: 'complete' | 'incomplete' | 'not-started';
  
  if (completedFields === 0) {
    completionStatus = 'not-started';
  } else if (missingFieldsCount === 0) {
    completionStatus = 'complete';
  } else {
    completionStatus = 'incomplete';
  }
  
  return {
    completionStatus,
    missingFieldsCount,
    completedFieldsCount: completedFields,
    totalFieldsCount: totalFields,
    missingFieldNames: missingFields
  };
}

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

// Centralized required field rules per step
const REQUIRED_FIELDS_BY_STEP: Record<number, Array<keyof ListingFormData>> = {
  1: ['make', 'model', 'year'],
  2: ['mileage'],
  3: ['title', 'description', 'images'], // Images are required by backend
  4: ['price', 'contactName', 'contactPhone', 'governorateSlug', 'locationSlug']
};

// Map field to i18n validation key and fallback
const REQUIRED_FIELD_I18N: Record<string, { key: string; fallback: string }> = {
  make: { key: 'listings:newListingValidationMakeRequired', fallback: 'Make is required' },
  model: { key: 'listings:newListingValidationModelRequired', fallback: 'Model is required' },
  year: { key: 'listings:newListingValidationYearRequired', fallback: 'Year is required' },
  mileage: { key: 'listings:newListingValidationMileageRequired', fallback: 'Mileage is required' },
  images: { key: 'listings:newListingValidationImagesRequired', fallback: 'At least one image is required' },
  title: { key: 'listings:newListingValidationTitleRequired', fallback: 'Title is required' },
  description: { key: 'listings:newListingValidationDescriptionRequired', fallback: 'Description is required' },
  price: { key: 'listings:newListingValidationPriceRequired', fallback: 'Price is required' },
  contactName: { key: 'listings:newListingValidationContactNameRequired', fallback: 'Contact name is required' },
  contactPhone: { key: 'listings:newListingValidationContactPhoneRequired', fallback: 'Contact phone is required' },
  governorateSlug: { key: 'listings:newListingValidationGovernorateRequired', fallback: 'Governorate is required' },
  locationSlug: { key: 'listings:newListingValidationLocationRequired', fallback: 'Location is required' },
};

// Removed unused function applyRequiredFieldErrors

type ValidationMode = 'final' | 'navigation' | 'accessibility';

// Blocking-only required fields per step (used for navigation/accessibility)
const BLOCKING_REQUIRED_FIELDS_BY_STEP: Record<number, Array<keyof ListingFormData>> = {
  1: ['make', 'model', 'year'],
  2: [], // No blocking fields for step 2 - mileage is required only for final submission
  3: ['title', 'description', 'images'], // Images are required by backend
  4: ['price', 'contactName', 'contactPhone', 'governorateSlug', 'locationSlug']
};

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
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            const i18nMeta = REQUIRED_FIELD_I18N[field as string];
            if (i18nMeta) tmp[field] = t(i18nMeta.key, i18nMeta.fallback);
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
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            const i18nMeta = REQUIRED_FIELD_I18N[field as string];
            if (i18nMeta) errors[field] = t(i18nMeta.key, i18nMeta.fallback);
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
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            const i18nMeta = REQUIRED_FIELD_I18N[field as string];
            if (i18nMeta) errors[field] = t(i18nMeta.key, i18nMeta.fallback);
          }
        }
      }
      break;
      
    case 4: // Pricing & Contact (Price, Location, Contact, Images)
      {
        const requiredFields = getRequiredFieldsForMode(step, mode);
        for (const field of requiredFields) {
          const value = formData[field];
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            const i18nMeta = REQUIRED_FIELD_I18N[field as string];
            if (i18nMeta) errors[field] = t(i18nMeta.key, i18nMeta.fallback);
          }
        }
      }
      if (formData.price && isNaN(Number(formData.price))) {
        errors.price = t('listings:newListingValidationPriceInvalid', 'Price must be a valid number');
      } else if (formData.price && Number(formData.price) <= 0) {
        errors.price = t('listings:newListingValidationPricePositive', 'Price must be greater than zero');
      }
      
      // Contact validation
      if (formData.contactEmail && formData.contactEmail.trim().length > 0 && !_isValidEmail(formData.contactEmail)) {
        errors.contactEmail = t('listings:newListingValidationEmailInvalid', 'Please enter a valid email address');
      }
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