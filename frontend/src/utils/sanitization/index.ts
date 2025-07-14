/**
 * Main sanitization module
 * 
 * Provides the primary sanitizeInput function with caching and performance tracking
 */

import { sanitizeCore, smartSanitize, sanitizeHtml, type SanitizationLevel } from './core';
import { getCachedResult, setCachedResult, createCacheKey, clearCache as clearSanitizationCache } from './cache';
import { 
  initializeStats, 
  shouldMeasurePerformance, 
  startPerformanceMeasurement, 
  recordPerformance,
  incrementCalls,
  incrementCacheHits,
  getStats,
  resetStats,
  getCacheHitRate
} from './stats';

// Initialize performance tracking
initializeStats();

/**
 * Main sanitization function with caching and performance tracking
 */
export function sanitizeInput(input: string, level: SanitizationLevel = 'standard'): string {
  if (!input || typeof input !== 'string') return '';

  // Performance tracking with sampling
  const shouldMeasure = shouldMeasurePerformance();
  const startTime = shouldMeasure ? startPerformanceMeasurement() : 0;

  incrementCalls();

  // Check cache first
  const cacheKey = createCacheKey(input, level);
  const cachedResult = getCachedResult(cacheKey);
  
  if (cachedResult !== undefined) {
    incrementCacheHits();
    return cachedResult;
  }

  // Process the input
  const result = sanitizeCore(input, level);

  // Cache the result
  setCachedResult(cacheKey, result);

  // Record performance if measuring
  if (shouldMeasure) {
    recordPerformance(startTime);
  }

  return result;
}

// Re-export other functions
export { smartSanitize, sanitizeHtml };
export { clearSanitizationCache };
export { getStats as getSanitizationStats, resetStats as resetSanitizationStats, getCacheHitRate };

// Re-export types
export type { SanitizationLevel };
