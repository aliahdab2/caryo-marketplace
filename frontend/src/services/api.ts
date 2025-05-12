// Service for handling API requests
// This file serves as a central place to manage API requests
// and handle common functionality like error handling

// Base URL for the API - will be set from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type RequestOptions = {
  method: string;
  headers: Record<string, string>;
  body?: string;
};

/**
 * Generic function to make API requests
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string, 
  data?: any, 
  customHeaders?: Record<string, string>
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    // Parse response
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Check for errors
    if (!response.ok) {
      // Format error with additional context
      const error = new Error(
        typeof responseData === 'string' 
          ? responseData 
          : responseData.message || 'An error occurred'
      );
      // Add the status and data to the error for more context
      throw Object.assign(error, {
        status: response.status,
        data: responseData
      });
    }

    return responseData as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Export common request methods
export const api = {
  get: <T>(endpoint: string, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'GET', undefined, customHeaders),
  
  post: <T>(endpoint: string, data: any, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'POST', data, customHeaders),
  
  put: <T>(endpoint: string, data: any, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'PUT', data, customHeaders),
  
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'DELETE', undefined, customHeaders),
};
