/**
 * Translation Loader Module - Test Suite
 * Tests for file loading and parsing functionality
 */

const fs = require('fs');
const path = require('path');
const { loadTranslationFile, loadAllTranslations, LOCALES_DIR, LANGUAGES, NAMESPACES } = require('../loader');

// Mock fs for testing
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');

  return {
    ...originalFs,
    readFileSync: jest.fn(),
  };
});

const fsMock = require('fs');

describe('Loader Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTranslationFile', () => {
    test('should load and parse valid JSON file', () => {
      const mockJson = '{"key1": "value1", "key2": "value2"}';
      fsMock.readFileSync.mockReturnValue(mockJson);

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
      expect(fsMock.readFileSync).toHaveBeenCalledWith(
        path.join(LOCALES_DIR, 'en', 'common.json'),
        'utf8'
      );
    });

    test('should handle empty files gracefully', () => {
      fsMock.readFileSync.mockReturnValue('');

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should handle whitespace-only files', () => {
      fsMock.readFileSync.mockReturnValue('   \n\t  ');

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should handle invalid JSON gracefully', () => {
      fsMock.readFileSync.mockReturnValue('invalid json {');

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should handle file read errors gracefully', () => {
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should detect duplicate keys in file content', () => {
      const duplicateContent = `{
  "duplicateKey": "first value",
  "normalKey": "normal value",
  "duplicateKey": "second value"
}`;

      fsMock.readFileSync.mockReturnValue(duplicateContent);

      // Mock console methods to capture output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = loadTranslationFile('en', 'common');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DUPLICATE KEY FOUND')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('duplicateKey')
      );

      consoleSpy.mockRestore();
    });

    test('should handle non-object JSON gracefully', () => {
      fsMock.readFileSync.mockReturnValue('"just a string"');

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should handle array JSON gracefully', () => {
      fsMock.readFileSync.mockReturnValue('["item1", "item2"]');

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });
  });

  describe('loadAllTranslations', () => {
    test('should load translations for all languages and namespaces', () => {
      const mockJson = '{"test": "value"}';
      fsMock.readFileSync.mockReturnValue(mockJson);

      const result = loadAllTranslations();

      expect(result).toHaveProperty('en');
      expect(result).toHaveProperty('ar');

      LANGUAGES.forEach(lang => {
        expect(result[lang]).toBeDefined();
        NAMESPACES.forEach(namespace => {
          expect(result[lang][namespace]).toEqual({ test: 'value' });
        });
      });

      // Should be called for each language/namespace combination
      expect(fsMock.readFileSync).toHaveBeenCalledTimes(LANGUAGES.length * NAMESPACES.length);
    });

    test('should handle partial loading failures', () => {
      let callCount = 0;
      fsMock.readFileSync.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return '{"valid": "json"}';
        } else if (callCount === 2) {
          throw new Error('File not found');
        } else {
          return '{"another": "file"}';
        }
      });

      const result = loadAllTranslations();

      expect(result).toBeDefined();
      // Should continue loading other files even if some fail
    });

    test('should handle all files failing to load', () => {
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('All files missing');
      });

      const result = loadAllTranslations();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('Configuration Constants', () => {
    test('should export correct LOCALES_DIR path', () => {
      const expectedPath = path.resolve(__dirname, '..', '..', '..', '..', 'public', 'locales');
      expect(LOCALES_DIR).toBe(expectedPath);
    });

    test('should export correct LANGUAGES array', () => {
      expect(LANGUAGES).toEqual(['en', 'ar']);
      expect(Array.isArray(LANGUAGES)).toBe(true);
    });

    test('should export correct NAMESPACES array', () => {
      const expectedNamespaces = [
        'auth', 'common', 'contact', 'dashboard', 'errors',
        'favorites', 'home', 'listings', 'mediaGallery',
        'messages', 'search', 'translation'
      ];

      expect(NAMESPACES).toEqual(expectedNamespaces);
      expect(Array.isArray(NAMESPACES)).toBe(true);
      expect(NAMESPACES.length).toBe(12);
    });
  });

  describe('Integration Tests', () => {
    test('should work with real file operations when files exist', () => {
      // This would test with actual files in a real scenario
      // For now, verify the functions exist and are callable
      expect(typeof loadTranslationFile).toBe('function');
      expect(typeof loadAllTranslations).toBe('function');
      expect(typeof LOCALES_DIR).toBe('string');
      expect(Array.isArray(LANGUAGES)).toBe(true);
      expect(Array.isArray(NAMESPACES)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle encoding errors', () => {
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('Encoding error');
      });

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should handle permission errors', () => {
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = loadTranslationFile('en', 'common');

      expect(result).toEqual({});
    });

    test('should handle very large files', () => {
      // Create a large JSON string
      const largeJson = JSON.stringify(
        Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`])
        )
      );

      fsMock.readFileSync.mockReturnValue(largeJson);

      const result = loadTranslationFile('en', 'common');

      expect(Object.keys(result).length).toBe(1000);
    });
  });

  describe('Performance Tests', () => {
    test('should load files efficiently', () => {
      const mockJson = '{"key": "value"}';
      fsMock.readFileSync.mockReturnValue(mockJson);

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        loadTranslationFile('en', 'common');
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete 100 loads in less than 1 second
      expect(totalTime).toBeLessThan(1000);
      expect(fsMock.readFileSync).toHaveBeenCalledTimes(100);
    });
  });
});
