import useSWR, { SWRConfiguration } from 'swr';
import type { FetchError, FetcherResponse } from '@/types/api';

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: FetchError = new Error('An error occurred while fetching the data.');
    try {
      error.info = await res.json();
    } catch {
      // If res.json() fails, set info to the response text
      error.info = { message: await res.text() || 'No additional error information available.' };
    }
    error.status = res.status;
    throw error;
  }

  // Check if response has content before parsing JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {} as T; // Return empty object for empty responses
    }
    throw new Error('Response is not JSON');
  }

  const text = await res.text();
  if (!text || text.trim() === '') {
    return {} as T; // Return empty object for empty JSON responses
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Response text:', text);
    throw new Error('Invalid JSON response');
  }
};

export function useSWRFetch<Data = unknown, Err = FetchError>(
  url: string | null,
  config?: SWRConfiguration<Data, Err>
): FetcherResponse<Data, Err> { // Add return type
  const { data, error, isLoading, isValidating, mutate } = useSWR<Data, Err>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      ...config,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

// Authenticated fetcher with Bearer token
export const authenticatedFetcher = async <T>(url: string): Promise<T> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) {
    const error: FetchError = new Error('An error occurred while fetching the data.');
    try {
      error.info = await res.json();
    } catch {
      error.info = { message: 'Failed to parse error response' };
    }
    error.status = res.status;
    throw error;
  }

  // Check if response has content before parsing JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {} as T; // Return empty object for empty responses
    }
    throw new Error('Response is not JSON');
  }

  const text = await res.text();
  if (!text || text.trim() === '') {
    return {} as T; // Return empty object for empty JSON responses
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Authenticated JSON parse error:', parseError, 'Response text:', text);
    throw new Error('Invalid JSON response');
  }
};

export function useAuthenticatedSWR<Data = unknown, Err = FetchError>(
  url: string | null,
  config?: SWRConfiguration<Data, Err>
) {
  return useSWR<Data, Err>(url, authenticatedFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    ...config,
  });
}
