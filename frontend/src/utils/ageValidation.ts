/**
 * Age validation utilities for signup flow
 */

export interface AgeValidationResult {
  isValid: boolean;
  age?: number;
  error?: string;
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate date of birth and age requirements
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @param requiredAge - Minimum age required (default: 18)
 * @returns Validation result
 */
export function validateAge(dateOfBirth: string, requiredAge: number = 18): AgeValidationResult {
  if (!dateOfBirth) {
    return {
      isValid: false,
      error: 'Date of birth is required'
    };
  }

  // Check if date is valid
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date of birth'
    };
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (birthDate > today) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future'
    };
  }

  // Check if date is too far in the past (reasonable limit: 120 years)
  const maxAge = 120;
  const maxBirthDate = new Date();
  maxBirthDate.setFullYear(maxBirthDate.getFullYear() - maxAge);
  if (birthDate < maxBirthDate) {
    return {
      isValid: false,
      error: 'Please enter a valid date of birth'
    };
  }

  const age = calculateAge(dateOfBirth);

  if (age < requiredAge) {
    return {
      isValid: false,
      age,
      error: `You must be at least ${requiredAge} years old to create an account`
    };
  }

  return {
    isValid: true,
    age
  };
}

/**
 * Format date string for display
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateOfBirth(dateOfBirth: string): string {
  if (!dateOfBirth) return '';

  try {
    const date = new Date(dateOfBirth);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateOfBirth;
  }
}

/**
 * Get minimum date for date picker (18 years ago)
 * @returns Date string in YYYY-MM-DD format
 */
export function getMinDateFor18Years(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split('T')[0];
}

/**
 * Check if user is eligible for dealer role
 * @param age - User's age
 * @returns Boolean indicating eligibility
 */
export function isEligibleForDealer(age: number): boolean {
  return age >= 18;
}
