'use client';

/**
 * Utility to check if the backend server is available
 */

// Cache the result of server availability checks to reduce network requests
interface CacheEntry {
  result: boolean;
  timestamp: number;
}
let availabilityCache: CacheEntry | null = null;
const CACHE_TTL = 60000; // Cache results for 1 minute

/**
 * Check if the backend server is responding
 * @param forceCheck Force a fresh check ignoring the cache
 * @returns true if server is available, false otherwise
 */
export const isServerAvailable = async (forceCheck: boolean = false): Promise<boolean> => {
  const now = Date.now();
  
  // Return cached result if valid and not forcing a check
  if (!forceCheck && availabilityCache && (now - availabilityCache.timestamp) < CACHE_TTL) {
    // eslint-disable-next-line no-console
    console.log('Using cached server availability result:', availabilityCache.result);
    return availabilityCache.result;
  }
  
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // Try endpoints in order of reliability
    const endpoints = [
      '/actuator/health',
      '/actuator/info',
      '/'
    ];
    
    // Use Promise.any to return true if any endpoint responds
    const result = await Promise.any(
      endpoints.map(async (endpoint: string) => {
        const controller = new AbortController();
        // Set a short timeout for quick feedback
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            // Using cache: 'no-store' to avoid cached responses
            cache: 'no-store'
          });
          
          clearTimeout(timeoutId);
          
          // Consider the server available even if we get 401/403 responses
          // These indicate the server is running but requires authentication
          if (response.status === 200 || response.status === 401 || response.status === 403) {
            // eslint-disable-next-line no-console
            console.log(`Server check succeeded via ${endpoint} with status ${response.status}`);
            return true;
          }
          
          console.warn(`Server check via ${endpoint} failed with status ${response.status}`);
          throw new Error(`Endpoint ${endpoint} returned status ${response.status}`);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error; // Rethrow to let Promise.any continue trying
        }
      })
    ).then(() => true).catch(() => false);
    
    // Cache the result for future checks
    availabilityCache = {
      result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    console.warn('Backend server health check failed:', error);
    return false;
  }
};

/**
 * Wait for the server to become available with retries
 * @param maxRetries Maximum number of retry attempts
 * @param retryInterval Time between retries in milliseconds
 * @param forceCheck Whether to force check ignoring cache
 * @returns Promise that resolves when server is available or rejects after max retries
 */
export const waitForServer = async (
  maxRetries = 3, 
  retryInterval = 2000,
  forceCheck = true
): Promise<boolean> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    // Force fresh check on first try, then use cache if available for subsequent checks
    const useCache = !forceCheck || retries > 0;
    const available = await isServerAvailable(!useCache);
    if (available) return true;
    
    retries++;
    if (retries < maxRetries) {
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  
  return false; // Server not available after all retries
};

if (typeof window === 'undefined') {
  // This will only run on the server
  // eslint-disable-next-line no-console
  console.log('Running on the server');
} else {
  // This will only run on the client
  // eslint-disable-next-line no-console
  console.log('Running on the client');
}
