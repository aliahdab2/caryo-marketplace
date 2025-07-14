/**
 * Form utilities and helper functions
 * 
 * Performance & Security Features:
 * - Zero-copy optimizations for clean inputs
 * - Tiered sanitization levels (basic/standard/strict)
 * - Smart memoization for repeated operations
 * - Lazy loading for heavy dependencies
 * - Input validation with early exit patterns
 */

import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';

// Performance optimizations
const SANITIZATION_CACHE = new Map<string, string>();
const CACHE_SIZE_LIMIT = 100;

// Lazy load DOMPurify only when needed for HTML content
let DOMPurifyModule: typeof import('dompurify').default | null = null;
let DOMPurifyPromise: Promise<typeof import('dompurify').default | null> | null = null;

const loadDOMPurify = async (): Promise<typeof import('dompurify').default | null> => {
  if (DOMPurifyModule) return DOMPurifyModule;
  if (DOMPurifyPromise) return DOMPurifyPromise;
  
  if (typeof window !== 'undefined') {
    DOMPurifyPromise = import('dompurify')
      .then(({ default: purify }) => {
        DOMPurifyModule = purify;
        return purify;
      })
      .catch(error => {
        console.warn('Failed to load DOMPurify:', error);
        return null;
      });
    return DOMPurifyPromise;
  }
  return null;
};

// Pre-compiled regex patterns for performance
const SECURITY_PATTERNS = {
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  EVENT_HANDLERS: /on\w+\s*=/gi,
  JS_PROTOCOLS: /javascript:|vbscript:|data:/gi,
  EXCESSIVE_WHITESPACE: /\s+/g,
  ARABIC_NUMERALS: /[٠-٩]/g,
  CONTROL_CHARS: /[\x00-\x1F\x7F]/g,
} as const;

// Input type detection for smart sanitization
type InputType = 'text' | 'email' | 'phone' | 'url' | 'number' | 'search' | 'html';

const detectInputType = (input: string): InputType => {
  if (!input) return 'text';
  if (input.includes('@') && input.includes('.')) return 'email';
  if (/^\+?[\d\s\-\(\)]+$/.test(input)) return 'phone';
  if (input.startsWith('http') || input.includes('://')) return 'url';
  if (/^\d+\.?\d*$/.test(input)) return 'number';
  if (input.includes('<') && input.includes('>')) return 'html';
  return 'text';
};

/**
 * Converts Arabic-Indic numerals to Latin numerals with performance optimization
 * @param input - The input string that may contain Arabic numerals
 * @returns String with Arabic numerals converted to Latin numerals
 */
export const convertArabicNumerals = (input: string): string => {
  if (!input || !SECURITY_PATTERNS.ARABIC_NUMERALS.test(input)) return input;
  
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  const latinNumerals = '0123456789';
  
  return input.replace(SECURITY_PATTERNS.ARABIC_NUMERALS, (char) => {
    const index = arabicNumerals.indexOf(char);
    return index !== -1 ? latinNumerals[index] : char;
  });
};

/**
 * High-performance sanitization with memoization and smart detection
 * Automatically chooses the right sanitization level based on input type
 * @param input - The input string to sanitize
 * @param level - Sanitization level: 'basic' | 'standard' | 'strict'
 * @returns Sanitized string
 */
export const sanitizeInput = (
  input: string, 
  level: 'basic' | 'standard' | 'strict' = 'standard'
): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Performance tracking (development only)
  const startTime = sanitizationStats ? performance.now() : 0;
  
  // Zero-copy optimization: return early if input is already clean
  if (level === 'basic' && !/<|>|javascript:|on\w+=/i.test(input)) {
    return input.trim();
  }
  
  // Check cache for repeated operations
  const cacheKey = `${level}:${input}`;
  if (SANITIZATION_CACHE.has(cacheKey)) {
    if (sanitizationStats) {
      sanitizationStats.calls++;
      sanitizationStats.cacheHits++;
    }
    return SANITIZATION_CACHE.get(cacheKey)!;
  }
  
  let sanitized = input.trim();
  
  // Apply sanitization based on level
  switch (level) {
    case 'basic':
      // Minimal sanitization for trusted inputs
      sanitized = sanitized.replace(/[<>]/g, '');
      break;
      
    case 'standard':
      // Standard sanitization for form inputs
      sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.EVENT_HANDLERS, '');
      break;
      
    case 'strict':
      // Comprehensive sanitization for untrusted inputs
      sanitized = sanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.EVENT_HANDLERS, '');
      
      // HTML entity encoding for dangerous characters
      sanitized = sanitized.replace(/[&<>"'`=\/]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
          "'": '&#x27;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
        };
        return escapeMap[match] || match;
      });
      break;
  }
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(SECURITY_PATTERNS.EXCESSIVE_WHITESPACE, ' ').trim();
  
  // Length limiting for DoS prevention
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  // Cache the result (with size limiting)
  if (SANITIZATION_CACHE.size >= CACHE_SIZE_LIMIT) {
    // Remove oldest entries (FIFO)
    const firstKey = SANITIZATION_CACHE.keys().next().value;
    if (firstKey) {
      SANITIZATION_CACHE.delete(firstKey);
    }
  }
  SANITIZATION_CACHE.set(cacheKey, sanitized);
  
  // Update performance stats
  if (sanitizationStats) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    sanitizationStats.calls++;
    sanitizationStats.avgTime = (sanitizationStats.avgTime * (sanitizationStats.calls - 1) + duration) / sanitizationStats.calls;
  }
  
  return sanitized;
};

/**
 * Smart sanitization that auto-detects input type and applies appropriate level
 * @param input - The input string to sanitize
 * @param options - Optional configuration
 * @returns Sanitized string
 */
export const smartSanitize = (
  input: string,
  options: {
    maxLength?: number;
    preserveLineBreaks?: boolean;
    allowEmojis?: boolean;
  } = {}
): string => {
  if (!input || typeof input !== 'string') return '';
  
  const { maxLength = 1000, preserveLineBreaks = false, allowEmojis = true } = options;
  const inputType = detectInputType(input);
  
  let level: 'basic' | 'standard' | 'strict';
  
  // Choose sanitization level based on input type
  switch (inputType) {
    case 'email':
    case 'phone':
    case 'number':
      level = 'basic'; // These have known safe patterns
      break;
    case 'url':
      level = 'standard'; // URLs need protocol validation
      break;
    case 'html':
      level = 'strict'; // HTML needs comprehensive sanitization
      break;
    default:
      level = 'standard'; // Default for text and search
  }
  
  let sanitized = sanitizeInput(input, level);
  
  // Apply additional options
  if (maxLength !== 1000 && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  if (!preserveLineBreaks) {
    sanitized = sanitized.replace(/\n+/g, ' ');
  }
  
  if (!allowEmojis) {
    // Remove emoji characters (basic pattern)
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
  }
  
  return sanitized;
};

/**
 * Optimized search query sanitization with intelligent parsing
 * @param query - The search query to sanitize
 * @param options - Optional configuration
 * @returns Sanitized search query
 */
export const sanitizeSearchQuery = (
  query: string,
  options: {
    maxLength?: number;
    preserveOperators?: boolean;
    allowQuotes?: boolean;
  } = {}
): string => {
  if (!query || typeof query !== 'string') return '';
  
  const { maxLength = 200, preserveOperators = true, allowQuotes = true } = options;
  
  let sanitized = query.trim();
  
  // Remove control characters but preserve unicode for international searches
  sanitized = sanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
  
  // Remove dangerous patterns but preserve search functionality
  sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, '');
  sanitized = sanitized.replace(/javascript:|vbscript:/gi, '');
  
  // Preserve search operators if requested
  if (!preserveOperators) {
    sanitized = sanitized.replace(/[+\-"*()]/g, ' ');
  }
  
  if (!allowQuotes) {
    sanitized = sanitized.replace(/["']/g, '');
  }
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(SECURITY_PATTERNS.EXCESSIVE_WHITESPACE, ' ').trim();
  
  // Length limiting
  if (sanitized.length > maxLength) {
    // Try to break at word boundary
    const truncated = sanitized.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    sanitized = lastSpace > maxLength * 0.8 ? truncated.substring(0, lastSpace) : truncated;
  }
  
  return sanitized;
};

/**
 * Advanced HTML sanitization with lazy-loaded DOMPurify
 * @param input - The HTML string to sanitize
 * @param options - Sanitization options
 * @returns Promise that resolves to sanitized HTML string
 */
export const sanitizeHtml = async (
  input: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
    keepContent?: boolean;
  } = {}
): Promise<string> => {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p'],
    allowedAttributes = [],
    keepContent = true
  } = options;
  
  // Try to use DOMPurify in browser environment
  if (typeof window !== 'undefined') {
    const purify = await loadDOMPurify();
    if (purify) {
      return purify.sanitize(input, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: allowedAttributes,
        KEEP_CONTENT: keepContent
      });
    }
  }
  
  // Fallback: use strict sanitization
  return sanitizeInput(input, 'strict');
};

/**
 * Performance-optimized content sanitization with smart detection
 * Always returns a Promise for consistent usage
 * @param input - The input string to sanitize
 * @param options - Configuration options
 * @returns Promise<string> - Always returns a Promise for consistent usage
 */
export const sanitizeUserContent = async (
  input: string,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    level?: 'basic' | 'standard' | 'strict';
    preserveFormatting?: boolean;
  } = {}
): Promise<string> => {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowHtml = false,
    maxLength = 1000,
    level = 'standard',
    preserveFormatting = false
  } = options;
  
  let sanitized = input.trim();
  
  // Length limiting with smart truncation
  if (sanitized.length > maxLength) {
    // Try to break at sentence or word boundary
    const sentences = sanitized.substring(0, maxLength).split(/[.!?]+/);
    if (sentences.length > 1) {
      sanitized = sentences.slice(0, -1).join('.') + '.';
    } else {
      const words = sanitized.substring(0, maxLength).split(' ');
      sanitized = words.slice(0, -1).join(' ');
    }
  }
  
  if (allowHtml) {
    // Use HTML sanitization with DOMPurify
    return await sanitizeHtml(sanitized, {
      allowedTags: preserveFormatting 
        ? ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li'] 
        : ['b', 'i', 'strong', 'em']
    });
  } else {
    // Use fast text sanitization, but wrap in Promise for consistency
    return sanitizeInput(sanitized, level);
  }
};

/**
 * Specialized sanitization for car listing data
 * Optimized for automotive marketplace use cases
 * @param data - Partial listing data to sanitize
 * @returns Sanitized listing data
 */
export const sanitizeListingData = (data: Partial<ListingFormData>): Partial<ListingFormData> => {
  const sanitized: Partial<ListingFormData> = {};
  
  // Title: standard sanitization with length limit
  if (data.title) {
    sanitized.title = smartSanitize(data.title, { maxLength: 100, allowEmojis: false });
  }
  
  // Description: preserve line breaks but strict sanitization
  if (data.description) {
    sanitized.description = smartSanitize(data.description, { 
      maxLength: 2000, 
      preserveLineBreaks: true,
      allowEmojis: true 
    });
  }
  
  // Price: numeric validation with Arabic numeral conversion
  if (data.price) {
    const convertedPrice = convertArabicNumerals(data.price);
    sanitized.price = sanitizeInput(convertedPrice, 'basic');
  }
  
  // Contact fields: specific validation
  if (data.contactName) {
    sanitized.contactName = smartSanitize(data.contactName, { maxLength: 50, allowEmojis: false });
  }
  
  if (data.contactPhone) {
    sanitized.contactPhone = convertArabicNumerals(data.contactPhone).replace(/[^\d\+\-\(\)\s]/g, '');
  }
  
  if (data.contactEmail) {
    sanitized.contactEmail = sanitizeInput(data.contactEmail, 'basic').toLowerCase();
  }
  
  // Sanitize user-input fields (free text that users can type)
  const userInputFields = ['year', 'mileage'] as const;
  userInputFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      sanitized[field] = sanitizeInput(data[field], 'standard');
    }
  });
  
  // Copy truly safe fields (IDs and controlled values from dropdowns/database)
  // make and model are dropdown IDs from the car_brands/car_models tables, not user text
  // currency is from SUPPORTED_CURRENCIES dropdown, not user text
  const trueSafeFields = ['make', 'model', 'currency', 'governorateId'] as const;
  trueSafeFields.forEach(field => {
    if (data[field]) {
      sanitized[field] = data[field];
    }
  });
  
  return sanitized;
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
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Performance monitoring utilities (development only)
let sanitizationStats: { calls: number; cacheHits: number; avgTime: number } | null = null;

if (process.env.NODE_ENV === 'development') {
  sanitizationStats = { calls: 0, cacheHits: 0, avgTime: 0 };
  
  // Export performance stats for debugging
  (globalThis as Record<string, unknown>).__formUtilsStats = () => {
    if (!sanitizationStats) return null;
    
    const hitRate = sanitizationStats.calls > 0 
      ? (sanitizationStats.cacheHits / sanitizationStats.calls * 100).toFixed(1)
      : '0';
      
    return {
      totalCalls: sanitizationStats.calls,
      cacheHits: sanitizationStats.cacheHits,
      hitRate: `${hitRate}%`,
      avgTimeMs: sanitizationStats.avgTime.toFixed(2),
      cacheSize: SANITIZATION_CACHE.size
    };
  };
}

/**
 * Clears the sanitization cache - useful for testing or memory management
 */
export const clearSanitizationCache = (): void => {
  SANITIZATION_CACHE.clear();
  if (sanitizationStats) {
    sanitizationStats.calls = 0;
    sanitizationStats.cacheHits = 0;
    sanitizationStats.avgTime = 0;
  }
};

/**
 * Batch sanitization for multiple inputs - more efficient than individual calls
 * @param inputs - Array of strings to sanitize
 * @param level - Sanitization level for all inputs
 * @returns Array of sanitized strings
 */
export const batchSanitize = (
  inputs: string[], 
  level: 'basic' | 'standard' | 'strict' = 'standard'
): string[] => {
  if (!Array.isArray(inputs)) return [];
  
  return inputs.map(input => sanitizeInput(input, level));
};

/**
 * Validates if a string is already sanitized (safe to use without re-sanitization)
 * @param input - String to check
 * @param level - Required safety level
 * @returns True if string is already safe
 */
export const isSanitized = (
  input: string, 
  level: 'basic' | 'standard' | 'strict' = 'standard'
): boolean => {
  if (!input || typeof input !== 'string') return true;
  
  const dangerousPatterns = {
    basic: [/<|>|javascript:|on\w+=/i],
    standard: [SECURITY_PATTERNS.HTML_TAGS, SECURITY_PATTERNS.JS_PROTOCOLS, SECURITY_PATTERNS.EVENT_HANDLERS],
    strict: [SECURITY_PATTERNS.SCRIPT_TAGS, SECURITY_PATTERNS.CONTROL_CHARS]
  };
  
  const patterns = dangerousPatterns[level];
  return !patterns.some(pattern => pattern.test(input));
};

/**
 * Get performance statistics for debugging (development only)
 * @returns Performance stats object or null if not in development
 */
export const getSanitizationStats = (): {
  totalCalls: number;
  cacheHits: number;
  hitRate: string;
  avgTimeMs: string;
  cacheSize: number;
} | null => {
  if (!sanitizationStats) return null;
  
  const hitRate = sanitizationStats.calls > 0 
    ? (sanitizationStats.cacheHits / sanitizationStats.calls * 100).toFixed(1)
    : '0';
    
  return {
    totalCalls: sanitizationStats.calls,
    cacheHits: sanitizationStats.cacheHits,
    hitRate: `${hitRate}%`,
    avgTimeMs: sanitizationStats.avgTime.toFixed(2),
    cacheSize: SANITIZATION_CACHE.size
  };
};

/**
 * Reset performance statistics (development only)
 */
export const resetSanitizationStats = (): void => {
  if (sanitizationStats) {
    sanitizationStats.calls = 0;
    sanitizationStats.cacheHits = 0;
    sanitizationStats.avgTime = 0;
  }
};

/**
 * Optimizes search queries for better performance and results
 * @param query - The search query to optimize
 * @returns Optimized search query
 */
export const optimizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  // Convert Arabic numerals and normalize
  let optimized = convertArabicNumerals(query);
  
  // Remove excessive whitespace and normalize
  optimized = optimized.trim().toLowerCase();
  optimized = optimized.replace(/\s+/g, ' ');
  
  return optimized;
};
