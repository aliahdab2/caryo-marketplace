import { Listing } from '@/types/listing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function addToFavorites(listingId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/favorites/${listingId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to add to favorites');
  }
}

export async function removeFromFavorites(listingId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/favorites/${listingId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove from favorites');
  }
}

export async function getFavorites(): Promise<Listing[]> {
  const response = await fetch(`${API_URL}/api/favorites`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch favorites');
  }

  return response.json();
}

export async function checkIsFavorite(listingId: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/favorites/${listingId}/check`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check favorite status');
  }

  return response.json();
} 