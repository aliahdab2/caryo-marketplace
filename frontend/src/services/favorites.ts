import { Listing } from '@/types/listings';
import { FavoriteServiceOptions, FavoriteStatusResponse, UserFavoritesResponse } from '@/types/favorites';
import { getAuthHeaders } from '@/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Add a listing to favorites
 * @param listingId The ID of the listing to add to favorites
 * @param options Optional configurations for the request
 */
export async function addToFavorites(
  listingId: string, 
  options?: FavoriteServiceOptions
): Promise<void> {
  if (options?.mockMode) {
    // In mock mode, just simulate success
    return Promise.resolve();
  }
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/favorites/${listingId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    } as HeadersInit,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to add to favorites');
  }
}

/**
 * Remove a listing from favorites
 * @param listingId The ID of the listing to remove from favorites
 * @param options Optional configurations for the request
 */
export async function removeFromFavorites(
  listingId: string,
  options?: FavoriteServiceOptions
): Promise<void> {
  if (options?.mockMode) {
    // In mock mode, just simulate success
    return Promise.resolve();
  }
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/favorites/${listingId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    } as HeadersInit,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to remove from favorites');
  }
}

/**
 * Get user's favorites
 * @param options Optional configurations for the request
 * @returns Promise<UserFavoritesResponse>
 */
export async function getFavorites(options?: FavoriteServiceOptions): Promise<UserFavoritesResponse> {
  if (options?.mockMode) {
    const mockData = getMockFavorites();
    return {
      favorites: mockData,
      total: mockData.length
    };
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/favorites`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    } as HeadersInit,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch favorites');
  }

  const data = await response.json();
  return {
    favorites: data,
    total: data.length
  };
}

/**
 * Check if a listing is favorited
 * @param listingId The ID of the listing to check
 * @param options Optional configurations for the request
 * @returns Promise<FavoriteStatusResponse>
 */
export async function checkIsFavorite(
  listingId: string,
  options?: FavoriteServiceOptions
): Promise<FavoriteStatusResponse> {
  if (options?.mockMode) {
    return {
      isFavorite: false,
      listingId
    };
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/favorites/${listingId}/check`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    } as HeadersInit,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to check favorite status');
  }

  const data = await response.json();
  return {
    isFavorite: data,
    listingId
  };
}

/**
 * Get mock favorites data for development and testing
 * @returns Array of mock Listing objects
 */
function getMockFavorites(): Listing[] {
  return [
    {
      id: 'mock-1',
      title: 'BMW 3 Series 2022',
      price: 45000,
      year: 2022,
      mileage: 1500,
      make: 'BMW',
      model: '3 Series',
      currency: 'USD',
      location: { city: 'New York', country: 'USA' },
      createdAt: new Date().toISOString(),
      category: { name: 'Sedan' },
      condition: 'new'
    },
    {
      id: 'mock-2',
      title: 'Toyota Camry 2021',
      price: 28000,
      year: 2021,
      mileage: 15000,
      make: 'Toyota',
      model: 'Camry',
      currency: 'USD',
      location: { city: 'Los Angeles', country: 'USA' },
      createdAt: new Date().toISOString(),
      category: { name: 'Sedan' },
      condition: 'used'
    },
    {
      id: 'mock-3',
      title: 'Tesla Model 3 2023',
      price: 52000,
      year: 2023,
      mileage: 500,
      make: 'Tesla',
      model: 'Model 3',
      currency: 'USD',
      location: { city: 'San Francisco', country: 'USA' },
      createdAt: new Date().toISOString(),
      category: { name: 'Electric' },
      condition: 'new'
    }
  ];
}