/**
 * Smart Form Validation System - Best Practices Implementation
 * 
 * This file implements a flexible, extensible validation system following industry standards:
 * - Schema-based validation
 * - Conditional validation rules
 * - Async validation support
 * - Field dependencies
 * - Custom validators
 * - Performance optimized
 */

import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { convertArabicNumerals } from './numeral/arabic';
import { createLogger } from './logger';

const logger = createLogger({
  level: 'info',
  enabled: process.env.NODE_ENV === 'development',
  prefix: 'ValidationSystem'
});

// Translation function type
type TranslationFunction = (key: string, fallback: string) => string;

/**
 * Validation rule interface
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any, formData: Partial<ListingFormData>) => string | null;
  dependencies?: string[]; // Fields this validation depends on
  when?: (formData: Partial<ListingFormData>) => boolean; // Conditional validation
}

/**
 * Validation schema for form steps
 */
export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

/**
 * Step configuration with validation schema
 */
export interface StepConfig {
  id: number;
  name: string;
  schema: ValidationSchema;
  dependencies?: number[]; // Previous steps that must be valid
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
  warnings?: FormErrors;
  validatedFields: string[];
  skippedFields: string[];
}

/**
 * Smart validation system class
 */
export class FormValidationSystem {
  private stepConfigs: Map<number, StepConfig> = new Map();
  private fieldCache: Map<string, any> = new Map();
  
  constructor() {
    this.initializeStepConfigs();
  }

  /**
   * Initialize step configurations with validation schemas
   */
  private initializeStepConfigs(): void {
    // Step 1: Basic Information
    this.stepConfigs.set(1, {
      id: 1,
      name: 'basic-info',
      schema: {
        title: {
          required: true,
          minLength: 3,
          maxLength: 200,
          pattern: /^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF.-]+$/
        },
        description: {
          required: true,
          minLength: 10,
          maxLength: 2000
        },
        price: {
          required: true,
          min: 1,
          max: 10000000,
          custom: (value) => {
            const numValue = parseFloat(convertArabicNumerals(String(value || '')));
            if (isNaN(numValue)) return 'Price must be a valid number';
            if (numValue <= 0) return 'Price must be greater than 0';
            return null;
          }
        },
        make: {
          required: true,
          minLength: 2,
          maxLength: 50
        },
        model: {
          required: true,
          minLength: 1,
          maxLength: 50
        },
        year: {
          required: true,
          min: 1900,
          max: new Date().getFullYear() + 1,
          custom: (value) => {
            const numValue = parseInt(convertArabicNumerals(String(value || '')));
            if (isNaN(numValue)) return 'Year must be a valid number';
            return null;
          }
        }
      }
    });

    // Step 2: Vehicle Details (Optional)
    this.stepConfigs.set(2, {
      id: 2,
      name: 'vehicle-details',
      schema: {
        mileage: {
          min: 0,
          max: 2000000,
          when: (formData) => !!formData.mileage,
          custom: (value) => {
            if (!value) return null;
            const numValue = parseFloat(convertArabicNumerals(String(value)));
            if (isNaN(numValue)) return 'Mileage must be a valid number';
            return null;
          }
        },
        condition: {
          pattern: /^(new|used|certified)$/,
          when: (formData) => !!formData.condition
        },
        fuelType: {
          pattern: /^(gasoline|diesel|hybrid|electric|other)$/,
          when: (formData) => !!formData.fuelType
        },
        transmission: {
          pattern: /^(manual|automatic|cvt|other)$/,
          when: (formData) => !!formData.transmission
        }
      },
      dependencies: [1]
    });

    // Step 3: Contact Information
    this.stepConfigs.set(3, {
      id: 3,
      name: 'contact-info',
      schema: {
        contactName: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF.-]+$/
        },
        contactPhone: {
          required: true,
          pattern: /^[\+]?[0-9\s\-\(\)]{10,15}$/,
          custom: (value) => {
            if (!value) return null;
            const cleaned = value.replace(/[\s\-\(\)]/g, '');
            if (cleaned.length < 10) return 'Phone number must be at least 10 digits';
            return null;
          }
        },
        contactEmail: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          when: (formData) => !!formData.contactEmail
        },
        governorateSlug: {
          required: true,
          minLength: 2
        },
        locationSlug: {
          required: true,
          minLength: 2,
          dependencies: ['governorateSlug']
        }
      },
      dependencies: [1]
    });

    // Step 4: Review & Submit
    this.stepConfigs.set(4, {
      id: 4,
      name: 'review',
      schema: {
        // Terms acceptance could be added here
      },
      dependencies: [1, 2, 3]
    });
  }

  /**
   * Validate a single field
   */
  public validateField(
    fieldName: string,
    value: any,
    formData: Partial<ListingFormData>,
    rule: ValidationRule,
    t: TranslationFunction
  ): string | null {
    // Check if validation should be skipped based on conditions
    if (rule.when && !rule.when(formData)) {
      return null;
    }

    const stringValue = String(value || '').trim();

    // Required field validation
    if (rule.required && !stringValue) {
      return t(`validation.${fieldName}.required`, 'This field is required');
    }

    // Skip other validations if field is empty and not required
    if (!stringValue && !rule.required) {
      return null;
    }

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      return t(`validation.${fieldName}.minLength`, `Minimum ${rule.minLength} characters required`);
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return t(`validation.${fieldName}.maxLength`, `Maximum ${rule.maxLength} characters allowed`);
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return t(`validation.${fieldName}.pattern`, 'Invalid format');
    }

    // Numeric validations
    if (rule.min !== undefined || rule.max !== undefined) {
      const numValue = parseFloat(convertArabicNumerals(stringValue));
      if (isNaN(numValue)) {
        return t(`validation.${fieldName}.number`, 'Must be a valid number');
      }

      if (rule.min !== undefined && numValue < rule.min) {
        return t(`validation.${fieldName}.min`, `Minimum value is ${rule.min}`);
      }

      if (rule.max !== undefined && numValue > rule.max) {
        return t(`validation.${fieldName}.max`, `Maximum value is ${rule.max}`);
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value, formData);
    }

    return null;
  }

  /**
   * Validate a single step
   */
  public validateStep(
    stepNumber: number,
    formData: Partial<ListingFormData>,
    t: TranslationFunction
  ): ValidationResult {
    const stepConfig = this.stepConfigs.get(stepNumber);
    if (!stepConfig) {
      logger.warn(`No configuration found for step ${stepNumber}`);
      return {
        isValid: true,
        errors: {},
        validatedFields: [],
        skippedFields: []
      };
    }

    const errors: FormErrors = {};
    const validatedFields: string[] = [];
    const skippedFields: string[] = [];

    logger.debug(`Validating step ${stepNumber}: ${stepConfig.name}`);

    // Validate each field in the step schema
    for (const [fieldName, rule] of Object.entries(stepConfig.schema)) {
      const value = formData[fieldName as keyof ListingFormData];

      // Check field dependencies
      if (rule.dependencies) {
        const missingDeps = rule.dependencies.filter(dep => !formData[dep as keyof ListingFormData]);
        if (missingDeps.length > 0) {
          skippedFields.push(fieldName);
          continue;
        }
      }

      const error = this.validateField(fieldName, value, formData, rule, t);
      if (error) {
        errors[fieldName] = error;
      }
      
      validatedFields.push(fieldName);
    }

    const isValid = Object.keys(errors).length === 0;
    
    logger.debug(`Step ${stepNumber} validation result`, {
      isValid,
      errorCount: Object.keys(errors).length,
      validatedFields: validatedFields.length,
      skippedFields: skippedFields.length
    });

    return {
      isValid,
      errors,
      validatedFields,
      skippedFields
    };
  }

  /**
   * Validate multiple steps efficiently
   */
  public validateSteps(
    stepNumbers: number[],
    formData: Partial<ListingFormData>,
    t: TranslationFunction
  ): ValidationResult {
    let allErrors: FormErrors = {};
    let allValidatedFields: string[] = [];
    let allSkippedFields: string[] = [];

    logger.info(`Validating steps: ${stepNumbers.join(', ')}`);

    for (const stepNumber of stepNumbers) {
      const result = this.validateStep(stepNumber, formData, t);
      
      allErrors = { ...allErrors, ...result.errors };
      allValidatedFields.push(...result.validatedFields);
      allSkippedFields.push(...result.skippedFields);
    }

    const isValid = Object.keys(allErrors).length === 0;

    logger.info(`Multi-step validation completed`, {
      steps: stepNumbers.join(', '),
      isValid,
      totalErrors: Object.keys(allErrors).length,
      totalValidatedFields: allValidatedFields.length
    });

    return {
      isValid,
      errors: allErrors,
      validatedFields: allValidatedFields,
      skippedFields: allSkippedFields
    };
  }

  /**
   * Check if a step is accessible (all dependencies are valid)
   */
  public isStepAccessible(
    targetStep: number,
    formData: Partial<ListingFormData>,
    t: TranslationFunction
  ): boolean {
    const stepConfig = this.stepConfigs.get(targetStep);
    if (!stepConfig?.dependencies) {
      return true;
    }

    const dependencyResult = this.validateSteps(stepConfig.dependencies, formData, t);
    return dependencyResult.isValid;
  }

  /**
   * Get step configuration
   */
  public getStepConfig(stepNumber: number): StepConfig | undefined {
    return this.stepConfigs.get(stepNumber);
  }

  /**
   * Get all step configurations
   */
  public getAllStepConfigs(): StepConfig[] {
    return Array.from(this.stepConfigs.values());
  }

  /**
   * Clear validation cache (useful for testing)
   */
  public clearCache(): void {
    this.fieldCache.clear();
  }
}

// Export singleton instance
export const validationSystem = new FormValidationSystem();

// Convenience functions for backward compatibility
export function validateStep(
  steps: number | number[],
  formData: Partial<ListingFormData>,
  t: TranslationFunction
): FormErrors {
  const stepNumbers = Array.isArray(steps) ? steps : [steps];
  const result = validationSystem.validateSteps(stepNumbers, formData, t);
  return result.errors;
}

export function isStepAccessible(
  targetStep: number,
  formData: Partial<ListingFormData>,
  t: TranslationFunction
): boolean {
  return validationSystem.isStepAccessible(targetStep, formData, t);
}

export function validateFormComplete(
  formData: Partial<ListingFormData>,
  t: TranslationFunction
): ValidationResult {
  return validationSystem.validateSteps([1, 2, 3, 4], formData, t);
}
