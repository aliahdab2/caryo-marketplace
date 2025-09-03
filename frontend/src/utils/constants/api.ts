/**
 * API configuration constants
 * Centralized configuration for API URLs and endpoints
 */

// API URL configuration with fallback for development
export const API_CONFIG = {
  // Base API URL - uses environment variable with fallback for development
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      SIGNIN: '/api/auth/signin',
      SIGNUP: '/api/auth/signup',
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESEND_VERIFICATION: '/api/auth/verify-email/resend',
      GOOGLE_OAUTH: '/api/auth/google',
    },
    USER: {
      PROFILE: '/api/user/profile',
      PREFERENCES: '/api/user/preferences',
    },
    LISTINGS: {
      BASE: '/api/listings',
      SEARCH: '/api/listings/search',
      FAVORITES: '/api/listings/favorites',
    },
  },
} as const;

/**
 * Helper function to build full API URLs
 * @param endpoint - The API endpoint path
 * @returns Full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Helper function to get auth endpoint URLs
 * @param endpoint - The auth endpoint name
 * @returns Full auth API URL
 */
export const getAuthUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.AUTH): string => {
  return buildApiUrl(API_CONFIG.ENDPOINTS.AUTH[endpoint]);
};
