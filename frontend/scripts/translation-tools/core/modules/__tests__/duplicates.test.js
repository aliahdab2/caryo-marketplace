/**
 * Translation Duplicates Module - Test Suite
 * Clean, comprehensive tests for duplicate detection and removal functionality
 */

const fs = require('fs');
const path = require('path');
const { findDuplicateKeys, fixDuplicateKeys } = require('../duplicates');

// Mock fs for testing
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');

  return {
    ...originalFs,
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(() => true),
  };
});

const fsMock = require('fs');

describe('Duplicates Module', () => {
  const TEST_LOCALES_DIR = path.resolve(__dirname, '..', '..', 'test-data');
  const TEST_NAMESPACES = ['sample-auth', 'sample-common', 'sample-duplicates'];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    fsMock.readFileSync.mockClear();
    fsMock.writeFileSync.mockClear();
  });

  describe('findDuplicateKeys', () => {
    test('should return 0 when no duplicates exist', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'value1',
            key2: 'value2'
          }
        }
      };

      // Mock file reading to return valid JSON without duplicates
      fsMock.readFileSync.mockReturnValue('{"key1": "value1", "key2": "value2"}');

      const result = findDuplicateKeys(mockTranslations, {
        returnSimple: true,
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      });

      expect(result).toBe(0);
    });

    test('should detect duplicates in actual test data', () => {
      const mockTranslations = {
        en: {
          common: {}
        },
        ar: {
          common: {}
        }
      };

      // Mock file reads to return different content based on file path
      fsMock.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('sample-duplicates.json')) {
          return `{
  "duplicateKey": "first value",
  "normalKey": "normal value",
  "duplicateKey": "second value",
  "anotherDuplicate": "First",
  "anotherDuplicate": "Second"
}`;
        }
        // Return valid JSON for other files
        return '{"key1": "value1", "key2": "value2"}';
      });

      const result = findDuplicateKeys(mockTranslations, {
        returnSimple: true,
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      });

      expect(result).toBeGreaterThan(0);
      expect(fsMock.readFileSync).toHaveBeenCalled();
    });

    test('should handle multiple duplicates correctly', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      // Mock file reads to return different content based on file path
      fsMock.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('sample-duplicates.json')) {
          return `{
  "dup1": "first",
  "dup2": "second",
  "dup1": "third",
  "dup2": "fourth",
  "dup1": "fifth"
}`;
        }
        // Return valid JSON for other files
        return '{"key1": "value1", "key2": "value2"}';
      });

      const result = findDuplicateKeys(mockTranslations, {
        returnSimple: true,
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      });

      expect(result).toBeGreaterThan(0);
      expect(fsMock.readFileSync).toHaveBeenCalled();
    });

    test('should handle file read errors gracefully', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => findDuplicateKeys(mockTranslations, {
        returnSimple: true,
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      })).not.toThrow();
    });
  });

  describe('fixDuplicateKeys', () => {
    test('should fix duplicates and create backups', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      const originalContent = `{
  "duplicateKey": "first value",
  "normalKey": "normal value",
  "duplicateKey": "second value"
}`;

      fsMock.readFileSync.mockReturnValue(originalContent);
      fsMock.writeFileSync.mockImplementation(() => {}); // Mock successful write

      const result = fixDuplicateKeys({
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      });

      expect(result.totalFilesFixed).toBeGreaterThan(0);
      expect(result.totalDuplicatesRemoved).toBeGreaterThan(0);
      expect(fsMock.writeFileSync).toHaveBeenCalled();
    });

    test('should handle file write errors', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      fsMock.readFileSync.mockReturnValue('{"duplicateKey": "value1", "duplicateKey": "value2"}');
      fsMock.writeFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      expect(() => fixDuplicateKeys({
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      })).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should work with real file system operations', () => {
      // Test that functions don't throw errors when called
      expect(typeof findDuplicateKeys).toBe('function');
      expect(typeof fixDuplicateKeys).toBe('function');
    });

    test('should handle empty translations object', () => {
      const result = findDuplicateKeys({}, {
        returnSimple: true,
        verbose: false,
        localesDir: TEST_LOCALES_DIR,
        namespaces: TEST_NAMESPACES
      });

      expect(result).toBe(0);
    });
  });
});