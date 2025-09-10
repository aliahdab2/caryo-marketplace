/**
 * Age validation utilities for signup flow
 */

export interface AgeValidationResult {
  isValid: boolean;
  age?: number;
  error?: string;
  requiresDealerVerification?: boolean;
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
 * Validate date of birth and age requirements for Caryo.sy
 * @param dateOfBirth - Date string in YYYY-MM-DD format (optional)
 * @param context - 'signup' | 'selling' | 'dealer' - what the user is trying to do
 * @returns Validation result
 */
export function validateAge(dateOfBirth: string | undefined, context: 'signup' | 'selling' | 'dealer' = 'signup'): AgeValidationResult {
  // For signup, DOB is optional - allow 16+ to browse
  if (!dateOfBirth) {
    if (context === 'signup') {
      return {
        isValid: true,
        age: undefined
      };
    }
    // For selling/dealer, DOB is required
    return {
      isValid: false,
      error: 'Date of birth is required to proceed'
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

  // Age validation based on context
  if (context === 'signup') {
    // Allow 16+ to browse and create account
    if (age < 16) {
      return {
        isValid: false,
        age,
        error: 'Users must be at least 16 years old'
      };
    }
    return {
      isValid: true,
      age
    };
  }

  if (context === 'selling') {
    // Require 18+ for selling cars
    if (age < 18) {
      return {
        isValid: false,
        age,
        error: 'You must be at least 18 years old to sell cars on Caryo.sy'
      };
    }
    return {
      isValid: true,
      age
    };
  }

  if (context === 'dealer') {
    // Require 18+ for dealer accounts and business verification
    if (age < 18) {
      return {
        isValid: false,
        age,
        error: 'You must be at least 18 years old to register as a dealer'
      };
    }
    return {
      isValid: true,
      age,
      requiresDealerVerification: true
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
