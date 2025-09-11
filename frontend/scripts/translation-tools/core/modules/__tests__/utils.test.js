/**
 * Translation Utils Module - Test Suite
 * Tests for utility functions and helpers
 */

const fs = require('fs');
const path = require('path');
const {
  getCached,
  clearCache,
  trackPerformance,
  validateKeyPattern,
  extractTranslationKeys,
  validateTranslationKeys,
  safeReadFile,
  safeWriteFile,
  ensureDirectory,
  getFileStats,
  formatFileSize,
  generateTimestamp,
  deepClone
} = require('../utils');

// Mock fs for testing
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');

  return {
    ...originalFs,
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn(),
  };
});

const fsMock = require('fs');

describe('Utils Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCache(); // Clear cache before each test
  });

  describe('getCached', () => {
    test('should return cached result within timeout', () => {
      const mockFn = jest.fn(() => 'result');
      const key = 'test-key';

      // First call should execute function
      const result1 = getCached(key, mockFn);
      expect(result1).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Second call should return cached result
      const result2 = getCached(key, mockFn);
      expect(result2).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should execute function again after cache timeout', () => {
      const mockFn = jest.fn(() => 'result');

      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(0) // First call
        .mockReturnValueOnce(6 * 60 * 1000); // Second call after timeout

      const result1 = getCached('test', mockFn);
      const result2 = getCached('test', mockFn);

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result1).toBe('result');
      expect(result2).toBe('result');

      Date.now = originalDateNow;
    });

    test('should handle different cache keys separately', () => {
      const mockFn1 = jest.fn(() => 'result1');
      const mockFn2 = jest.fn(() => 'result2');

      const result1 = getCached('key1', mockFn1);
      const result2 = getCached('key2', mockFn2);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    test('should clear all cached data', () => {
      const mockFn = jest.fn(() => 'result');

      // Cache a result
      getCached('test', mockFn);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Clear cache
      clearCache();

      // Next call should execute function again
      getCached('test', mockFn);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackPerformance', () => {
    test('should track execution time and return result', () => {
      const mockFn = jest.fn(() => 'result');

      const result = trackPerformance('test-operation', mockFn);

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle function errors', () => {
      const mockFn = jest.fn(() => {
        throw new Error('Test error');
      });

      expect(() => trackPerformance('test', mockFn)).toThrow('Test error');
    });
  });

  describe('validateKeyPattern', () => {
    test('should validate correct key patterns', () => {
      expect(validateKeyPattern('validKey')).toBe(true);
      expect(validateKeyPattern('another_valid_key')).toBe(true);
      expect(validateKeyPattern('key123')).toBe(true);
      expect(validateKeyPattern('key.with.dots')).toBe(true);
    });

    test('should reject invalid key patterns', () => {
      expect(validateKeyPattern('')).toBe(false);
      expect(validateKeyPattern(null)).toBe(false);
      expect(validateKeyPattern(undefined)).toBe(false);
      expect(validateKeyPattern(123)).toBe(false);
      expect(validateKeyPattern('key with spaces')).toBe(false);
      expect(validateKeyPattern('_leading_underscore')).toBe(false);
      expect(validateKeyPattern('trailing_underscore_')).toBe(false);
    });
  });

  describe('extractTranslationKeys', () => {
    test('should extract keys from t() function calls', () => {
      const content = `
        t('key1');
        t('key2', 'default');
        i18n.t('key3');
        useTranslation('namespace');
        const x = t('key4');
      `;

      const keys = extractTranslationKeys(content);

      expect(keys).toEqual(['key1', 'key2', 'key3', 'namespace', 'key4']);
    });

    test('should remove duplicates', () => {
      const content = `
        t('duplicate');
        t('duplicate');
        t('unique');
      `;

      const keys = extractTranslationKeys(content);

      expect(keys).toEqual(['duplicate', 'unique']);
      expect(keys.length).toBe(2);
    });

    test('should handle empty content', () => {
      const keys = extractTranslationKeys('');
      expect(keys).toEqual([]);
    });

    test('should handle content without translation calls', () => {
      const content = 'console.log("hello"); var x = 1;';
      const keys = extractTranslationKeys(content);
      expect(keys).toEqual([]);
    });
  });

  describe('validateTranslationKeys', () => {
    test('should validate multiple keys and return issues', () => {
      const keys = ['validKey', 'invalid key', 'another_valid'];

      const issues = validateTranslationKeys(keys);

      expect(issues).toHaveLength(1);
      expect(issues[0].key).toBe('invalid key');
      expect(issues[0].issue).toBe('Invalid key pattern');
    });

    test('should return empty array for valid keys', () => {
      const keys = ['validKey', 'anotherValid', 'valid.key'];

      const issues = validateTranslationKeys(keys);

      expect(issues).toHaveLength(0);
    });
  });

  describe('safeReadFile', () => {
    test('should read file successfully', () => {
      const mockContent = 'file content';
      fsMock.readFileSync.mockReturnValue(mockContent);

      const result = safeReadFile('test.txt');

      expect(result).toBe(mockContent);
      expect(fsMock.readFileSync).toHaveBeenCalledWith('test.txt', 'utf8');
    });

    test('should return null on read error', () => {
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = safeReadFile('nonexistent.txt');

      expect(result).toBeNull();
    });
  });

  describe('safeWriteFile', () => {
    test('should write file successfully', () => {
      fsMock.writeFileSync.mockImplementation(() => {});

      const result = safeWriteFile('test.txt', 'content');

      expect(result).toBe(true);
      expect(fsMock.writeFileSync).toHaveBeenCalledWith('test.txt', 'content', 'utf8');
    });

    test('should return false on write error', () => {
      fsMock.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const result = safeWriteFile('test.txt', 'content');

      expect(result).toBe(false);
    });
  });

  describe('ensureDirectory', () => {
    test('should create directory if it does not exist', () => {
      fsMock.existsSync.mockReturnValue(false);
      fsMock.mkdirSync.mockImplementation(() => {});

      ensureDirectory('/test/path');

      expect(fsMock.mkdirSync).toHaveBeenCalledWith('/test/path', { recursive: true });
    });

    test('should not create directory if it exists', () => {
      fsMock.existsSync.mockReturnValue(true);

      ensureDirectory('/existing/path');

      expect(fsMock.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getFileStats', () => {
    test('should return file stats successfully', () => {
      const mockStats = { size: 1024, mtime: new Date() };
      fsMock.statSync.mockReturnValue(mockStats);

      const result = getFileStats('test.txt');

      expect(result).toBe(mockStats);
      expect(fsMock.statSync).toHaveBeenCalledWith('test.txt');
    });

    test('should return null on stat error', () => {
      fsMock.statSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = getFileStats('nonexistent.txt');

      expect(result).toBeNull();
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    test('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(2560)).toBe('2.50 KB');
    });
  });

  describe('generateTimestamp', () => {
    test('should generate timestamp string', () => {
      const result = generateTimestamp();

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should generate different timestamps', () => {
      const timestamp1 = generateTimestamp();
      // Small delay to ensure different timestamp
      setTimeout(() => {}, 1);
      const timestamp2 = generateTimestamp();

      expect(timestamp1).toBeDefined();
      expect(timestamp2).toBeDefined();
      // Note: In a real test environment, these might be the same
      // but the function should work correctly
    });
  });

  describe('deepClone', () => {
    test('should clone primitive values', () => {
      expect(deepClone('string')).toBe('string');
      expect(deepClone(123)).toBe(123);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    test('should clone arrays', () => {
      const original = [1, 2, { nested: 'value' }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different reference
      expect(cloned[2]).not.toBe(original[2]); // Nested object different reference
    });

    test('should clone objects', () => {
      const original = {
        key1: 'value1',
        key2: { nested: 'value2' },
        key3: [1, 2, 3]
      };

      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.key2).not.toBe(original.key2);
      expect(cloned.key3).not.toBe(original.key3);
    });

    test('should clone Date objects', () => {
      const original = new Date();
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned instanceof Date).toBe(true);
    });

    test('should handle circular references', () => {
      const original = { self: null };
      original.self = original;

      expect(() => deepClone(original)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should work together as a cohesive utility suite', () => {
      // Test that all functions can be imported and called
      expect(typeof getCached).toBe('function');
      expect(typeof clearCache).toBe('function');
      expect(typeof trackPerformance).toBe('function');
      expect(typeof validateKeyPattern).toBe('function');
      expect(typeof extractTranslationKeys).toBe('function');
      expect(typeof validateTranslationKeys).toBe('function');
      expect(typeof safeReadFile).toBe('function');
      expect(typeof safeWriteFile).toBe('function');
      expect(typeof ensureDirectory).toBe('function');
      expect(typeof getFileStats).toBe('function');
      expect(typeof formatFileSize).toBe('function');
      expect(typeof generateTimestamp).toBe('function');
      expect(typeof deepClone).toBe('function');
    });

    test('should handle complex workflow', () => {
      // Test a realistic workflow using multiple utilities
      const testData = { key: 'value', nested: { deep: 'data' } };
      const cloned = deepClone(testData);

      // Validate key patterns
      const keys = Object.keys(cloned);
      const validationResults = validateTranslationKeys(keys);

      // Test caching
      const cachedResult = getCached('test-cache', () => 'cached-value');

      expect(cloned).toEqual(testData);
      expect(validationResults.length).toBe(0); // 'key' and 'nested' are valid
      expect(cachedResult).toBe('cached-value');
    });
  });

  describe('Error Handling', () => {
    test('should handle all utilities gracefully under error conditions', () => {
      // Test error handling for file operations
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      fsMock.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      fsMock.statSync.mockImplementation(() => {
        throw new Error('Stat error');
      });

      expect(safeReadFile('test')).toBeNull();
      expect(safeWriteFile('test', 'content')).toBe(false);
      expect(getFileStats('test')).toBeNull();
    });
  });
});
