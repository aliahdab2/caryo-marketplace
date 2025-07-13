/**
 * Form utilities and helper functions
 */

import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';

/**
 * Converts Arabic-Indic numerals to Latin numerals
 * @param input - The input string that may contain Arabic numerals
 * @returns String with Arabic numerals converted to Latin numerals
 */
export const convertArabicNumerals = (input: string): string => {
  if (!input) return input;
  
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  const latinNumerals = '0123456789';
  
  return input.replace(/[٠-٩]/g, (char) => {
    const index = arabicNumerals.indexOf(char);
    return index !== -1 ? latinNumerals[index] : char;
  });
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validates a specific step of the listing form
 * @param step - The step number to validate
 * @param formData - The form data to validate
 * @param t - Translation function for error messages
 * @returns Object with field names as keys and error messages as values
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

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if email is valid
 */
const _isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (basic validation)
 * @param phone - Phone string to validate
 * @returns True if phone is valid
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Calculates form completion percentage
 * @param currentStep - Current step number
 * @param totalSteps - Total number of steps
 * @returns Completion percentage
 */
export const calculateProgress = (currentStep: number, totalSteps: number): number => {
  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Formats currency display
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: string | number, currency: string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

/**
 * Debounce function for input validation
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
