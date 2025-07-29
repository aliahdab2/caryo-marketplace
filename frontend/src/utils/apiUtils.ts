/**
 * Shared API utilities for consistent API calls across the application
 */

// Use the same API base URL as other services
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Build query parameters from filter object
 * @param filters - The filter parameters to convert to query string
 * @returns URLSearchParams object
 */
export const buildQueryParams = (filters?: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (!filters) return params;
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item.toString()));
    } else {
      params.append(key, value.toString());
    }
  });
  
  return params;
};

/**
 * Make a simple API request with error handling
 * @param endpoint - The API endpoint (without base URL)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export const makeApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Standard error message for API failures
 * @param service - The service name for the error message
 * @returns Standardized error message
 */
export const getStandardErrorMessage = (service: string): string => {
  return `Failed to load ${service}`;
}; 