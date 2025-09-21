/**
 * Syrian phone number validation utilities
 * 
 * Supports formats:
 * - +963XXXXXXXXX (international with +)
 * - 963XXXXXXXXX (international without +)
 * - 09XXXXXXXX (local with 0)
 * - 9XXXXXXXX (local without 0)
 * 
 * Validates against Syrian operators: Syriatel (91, 98, 99) and MTN (92-96)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  message: string;
  operator?: string;
}

/**
 * Normalizes Syrian phone numbers to standard format
 */
export function normalizeSyrianNumber(raw: string): string | null {
  const number = raw.replace(/[\s\-\(\)]/g, '');

  // Already in full international format
  if (number.startsWith('+963') && number.length === 12) {
    return number;
  }

  // International format without +
  if (number.startsWith('963') && number.length === 11) {
    return `+${number}`;
  }

  // Local format with 0 prefix (09xxxxxxxx)
  if (number.startsWith('09') && number.length === 10) {
    return `+963${number.substring(1)}`;
  }

  // Local format without 0 prefix (9xxxxxxxx)
  if (number.startsWith('9') && number.length === 9) {
    return `+963${number}`;
  }

  return null;
}

/**
 * Validates if a phone number has a valid Syrian operator code
 */
export function hasValidSyrianOperator(normalizedPhone: string): boolean {
  if (!normalizedPhone.startsWith('+963')) return false;

  // Extract operator code (two digits after +963)
  const operatorCode = normalizedPhone.substring(4, 6);
  const validOperators = ['91', '92', '93', '94', '95', '96', '98', '99'];

  return validOperators.includes(operatorCode);
}

/**
 * Gets the operator name from a normalized Syrian phone number
 */
export function getSyrianOperator(normalizedPhone: string): string | null {
  if (!hasValidSyrianOperator(normalizedPhone)) return null;

  const operatorCode = normalizedPhone.substring(4, 6);

  if (['91', '98', '99'].includes(operatorCode)) {
    return 'Syriatel';
  }

  if (['92', '93', '94', '95', '96'].includes(operatorCode)) {
    return 'MTN Syria';
  }

  return null;
}

/**
 * Validates a Syrian phone number with simple feedback
 */
export function validateSyrianPhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, message: 'phoneRequired' };
  }

  const normalized = normalizeSyrianNumber(phone);

  if (!normalized) {
    return {
      isValid: false,
      message: 'invalidPhoneFormat'
    };
  }

  if (!hasValidSyrianOperator(normalized)) {
    return {
      isValid: false,
      message: 'invalidSyrianOperator'
    };
  }

  const operator = getSyrianOperator(normalized);

  return {
    isValid: true,
    message: '',
    operator: operator || undefined
  };
}

/**
 * Formats phone number for display (removes +963 prefix)
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizeSyrianNumber(phone);
  if (normalized && normalized.startsWith('+963')) {
    return normalized.substring(4); // Remove +963 prefix
  }
  return phone;
}

/**
 * Gets user-friendly operator display name
 */
export function getOperatorDisplayName(operator: string): string {
  return operator; // Simple pass-through
}