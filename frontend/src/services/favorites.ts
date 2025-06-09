import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { 
  FavoriteServiceOptions, 
  FavoriteStatusResponse, 
  UserFavoritesResponse
} from '@/types/favorites';

/**
 * Configuration constants for the favorites service
 * @constant {string} API_URL - Base URL for API endpoints
 * @constant {number} MAX_RETRIES - Maximum number of retry attempts for failed operations
 * @constant {number} RETRY_DELAY_BASE - Base delay in milliseconds between retries
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 500; // ms

/**
 * Generic retry function for API operations with exponential backoff
 * @template T - The type of the operation result
 * @param {() => Promise<T>} operation - The async operation to retry
 * @param {(error: unknown) => boolean} errorCheck - Function to determine if an error should trigger a retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay between retries in milliseconds
 * @returns {Promise<T>} - The operation result
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  errorCheck: (error: unknown) => boolean = () => true,
  maxRetries: number = MAX_RETRIES, 
  baseDelay: number = RETRY_DELAY_BASE
): Promise<T> {
  let lastError: unknown = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!errorCheck(error)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Custom error class for favorite-related operations
 * @extends Error
 */
class FavoriteServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'FavoriteServiceError';
  }
}

/**
 * Type guard to check if an error is an authentication error
 * @param {unknown} error - The error to check
 * @returns {boolean} - True if the error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  return (
    error instanceof FavoriteServiceError &&
    (error.code === 'UNAUTHORIZED' || error.status === 401)
  );
}

/**
 * Validates and converts a listing ID string to a number
 * @param {string} listingId - The listing ID to validate
 * @returns {number} - The validated numeric listing ID
 * @throws {FavoriteServiceError} - If the ID is invalid
 */
const validateListingId = (listingId: string): number => {
  const numericId = parseInt(listingId, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new FavoriteServiceError(
      'Invalid listing ID provided',
      'INVALID_LISTING_ID'
    );
  }
  return numericId;
};

/**
 * Creates a delay using Promise
 * @param {number} ms - The delay duration in milliseconds
 * @returns {Promise<void>}
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Add a listing to the user's favorites
 * @param {string} listingId - The ID of the listing to favorite
 * @param {FavoriteServiceOptions} [options] - Optional configuration for the operation
 * @param {Session | null} [session] - Optional session object for authentication
 * @returns {Promise<void>}
 * @throws {FavoriteServiceError} If the operation fails
 */
export async function addToFavorites(
  listingId: string, 
  _options?: FavoriteServiceOptions,
  _session?: Session | null
): Promise<void> {
  const numericId = validateListingId(listingId);
  
  const { apiRequest, validateSession } = await import('./auth/session-manager');
  
  const sessionCheck = await validateSession();
  if (!sessionCheck.isValid) {
    throw new FavoriteServiceError(
      'User is not authenticated',
      'UNAUTHORIZED',
      401
    );
  }

  const url = `${API_URL}/api/favorites/${numericId}`;
  
  await retryOperation(
    async () => {
      const response = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FavoriteServiceError(
          errorData.message || 'Failed to add to favorites',
          errorData.code || 'ADD_FAVORITE_ERROR',
          response.status
        );
      }
    },
    error => error instanceof FavoriteServiceError && error.status !== 401
  );
}

/**
 * Remove a listing from the user's favorites
 * @param {string} listingId - The ID of the listing to unfavorite
 * @param {FavoriteServiceOptions} [options] - Optional configuration for the operation
 * @param {Session | null} [session] - Optional session object for authentication
 * @returns {Promise<void>}
 * @throws {FavoriteServiceError} If the operation fails
 */
export async function removeFromFavorites(
  listingId: string,
  _options?: FavoriteServiceOptions,
  _session?: Session | null
): Promise<void> {
  const numericId = validateListingId(listingId);
  
  const { apiRequest, validateSession } = await import('./auth/session-manager');
  
  const sessionCheck = await validateSession();
  if (!sessionCheck.isValid) {
    throw new FavoriteServiceError(
      'User is not authenticated',
      'UNAUTHORIZED',
      401
    );
  }

  const url = `${API_URL}/api/favorites/${numericId}`;
  
  await retryOperation(
    async () => {
      const response = await apiRequest(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FavoriteServiceError(
          errorData.message || 'Failed to remove from favorites',
          errorData.code || 'REMOVE_FAVORITE_ERROR',
          response.status
        );
      }
    },
    error => error instanceof FavoriteServiceError && error.status !== 401
  );
}

/**
 * Check if a listing is in the user's favorites
 * @param {string} listingId - The ID of the listing to check
 * @param {FavoriteServiceOptions} [options] - Optional configuration for the operation
 * @param {Session | null} [session] - Optional session object for authentication
 * @returns {Promise<FavoriteStatusResponse>}
 * @throws {FavoriteServiceError} If the operation fails
 */
export async function checkFavoriteStatus(
  listingId: string,
  _options?: FavoriteServiceOptions,
  _session?: Session | null
): Promise<FavoriteStatusResponse> {
  const numericId = validateListingId(listingId);
  
  const { apiRequest, validateSession } = await import('./auth/session-manager');
  
  const sessionCheck = await validateSession();
  if (!sessionCheck.isValid) {
    return { isFavorite: false, listingId: numericId.toString() };
  }

  const url = `${API_URL}/api/favorites/${numericId}/status`;
  
  return await retryOperation(
    async () => {
      const response = await apiRequest(url, {
        method: 'GET'
      });

      if (!response.ok) {      if (response.status === 404) {
        return { isFavorite: false, listingId: numericId.toString() };
      }
        
        const errorData = await response.json().catch(() => ({}));
        throw new FavoriteServiceError(
          errorData.message || 'Failed to check favorite status',
          errorData.code || 'CHECK_FAVORITE_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data as FavoriteStatusResponse;
    },
    error => error instanceof FavoriteServiceError && error.status !== 401
  );
}

/**
 * Check if a listing is favorited by the user
 * @param {string} listingId - The ID of the listing to check
 * @param {FavoriteServiceOptions} [options] - Optional configuration
 * @param {Session | null} [session] - Optional session object
 * @returns {Promise<FavoriteStatusResponse>} - The favorite status response
 */
export async function isFavorited(
  listingId: string,
  _options?: FavoriteServiceOptions,
  _session?: Session | null
): Promise<FavoriteStatusResponse> {
  // This is an alias for checkFavoriteStatus for backward compatibility
  return checkFavoriteStatus(listingId, _options, _session);
}

/**
 * Get all favorites for the current user
 * @param {FavoriteServiceOptions} [options] - Optional configuration for the operation
 * @param {Session | null} [session] - Optional session object for authentication
 * @returns {Promise<UserFavoritesResponse>}
 * @throws {FavoriteServiceError} If the operation fails
 */
export async function getUserFavorites(
  _options?: FavoriteServiceOptions,
  _session?: Session | null
): Promise<UserFavoritesResponse> {
  const { apiRequest, validateSession } = await import('./auth/session-manager');
  
  const sessionCheck = await validateSession();
  if (!sessionCheck.isValid) {
    throw new FavoriteServiceError(
      'User is not authenticated',
      'UNAUTHORIZED',
      401
    );
  }

  const url = `${API_URL}/api/favorites`;
  
  return await retryOperation(
    async () => {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new FavoriteServiceError('No access token available', 'UNAUTHORIZED', 401);
      }

      const response = await apiRequest(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { favorites: [] };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new FavoriteServiceError(
          errorData.message || 'Failed to fetch favorites',
          errorData.code || 'GET_FAVORITES_ERROR',
          response.status
        );
      }

      const data = await response.json();
      
      // The API returns an array directly
      const favorites = Array.isArray(data) ? data : [];
      const result = {
        favorites,
        total: favorites.length
      };
      return result;
    },
    error => error instanceof FavoriteServiceError && error.status !== 401
  );
}