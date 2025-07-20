/**
 * PriceSlider component constants
 * Optimized for Blocket-style design with proper modal integration
 */

export const PRICE_SLIDER_DEFAULTS = {
  MIN_RANGE: 0,
  MAX_RANGE: 120000,
  STEP: 100,
  // Locale fallbacks for bilingual support (auto-detected from i18n context)
  FALLBACK_LOCALE: 'en-US',
  SUPPORTED_LOCALES: ['en', 'ar', 'en-US', 'ar-SY'] as const,
  // Debounce settings
  DEBOUNCE_MS: 100,
  INPUT_DEBOUNCE_MS: 800
} as const;

export const SLIDER_CLASSES = {
  // Container
  CONTAINER: 'range-slider',
  
  // Value displays
  VALUE_DISPLAY: 'flex justify-between items-center mb-6',
  VALUE_ITEM: 'text-center',
  VALUE_TEXT: 'text-lg font-semibold text-gray-900',
  
  // Slider track container
  TRACK_CONTAINER: 'relative px-3 py-6',
  TRACK_BASE: 'relative h-2 bg-gray-200 rounded-full cursor-pointer',
  TRACK_ACTIVE: 'absolute h-2 bg-blue-500 rounded-full',
  
  // Thumb styles (Blocket-style)
  THUMB_BASE: 'absolute w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-pointer transition-all duration-150 ease-out',
  THUMB_HOVER: 'shadow-xl',
  THUMB_ACTIVE: 'shadow-xl',
  THUMB_DISABLED: 'opacity-50 cursor-not-allowed',
  
  // Range labels
  RANGE_LABELS: 'flex justify-between mt-3 text-sm text-gray-500',
  
  // Input container and fields
  INPUT_GRID: 'grid grid-cols-2 gap-4 mt-6',
  INPUT_WRAPPER: '',
  INPUT_LABEL: 'block text-sm text-gray-600 mb-2',
  INPUT_FIELD: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Disabled states
  DISABLED: 'opacity-50'
} as const;

export const INPUT_CLASSES = {
  // Remove number input spinner arrows for cleaner Blocket-style appearance
  NO_SPINNER: '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
} as const;

export const LAYOUT_CLASSES = {
  // Layout utilities that work well with modal integration
  MODAL_COMPATIBLE: 'w-full',
  RESPONSIVE_PADDING: 'px-1 sm:px-0'
} as const;
