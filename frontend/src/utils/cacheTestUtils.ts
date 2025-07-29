import apiCache from './apiCache';
import { getCacheStats } from './cachedFetch';

/**
 * Test cache functionality and provide detailed information
 */
export const testCacheFunctionality = () => {
  console.group('🔍 Cache Functionality Test');
  
  // Get current stats
  const stats = getCacheStats();
  console.log('📊 Current Cache Stats:', stats);
  
  // Test cache operations
  const testKey = 'test-cache-key';
  const testData = { test: 'data', timestamp: Date.now() };
  
  console.log('🧪 Testing cache operations...');
  
  // Test set
  apiCache.set(testKey, testData, undefined, 5000); // 5 second TTL
  console.log('✅ Set data in cache');
  
  // Test get
  const retrieved = apiCache.get(testKey);
  console.log('✅ Retrieved data:', retrieved);
  
  // Test cache hit
  const hit = apiCache.has(testKey);
  console.log('✅ Cache hit test:', hit);
  
  // Test with parameters
  const paramKey = 'test-with-params';
  const params = { brand: 'toyota', model: 'camry' };
  apiCache.set(paramKey, testData, params);
  const retrievedWithParams = apiCache.get(paramKey, params);
  console.log('✅ Test with parameters:', retrievedWithParams);
  
  console.groupEnd();
  
  return {
    stats,
    testData,
    retrieved,
    hit,
    retrievedWithParams
  };
};

/**
 * Clear cache and show before/after stats
 */
export const clearCacheAndShowStats = () => {
  console.group('🧹 Cache Clear Test');
  
  const beforeStats = getCacheStats();
  console.log('📊 Before clear:', beforeStats);
  
  apiCache.clear();
  
  const afterStats = getCacheStats();
  console.log('📊 After clear:', afterStats);
  
  console.groupEnd();
  
  return { beforeStats, afterStats };
};

/**
 * Monitor cache performance over time
 */
export const monitorCachePerformance = (duration = 30000) => {
  console.log(`🔍 Monitoring cache performance for ${duration/1000} seconds...`);
  
  const startTime = Date.now();
  const interval = setInterval(() => {
    const stats = getCacheStats();
    const elapsed = Date.now() - startTime;
    
    console.log(`⏱️  ${elapsed}ms - Cache: ${stats.size}/${stats.maxSize} entries`);
    
    if (elapsed >= duration) {
      clearInterval(interval);
      console.log('✅ Cache monitoring completed');
    }
  }, 5000); // Log every 5 seconds
  
  return () => clearInterval(interval);
};

/**
 * Get detailed cache information for debugging
 */
export const getDetailedCacheInfo = () => {
  const stats = getCacheStats();
  
  return {
    currentSize: stats.size,
    maxSize: stats.maxSize,
    usagePercentage: Math.round((stats.size / stats.maxSize) * 100),
    availableSlots: stats.maxSize - stats.size,
    isFull: stats.size >= stats.maxSize
  };
}; 