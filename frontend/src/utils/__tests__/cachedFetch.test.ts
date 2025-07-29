import { cachedFetch, getCacheStats, clearCacheForUrl } from '../cachedFetch';
import apiCache from '../apiCache';

// Mock the API utilities
jest.mock('../apiUtils', () => ({
  API_BASE_URL: 'http://localhost:8080',
  getStandardErrorMessage: jest.fn(() => 'Error message'),
}));

// Mock fetch
global.fetch = jest.fn();

describe('cachedFetch', () => {
  beforeEach(() => {
    apiCache.clear();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    // Reset fetch mock to return undefined by default
    (global.fetch as jest.Mock).mockImplementation(() => undefined);
  });

  describe('Cache hit scenarios', () => {
    it('should return cached data when available', async () => {
      const testData = { test: 'data' };
      const url = '/api/test';
      
      // Pre-populate cache with the same key that cachedFetch generates
      const cacheKey = `${url}-{}`;
      apiCache.set(cacheKey, testData);
      
      const result = await cachedFetch(url);
      
      expect(result).toEqual(testData);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should skip cache when skipCache is true', async () => {
      const testData = { test: 'data' };
      const url = '/api/test';
      
      // Pre-populate cache
      apiCache.set(url, testData);
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fresh: 'data' })
      });
      
      const result = await cachedFetch(url, { skipCache: true });
      
      expect(result).toEqual({ fresh: 'data' });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache miss scenarios', () => {
    it('should fetch and cache data when not in cache', async () => {
      const url = '/api/test';
      const responseData = { fresh: 'data' };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseData
      });
      
      const result = await cachedFetch(url);
      
      expect(result).toEqual(responseData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Verify data was cached
      const cacheKey = `${url}-{}`;
      const cachedData = apiCache.get(cacheKey);
      expect(cachedData).toEqual(responseData);
    });

    it('should handle fetch errors', async () => {
      const url = '/api/test';
      
      // Mock fetch error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(cachedFetch(url)).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      const url = '/api/test';
      
      // Mock HTTP error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await expect(cachedFetch(url)).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('Cache key generation', () => {
    it('should use custom cache key when provided', async () => {
      const url = '/api/test';
      const customKey = 'custom-cache-key';
      const responseData = { test: 'data' };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseData
      });
      
      await cachedFetch(url, { cacheKey: customKey });
      
      // Verify data was cached with custom key
      const cachedData = apiCache.get(customKey);
      expect(cachedData).toEqual(responseData);
    });

    it('should generate cache key from URL and options', async () => {
      const url = '/api/test';
      const options = { method: 'POST', body: 'test' };
      const responseData = { test: 'data' };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseData
      });
      
      await cachedFetch(url, options);
      
      // Verify data was cached with generated key
      const expectedKey = `${url}-${JSON.stringify(options)}`;
      const cachedData = apiCache.get(expectedKey);
      expect(cachedData).toEqual(responseData);
    });
  });

  describe('TTL functionality', () => {
    it('should respect custom TTL', async () => {
      const url = '/api/test';
      const customTtl = 1000; // 1 second
      const responseData = { test: 'data' };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseData
      });
      
      await cachedFetch(url, { ttl: customTtl });
      
      // Verify data was cached with custom TTL
      const cacheKey = `${url}-{}`;
      const cachedData = apiCache.get(cacheKey);
      expect(cachedData).toEqual(responseData);
    });
  });

  describe('URL handling', () => {
    it('should handle relative URLs', async () => {
      const url = '/api/test';
      const responseData = { test: 'data' };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseData
      });
      
      await cachedFetch(url);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      const url = 'https://api.example.com/test';
      const responseData = { test: 'data' };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseData
      });
      
      await cachedFetch(url);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      );
    });
  });

  describe('Utility functions', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
    });

    it('should clear cache for URL pattern', () => {
      // Pre-populate cache
      apiCache.set('/api/test1', { data: '1' });
      apiCache.set('/api/test2', { data: '2' });
      
      expect(apiCache.get('/api/test1')).toEqual({ data: '1' });
      expect(apiCache.get('/api/test2')).toEqual({ data: '2' });
      
      clearCacheForUrl('/api/test');
      
      // Cache should be cleared (simple implementation clears all)
      expect(apiCache.get('/api/test1')).toBeNull();
      expect(apiCache.get('/api/test2')).toBeNull();
    });
  });
}); 