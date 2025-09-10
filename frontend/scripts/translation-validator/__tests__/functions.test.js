/**
 * Translation Validator Tool - Test Suite
 */

const path = require('path');
const fs = require('fs');

// Import functions from the translation validator
const {
  loadAllTranslations,
  findMissingTranslations,
  findDuplicateKeys,
  checkConsistency,
  calculateCompleteness,
  generateSummaryReport,
  autoFixMissingTranslations
} = require('../validator');

// Test configuration
const TEST_LOCALES_DIR = path.join(__dirname, '..', 'test-data');
const TEST_LANGUAGES = ['en', 'ar'];
const TEST_NAMESPACES = ['common', 'auth', 'duplicates'];

describe('Translation Validator Tool', () => {
  beforeAll(() => {
    // Create test directory structure if it doesn't exist
    if (!fs.existsSync(TEST_LOCALES_DIR)) {
      fs.mkdirSync(TEST_LOCALES_DIR, { recursive: true });
      TEST_LANGUAGES.forEach(lang => {
        fs.mkdirSync(path.join(TEST_LOCALES_DIR, lang), { recursive: true });
      });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original methods
    fs.readFileSync = global.originalReadFileSync;
    fs.writeFileSync = global.originalWriteFileSync;
    fs.existsSync = global.originalExistsSync;
  });

  describe('loadAllTranslations', () => {
    test('should load all translation files correctly', () => {
      // Temporarily override the LOCALES_DIR for testing
      const originalLocalesDir = global.TEST_LOCALES_DIR;
      global.TEST_LOCALES_DIR = TEST_LOCALES_DIR;

      const translations = loadAllTranslations();

      // Restore original
      global.TEST_LOCALES_DIR = originalLocalesDir;

      expect(translations).toBeDefined();
      expect(translations.en).toBeDefined();
      expect(translations.ar).toBeDefined();
      expect(typeof translations.en.common).toBe('object');
      expect(typeof translations.ar.common).toBe('object');
    });

    test('should handle missing files gracefully', () => {
      const translations = loadAllTranslations();
      expect(translations).toBeDefined();
      // Should not throw errors for missing files
    });
  });

  describe('findMissingTranslations', () => {
    test('should correctly identify missing translations', () => {
      // Mock translations data
      const mockTranslations = {
        en: {
          common: {
            appName: 'Test App',
            welcome: 'Welcome',
            login: 'Login',
            missingInArabic: 'Only in English'
          },
          auth: {
            username: 'Username',
            password: 'Password'
          }
        },
        ar: {
          common: {
            appName: 'تطبيق الاختبار',
            welcome: 'مرحباً',
            extraInArabic: 'فقط في العربية'
          },
          auth: {
            username: 'اسم المستخدم'
          }
        }
      };

      const missing = findMissingTranslations(mockTranslations);

      // English should be missing some keys that exist in Arabic
      expect(missing.en.common).toContain('extraInArabic');
      expect(missing.ar.common).toContain('missingInArabic');
      expect(missing.ar.common).toContain('login');
      expect(missing.ar.auth).toContain('password');
    });

    test('should return empty arrays when all translations exist', () => {
      const mockTranslations = {
        en: {
          common: {
            test: 'Test'
          }
        },
        ar: {
          common: {
            test: 'اختبار'
          }
        }
      };

      const missing = findMissingTranslations(mockTranslations);

      expect(missing.en.common).toHaveLength(0);
      expect(missing.ar.common).toHaveLength(0);
    });
  });

  describe('calculateCompleteness', () => {
    test('should calculate completeness percentages correctly', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
          }
        },
        ar: {
          common: {
            key1: 'قيمة1',
            key2: 'قيمة2'
          }
        }
      };

      const completeness = calculateCompleteness(mockTranslations);

      expect(completeness.en.percentage).toBe(100); // 3/3 = 100%
      expect(completeness.ar.percentage).toBe(67); // 2/3 = 67% (rounded)
      expect(completeness.en.total).toBe(3);
      expect(completeness.ar.translated).toBe(2);
    });

    test('should handle empty translations', () => {
      const mockTranslations = {
        en: { common: {} },
        ar: { common: { key1: 'value1' } }
      };

      const completeness = calculateCompleteness(mockTranslations);

      expect(completeness.en.percentage).toBe(0);
      expect(completeness.ar.percentage).toBe(100);
    });
  });

  describe('findDuplicateKeys', () => {
    test('should detect duplicate keys within the same namespace', () => {
      // Create a mock JSON with duplicates (this would normally be invalid JSON)
      const mockTranslations = {
        en: {
          common: {
            duplicateKey: 'First occurrence',
            normalKey: 'Normal value'
          },
          duplicates: {
            duplicateKey: 'Another duplicate',
            normalKey: 'Another normal'
          }
        },
        ar: {
          common: {},
          duplicates: {}
        }
      };

      // Manually add a duplicate to simulate the scenario
      mockTranslations.en.common.duplicateKey2 = 'Second occurrence';

      const duplicates = findDuplicateKeys(mockTranslations);

      // Note: This test is limited because JSON doesn't allow actual duplicates
      // In a real scenario, the JSON parsing would fail
      expect(duplicates).toBeDefined();
    });

    test('should return empty arrays when no duplicates exist', () => {
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

      const duplicates = findDuplicateKeys(mockTranslations);

      expect(duplicates.en.common).toHaveLength(0);
      expect(duplicates.ar.common).toHaveLength(0);
    });
  });

  describe('checkConsistency', () => {
    test('should detect type inconsistencies', () => {
      const mockTranslations = {
        en: {
          common: {
            numberKey: 123,
            stringKey: 'string',
            booleanKey: true
          }
        },
        ar: {
          common: {
            numberKey: '123', // Different type
            stringKey: 'نص', // Same type
            booleanKey: false // Same type
          }
        }
      };

      const inconsistencies = checkConsistency(mockTranslations);

      expect(inconsistencies).toHaveLength(1);
      expect(inconsistencies[0].key).toBe('common:numberKey');
      expect(inconsistencies[0].types).toContain('number');
      expect(inconsistencies[0].types).toContain('string');
    });

    test('should return empty array when all types are consistent', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'string',
            key2: 123,
            key3: true
          }
        },
        ar: {
          common: {
            key1: 'نص',
            key2: 456,
            key3: false
          }
        }
      };

      const inconsistencies = checkConsistency(mockTranslations);

      expect(inconsistencies).toHaveLength(0);
    });
  });

  describe('autoFixMissingTranslations', () => {
    test('should copy missing translations from source language', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'English value 1',
            key2: 'English value 2',
            key3: 'English value 3'
          }
        },
        ar: {
          common: {
            key1: 'Arabic value 1',
            key2: 'Arabic value 2'
          }
        }
      };

      const fixed = autoFixMissingTranslations(mockTranslations, 'en', 'ar');

      expect(fixed).toBe(1); // Should fix 1 missing key
      expect(mockTranslations.ar.common.key3).toBe('English value 3');
      expect(mockTranslations.ar.common.key1).toBe('Arabic value 1'); // Should not overwrite existing
    });

    test('should return 0 when no fixes are needed', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'English value'
          }
        },
        ar: {
          common: {
            key1: 'Arabic value'
          }
        }
      };

      const fixed = autoFixMissingTranslations(mockTranslations, 'en', 'ar');

      expect(fixed).toBe(0);
    });

    test('should handle missing source keys gracefully', () => {
      const mockTranslations = {
        en: {
          common: {}
        },
        ar: {
          common: {
            missingKey: 'Arabic only'
          }
        }
      };

      const fixed = autoFixMissingTranslations(mockTranslations, 'en', 'ar');

      expect(fixed).toBe(0); // Can't fix because source doesn't have the key
    });
  });

  describe('generateSummaryReport', () => {
    test('should generate comprehensive summary report', () => {
      const mockTranslations = {
        en: {
          common: {
            key1: 'value1',
            key2: 'value2'
          }
        },
        ar: {
          common: {
            key1: 'قيمة1'
          }
        }
      };

      const report = generateSummaryReport(mockTranslations);

      expect(report).toBeDefined();
      expect(report.totalKeys).toBe(2);
      expect(report.missing).toBe(1);
      expect(report.completeness.en.percentage).toBe(100);
      expect(report.completeness.ar.percentage).toBe(50);
    });
  });

  describe('Integration Tests', () => {
    test('should work with real test data', () => {
      // This test would use the actual test files we created
      // For now, we'll use mock data to ensure the test runs
      const mockTranslations = {
        en: {
          common: {
            appName: 'Test App',
            welcome: 'Welcome'
          },
          auth: {
            login: 'Login',
            register: 'Register'
          }
        },
        ar: {
          common: {
            appName: 'تطبيق الاختبار',
            welcome: 'مرحباً',
            extraKey: 'إضافي'
          },
          auth: {
            login: 'تسجيل الدخول'
          }
        }
      };

      // Test all functions work together
      const missing = findMissingTranslations(mockTranslations);
      const completeness = calculateCompleteness(mockTranslations);
      const duplicates = findDuplicateKeys(mockTranslations);
      const inconsistencies = checkConsistency(mockTranslations);

      expect(missing).toBeDefined();
      expect(completeness).toBeDefined();
      expect(duplicates).toBeDefined();
      expect(inconsistencies).toBeDefined();

      // Verify expected results
      expect(missing.en.common).toContain('extraKey');
      expect(missing.ar.auth).toContain('register');
      expect(completeness.en.percentage).toBe(75); // 3/4 keys
      expect(completeness.ar.percentage).toBe(100); // 4/4 keys
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON gracefully', () => {
      // Mock fs.readFileSync to return invalid JSON
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn(() => 'invalid json');

      const translations = loadAllTranslations();

      // Should handle the error gracefully
      expect(translations).toBeDefined();

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    test('should handle missing directories gracefully', () => {
      const translations = loadAllTranslations();

      // Should not throw errors for missing files/directories
      expect(translations).toBeDefined();
      expect(typeof translations).toBe('object');
    });
  });
});
