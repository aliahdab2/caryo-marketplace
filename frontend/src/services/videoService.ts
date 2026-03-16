import { getSession } from '@/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ExternalVideoRequest {
  url: string;
  title?: string;
  durationSeconds?: number;
}

export interface VideoResponse {
  id: number;
  url: string;
  videoSource: string;
  mediaType: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface VideoServiceError extends Error {
  status?: number;
  code?: string;
}

/**
 * Add external video URL to a listing
 */
export async function addExternalVideoToListing(
  listingId: string | number,
  videoRequest: ExternalVideoRequest
): Promise<VideoResponse> {
  if (!listingId) {
    const error = new Error('Listing ID is required') as VideoServiceError;
    error.code = 'MISSING_LISTING_ID';
    throw error;
  }

  if (!videoRequest.url?.trim()) {
    const error = new Error('Video URL is required') as VideoServiceError;
    error.code = 'MISSING_VIDEO_URL';
    throw error;
  }

  const session = await getSession();
  
  if (!session?.accessToken) {
    const error = new Error('Authentication required to add videos') as VideoServiceError;
    error.code = 'AUTHENTICATION_REQUIRED';
    error.status = 401;
    throw error;
  }

  const url = `${API_BASE_URL}/api/v1/listings/${listingId}/videos/external`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(videoRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Failed to add video: ${response.status} ${response.statusText}`) as VideoServiceError;
      error.status = response.status;
      error.code = errorData.code || 'API_ERROR';
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error; // Re-throw VideoServiceError
    }
    
    // Network or other errors
    const networkError = new Error('Network error occurred while adding video') as VideoServiceError;
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }
}


