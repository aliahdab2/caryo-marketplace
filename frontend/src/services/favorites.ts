import { Listing } from '@/types/listing';
import { getAuthHeaders } from '@/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Add a listing to favorites
 * @param listingId The ID of the listing to add to favorites
 * @param options Optional configurations for the request
 */
export async function addToFavorites(
  listingId: string, 
  options?: { mockMode?: boolean }
): Promise<void> {
  if (options?.mockMode) {
    // In mock mode, just simulate success
    return Promise.resolve();
  }
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites/${listingId}`, {
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
  options?: { mockMode?: boolean }
): Promise<void> {
  if (options?.mockMode) {
    // In mock mode, just simulate success
    return Promise.resolve();
  }
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites/${listingId}`, {
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
 * Get all favorites for the current user
 * @param options Optional configurations for the request
 * @returns A Promise that resolves to an array of Listing objects
 */
export async function getFavorites(options?: { mockMode?: boolean }): Promise<Listing[]> {
  // If mockMode is enabled, return mock favorites data
  if (options?.mockMode) {
    return getMockFavorites();
  }
  
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites`, {
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

  return response.json();
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
      currency: 'USD',
      image: '/images/vehicles/car-1.jpg',
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
      currency: 'USD',
      image: '/images/vehicles/car-2.jpg',
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
      currency: 'USD',
      image: '/images/vehicles/car-3.jpg',
      location: { city: 'San Francisco', country: 'USA' },
      createdAt: new Date().toISOString(),
      category: { name: 'Electric' },
      condition: 'new'
    }
  ];
}

/**
 * Check if a listing is in the user's favorites
 * @param listingId The ID of the listing to check
 * @param options Optional configurations for the request
 * @returns A Promise that resolves to true if the listing is in favorites, false otherwise
 */
export async function checkIsFavorite(
  listingId: string, 
  options?: { mockMode?: boolean }
): Promise<boolean> {
  if (options?.mockMode) {
    // In mock mode, simulate a random favorite status or use fixed value
    return Promise.resolve(Math.random() > 0.5);
  }
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/favorites/${listingId}/check`, {
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

  return response.json();
}