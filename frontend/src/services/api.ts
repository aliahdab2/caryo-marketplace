'use client';

// Service for handling API requests
// This file serves as a central place to manage API requests
// and handle common functionality like error handling

import { ApiError } from '@/utils/apiErrorHandler';

// Base URL for the API - will be set from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type RequestOptions = {
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number; // Request timeout in ms
};

// Define a type for request data
type RequestData = Record<string, unknown> | unknown[] | null | undefined;

/**
 * Generic function to make API requests
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string, 
  data?: RequestData, 
  customHeaders?: Record<string, string>,
  timeout: number = 15000 // Default timeout: 15 seconds
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    timeout
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    // Create a controller to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    // Parse the response
    let responseData: unknown;
    
    // Try to parse as JSON first
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Check for errors
    if (!response.ok) {
      // Create an ApiError with status code and response data
      const errorMessage = typeof responseData === 'string' 
        ? responseData 
        : (responseData as { message?: string })?.message || `Error ${response.status}: Request failed`;
        
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Handle timeout/abort errors explicitly
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 0);
    }
    
    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Convert other errors to ApiError
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    );
  }
}

// Export common request methods
export const api = {
  get: <T>(endpoint: string, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'GET', undefined, customHeaders, timeout),
  
  post: <T>(endpoint: string, data: RequestData, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'POST', data, customHeaders, timeout),
  
  put: <T>(endpoint: string, data: RequestData, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'PUT', data, customHeaders, timeout),
  
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'DELETE', undefined, customHeaders),
};
