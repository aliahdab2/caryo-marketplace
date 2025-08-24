/**
 * Centralized password validation utility
 * Aligned with backend PasswordValidator requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordRequirements {
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  characterTypeCount: number;
  hasEnoughTypes: boolean;
}

/**
 * Validates password against strict security requirements
 * Must match backend PasswordValidator logic exactly
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  if (!password || password.trim().length === 0) {
    errors.push('Password cannot be empty');
    return { isValid: false, errors };
  }
  
  const trimmedPassword = password.trim();
  
  // Length validation
  if (trimmedPassword.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (trimmedPassword.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Character requirements - require at least 2 of 4 character types (reasonable security)
  let characterTypes = 0;
  
  if (/[a-z]/.test(trimmedPassword)) characterTypes++;
  if (/[A-Z]/.test(trimmedPassword)) characterTypes++;
  if (/\d/.test(trimmedPassword)) characterTypes++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword)) characterTypes++;
  
  if (characterTypes < 2) {
    errors.push('Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets detailed password requirements status for UI feedback
 */
export function getPasswordRequirements(password: string): PasswordRequirements {
  const trimmedPassword = password.trim();
  
  const hasLowercase = /[a-z]/.test(trimmedPassword);
  const hasUppercase = /[A-Z]/.test(trimmedPassword);
  const hasDigit = /\d/.test(trimmedPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword);
  
  let characterTypeCount = 0;
  if (hasLowercase) characterTypeCount++;
  if (hasUppercase) characterTypeCount++;
  if (hasDigit) characterTypeCount++;
  if (hasSpecialChar) characterTypeCount++;
  
  return {
    hasMinLength: trimmedPassword.length >= 8,
    hasMaxLength: trimmedPassword.length <= 128,
    hasLowercase,
    hasUppercase,
    hasDigit,
    hasSpecialChar,
    characterTypeCount,
    hasEnoughTypes: characterTypeCount >= 2
  };
}

/**
 * Gets the first validation error message (for simple error display)
 */
export function getPasswordError(password: string): string | null {
  const result = validatePassword(password);
  return result.errors.length > 0 ? result.errors[0] : null;
}
