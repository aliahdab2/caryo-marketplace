import { useState, useEffect, useCallback } from 'react';
import { fetchWithCache } from '@/services/api';

/**
 * Custom hook for fetching API data with loading, error, and retry capability
 * @param fetchFunction The function to call for fetching data
 * @param endpoint The API endpoint for caching (empty string to skip caching)
 * @param dependencies Additional dependencies for the useEffect
 * @param params Optional parameters for cache key
 * @returns Object containing data, loading state, error state, and retry function
 */
export function useApiData<T>(
  fetchFunction: () => Promise<T>,
  endpoint: string,
  dependencies: React.DependencyList = [],
  params?: Record<string, string | number>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data function
  const loadData = useCallback(async () => {
    // Skip API call if endpoint is empty (indicating no valid request)
    if (!endpoint) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await fetchWithCache<T>(
        endpoint,
        fetchFunction,
        params
      );
      
      setData(result);
    } catch (err) {
      console.error(`Failed to fetch data from ${endpoint}:`, err);
      setError('Error loading data. Please try again.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, fetchFunction, params]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, loadData]);

  return {
    data,
    isLoading,
    error,
    retry: loadData,
  };
}

/**
 * Custom hook for managing form selections with reset capabilities
 * @param initialValue Initial value
 * @param resetDependencies Dependencies that will trigger reset when changed
 * @returns [value, setter]
 */
export function useFormSelection<T>(initialValue: T, resetDependencies: React.DependencyList = []) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    setValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDependencies);

  return [value, setValue] as const;
}
