import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithCache } from '@/services/api';

/**
 * Custom hook for fetching API data with loading, error, and retry capability.
 * 
 * IMPORTANT: This hook uses refs to store fetchFunction and params to avoid
 * triggering re-fetches when these change identity (which happens on every render).
 * Only `endpoint` and explicit `dependencies` trigger re-fetches.
 * 
 * @param fetchFunction The function to call for fetching data
 * @param endpoint The API endpoint for caching (empty string to skip caching)
 * @param dependencies Additional dependencies for the useEffect (DO NOT include `t` or other unstable refs)
 * @param params Optional parameters for cache key
 * @param errorMessage Custom error message (for i18n support)
 * @returns Object containing data, loading state, error state, and retry function
 */
export function useApiData<T>(
  fetchFunction: () => Promise<T>,
  endpoint: string,
  dependencies: React.DependencyList = [],
  params?: Record<string, string | number>,
  errorMessage?: string
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to avoid re-fetches when function identity changes
  // This prevents duplicate API calls from React StrictMode or unstable deps
  const fetchFunctionRef = useRef(fetchFunction);
  const paramsRef = useRef(params);
  const errorMessageRef = useRef(errorMessage);
  
  // Update refs on each render (but don't trigger re-fetch)
  fetchFunctionRef.current = fetchFunction;
  paramsRef.current = params;
  errorMessageRef.current = errorMessage;
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Track current request to prevent race conditions
  const requestIdRef = useRef(0);
  
  // Track if a fetch is already in-flight to prevent duplicate calls (React StrictMode)
  const isFetchingRef = useRef(false);

  // Load data function - only depends on endpoint (stable string)
  const loadData = useCallback(async () => {
    // Skip API call if endpoint is empty (indicating no valid request)
    if (!endpoint) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Prevent duplicate fetches (React StrictMode calls effects twice)
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    
    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await fetchWithCache<T>(
        endpoint,
        fetchFunctionRef.current,
        paramsRef.current
      );
      
      // Only update state if this is still the latest request and component is mounted
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      // Only update state if this is still the latest request and component is mounted
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        console.error(`Failed to fetch data from ${endpoint}:`, err);
        setError(errorMessageRef.current || 'Error loading data. Please try again.');
        setData(null);
      }
    } finally {
      isFetchingRef.current = false;
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint]); // Only endpoint triggers new fetch

  // Load data on mount and when dependencies change
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...dependencies]);

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
