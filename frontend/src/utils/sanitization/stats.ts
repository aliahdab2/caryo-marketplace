/**
 * Performance tracking and statistics for sanitization operations
 * 
 * Uses sampling to minimize overhead while providing useful metrics
 */

// Sample 1 in 100 calls for performance measurement to reduce overhead
const SAMPLING_RATE = 0.01;

interface SanitizationStats {
  calls: number;
  cacheHits: number;
  avgTime: number;
  sampledMeasurements: number;
}

// Global stats tracking (development only)
let sanitizationStats: SanitizationStats | null = null;

/**
 * Initialize performance tracking (development mode only)
 */
export function initializeStats(): void {
  if (process.env.NODE_ENV === 'development') {
    sanitizationStats = {
      calls: 0,
      cacheHits: 0,
      avgTime: 0,
      sampledMeasurements: 0
    };
  }
}

/**
 * Check if performance should be measured for this call (sampling)
 */
export function shouldMeasurePerformance(): boolean {
  return sanitizationStats !== null && Math.random() < SAMPLING_RATE;
}

/**
 * Start performance measurement
 */
export function startPerformanceMeasurement(): number {
  return performance.now();
}

/**
 * Record performance measurement
 */
export function recordPerformance(startTime: number): void {
  if (!sanitizationStats) return;
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  sanitizationStats.sampledMeasurements++;
  sanitizationStats.avgTime = (
    sanitizationStats.avgTime * (sanitizationStats.sampledMeasurements - 1) + duration
  ) / sanitizationStats.sampledMeasurements;
}

/**
 * Increment call counter
 */
export function incrementCalls(): void {
  if (sanitizationStats) {
    sanitizationStats.calls++;
  }
}

/**
 * Increment cache hit counter
 */
export function incrementCacheHits(): void {
  if (sanitizationStats) {
    sanitizationStats.cacheHits++;
  }
}

/**
 * Get current performance statistics
 */
export function getStats(): SanitizationStats | null {
  if (!sanitizationStats) return null;
  
  return {
    calls: sanitizationStats.calls,
    cacheHits: sanitizationStats.cacheHits,
    avgTime: sanitizationStats.avgTime,
    sampledMeasurements: sanitizationStats.sampledMeasurements
  };
}

/**
 * Reset all statistics
 */
export function resetStats(): void {
  if (sanitizationStats) {
    sanitizationStats.calls = 0;
    sanitizationStats.cacheHits = 0;
    sanitizationStats.avgTime = 0;
    sanitizationStats.sampledMeasurements = 0;
  }
}

/**
 * Calculate cache hit rate
 */
export function getCacheHitRate(): number {
  if (!sanitizationStats || sanitizationStats.calls === 0) return 0;
  return (sanitizationStats.cacheHits / sanitizationStats.calls) * 100;
}
