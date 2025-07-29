import { testCacheFunctionality, clearCacheAndShowStats, monitorCachePerformance, getDetailedCacheInfo } from './cacheTestUtils';
import { getCacheStats } from './cachedFetch';
import apiCache from './apiCache';

// Make cache utilities available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).cacheUtils = {
    // Test functions
    test: testCacheFunctionality,
    clear: clearCacheAndShowStats,
    monitor: monitorCachePerformance,
    info: getDetailedCacheInfo,
    
    // Direct access
    stats: getCacheStats,
    clearCache: () => apiCache.clear(),
    
    // Helpers
    help: () => {
      console.log(`
🔧 Cache Testing Utilities Available:

📊 Info & Stats:
  cacheUtils.info()     - Get detailed cache information
  cacheUtils.stats()    - Get basic cache statistics

🧪 Testing:
  cacheUtils.test()     - Run comprehensive cache tests
  cacheUtils.clear()    - Clear cache and show before/after stats
  cacheUtils.monitor()  - Monitor cache performance for 30 seconds

🗑️ Management:
  cacheUtils.clearCache() - Clear all cache entries

💡 Usage Examples:
  cacheUtils.test()     // Test cache functionality
  cacheUtils.info()     // Check cache usage
  cacheUtils.monitor()  // Monitor for 30 seconds
      `);
    }
  };
  
  console.log('🔧 Cache utilities loaded! Type cacheUtils.help() for usage info.');
} 