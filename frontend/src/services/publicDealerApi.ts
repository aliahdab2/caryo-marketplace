import type { PublicDealerProfile, DealerListingsResponse } from '@/types/dealer';
import type { Listing } from '@/types/listings';
import { createApiErrorFromResponse } from '@/lib/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Fetch public dealer profile by ID
 * 
 * @throws {ApiError} With status 404 if dealer not found
 * @throws {ApiError} With appropriate status for other errors
 */
export async function getPublicDealerProfile(dealerId: number): Promise<PublicDealerProfile> {
  const response = await fetch(`${API_BASE_URL}/api/dealers/${dealerId}/public`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Enable caching for public dealer profiles (revalidate every 5 minutes)
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw await createApiErrorFromResponse(response);
  }

  return response.json();
}

/**
 * Fetch paginated listings for a dealer
 * 
 * @throws {ApiError} With status 404 if dealer not found
 * @throws {ApiError} With appropriate status for other errors
 */
export async function getPublicDealerListings(
  dealerId: number,
  page = 0,
  size = 12
): Promise<DealerListingsResponse<Listing>> {
  const response = await fetch(
    `${API_BASE_URL}/api/dealers/${dealerId}/listings?page=${page}&size=${size}&sort=createdAt&direction=desc`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Enable caching for dealer listings (revalidate every 2 minutes)
      next: { revalidate: 120 },
    }
  );

  if (!response.ok) {
    throw await createApiErrorFromResponse(response);
  }

  return response.json();
}

// Re-export ApiError for convenience
export { ApiError } from '@/lib/errors';
