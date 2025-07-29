import apiCache from '../apiCache';

// Mock fetch for testing
global.fetch = jest.fn();

describe('ApiCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    apiCache.clear();
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should store and retrieve data', () => {
      const testData = { test: 'data' };
      const url = '/api/test';
      
      apiCache.set(url, testData);
      const retrieved = apiCache.get(url);
      
      expect(retrieved).toEqual(testData);
    });

    it('should generate cache keys correctly', () => {
      const url = '/api/test';
      const params = { brand: 'toyota', model: 'camry' };
      
      apiCache.set(url, { data: 'test' }, params);
      const retrieved = apiCache.get(url, params);
      
      expect(retrieved).toEqual({ data: 'test' });
    });

    it('should return null for non-existent entries', () => {
      const retrieved = apiCache.get('/api/nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('TTL functionality', () => {
    it('should expire entries after TTL', () => {
      const testData = { test: 'data' };
      const url = '/api/test';
      
      // Set with short TTL
      apiCache.set(url, testData, undefined, 100); // 100ms TTL
      
      // Should be available immediately
      expect(apiCache.get(url)).toEqual(testData);
      
      // Wait for expiration
      setTimeout(() => {
        expect(apiCache.get(url)).toBeNull();
      }, 150);
    });

    it('should use default TTL when not specified', () => {
      const testData = { test: 'data' };
      const url = '/api/test';
      
      apiCache.set(url, testData);
      
      // Should be available immediately
      expect(apiCache.get(url)).toEqual(testData);
    });
  });

  describe('Cache size management', () => {
    it('should respect max size limit', () => {
      // Create a cache with small max size
      const smallCache = new (apiCache.constructor as any)({ maxSize: 2 });
      
      smallCache.set('/api/1', { data: '1' });
      smallCache.set('/api/2', { data: '2' });
      smallCache.set('/api/3', { data: '3' }); // This should evict the first entry
      
      expect(smallCache.get('/api/1')).toBeNull();
      expect(smallCache.get('/api/2')).toEqual({ data: '2' });
      expect(smallCache.get('/api/3')).toEqual({ data: '3' });
    });
  });

  describe('Cache statistics', () => {
    it('should return correct statistics', () => {
      apiCache.set('/api/1', { data: '1' });
      apiCache.set('/api/2', { data: '2' });
      
      const stats = apiCache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100); // Default max size
    });
  });

  describe('Cache cleanup', () => {
    it('should remove expired entries during cleanup', () => {
      const testData = { test: 'data' };
      const url = '/api/test';
      
      // Set with short TTL
      apiCache.set(url, testData, undefined, 100); // 100ms TTL
      
      // Wait for expiration
      setTimeout(() => {
        apiCache.cleanup();
        expect(apiCache.get(url)).toBeNull();
      }, 150);
    });
  });

  describe('Cache clearing', () => {
    it('should clear all entries', () => {
      apiCache.set('/api/1', { data: '1' });
      apiCache.set('/api/2', { data: '2' });
      
      expect(apiCache.get('/api/1')).toEqual({ data: '1' });
      expect(apiCache.get('/api/2')).toEqual({ data: '2' });
      
      apiCache.clear();
      
      expect(apiCache.get('/api/1')).toBeNull();
      expect(apiCache.get('/api/2')).toBeNull();
    });
  });

  describe('Cache key generation', () => {
    it('should handle different parameter orders', () => {
      const url = '/api/test';
      const params1 = { brand: 'toyota', model: 'camry' };
      const params2 = { model: 'camry', brand: 'toyota' };
      
      apiCache.set(url, { data: 'test' }, params1);
      
      // Should retrieve with different parameter order
      const retrieved = apiCache.get(url, params2);
      expect(retrieved).toEqual({ data: 'test' });
    });

    it('should handle undefined parameters', () => {
      const url = '/api/test';
      
      apiCache.set(url, { data: 'test' });
      const retrieved = apiCache.get(url);
      
      expect(retrieved).toEqual({ data: 'test' });
    });
  });
}); 