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

  return res.json();
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

  return res.json();
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
