"use client";

import { useTranslation } from 'react-i18next';

/**
 * Custom error types for API requests, aligned with error messages in locales
 */
export type ApiErrorType = 
  | 'general'          // General errors
  | 'unauthorized'     // 401/403 errors
  | 'notFound'         // 404 errors
  | 'rate_limited'     // 429 errors
  | 'server_error'     // 500 errors
  | 'networkError'     // Network/connectivity issues
  | 'requestTimeout'   // Request timeout
  | 'validation';      // Validation issues

/**
 * Custom API Error class with improved error handling
 */
export class ApiError extends Error {
  public status?: number;
  public data?: unknown;
  public type: ApiErrorType;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    
    // Determine error type based on status code
    if (!status || status === 0) {
      this.type = message.includes('timeout') ? 'requestTimeout' : 'networkError';
    } else if (status === 401 || status === 403) {
      this.type = 'unauthorized';
    } else if (status === 404) {
      this.type = 'notFound';
    } else if (status === 429) {
      this.type = 'rate_limited';
    } else if (status >= 500) {
      this.type = 'server_error';
    } else if (status === 422 || status === 400) {
      this.type = 'validation';
    } else {
      this.type = 'general';
    }
  }
}

/**
 * Hook for getting user-friendly error messages based on API errors
 */
export function useApiErrorHandler() {
  const { t } = useTranslation('errors');
  
  /**
   * Get a user-friendly error message for an API error
   */
  const getErrorMessage = (error: unknown): string => {
    // Handle API errors
    if (error instanceof ApiError) {
      switch (error.type) {
        case 'networkError':
          return t('networkError', { ns: 'errors', defaultValue: 'Network error. Please check your connection and try again.' });
        
        case 'requestTimeout':
          return t('requestTimeout', { ns: 'errors', defaultValue: 'Request timed out. Please try again later.' });
        
        case 'unauthorized':
          return t('unauthorized', { ns: 'errors', defaultValue: 'You are not authorized to perform this action.' });
        
        case 'notFound':
          return t('notFound', { ns: 'errors', defaultValue: 'The requested resource was not found.' });
        
        case 'server_error':
          return t('general', { ns: 'errors', defaultValue: 'An error occurred. Please try again later.' });
        
        case 'validation':
          // Try to extract field-specific validation errors
          if (
            error.data &&
            typeof error.data === 'object' &&
            'errors' in error.data &&
            Array.isArray((error.data as { errors?: unknown[] }).errors)
          ) {
            return ((error.data as { errors: Array<{ message?: string } | string> }).errors)
              .map((e) => (typeof e === 'string' ? e : e.message) || e)
              .join(', ');
          }
          if (
            error.data &&
            typeof error.data === 'object' &&
            'message' in error.data &&
            typeof (error.data as { message?: string }).message === 'string'
          ) {
            return (error.data as { message: string }).message;
          }
          return t('validation', { ns: 'errors', defaultValue: 'Please check your input and try again.' });
          
        case 'rate_limited':
          return t('general', { ns: 'errors', defaultValue: 'Too many requests. Please try again later.' });
          
        default:
          // Use the server message if available
          if (error.message) {
            return error.message;
          }
          return t('errors.general', 'An error occurred. Please try again.');
      }
    }
    
    // Handle standard errors
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return t('networkError', { ns: 'errors', defaultValue: 'Network error. Please check your connection and try again.' });
      }
      // Check for authentication/credential errors
      if (error.message.toLowerCase().includes('invalid credential') || 
          error.message.toLowerCase().includes('incorrect password') ||
          error.message.toLowerCase().includes('user not found')) {
        return t('invalidCredentials', { ns: 'errors', defaultValue: 'Invalid username or password. Please try again.' });
      }
      return error.message;
    }
    
    // Unknown error type
    return t('general', { ns: 'errors', defaultValue: 'An error occurred. Please try again.' });
  };
  
  return {
    getErrorMessage
  };
}
