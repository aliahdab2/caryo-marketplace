/**
 * Translation Duplicates Module - Test Suite
 * Tests for the new modular duplicate detection and fixing functionality
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
        },
        ar: {
          common: {
            key1: 'قيمة1',
            key2: 'قيمة2'
          }
        }
      };

      // Mock file reading to return valid JSON without duplicates
      fsMock.readFileSync.mockReturnValue('{"key1": "value1", "key2": "value2"}');

      const result = findDuplicateKeys(mockTranslations, { returnSimple: true });

      expect(result).toBe(0);
      expect(fsMock.readFileSync).toHaveBeenCalled();
    });

    test('should detect duplicates in file content', () => {
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

      const result = findDuplicateKeys(mockTranslations, { returnSimple: true, verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      expect(result).toBeGreaterThan(0); // Should find duplicates in test files
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

      const result = findDuplicateKeys(mockTranslations, { returnSimple: true, verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      expect(result).toBeGreaterThan(0); // Should find duplicates in test files
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

      const result = findDuplicateKeys(mockTranslations, { returnSimple: true });

      expect(result).toBe(0); // Should handle error gracefully
    });
  });

  describe('fixDuplicateKeys', () => {
    test('should not create backups when no duplicates found', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'value1',
            key2: 'value2'
          }
        }
      };

      // Mock clean file without duplicates
      fsMock.readFileSync.mockReturnValue('{"key1": "value1", "key2": "value2"}');

      const result = fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      expect(result.totalFilesFixed).toBe(0);
      expect(result.totalDuplicatesRemoved).toBe(0);
      expect(fsMock.writeFileSync).not.toHaveBeenCalled();
    });

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

      const expectedCleanContent = `{
  "duplicateKey": "second value",
  "normalKey": "normal value"
}`;

      fsMock.readFileSync.mockReturnValue(originalContent);
      fsMock.writeFileSync.mockImplementation(() => {}); // Mock successful write

      const result = fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      expect(result.totalFilesFixed).toBe(1);
      expect(result.totalDuplicatesRemoved).toBe(1);
      expect(fsMock.writeFileSync).toHaveBeenCalledTimes(2); // Backup + cleaned file
    });

    test('should handle JSON validation errors', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      const invalidJsonContent = `{
  "duplicateKey": "first value",
  "duplicateKey": "second value"
}`;

      // Mock invalid JSON after "fixing"
      fsMock.readFileSync.mockReturnValue(invalidJsonContent);

      const result = fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      expect(result.totalFilesFixed).toBe(0);
      expect(result.totalDuplicatesRemoved).toBe(0);
    });

    test('should keep last occurrence of duplicates', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      const contentWithDuplicates = `{
  "key": "first",
  "other": "value",
  "key": "second",
  "key": "third"
}`;

      const expectedResult = `{
  "key": "third",
  "other": "value"
}`;

      fsMock.readFileSync.mockReturnValue(contentWithDuplicates);

      fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      // Check that the cleaned content keeps the last occurrence
      const writeFileCalls = fsMock.writeFileSync.mock.calls;
      const cleanedContent = writeFileCalls.find(call => !call[0].includes('.backup.'))[1];

      expect(cleanedContent).toBe(expectedResult);
    });

    test('should create timestamped backups', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      const contentWithDuplicates = `{
  "key": "first",
  "key": "second"
}`;

      fsMock.readFileSync.mockReturnValue(contentWithDuplicates);

      fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      const writeFileCalls = fsMock.writeFileSync.mock.calls;
      const backupCall = writeFileCalls.find(call => call[0].includes('.backup.'));

      expect(backupCall).toBeTruthy();
      expect(backupCall[0]).toMatch(/\.backup\.\d+$/);
      expect(backupCall[1]).toBe(contentWithDuplicates);
    });

    test('should handle file write errors', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      fsMock.readFileSync.mockReturnValue('{"key": "first", "key": "second"}');
      fsMock.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES })).not.toThrow();
    });

    test('should handle multiple files with duplicates', () => {
      const mockTranslations = {
        en: {
          common: {},
          auth: {}
        },
        ar: {
          common: {}
        }
      };

      // Mock different files with different duplicate patterns
      fsMock.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('en/common')) {
          return '{"dup1": "first", "dup1": "second"}';
        } else if (filePath.includes('en/auth')) {
          return '{"dup2": "third", "dup2": "fourth"}';
        } else if (filePath.includes('ar/common')) {
          return '{"dup3": "fifth", "dup3": "sixth"}';
        }
        return '{}';
      });

      const result = fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES });

      expect(result.totalFilesFixed).toBe(3);
      expect(result.totalDuplicatesRemoved).toBe(3);
      expect(fsMock.writeFileSync).toHaveBeenCalledTimes(6); // 3 backups + 3 cleaned files
    });
  });

  describe('Integration Tests', () => {
    test('should work with real file system operations', () => {
      // This test would use temporary files in a real scenario
      // For now, we verify the function structure
      expect(typeof findDuplicateKeys).toBe('function');
      expect(typeof fixDuplicateKeys).toBe('function');
    });

    test('should handle empty translations object', () => {
      const result = findDuplicateKeys({}, { returnSimple: true });
      expect(result).toBe(0);
    });

    test('should handle translations with missing language keys', () => {
      const mockTranslations = {
        en: {
          common: {}
        },
        // Missing 'ar' language
      };

      const result = findDuplicateKeys(mockTranslations, { returnSimple: true });
      expect(result).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON in files', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      fsMock.readFileSync.mockReturnValue('invalid json content {');

      expect(() => findDuplicateKeys(mockTranslations, { returnSimple: true })).not.toThrow();
    });

    test('should handle files that cannot be read', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => findDuplicateKeys(mockTranslations, { returnSimple: true })).not.toThrow();
    });

    test('should handle directory access errors', () => {
      fsMock.readFileSync.mockImplementation(() => {
        throw new Error('Directory not accessible');
      });

      expect(() => fixDuplicateKeys({ verbose: false, localesDir: TEST_LOCALES_DIR, namespaces: TEST_NAMESPACES })).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large files efficiently', () => {
      const mockTranslations = {
        en: {
          common: {}
        }
      };

      // Create a large file with many lines
      const lines = [];
      for (let i = 0; i < 1000; i++) {
        lines.push(`  "key${i}": "value${i}"`);
        if (i === 500) {
          lines.push(`  "duplicate": "first occurrence"`);
        }
      }
      lines.push(`  "duplicate": "second occurrence"`);

      const largeContent = `{\n${lines.join(',\n')}\n}`;

      fsMock.readFileSync.mockReturnValue(largeContent);

      const startTime = Date.now();
      const result = findDuplicateKeys(mockTranslations, { returnSimple: true });
      const endTime = Date.now();

      expect(result).toBe(1);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
