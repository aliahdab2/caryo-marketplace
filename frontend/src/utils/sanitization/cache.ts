/**
 * LRU Cache implementation for sanitization results
 * 
 * Provides efficient caching with Least Recently Used eviction strategy
 */

const CACHE_SIZE_LIMIT = 100;

// LRU Cache using Map (maintains insertion order)
const SANITIZATION_CACHE = new Map<string, string>();

/**
 * Get cached sanitization result
 */
export function getCachedResult(key: string): string | undefined {
  if (!SANITIZATION_CACHE.has(key)) {
    return undefined;
  }
  
  // LRU: Move accessed item to end by deleting and re-setting
  const cachedValue = SANITIZATION_CACHE.get(key)!;
  SANITIZATION_CACHE.delete(key);
  SANITIZATION_CACHE.set(key, cachedValue);
  return cachedValue;
}

/**
 * Cache sanitization result with LRU eviction
 */
export function setCachedResult(key: string, value: string): void {
  // Remove LRU item if cache is full
  if (SANITIZATION_CACHE.size >= CACHE_SIZE_LIMIT) {
    // First key is least recently used in Map
    const lruKey = SANITIZATION_CACHE.keys().next().value;
    if (lruKey) {
      SANITIZATION_CACHE.delete(lruKey);
    }
  }
  
  // Set/update the cache entry (moves to end of iteration order)
  SANITIZATION_CACHE.set(key, value);
}

/**
 * Generate cache key for sanitization
 */
export function createCacheKey(input: string, level: string): string {
  return `${level}:${input}`;
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  SANITIZATION_CACHE.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: SANITIZATION_CACHE.size,
    maxSize: CACHE_SIZE_LIMIT,
    utilizationPercent: Math.round((SANITIZATION_CACHE.size / CACHE_SIZE_LIMIT) * 100)
  };
}
