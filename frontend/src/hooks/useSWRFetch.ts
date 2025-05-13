// SWR hook for API data fetching and caching
import useSWR, { SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
};

export function useSWRFetch<Data = any, Error = any>(
  url: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Data, Error>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // dedupe requests with the same key in 10 seconds
      ...config,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  };
}

// Authenticated fetcher with Bearer token
export const authenticatedFetcher = async (url: string) => {
  // Get the token from localStorage or wherever you store it
  const token = localStorage.getItem('token'); // Adjust based on your auth implementation
  
  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    try {
      (error as any).info = await res.json();
    } catch (e) {
      (error as any).info = { message: 'Failed to parse error response' };
    }
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
};

export function useAuthenticatedSWR<Data = any, Error = any>(
  url: string | null,
  config?: SWRConfiguration
) {
  return useSWR<Data, Error>(url, authenticatedFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    ...config,
  });
}
