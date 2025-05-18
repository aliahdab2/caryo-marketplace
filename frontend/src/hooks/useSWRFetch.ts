import useSWR, { SWRConfiguration } from 'swr';

// Define a custom error type for fetch errors with extra info and status
interface FetchError extends Error {
  info?: unknown;  // You can narrow this further if you want
  status?: number;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: FetchError = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export function useSWRFetch<Data = unknown, Err = FetchError>(
  url: string | null,
  config?: SWRConfiguration<Data, Err>
) {
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
  const token = localStorage.getItem('token');

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
