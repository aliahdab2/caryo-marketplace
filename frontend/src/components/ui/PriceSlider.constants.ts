/**
 * PriceSlider component constants
 * 
 * Note: Locale is auto-detected from i18n context to support bilingual (English/Arabic) users.
 * No hardcoded locale defaults are used to ensure proper internationalization.
 */

export const PRICE_SLIDER_DEFAULTS = {
  MIN_RANGE: 0,
  MAX_RANGE: 150000,
  STEP: 1000,
  // Locale fallbacks for bilingual support (auto-detected from i18n context)
  FALLBACK_LOCALE: 'en-US',
  SUPPORTED_LOCALES: ['en', 'ar', 'en-US', 'ar-SY'] as const
} as const;

export const PRICE_SLIDER_CLASSES = {
  TRACK_BASE: 'absolute h-2 rounded-full',
  TRACK_ACTIVE: 'bg-blue-500',
  TRACK_INACTIVE: 'bg-gray-200',
  THUMB_BASE: 'absolute w-6 h-6 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-200',
  THUMB_DEFAULT: 'bg-blue-600',
  THUMB_ACTIVE: 'scale-110 ring-4 ring-blue-200'
} as const;
