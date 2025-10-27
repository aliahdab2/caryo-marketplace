/**
 * Country-specific business registration configuration
 * 
 * This allows easy expansion to new markets without changing core validation logic.
 * Simply add a new country configuration and update CURRENT_MARKET.
 */

// Currently supporting Syria only
// When expanding, add: 'JO' | 'EG' | 'AE' | 'SA' | 'LB' etc.
export type CountryCode = 'SY';

export interface BusinessRegistrationConfig {
  /** Country code */
  country: CountryCode;
  
  /** Field label in English */
  labelEn: string;
  
  /** Field label in Arabic */
  labelAr: string;
  
  /** Is this field required? */
  required: boolean;
  
  /** Placeholder text in English */
  placeholderEn: string;
  
  /** Placeholder text in Arabic */
  placeholderAr: string;
  
  /** Tooltip/help text in English */
  tooltipEn: string;
  
  /** Tooltip/help text in Arabic */
  tooltipAr: string;
  
  /** Validation regex pattern */
  validationPattern: RegExp;
  
  /** Minimum length */
  minLength: number;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Error message for invalid format (English) */
  errorMessageEn: string;
  
  /** Error message for invalid format (Arabic) */
  errorMessageAr: string;
}

/**
 * Market-specific configurations
 * 
 * Currently: Syria only
 * To add more markets: uncomment configurations below or add new ones
 */
export const BUSINESS_REGISTRATION_CONFIGS: Record<CountryCode, BusinessRegistrationConfig> = {
  // 🇸🇾 Syria - Commercial Registration Number
  SY: {
    country: 'SY',
    labelEn: 'Commercial Registration Number',
    labelAr: 'رقم السجل التجاري',
    required: false,
    placeholderEn: 'e.g., 12345 or CR-12345',
    placeholderAr: 'مثال: ١٢٣٤٥ أو CR-12345',
    tooltipEn: 'Your commercial registration number (السجل التجاري) or tax ID',
    tooltipAr: 'رقم السجل التجاري أو الرقم الضريبي',
    validationPattern: /^[A-Za-z0-9\-\/]+$/,
    minLength: 3,
    maxLength: 50,
    errorMessageEn: 'Business registration number must be at least 3 characters',
    errorMessageAr: 'يجب أن يكون رقم السجل التجاري 3 أحرف على الأقل',
  },
};

/* 
 * FUTURE MARKETS - Add when expanding
 * 
 * See docs/EXPANSION_GUIDE.md for examples:
 * - Jordan (JO): Commercial Registration
 * - Egypt (EG): Tax Registration (XXX-XXX-XXX)
 * - UAE (AE): Trade License (6-10 digits)
 * - Saudi Arabia (SA): CR Number (10 digits)
 * - Lebanon (LB): Commercial Registration
 */

/**
 * Get current market (always returns 'SY' for now)
 * 
 * When expanding to multiple markets, read from:
 * - NEXT_PUBLIC_MARKET environment variable
 * - Cookie/domain detection (see docs/EXPANSION_GUIDE.md)
 */
export function getCurrentMarket(): CountryCode {
  // Currently: Syria only
  // Future: Read from env var or domain detection
  return 'SY';
}

/**
 * Get current market's business registration config
 */
export function getBusinessRegistrationConfig(): BusinessRegistrationConfig {
  const market = getCurrentMarket();
  return BUSINESS_REGISTRATION_CONFIGS[market];
}

/**
 * Validate business registration number for current market
 */
export function validateBusinessRegistration(value: string): {
  isValid: boolean;
  error?: string;
} {
  const config = getBusinessRegistrationConfig();
  
  // If field is optional and empty, it's valid
  if (!config.required && (!value || value.trim().length === 0)) {
    return { isValid: true };
  }
  
  // If field is required and empty, it's invalid
  if (config.required && (!value || value.trim().length === 0)) {
    return {
      isValid: false,
      error: `${config.labelEn} is required`,
    };
  }
  
  const trimmedValue = value.trim();
  
  // Check minimum length
  if (trimmedValue.length < config.minLength) {
    return {
      isValid: false,
      error: config.errorMessageEn,
    };
  }
  
  // Check maximum length (if specified)
  if (config.maxLength && trimmedValue.length > config.maxLength) {
    return {
      isValid: false,
      error: config.errorMessageEn,
    };
  }
  
  // Check pattern
  if (!config.validationPattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: config.errorMessageEn,
    };
  }
  
  return { isValid: true };
}

/**
 * Get field label for current language
 */
export function getBusinessRegistrationLabel(locale: 'en' | 'ar'): string {
  const config = getBusinessRegistrationConfig();
  return locale === 'ar' ? config.labelAr : config.labelEn;
}

/**
 * Get field placeholder for current language
 */
export function getBusinessRegistrationPlaceholder(locale: 'en' | 'ar'): string {
  const config = getBusinessRegistrationConfig();
  return locale === 'ar' ? config.placeholderAr : config.placeholderEn;
}

/**
 * Get field tooltip for current language
 */
export function getBusinessRegistrationTooltip(locale: 'en' | 'ar'): string {
  const config = getBusinessRegistrationConfig();
  return locale === 'ar' ? config.tooltipAr : config.tooltipEn;
}

/**
 * Check if business registration is required in current market
 */
export function isBusinessRegistrationRequired(): boolean {
  return getBusinessRegistrationConfig().required;
}

