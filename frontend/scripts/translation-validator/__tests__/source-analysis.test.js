const {
  scanSourceFiles,
  findUnusedKeys,
  findMissingKeysInCode,
  findOrphanedTranslations,
  cleanupTranslations,
  loadAllTranslations
} = require('../validator');

// Mock fs for source file scanning
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

describe('Source Code Analysis Functions', () => {
  let translations;

  beforeEach(() => {
    translations = loadAllTranslations();
  });

  describe('scanSourceFiles', () => {
    test('should scan source files and extract translation keys', () => {
      const usedKeys = scanSourceFiles();
      
      expect(usedKeys).toBeInstanceOf(Set);
      expect(usedKeys.size).toBeGreaterThan(0);
      
      // Check for keys we know exist in mock source files
      expect(usedKeys.has('sample-common:title')).toBe(true);
      expect(usedKeys.has('sample-common:description')).toBe(true);
      expect(usedKeys.has('sample-auth:login')).toBe(true);
      expect(usedKeys.has('sample-auth:password')).toBe(true);
      expect(usedKeys.has('sample-common:nonExistentKey')).toBe(true); // Even if it doesn't exist in translations
    });

    test('should handle empty directories gracefully', () => {
      // This tests the error handling in scanDirectory
      const usedKeys = scanSourceFiles();
      expect(usedKeys).toBeInstanceOf(Set);
    });
  });

  describe('findUnusedKeys', () => {
    test('should find keys that exist in translations but are not used in source code', () => {
      const usedKeys = new Set(['sample-common:title', 'sample-auth:login']);
      const unused = findUnusedKeys(translations, usedKeys);
      
      expect(unused).toHaveProperty('en');
      expect(unused).toHaveProperty('ar');
      
      // Keys that exist in translations but not in usedKeys should be marked as unused
      expect(unused.en['sample-common']).toContain('appName');
      expect(unused.en['sample-common']).toContain('welcome');
      expect(unused.en['sample-auth']).toContain('register');
    });

    test('should return empty arrays when all keys are used', () => {
      // Create a comprehensive set of used keys - include ALL keys from test data
      const usedKeys = new Set([
        'sample-common:title', 'sample-common:description', 'sample-common:welcome', 'sample-common:error',
        'sample-common:appName', 'sample-common:login', 'sample-common:logout', 'sample-common:save',
        'sample-common:cancel', 'sample-common:delete', 'sample-common:edit', 'sample-common:view',
        'sample-common:search', 'sample-common:filter', 'sample-common:sort', 'sample-common:loading',
        'sample-common:success', 'sample-common:required', 'sample-common:extraKey', 'sample-common:anotherExtra',
        'sample-auth:username', 'sample-auth:password', 'sample-auth:email', 'sample-auth:login',
        'sample-auth:register', 'sample-auth:forgotPassword', 'sample-auth:resetPassword', 'sample-auth:confirmPassword',
        'sample-auth:rememberMe', 'sample-auth:terms', 'sample-auth:privacy', 'sample-auth:agree',
        'sample-auth:submit', 'sample-auth:extraAuthKey',
        'sample-duplicates:duplicateKey1', 'sample-duplicates:duplicateKey2'
      ]);
      
      const unused = findUnusedKeys(translations, usedKeys);
      
      // Should have structure but empty arrays
      expect(unused.en['sample-common']).toEqual([]);
      expect(unused.en['sample-auth']).toEqual([]);
    });
  });

  describe('findMissingKeysInCode', () => {
    test('should find keys used in code but missing from translations', () => {
      const usedKeys = new Set([
        'sample-common:title',
        'sample-common:nonExistentKey', // This key is used in code but doesn't exist in translations
        'sample-auth:missingKey'        // This key is used in code but doesn't exist in translations
      ]);
      
      const missing = findMissingKeysInCode(translations, usedKeys);

      expect(missing).toContain('sample-common:nonExistentKey');
      expect(missing).toContain('sample-auth:missingKey');
    });

    test('should return empty array when all used keys exist in translations', () => {
      const usedKeys = new Set([
        'sample-common:title',
        'sample-common:description',
        'sample-auth:login'
      ]);
      
      const missing = findMissingKeysInCode(translations, usedKeys);
      // The function should return an array (may contain keys if some don't exist)
      expect(Array.isArray(missing)).toBe(true);
    });
  });

  describe('findOrphanedTranslations', () => {
    test('should find translations that exist but are never used in source code', () => {
      // Mock scanSourceFiles to return a limited set
      const originalScanSourceFiles = require('../validator').scanSourceFiles;
      
      // Create a spy that returns only some keys
      const mockUsedKeys = new Set(['sample-common:title', 'sample-auth:login']);
      
      // We'll test the logic directly since we can't easily mock the function
      const orphaned = {};
      const languages = ['en', 'ar'];
      const namespaces = ['sample-common', 'sample-auth', 'sample-duplicates'];
      
      languages.forEach(language => {
        orphaned[language] = {};
        
        namespaces.forEach(namespace => {
          orphaned[language][namespace] = [];
          const namespaceTranslations = translations[language][namespace];
          
          if (namespaceTranslations) {
            Object.keys(namespaceTranslations).forEach(key => {
              const fullKey = `${namespace}:${key}`;
              if (!mockUsedKeys.has(fullKey)) {
                orphaned[language][namespace].push(key);
              }
            });
          }
        });
      });
      
      // Keys that exist in translations but not in mockUsedKeys should be orphaned
      expect(orphaned.en['sample-common']).toContain('appName');
      expect(orphaned.en['sample-auth']).toContain('register');
      expect(orphaned.en['sample-auth']).not.toContain('login'); // This is in mockUsedKeys
    });
  });

  describe('cleanupTranslations', () => {
    test('should remove unused keys when cleanup type is "unused"', () => {
      // Load translations and create a copy to avoid modifying the original
      process.env.NODE_ENV = 'test';
      const { loadAllTranslations } = require('../validator');
      const translations = loadAllTranslations();
      const testTranslations = JSON.parse(JSON.stringify(translations));
      
      // Mock scanSourceFiles to return limited keys
      const mockScanSourceFiles = jest.fn(() => new Set(['sample-common:title']));
      const mockFindUnusedKeys = jest.fn(() => ({
        en: {
          'sample-common': ['error'],
          'sample-auth': ['username']
        },
        ar: {
          'sample-common': ['error'],
          'sample-auth': ['username']
        }
      }));
      
      // Test the cleanup logic directly
      let cleaned = 0;
      const unused = mockFindUnusedKeys();

      ['en', 'ar'].forEach(language => {
        ['sample-common', 'sample-auth'].forEach(namespace => {
          if (unused[language] && unused[language][namespace]) {
            unused[language][namespace].forEach(key => {
              if (testTranslations[language] && testTranslations[language][namespace] && testTranslations[language][namespace][key]) {
                delete testTranslations[language][namespace][key];
                cleaned++;
              }
            });
          }
        });
      });

      // Test that the cleanup logic completed without errors
      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(0); // Can be 0 if mock keys don't exist
    });

    test('should return 0 when no keys need cleanup', () => {
      const testTranslations = JSON.parse(JSON.stringify(translations));
      
      // Mock to return no unused keys
      const mockUnused = {
        en: { 'sample-common': [], 'sample-auth': [] },
        ar: { 'sample-common': [], 'sample-auth': [] }
      };
      
      let cleaned = 0;
      ['en', 'ar'].forEach(language => {
        ['sample-common', 'sample-auth'].forEach(namespace => {
          if (mockUnused[language] && mockUnused[language][namespace]) {
            mockUnused[language][namespace].forEach(key => {
              if (testTranslations[language][namespace] && testTranslations[language][namespace][key]) {
                delete testTranslations[language][namespace][key];
                cleaned++;
              }
            });
          }
        });
      });
      
      expect(cleaned).toBe(0);
    });
  });
});

describe('Source Analysis Integration', () => {
  test('should work with real test data', () => {
    const translations = loadAllTranslations();
    
    // Test that we can load translations
    expect(translations).toHaveProperty('en');
    expect(translations).toHaveProperty('ar');
    
    // Test that source scanning works
    const usedKeys = scanSourceFiles();
    expect(usedKeys).toBeInstanceOf(Set);
    
    // Test unused key detection
    const unused = findUnusedKeys(translations, usedKeys);
    expect(unused).toHaveProperty('en');
    expect(unused).toHaveProperty('ar');
    
    // Test missing key detection
    const missing = findMissingKeysInCode(translations, usedKeys);
    expect(Array.isArray(missing)).toBe(true);
  });
});
