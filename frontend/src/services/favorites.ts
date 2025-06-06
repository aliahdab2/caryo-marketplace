import { FavoriteServiceOptions, FavoriteStatusResponse, UserFavoritesResponse } from '@/types/favorites';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';

// Log the API URL to make sure it's correct
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
console.log('[FAVORITES] Using API URL:', API_URL);

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
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET', 
  currentSession?: Session | null
): Promise<T> {
  console.log(`[FAVORITES] Making API request to: ${endpoint}`, {
    method
  });
  
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
    // Special handling for /check endpoint to prevent parse errors
    const isCheckEndpoint = endpoint.includes('/check');
    const requestOptions = {
      method,
      headers,
      mode: 'cors' as RequestMode,
      cache: 'no-store' as RequestCache,
      credentials: 'include' as RequestCredentials // Include credentials for cross-origin requests
    };

    console.log('Making request to:', url, {
      method,
      headersPresent: Object.keys(headers),
      isCheckEndpoint
    });

    const response = await fetch(url, requestOptions);

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
      // Handle boolean responses
      const contentType = response.headers.get('content-type');
      
      // Special handling for the check endpoint which returns a raw boolean
      if (endpoint.includes('/check') && contentType) {
        // Read the response as text first to examine it
        const rawText = await response.text();
        console.log('[FAVORITES] Raw response from check endpoint:', rawText, 'content-type:', contentType);
        
        // For json response, try to parse it
        if (contentType.includes('application/json')) {
          try {
            // The API is expected to return a raw boolean
            if (rawText === 'true') return true as unknown as T;
            if (rawText === 'false') return false as unknown as T;
            
            // If it's not a raw boolean, try to parse it as JSON
            return JSON.parse(rawText) as T;
          } catch (e) {
            console.error('[FAVORITES] Error parsing JSON response:', e);
            // Default to false for failed parsing
            return false as unknown as T;
          }
        } else {
          // For non-JSON response, interpret the content directly
          if (rawText === 'true') return true as unknown as T;
          if (rawText === 'false') return false as unknown as T;
          return false as unknown as T;
        }
      }
      
      // For other endpoints, parse as JSON normally
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
      } else if (endpoint.includes('/check')) {
        // For check endpoint, return false as the backend would in case of error
        return false as unknown as T;
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
  options?: FavoriteServiceOptions | undefined,
  session?: Session | null
): Promise<void> {
  console.log('[FAVORITES] Adding to favorites:', listingId);

  try {
    // Ensure listingId is a valid number
    const numericId = parseInt(listingId, 10);
    if (isNaN(numericId)) {
      console.error('[FAVORITES] Invalid listing ID (not a number):', listingId);
      throw new Error('Invalid listing ID');
    }
    
    // Direct debugging - log the exact URL and auth token being used
    const api_url = API_URL;
    const endpoint = `/api/favorites/${numericId}`;
    const url = `${api_url}${endpoint}`;
    
    console.log('[FAVORITES] Direct API call to:', url);
    
    // Use provided session or get current session
    const currentSession = session || await getSession();
    
    if (!currentSession?.accessToken) {
      console.error('[FAVORITES] No valid token for API request');
      throw new Error('UNAUTHORIZED: No valid token');
    }
    
    // Log token information (safe format)
    const token = currentSession.accessToken;
    console.log('[FAVORITES] Using token:', token.substring(0, 10) + '...' + token.substring(token.length - 10));
    
    // Make direct fetch call with retry mechanism
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError: unknown;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        // Log detailed response
        console.log('[FAVORITES] Add response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
        
        // Check if the request was successful
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[FAVORITES] Error adding favorite (attempt ${retryCount + 1}):`, errorText);
          
          // If this is a server error that might be related to Hibernate, check if operation succeeded
          if (response.status === 500) {
            const { isHibernateSerializationError } = await import('./error-handlers');
            if (isHibernateSerializationError(errorText)) {
              // Verify actual state before throwing
              const actualState = await isFavorited(listingId, options, currentSession);
              if (actualState.isFavorite === true) {
                console.log('[FAVORITES] Despite 500 error, favorite was actually added successfully');
                return; // Exit successfully
              }
            }
          }
          
          throw new Error(`Error adding favorite: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
        console.log('[FAVORITES] Successfully added to favorites');
        return; // Success - exit function
        
      } catch (apiError) {
        lastError = apiError;
        retryCount++;
        
        if (retryCount <= MAX_RETRIES) {
          // Exponential backoff: 500ms, 1000ms, etc.
          const backoffMs = 500 * retryCount;
          console.log(`[FAVORITES] Retrying in ${backoffMs}ms (attempt ${retryCount} of ${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
    
    // If we got here, we've exhausted our retries. Try to handle the error.
    const { handleFavoriteApiError } = await import('./error-handlers');
    
    // Try to handle the error with our utility function
    const errorHandled = await handleFavoriteApiError(
      lastError, 
      listingId, 
      true, // We expect the item to be favorited after adding
      options,
      currentSession
    );
    
    // If the error was handled and the operation actually succeeded, we can continue
    if (errorHandled) {
      console.log('[FAVORITES] Error was handled, operation succeeded despite error');
      return;
    }
    
    // Otherwise, rethrow the error
    throw lastError;
    
  } catch (error) {
    console.error('[FAVORITES] Error adding to favorites:', error);
    
    // One final check to verify actual state
    try {
      const currentSession = session || await getSession();
      const actualState = await isFavorited(listingId, options, currentSession);
      
      // If the state is already what we wanted, suppress the error
      if (actualState.isFavorite === true) {
        console.log('[FAVORITES] Despite error, favorite status is correct. Suppressing error.');
        return;
      }
    } catch (verifyError) {
      console.error('[FAVORITES] Failed to verify final state:', verifyError);
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Remove a listing from favorites
 */
export async function removeFromFavorites(
  listingId: string,
  options?: FavoriteServiceOptions | undefined,
  session?: Session | null
): Promise<void> {
  console.log('[FAVORITES] Removing from favorites:', listingId);

  try {
    // Ensure listingId is a valid number
    const numericId = parseInt(listingId, 10);
    if (isNaN(numericId)) {
      console.error('[FAVORITES] Invalid listing ID (not a number):', listingId);
      throw new Error('Invalid listing ID');
    }
    
    // Direct debugging - log the exact URL and auth token being used
    const api_url = API_URL;
    const endpoint = `/api/favorites/${numericId}`;
    const url = `${api_url}${endpoint}`;
    
    console.log('[FAVORITES] Direct API call to:', url);
    
    // Use provided session or get current session
    const currentSession = session || await getSession();
    
    if (!currentSession?.accessToken) {
      console.error('[FAVORITES] No valid token for API request');
      throw new Error('UNAUTHORIZED: No valid token');
    }
    
    // Log token information (safe format)
    const token = currentSession.accessToken;
    console.log('[FAVORITES] Using token:', token.substring(0, 10) + '...' + token.substring(token.length - 10));
    
    // Make direct fetch call with retry mechanism
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError: unknown;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        // Log detailed response
        console.log('[FAVORITES] Remove response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
        
        // Check if the request was successful
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[FAVORITES] Error removing favorite (attempt ${retryCount + 1}):`, errorText);
          
          // If this is a server error that might be related to Hibernate, check if operation succeeded
          if (response.status === 500) {
            const { isHibernateSerializationError } = await import('./error-handlers');
            if (isHibernateSerializationError(errorText)) {
              // Verify actual state before throwing
              const actualState = await isFavorited(listingId, options, currentSession);
              if (actualState.isFavorite === false) {
                console.log('[FAVORITES] Despite 500 error, favorite was actually removed successfully');
                return; // Exit successfully
              }
            }
          }
          
          throw new Error(`Error removing favorite: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
        console.log('[FAVORITES] Successfully removed from favorites');
        return; // Success - exit function
        
      } catch (apiError) {
        lastError = apiError;
        retryCount++;
        
        if (retryCount <= MAX_RETRIES) {
          // Exponential backoff: 500ms, 1000ms, etc.
          const backoffMs = 500 * retryCount;
          console.log(`[FAVORITES] Retrying in ${backoffMs}ms (attempt ${retryCount} of ${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
    
    // If we got here, we've exhausted our retries. Try to handle the error.
    const { handleFavoriteApiError } = await import('./error-handlers');
    
    // Try to handle the error with our utility function
    const errorHandled = await handleFavoriteApiError(
      lastError, 
      listingId, 
      false, // We expect the item to NOT be favorited after removing
      options,
      currentSession
    );
    
    // If the error was handled and the operation actually succeeded, we can continue
    if (errorHandled) {
      console.log('[FAVORITES] Error was handled, operation succeeded despite error');
      return;
    }
    
    // Otherwise, rethrow the error
    throw lastError;
    
  } catch (error) {
    console.error('[FAVORITES] Error removing from favorites:', error);
    
    // One final check to verify actual state
    try {
      const currentSession = session || await getSession();
      const actualState = await isFavorited(listingId, options, currentSession);
      
      // If the state is already what we wanted, suppress the error
      if (actualState.isFavorite === false) {
        console.log('[FAVORITES] Despite error, favorite status is correct. Suppressing error.');
        return;
      }
    } catch (verifyError) {
      console.error('[FAVORITES] Failed to verify final state:', verifyError);
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Get user's favorites
 */
export async function getFavorites(
  options?: FavoriteServiceOptions | undefined,
  session?: Session | null
): Promise<UserFavoritesResponse> {
  console.log('Getting favorites');
  
  return await apiRequest<UserFavoritesResponse>('/api/favorites', 'GET', session);
}

/**
 * Check if a listing is favorited
 */
export async function isFavorited(
  listingId: string,
  options?: FavoriteServiceOptions | undefined,
  session?: Session | null
): Promise<FavoriteStatusResponse> {
  console.log('[FAVORITES] Checking favorite status:', listingId);
  
  try {
    // Ensure listingId is a valid number
    const numericId = parseInt(listingId, 10);
    if (isNaN(numericId)) {
      console.error('[FAVORITES] Invalid listing ID (not a number):', listingId);
      return { isFavorite: false, listingId };
    }
    
    // Direct debugging - log the exact URL and auth token being used
    const api_url = API_URL;
    const endpoint = `/api/favorites/${numericId}/check`;
    const url = `${api_url}${endpoint}`;
    
    console.log('[FAVORITES] Direct API call to:', url);
    
    // Use provided session or get current session
    const currentSession = session || await getSession();
    
    if (!currentSession?.accessToken) {
      console.error('[FAVORITES] No valid token for API request');
      return { isFavorite: false, listingId };
    }
    
    // Log token information (safe format)
    const token = currentSession.accessToken;
    console.log('[FAVORITES] Using token:', token.substring(0, 10) + '...' + token.substring(token.length - 10));
    
    // Make direct fetch call for debugging
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    // Log detailed response
    console.log('[FAVORITES] Check response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FAVORITES] Error checking favorite status:', errorText);
      return { isFavorite: false, listingId };
    }
    
    // Read response text
    const rawText = await response.text();
    console.log('[FAVORITES] Raw response text:', rawText);
    
    // Parse response
    let isFavorite = false;
    
    if (rawText === 'true') {
      isFavorite = true;
    } else if (rawText === 'false') {
      isFavorite = false;
    } else {
      try {
        // Try to parse as JSON if it's not a plain "true" or "false"
        const parsedResponse = JSON.parse(rawText);
        isFavorite = Boolean(parsedResponse);
      } catch (e) {
        console.error('[FAVORITES] Error parsing response:', e);
        isFavorite = false;
      }
    }
    
    console.log('[FAVORITES] Parsed favorite status:', isFavorite);
    
    return {
      isFavorite,
      listingId
    };
  } catch (error) {
    console.error('[FAVORITES] Error checking favorite status:', error);
    return { isFavorite: false, listingId };
  }
}

/**
 * Alias for isFavorited to maintain backward compatibility
 */
export const checkIsFavorite = isFavorited;