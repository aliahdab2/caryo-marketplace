# Frontend Caching System

This document describes the comprehensive caching system implemented to improve performance and reduce network requests.

## Overview

The caching system provides intelligent caching for API responses, reducing server load and improving user experience through faster data retrieval.

## Architecture

### Core Components

1. **`cachedFetch`** - Main caching utility
2. **`apiCache`** - In-memory cache implementation
3. **`useAllCounts`** - Consolidated counts hook
4. **Cache Debugger** - Development tool for monitoring cache performance

## Caching Implementation

### 1. Cached Fetch Utility

Located in `src/utils/cachedFetch.ts`, this utility provides:

- **Automatic cache checking** before making network requests
- **Configurable TTL** (Time To Live) for cache entries
- **Cache key generation** from URL and options
- **Error handling** with proper fallbacks
- **Cache bypass** option for fresh data requests

```typescript
// Example usage
const data = await cachedFetch<FuelTypeCounts>(
  '/api/listings/counts/fuel-types',
  {
    ttl: 2 * 60 * 1000, // 2 minutes
    cacheKey: 'fuel-types-counts'
  }
);
```

### 2. API Cache Implementation

Located in `src/utils/apiCache.ts`, provides:

- **In-memory storage** with configurable size limits
- **Automatic cleanup** of expired entries
- **Statistics tracking** for cache performance
- **Pattern-based cache clearing**

```typescript
// Cache statistics
const stats = apiCache.getStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
```

### 3. Consolidated Counts Hook

The `useAllCounts` hook (`src/hooks/useAllCounts.ts`) provides:

- **Single API call** for all count types (fuel types, transmissions, body styles, brands, models)
- **Automatic caching** with 2-minute TTL
- **Debounced requests** to prevent excessive API calls
- **Error handling** with fallback to empty counts

```typescript
const { counts, isLoading, error } = useAllCounts(filters);
// Returns: fuelTypeCounts, transmissionCounts, bodyStyleCounts, brandCounts, modelCounts
```

## Performance Benefits

### 1. Reduced Network Requests

- **Before**: 5 separate API calls for different count types
- **After**: 1 consolidated API call for all counts

### 2. Improved Response Times

- **Cache hits**: Instant response from memory
- **Cache misses**: Single network request instead of multiple
- **Debouncing**: Prevents rapid successive requests

### 3. Better User Experience

- **Faster loading**: Cached data loads immediately
- **Reduced loading states**: Less time spent waiting for data
- **Consistent data**: All counts calculated with same filters

## Cache Configuration

### Default Settings

- **TTL**: 5 minutes for general cache, 2 minutes for counts
- **Max Size**: 100 entries for in-memory cache
- **Cleanup Interval**: Every 60 seconds

### Customization

```typescript
// Custom TTL for specific requests
const data = await cachedFetch('/api/special-endpoint', {
  ttl: 10 * 60 * 1000 // 10 minutes
});

// Skip cache for fresh data
const freshData = await cachedFetch('/api/latest-data', {
  skipCache: true
});
```

## Cache Management

### 1. Cache Clearing

```typescript
// Clear entire cache
clearApiCache();

// Clear specific endpoint patterns
clearCacheForUrl('/api/listings/counts');
```

### 2. Cache Statistics

```typescript
// Get cache performance metrics
const stats = getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

### 3. Development Tools

The `CacheDebugger` component provides:

- **Real-time cache statistics**
- **Cache hit/miss monitoring**
- **Manual cache clearing**
- **Performance metrics**

## API Integration

### Backend Endpoints

The caching system works with these new consolidated endpoints:

1. **`GET /api/listings/counts/all`** - All counts in single request
2. **`GET /api/listings/counts/fuel-types`** - Fuel type counts
3. **`GET /api/listings/counts/transmissions`** - Transmission counts

### Frontend Hooks

Updated hooks that utilize caching:

1. **`useAllCounts`** - Consolidated counts with caching
2. **`useFuelTypeCounts`** - Fuel type counts with caching
3. **`useTransmissionCounts`** - Transmission counts with caching

## Error Handling

### Cache Error Recovery

- **Cache failures**: Fallback to direct API calls
- **Network errors**: Return cached data if available
- **Invalid responses**: Clear cache and retry

### Graceful Degradation

```typescript
try {
  const data = await cachedFetch('/api/endpoint');
  return data;
} catch (error) {
  // Fallback to direct fetch
  const fallbackData = await fetch('/api/endpoint');
  return fallbackData.json();
}
```

## Testing

### Cache Testing Utilities

Located in `src/utils/cacheTestUtils.ts`:

- **Mock cache implementations**
- **Cache performance testing**
- **Cache invalidation testing**

### Test Coverage

- **Cache hit/miss scenarios**
- **TTL expiration testing**
- **Error handling with cache**
- **Cache clearing functionality**

## Monitoring and Debugging

### 1. Console Logging

Cache operations are logged for debugging:

```
[CACHE HIT] /api/listings/counts/all
[CACHE MISS] /api/listings/counts/fuel-types
[CACHE CLEAR] Pattern: /api/listings/counts
```

### 2. Performance Metrics

- **Cache hit rate**
- **Average response time**
- **Memory usage**
- **Network request reduction**

### 3. Development Tools

- **CacheDebugger component** for real-time monitoring
- **Cache statistics** in browser console
- **Manual cache management** tools

## Best Practices

### 1. Cache Key Strategy

- **Use descriptive keys** for easy debugging
- **Include filter parameters** in cache keys
- **Avoid sensitive data** in cache keys

### 2. TTL Configuration

- **Short TTL** for frequently changing data
- **Longer TTL** for reference data
- **No TTL** for static data

### 3. Cache Invalidation

- **Clear cache** when user actions affect data
- **Use pattern-based clearing** for related endpoints
- **Implement cache warming** for critical data

## Future Enhancements

### 1. Persistent Cache

- **LocalStorage integration** for persistent cache
- **IndexedDB** for larger cache storage
- **Service Worker** for offline caching

### 2. Advanced Features

- **Cache warming** for critical data
- **Predictive caching** based on user behavior
- **Cache compression** for memory optimization
- **Distributed cache** for multi-tab support

### 3. Performance Optimizations

- **Background cache updates**
- **Incremental cache updates**
- **Cache preloading** strategies

## Migration Guide

### From Individual Hooks to Consolidated

**Before:**
```typescript
const { fuelTypeCounts } = useFuelTypeCounts(filters);
const { transmissionCounts } = useTransmissionCounts(filters);
const { bodyStyleCounts } = useBodyStyleCounts(filters);
```

**After:**
```typescript
const { counts } = useAllCounts(filters);
const { fuelTypeCounts, transmissionCounts, bodyStyleCounts } = counts;
```

### Cache Integration

1. **Replace direct fetch calls** with `cachedFetch`
2. **Update hook implementations** to use caching
3. **Add cache clearing** for data updates
4. **Monitor cache performance** in development

## Troubleshooting

### Common Issues

1. **Stale data**: Clear cache or reduce TTL
2. **Memory leaks**: Monitor cache size and implement cleanup
3. **Cache misses**: Check cache key generation
4. **Performance issues**: Review TTL and cache size settings

### Debug Steps

1. **Enable cache logging** in development
2. **Monitor cache statistics** using CacheDebugger
3. **Check network tab** for actual API calls
4. **Verify cache keys** are unique and descriptive

This caching system significantly improves application performance while maintaining data consistency and providing a smooth user experience. 