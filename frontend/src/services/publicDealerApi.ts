import type { PublicDealerProfile, DealerListingsResponse } from '@/types/dealer';
import type { Listing } from '@/types/listings';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function getPublicDealerProfile(dealerId: number): Promise<PublicDealerProfile> {
  const response = await fetch(`${API_BASE_URL}/api/dealers/${dealerId}/public`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dealer profile: ${response.status}`);
  }

  return response.json();
}

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
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch dealer listings: ${response.status}`);
  }

  return response.json();
}
