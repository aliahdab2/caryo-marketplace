
import { FavoriteServiceOptions, FavoriteStatusResponse, UserFavoritesResponse } from '@/types/favorites';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Validates if a token exists and is potentially valid
 */
function validateToken(token?: string | null): boolean {
  if (!token) {
    console.error('Token validation failed: No token provided');
    return false;
  }
  
  // Basic validation - token should be a non-empty string
  // This doesn't check if the token is actually valid with the server
  const isValid = typeof token === 'string' && token.length > 0;
  
  if (!isValid) {
    console.error('Token validation failed: Invalid token format', {
      isString: typeof token === 'string',
      length: token ? token.length : 0
    });
  }
  
  return isValid;
}

/**
 * Make authenticated API request with fallback to mock data if specified
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET', 
  currentSession?: Session | null, 
  options?: FavoriteServiceOptions
): Promise<T> {
  console.log(`Making API request to: ${endpoint}`, {
    method,
    mockMode: options?.mockMode
  });
  
  // If in mock mode, return empty data for demonstration
  if (options?.mockMode) {
    console.log('Using mock mode for request');
    
    // Generate appropriate mock responses based on the endpoint and method
    if (endpoint === '/api/favorites') {
      return { favorites: [], total: 0 } as unknown as T;
    } else if (endpoint.includes('/status')) {
      const listingId = endpoint.split('/')[2];
      return { isFavorite: false, listingId } as unknown as T;
    }
    
    // Default empty response
    return {} as T;
  }
  
  // Use provided session or get current session
  const session = currentSession || await getSession();
  
  // Debug session info
  console.log('Current session for API request:', {
    hasUser: !!session?.user,
    hasToken: !!session?.accessToken,
    tokenLength: session?.accessToken ? session.accessToken.length : 0,
    tokenPrefix: session?.accessToken ? `${session.accessToken.substring(0, 10)}...` : 'none',
    tokenType: session?.accessToken ? typeof session.accessToken : 'undefined',
    expires: session?.expires ? new Date(session.expires).toISOString() : 'no expiry'
  });

  // Enhanced token validation with detailed logging
  if (!validateToken(session?.accessToken)) {
    console.error('No valid access token available for API request', {
      sessionExists: !!session,
      tokenExists: !!session?.accessToken,
      tokenType: typeof session?.accessToken,
      tokenStart: session?.accessToken?.substring(0, 20)
    });
    
    // Instead of returning mock data, throw an error to trigger a re-auth
    throw new Error('UNAUTHORIZED');
  }

  const url = `${API_URL}${endpoint}`;
  console.log('Request URL:', url);
  
  // Create headers with the token and log them (excluding the full token)
  const authHeader = `Bearer ${session?.accessToken}`;
  // Only include headers that are explicitly allowed by the backend's CORS configuration
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authHeader
  } as const;

  // Debug the token format
  const tokenParts = session?.accessToken?.split('.') || [];
  console.log('Request configuration:', {
    contentType: headers['Content-Type'],
    authType: authHeader.split(' ')[0],
    tokenFormat: {
      parts: tokenParts.length,
      isJWT: tokenParts.length === 3,
      structure: tokenParts.map(part => `${part.substring(0, 3)}...${part.substring(part.length - 3)}`)
    }
  });

  try {
    console.log('Making request to:', url, {
      method,
      headersPresent: Object.keys(headers),
      mode: 'cors' // Explicitly set CORS mode for clearer error messages
    });

    const response = await fetch(url, {
      method,
      headers,
      mode: 'cors',
      cache: 'no-store'
    });

    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    if (!response.ok) {
      let errorData = null;
      const responseContentType = response.headers.get('content-type');
      
      try {
        if (responseContentType?.includes('application/json')) {
          errorData = await response.json();
          console.error('API Error Response:', {
            status: response.status,
            endpoint,
            error: errorData,
            timestamp: errorData?.timestamp,
            path: errorData?.path
          });
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }

      if (response.status === 401 || response.status === 403) {
        // Log detailed information about the failed request
        console.error('Authentication error:', {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          errorData,
          responseHeaders: Object.fromEntries(response.headers.entries())
        });
        
        // Extract the error message from the API response format
        const errorMessage = errorData?.message || 'Authentication required';
        throw new Error(`UNAUTHORIZED: ${errorMessage}`);
      }

      const contentType = response.headers.get('content-type');
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      console.error('Request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Parse the successful response
    try {
      const data = await response.json();
      
      // For GET /api/favorites endpoint, validate the response format
      if (endpoint === '/api/favorites') {
        if (!Array.isArray(data)) {
          console.error('Invalid response format for favorites:', data);
          throw new Error('Invalid response format: Expected an array of favorites');
        }
        
        // Log the successful response format
        console.log('Favorites response:', {
          count: data.length,
          sample: data.length > 0 ? {
            id: data[0].id,
            title: data[0].title,
            // Log other fields without sensitive data
          } : null
        });
      }
      
      return data;
    } catch (e) {
      console.error('Error parsing response JSON:', e);
      throw new Error('Invalid response format');
    }
  } catch (e) {
    // Log detailed error information
    console.error('API request error:', {
      error: e,
      type: e instanceof Error ? e.constructor.name : typeof e,
      message: e instanceof Error ? e.message : 'Unknown error',
      endpoint,
      url
    });

    // Handle specific error types
    if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
      console.error('Network error - possible CORS issue or server not responding');
      throw new Error('NETWORK_ERROR: Unable to connect to the server. Please check your connection and try again.');
    }

    if (e instanceof Error && e.message.includes('CORS')) {
      console.error('CORS error detected:', e.message);
      throw new Error('CORS_ERROR: Unable to access the server. This might be a temporary issue, please try again.');
    }

    // For other errors, maintain the previous behavior
    if (!(e instanceof Error && e.message === 'UNAUTHORIZED')) {
      if (endpoint === '/api/favorites') {
        console.warn('Returning empty favorites list due to error');
        return { favorites: [], total: 0 } as unknown as T;
      } else if (endpoint.includes('/status')) {
        const listingId = endpoint.split('/')[2];
        return { isFavorite: false, listingId } as unknown as T;
      }
    }
    
    if (e instanceof Error) {
      throw e;
    }
    throw new Error('UNKNOWN_ERROR: An unexpected error occurred');
  }
}

/**
 * Add a listing to favorites
 */
export async function addToFavorites(
  listingId: string, 
  options?: FavoriteServiceOptions,
  session?: Session | null
): Promise<void> {
  console.log('Adding to favorites:', listingId);
  if (options?.mockMode) {
    console.log('Mock mode: Simulating add to favorites');
    return Promise.resolve();
  }

  await apiRequest(`/api/favorites/${listingId}`, 'POST', session, options);
}

/**
 * Remove a listing from favorites
 */
export async function removeFromFavorites(
  listingId: string,
  options?: FavoriteServiceOptions,
  session?: Session | null
): Promise<void> {
  console.log('Removing from favorites:', listingId);
  if (options?.mockMode) {
    console.log('Mock mode: Simulating remove from favorites');
    return Promise.resolve();
  }

  await apiRequest(`/api/favorites/${listingId}`, 'DELETE', session, options);
}

/**
 * Get user's favorites
 */
export async function getFavorites(
  options?: FavoriteServiceOptions,
  session?: Session | null
): Promise<UserFavoritesResponse> {
  console.log('Getting favorites', { mockMode: options?.mockMode });
  
  return await apiRequest<UserFavoritesResponse>('/api/favorites', 'GET', session, options);
}

/**
 * Check if a listing is favorited
 */
export async function isFavorited(
  listingId: string,
  options?: FavoriteServiceOptions,
  session?: Session | null
): Promise<FavoriteStatusResponse> {
  console.log('Checking favorite status:', listingId, { mockMode: options?.mockMode });
  
  return await apiRequest<FavoriteStatusResponse>(
    `/api/favorites/${listingId}/status`, 
    'GET', 
    session,
    options
  );
}

/**
 * Alias for isFavorited to maintain backward compatibility
 */
export const checkIsFavorite = isFavorited;