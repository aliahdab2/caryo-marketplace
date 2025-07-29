import { API_BASE_URL, getStandardErrorMessage } from './apiUtils';
import apiCache from './apiCache';

interface CachedFetchOptions extends RequestInit {
  cacheKey?: string;
  ttl?: number; // Time to live in milliseconds
  skipCache?: boolean; // Force skip cache
}

/**
 * Cached fetch utility that checks cache before making network requests
 */
export async function cachedFetch<T>(
  url: string,
  options: CachedFetchOptions = {}
): Promise<T> {
  const {
    cacheKey,
    ttl,
    skipCache = false,
    ...fetchOptions
  } = options;

  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided to cachedFetch');
  }

  // Generate cache key from URL and options
  const key = cacheKey || `${url}-${JSON.stringify(fetchOptions)}`;

  // Check cache first (unless skipCache is true)
  if (!skipCache) {
    const cachedData = apiCache.get<T>(key);
    if (cachedData) {
      console.log(`[CACHE HIT] ${url}`);
      return cachedData;
    }
  }

  try {
    console.log(`[CACHE MISS] ${url}`);
    
    // Make the actual fetch request
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, fetchOptions);

    // Add null check for response
    if (!response) {
      throw new Error('Network error: No response received');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the successful response (unless skipCache is true)
    if (!skipCache) {
      apiCache.set(key, data, undefined, ttl);
    }

    return data;
  } catch (error) {
    console.error(`[CACHED FETCH ERROR] ${url}:`, error);
    throw error;
  }
}

/**
 * Clear cache for specific URL pattern
 */
export function clearCacheForUrl(urlPattern: string): void {
  // This is a simple implementation - in a real app you might want more sophisticated pattern matching
  console.log(`[CACHE CLEAR] Pattern: ${urlPattern}`);
  // For now, we'll clear all cache - you can implement pattern-based clearing if needed
  apiCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return apiCache.getStats();
}

/**
 * Prefetch data and cache it
 */
export async function prefetchData<T>(
  url: string,
  options: CachedFetchOptions = {}
): Promise<void> {
  try {
    await cachedFetch<T>(url, { ...options, skipCache: false });
  } catch (error) {
    console.warn(`[PREFETCH FAILED] ${url}:`, error);
  }
} 