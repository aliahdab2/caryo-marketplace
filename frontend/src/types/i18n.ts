/**
 * Defines the supported languages for the application.
 */
export type Lang = 'en' | 'ar';

/**
 * Record mapping language codes to their display names.
 */
export const SUPPORTED_LANGUAGES: Record<Lang, string> = {
  en: 'English',
  ar: 'العربية',
} as const;

/**
 * Configuration for currency formatting based on language.
 */
export const CURRENCY_CONFIG: Record<Lang, { currency: string; locale: string }> = {
  en: { currency: 'USD', locale: 'en-US' },
  ar: { currency: 'SAR', locale: 'ar-SA' },
} as const;
