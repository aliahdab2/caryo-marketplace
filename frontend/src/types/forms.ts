/**
 * Types for form components and validation
 */

import { ListingFormData } from './listings';

/**
 * Interface for form validation errors
 */
export interface FormErrors {
  [key: string]: string;
}

/**
 * Interface for step configuration in multi-step forms
 */
export interface StepConfig {
  step: number;
  title: string;
  icon: string;
  isComplete: boolean;
}

/**
 * Type for form validation functions
 */
export type FormValidator<T = Record<string, unknown>> = (data: T) => string[];

/**
 * Interface for step validation configuration
 */
export interface StepValidation {
  step: number;
  validate: FormValidator<ListingFormData>;
  requiredFields: (keyof ListingFormData)[];
}

/**
 * Interface for form field configuration
 */
export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Interface for form step navigation
 */
export interface FormNavigation {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
}
