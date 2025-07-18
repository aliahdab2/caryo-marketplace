import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOptimizedFilteringOptions {
  debounceMs?: number;
  minLoadingDelayMs?: number;
  immediate?: boolean;
}

// Type for filter comparison function
type FilterComparator<T> = (newFilters: T, oldFilters: T | null) => boolean;

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
    debounceMs = 500, // Increased from 300ms to 500ms for better debouncing
    minLoadingDelayMs = 150,
    immediate = false
  } = options;

  const [data, setData] = useState<TResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Use refs to track timers and previous filters
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const loadingTimerRef = useRef<NodeJS.Timeout>();
  const previousFiltersRef = useRef<TFilters | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Optimized filter comparison with memoization
  const filtersHaveChanged: FilterComparator<TFilters> = useCallback((newFilters, oldFilters) => {
    if (!oldFilters) return true;
    
    try {
      // Use a more efficient comparison for simple objects
      if (typeof newFilters === 'object' && newFilters !== null) {
        const newObj = newFilters as Record<string, unknown>;
        const oldObj = oldFilters as Record<string, unknown>;
        const newKeys = Object.keys(newObj);
        const oldKeys = Object.keys(oldObj);
        
        if (newKeys.length !== oldKeys.length) return true;
        
        return newKeys.some(key => newObj[key] !== oldObj[key]);
      }
      
      // Fallback to JSON comparison for complex objects
      return JSON.stringify(newFilters) !== JSON.stringify(oldFilters);
    } catch {
      return newFilters !== oldFilters;
    }
  }, []);

  // Cleanup function for timers and abort controller
  const _cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = undefined;
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = undefined;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const executeSearch = useCallback(async (showLoadingImmediately = false, isManual = false) => {
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
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
      // For manual searches, show loading immediately
      setIsLoading(true);
    } else {
      // For automatic filter changes, delay showing loading state
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(true);
      }, minLoadingDelayMs);
    }

    try {
      const result = await fetchFunction(filters);
      
      // Check if this request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Clear loading timer if it's still pending
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = undefined;
      }

      setData(result);
      setIsLoading(false);
      setIsManualSearch(false);
      
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    } catch (err) {
      // Check if this request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Clear loading timer if it's still pending
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = undefined;
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
      return;
    }

    // Update the previous filters reference
    previousFiltersRef.current = filters;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate || isFirstLoad) {
      executeSearch(isFirstLoad, false);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(false, false);
      }, debounceMs);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = undefined;
      }
    };
  }, [executeSearch, debounceMs, immediate, isFirstLoad, filters, filtersHaveChanged]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      _cleanup();
    };
  }, [_cleanup]);

  // Manual search function for user-initiated actions
  const search = useCallback((immediate = false) => {
    const hasChanged = filtersHaveChanged(filters, previousFiltersRef.current);
    
    if (!hasChanged && !isFirstLoad) {
      return false; // Return false to indicate no search was performed
    }

    previousFiltersRef.current = filters;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(immediate, true);
    return true; // Return true to indicate search was performed
  }, [executeSearch, filters, filtersHaveChanged, isFirstLoad]);

  // Reset function with proper cleanup
  const reset = useCallback(() => {
    _cleanup();
    setData(null);
    setIsLoading(false);
    setIsManualSearch(false);
    setError(null);
    setIsFirstLoad(true);
    previousFiltersRef.current = null;
  }, [_cleanup]);

  return {
    data,
    isLoading,
    isManualSearch,
    error,
    search,
    reset,
    isFirstLoad,
    // Expose filter change detection for external use
    hasFiltersChanged: useCallback((newFilters: TFilters) => 
      filtersHaveChanged(newFilters, previousFiltersRef.current), [filtersHaveChanged])
  };
}
