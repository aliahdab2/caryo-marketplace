/**
 * Consolidated form utilities
 * 
 * This file consolidates form-related utilities to eliminate complex re-export chains
 * and provide a cleaner API for form handling and validation.
 */

// Direct imports from specific modules
import { sanitizeInput, smartSanitize, sanitizeHtml } from './sanitization';
import { convertArabicNumerals } from './numeral/arabic';
import { 
  processFormFieldValue, 
  getFieldCategory, 
  FORM_FIELD_CATEGORIES 
} from './forms/processing';

// Re-export the commonly used functions
export {
  sanitizeInput,
  smartSanitize,
  sanitizeHtml,
  convertArabicNumerals,
  processFormFieldValue,
  getFieldCategory,
  FORM_FIELD_CATEGORIES
};

// Form validation and processing logic
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { createLogger } from '@/utils/logger';

const logger = createLogger({
  level: 'info',
  enabled: process.env.NODE_ENV === 'development',
  prefix: 'FormUtils'
});

/**
 * Smart field processing with automatic conversion and sanitization
 */
export function smartProcessField(fieldName: string, value: string): {
  value: string;
  category: string;
  requiresConversion: boolean;
  requiresSanitization: boolean;
} {
  const category = getFieldCategory(fieldName);
  
  return {
    value: processFormFieldValue(fieldName, value),
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
 * Main form data sanitization function
 */
export function sanitizeFormData<T extends Record<string, any>>(
  formData: T,
  options: {
    skipFields?: string[];
    strictSanitization?: boolean;
  } = {}
): { data: T; errors: string[] } {
  const { skipFields = [], strictSanitization = false } = options;
  const errors: string[] = [];
  const sanitizedData = { ...formData };

  logger.info('Starting form sanitization', { 
    fieldCount: Object.keys(formData).length,
    options 
  });

  for (const [key, value] of Object.entries(formData)) {
    if (skipFields.includes(key)) {
      logger.debug(`Skipping field: ${key}`);
      continue;
    }

    try {
      if (typeof value === 'string') {
        const processedField = smartProcessField(key, value);
        sanitizedData[key as keyof T] = processedField.value as T[keyof T];
        
        logger.debug(`Processed field: ${key}`, processedField);
      }
    } catch (error) {
      const errorMessage = `Failed to sanitize field ${key}: ${error}`;
      logger.error(errorMessage);
      errors.push(errorMessage);
      
      if (strictSanitization) {
        throw new Error(errorMessage);
      }
    }
  }

  logger.info('Form sanitization completed', { 
    errorCount: errors.length,
    hasErrors: errors.length > 0 
  });

  return { data: sanitizedData, errors };
}

// Re-export the smart validation system
export { 
  validateStep, 
  isStepAccessible, 
  validateFormComplete,
  validationSystem,
  type ValidationResult,
  type ValidationRule,
  type ValidationSchema,
  type StepConfig
} from './validation';

/**
 * Validate form data by step name (alternative API)
 */
export function validateStepByName(
  stepData: Partial<ListingFormData>,
  stepName: string,
  validationRules?: Record<string, { required?: boolean; custom?: (value: any) => string | null }>
): FormErrors {
  const errors: FormErrors = {};

  logger.info(`Validating step: ${stepName}`, { 
    fieldCount: Object.keys(stepData).length 
  });

  for (const [fieldName, value] of Object.entries(stepData)) {
    const rules = validationRules?.[fieldName];
    const stringValue = typeof value === 'string' ? value : String(value || '');
    
    // Apply field validation
    const validation = validateFormField(fieldName, stringValue, rules?.required);
    
    if (!validation.isValid) {
      errors[fieldName] = validation.error || 'Invalid field';
    }
    
    // Apply custom validation if provided
    if (rules?.custom && !errors[fieldName]) {
      const customError = rules.custom(value);
      if (customError) {
        errors[fieldName] = customError;
      }
    }
  }

  const errorCount = Object.keys(errors).length;
  logger.info(`Step validation completed: ${stepName}`, { 
    errorCount,
    isValid: errorCount === 0 
  });

  return errors;
}

/**
 * Process form fields in batch
 */
export function processFormFields(fields: Record<string, string>): Record<string, string> {
  const processed: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(fields)) {
    processed[key] = processFormFieldValue(key, value);
  }
  
  return processed;
}
