import { Listing } from '@/types/listing';
import { getAuthHeaders } from '@/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Add a listing to favorites
 * @param listingId The ID of the listing to add to favorites
 */
export async function addToFavorites(listingId: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites/${listingId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to add to favorites');
  }
}

/**
 * Remove a listing from favorites
 * @param listingId The ID of the listing to remove from favorites
 */
export async function removeFromFavorites(listingId: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites/${listingId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to remove from favorites');
  }
}

/**
 * Get all favorites for the current user
 * @returns A Promise that resolves to an array of Listing objects
 */
export async function getFavorites(): Promise<Listing[]> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch favorites');
  }

  return response.json();
}

/**
 * Check if a listing is in the user's favorites
 * @param listingId The ID of the listing to check
 * @returns A Promise that resolves to true if the listing is in favorites, false otherwise
 */
export async function checkIsFavorite(listingId: string): Promise<boolean> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites/${listingId}/check`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to check favorite status');
  }

  return response.json();
}