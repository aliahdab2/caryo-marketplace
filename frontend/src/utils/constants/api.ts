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
      SIGNIN: '/api/v1/auth/signin',
      SIGNUP: '/api/v1/auth/signup',
      VERIFY_EMAIL: '/api/v1/auth/verify-email',
      RESEND_VERIFICATION: '/api/v1/auth/verify-email/resend',
      GOOGLE_OAUTH: '/api/v1/auth/google',
    },
    USER: {
      PROFILE: '/api/v1/user/profile',
      PREFERENCES: '/api/v1/user/preferences',
    },
    LISTINGS: {
      BASE: '/api/v1/listings',
      SEARCH: '/api/v1/listings/search',
      FAVORITES: '/api/v1/listings/favorites',
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
