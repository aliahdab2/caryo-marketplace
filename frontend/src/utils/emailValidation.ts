/**
 * Email validation utility with comprehensive checks
 */

// RFC 5322 compliant email regex (simplified but robust)
const _EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// More strict email regex for better validation
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates email format using strict regex
 * @param email - Email string to validate
 * @returns boolean - true if valid, false if invalid
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Basic length check
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }

  // Check for basic structure
  if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
    return false;
  }

  // Check for invalid characters and patterns
  if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
    return false;
  }

  // Split into local and domain parts
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;

  // Validate local part (before @)
  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Validate domain part (after @)
  if (domainPart.length === 0 || domainPart.length > 253) {
    return false;
  }

  // Domain must have at least one dot and valid TLD
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return false;
  }

  // Check TLD (last part) - must be at least 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return false;
  }

  // Use strict regex for final validation
  return STRICT_EMAIL_REGEX.test(trimmedEmail);
};

/**
 * Gets email validation error message
 * @param email - Email string to validate
 * @param t - Translation function
 * @returns string - Error message or empty string if valid
 */
export const getEmailValidationError = (email: string, t: (key: string) => string): string => {
  if (!email || email.trim().length === 0) {
    return t('emailRequired');
  }

  if (!isValidEmail(email)) {
    return t('invalidEmailFormat');
  }

  return '';
};

/**
 * Real-time email validation for input fields
 * @param email - Email string to validate
 * @returns object with isValid and error message
 */
export const validateEmailRealTime = (email: string, t: (key: string) => string) => {
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: '' }; // Don't show error for empty field
  }

  const isValid = isValidEmail(trimmedEmail);
  const error = isValid ? '' : t('invalidEmailFormat');

  return { isValid, error };
};

/**
 * Checks if a string could be an email (contains @)
 * @param input - Input string to check
 * @returns boolean - true if it looks like an email
 */
export const looksLikeEmail = (input: string): boolean => {
  return input.includes('@');
};
