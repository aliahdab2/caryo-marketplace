import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOptimizedFilteringOptions {
  debounceMs?: number;
  minLoadingDelayMs?: number;
  immediate?: boolean;
}

/**
 * Custom hook to optimize filtering operations and reduce UI flickering
 * by debouncing filter changes and delaying loading states for fast responses
 */
export function useOptimizedFiltering<TFilters, TResult>(
  filters: TFilters,
  fetchFunction: (filters: TFilters) => Promise<TResult>,
  options: UseOptimizedFilteringOptions = {}
) {
  const {
    debounceMs = 300,
    minLoadingDelayMs = 150,
    immediate = false
  } = options;

  const [data, setData] = useState<TResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualSearch, setIsManualSearch] = useState(false); // Track if search is manual
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Use refs to track timers and previous filters to avoid stale closure issues
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const loadingTimerRef = useRef<NodeJS.Timeout>();
  const previousFiltersRef = useRef<TFilters | null>(null);

  // Helper function to compare filters deeply
  const filtersHaveChanged = useCallback((newFilters: TFilters, oldFilters: TFilters | null): boolean => {
    if (!oldFilters) return true; // First time, always changed
    
    // Deep comparison for objects
    try {
      return JSON.stringify(newFilters) !== JSON.stringify(oldFilters);
    } catch {
      // Fallback to reference comparison if JSON.stringify fails
      return newFilters !== oldFilters;
    }
  }, []);

  const executeSearch = useCallback(async (showLoadingImmediately = false, isManual = false) => {
    // Clear any existing timers
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    setError(null);
    setIsManualSearch(isManual);

    // Handle loading state based on whether it's manual or automatic
    if (showLoadingImmediately || isFirstLoad) {
      setIsLoading(true);
    } else if (isManual) {
      // For manual searches, show loading immediately but with a shorter minimum time
      setIsLoading(true);
    } else {
      // For automatic filter changes, delay showing loading state
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(true);
      }, minLoadingDelayMs);
    }

    try {
      const result = await fetchFunction(filters);
      
      // Clear loading timer if it's still pending
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      setData(result);
      setIsLoading(false);
      setIsManualSearch(false);
      
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    } catch (err) {
      // Clear loading timer if it's still pending
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsLoading(false);
      setIsManualSearch(false);
      
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [filters, fetchFunction, minLoadingDelayMs, isFirstLoad]);

  // Effect to handle debounced filtering
  useEffect(() => {
    // Check if filters have actually changed
    const hasChanged = filtersHaveChanged(filters, previousFiltersRef.current);
    
    if (!hasChanged && !isFirstLoad) {
      // Filters haven't changed, no need to search
      return;
    }

    // Update the previous filters reference
    previousFiltersRef.current = filters;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate || isFirstLoad) {
      // Execute immediately for first load or when immediate flag is set
      executeSearch(isFirstLoad, false);
    } else {
      // Debounce subsequent filter changes
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(false, false);
      }, debounceMs);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [executeSearch, debounceMs, immediate, isFirstLoad, filters, filtersHaveChanged]);

  // Manual search function for user-initiated actions
  const search = useCallback((immediate = false) => {
    // Check if filters have actually changed since last search
    const hasChanged = filtersHaveChanged(filters, previousFiltersRef.current);
    
    if (!hasChanged && !isFirstLoad) {
      // No changes detected, don't trigger search
      console.log('Manual search skipped - no filter changes detected');
      return;
    }

    // Update the previous filters reference
    previousFiltersRef.current = filters;

    // Clear any existing debounce timer to execute immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(immediate, true); // Mark as manual search
  }, [executeSearch, filters, filtersHaveChanged, isFirstLoad]);

  // Reset function to clear all state
  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setIsManualSearch(false);
    setError(null);
    setIsFirstLoad(true);
  }, []);

  return {
    data,
    isLoading,
    isManualSearch,
    error,
    search,
    reset,
    isFirstLoad
  };
}
