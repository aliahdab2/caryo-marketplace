#!/usr/bin/env node

/**
 * Translation Validator Tool (ANALYSIS ONLY)
 * Validates translation files for Caryo Marketplace
 *
 * Features:
 * - Find missing translations across languages
 * - Find orphaned translations (keys without usage)
 * - Scan React/TypeScript files for translation key usage
 * - Identify unused translation keys
 * - Generate comprehensive reports
 * - Export missing translations for professional translation
 * - Consistency checking
 *
 * IMPORTANT: This tool is ANALYSIS-ONLY and does not modify translation files.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.resolve(__dirname, '..', '..', '..', 'public', 'locales');
const SRC_DIR = path.resolve(__dirname, '..', '..', '..', 'src');
const LANGUAGES = ['en', 'ar'];
const NAMESPACES = [
  'auth', 'common', 'contact', 'dashboard', 'errors',
  'favorites', 'home', 'listings', 'mediaGallery',
  'messages', 'search', 'translation'
];

// Test configuration (used when running tests)
const TEST_LOCALES_DIR = process.env.NODE_ENV === 'test' ?
  path.join(__dirname, 'test-data') : LOCALES_DIR;
const TEST_SRC_DIR = process.env.NODE_ENV === 'test' ?
  path.join(__dirname, 'test-data', 'mock-source-files') : SRC_DIR;
const TEST_LANGUAGES = process.env.NODE_ENV === 'test' ? ['en', 'ar'] : LANGUAGES;
const TEST_NAMESPACES = process.env.NODE_ENV === 'test' ? ['sample-common', 'sample-auth', 'sample-duplicates'] : NAMESPACES;

/**
 * Load translation file
 */
function loadTranslationFile(language, namespace) {
  const baseDir = process.env.NODE_ENV === 'test' ? TEST_LOCALES_DIR : LOCALES_DIR;
  const filePath = path.join(baseDir, language, `${namespace}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file is empty
    if (!content.trim()) {
      console.warn(`⚠️  File ${language}/${namespace}.json is empty`);
      return {};
    }

    // Try to parse JSON
    const parsed = JSON.parse(content);

    // Validate that it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      console.error(`❌ Invalid JSON structure in ${language}/${namespace}.json - expected object, got ${typeof parsed}`);
      return {};
    }

    // Check for duplicate keys in the raw file content before JSON parsing
    const lines = content.split('\n');
    const keyPattern = /^\s*"([^"]+)":/;
    const seenKeys = new Map();
    const duplicatesInFile = [];

    lines.forEach((line, index) => {
      const match = line.match(keyPattern);
      if (match) {
        const key = match[1];
        if (seenKeys.has(key)) {
          duplicatesInFile.push(key);
          console.error(`🚨 DUPLICATE KEY FOUND in ${language}/${namespace}.json at line ${index + 1}: "${key}"`);
          console.error(`   First occurrence: line ${seenKeys.get(key)}`);
          console.error(`   Duplicate: line ${index + 1}`);
        } else {
          seenKeys.set(key, index + 1);
        }
      }
    });

    if (duplicatesInFile.length > 0) {
      console.error(`❌ ${language}/${namespace}.json contains ${duplicatesInFile.length} duplicate keys: ${duplicatesInFile.join(', ')}`);
      // Still return the parsed object for other validation purposes
    }

    return parsed;
  } catch (error) {
    console.error(`❌ Failed to load ${language}/${namespace}.json: ${error.message}`);
    if (process.env.NODE_ENV !== 'test' || process.env.DEBUG_TRANSLATIONS) {
      console.error(`   Error details:`, error);
    }
    return {};
  }
}

/**
 * Load all translation files
 */
function loadAllTranslations() {
  return trackPerformance('Loading translations', () => {
    return getCached('translations', () => {
      console.log('Loading translation files...');
      const translations = {};
      const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
      const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

      languages.forEach(language => {
        translations[language] = {};

        namespaces.forEach(namespace => {
          translations[language][namespace] = loadTranslationFile(language, namespace);
        });
      });

      return translations;
    });
  });
}

/**
 * Get all unique keys across all languages and namespaces
 */
function getAllKeys(translations) {
  const allKeys = new Set();
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    namespaces.forEach(namespace => {
      const namespaceTranslations = translations[language][namespace];
      if (namespaceTranslations) {
        Object.keys(namespaceTranslations).forEach(key => {
          allKeys.add(`${namespace}:${key}`);
        });
      }
    });
  });

  return Array.from(allKeys).sort();
}

/**
 * Find missing translations
 */
function findMissingTranslations(translations) {
  const missing = {};
  const allKeys = getAllKeys(translations);
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    missing[language] = {};

    namespaces.forEach(namespace => {
      missing[language][namespace] = [];
    });
  });

  allKeys.forEach(fullKey => {
    const [namespace, key] = fullKey.split(':');

    LANGUAGES.forEach(language => {
      if (!translations[language][namespace][key]) {
        missing[language][namespace].push(key);
      }
    });
  });

  return missing;
}

/**
 * Find orphaned translations (keys that exist in translations but are never used in source code)
 */
function findOrphanedTranslations(translations) {
  console.log('Scanning source files to detect orphaned translations...');
  const usedKeys = scanSourceFiles();
  const orphaned = {};
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    orphaned[language] = {};

    namespaces.forEach(namespace => {
      orphaned[language][namespace] = [];
      const namespaceTranslations = translations[language][namespace];

      if (namespaceTranslations) {
        Object.keys(namespaceTranslations).forEach(key => {
          const fullKey = `${namespace}:${key}`;
          // If key exists in translations but not used in source code, it's orphaned
          if (!usedKeys.has(fullKey)) {
            orphaned[language][namespace].push(key);
          }
        });
      }
    });
  });

  return orphaned;
}

/**
 * Find duplicate keys within the same namespace
 */
function findDuplicateKeys(translations) {
  console.log('🔍 Starting duplicate detection...');
  const duplicates = {};
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  console.log(`📊 Checking ${languages.length} languages and ${namespaces.length} namespaces`);
  let totalDuplicates = 0;

  languages.forEach(language => {
    console.log(`🌍 Processing language: ${language}`);
    duplicates[language] = {};

    namespaces.forEach(namespace => {
      console.log(`📁 Processing namespace: ${namespace}`);
      duplicates[language][namespace] = [];

      // First check for duplicates at the file level
      const baseDir = process.env.NODE_ENV === 'test' ? TEST_LOCALES_DIR : LOCALES_DIR;
      const filePath = path.join(baseDir, language, `${namespace}.json`);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const keyPattern = /^\s*"([^"]+)":/;
        const seenKeys = new Map();

        lines.forEach((line, index) => {
          const match = line.match(keyPattern);
          if (match) {
            const key = match[1];
            if (seenKeys.has(key)) {
              console.log(`🚨 DUPLICATE FOUND: "${key}" in ${language}/${namespace}.json`);
              console.log(`   First occurrence: line ${seenKeys.get(key)}`);
              console.log(`   Duplicate: line ${index + 1}`);
              console.log(`   Values will be: last one wins in JSON parsing`);

              duplicates[language][namespace].push(key);
              totalDuplicates++;
            } else {
              seenKeys.set(key, index + 1);
            }
          }
        });
      } catch (error) {
        console.log(`⚠️ Could not read file ${language}/${namespace}.json for duplicate detection`);
      }

      // Also check the parsed object for any remaining duplicates (though JSON parsing removes them)
      const namespaceTranslations = translations[language][namespace];
      if (namespaceTranslations && typeof namespaceTranslations === 'object') {
        const keys = Object.keys(namespaceTranslations);
        console.log(`🔑 Found ${keys.length} keys in ${language}/${namespace} after parsing`);

        if (keys.length === 0) {
          console.log(`⚠️  No keys found in ${language}/${namespace} - possibly empty or malformed file`);
          return;
        }
      }

      console.log(`📋 Keys processed in ${language}/${namespace}, Duplicates found: ${duplicates[language][namespace].length}`);
    });
  });

  console.log(`✅ Duplicate detection completed. Total duplicates found: ${totalDuplicates}`);
  return duplicates;
}

/**
 * Safely remove duplicate keys from translation files
 * Keeps the LAST occurrence of each duplicate key (JSON "last wins" behavior)
 */
function fixDuplicateKeys() {
  console.log('🛠️  Starting safe duplicate key removal...');
  console.log('⚠️  This will create backups and keep the LAST occurrence of each duplicate key\n');

  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  let totalFilesProcessed = 0;
  let totalDuplicatesRemoved = 0;
  let totalFilesFixed = 0;

  languages.forEach(language => {
    namespaces.forEach(namespace => {
      const baseDir = process.env.NODE_ENV === 'test' ? TEST_LOCALES_DIR : LOCALES_DIR;
      const filePath = path.join(baseDir, language, `${namespace}.json`);

      try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        // Find duplicate keys
        const keyPattern = /^\s*"([^"]+)":/;
        const keyOccurrences = new Map(); // key -> array of line numbers
        const duplicates = new Map(); // key -> array of line numbers (excluding last)

        lines.forEach((line, index) => {
          const match = line.match(keyPattern);
          if (match) {
            const key = match[1];
            if (!keyOccurrences.has(key)) {
              keyOccurrences.set(key, []);
            }
            keyOccurrences.get(key).push(index);
          }
        });

        // Find keys with multiple occurrences
        keyOccurrences.forEach((lineNumbers, key) => {
          if (lineNumbers.length > 1) {
            // Keep the last occurrence, mark others for removal
            const toRemove = lineNumbers.slice(0, -1); // All except last
            duplicates.set(key, toRemove);
          }
        });

        if (duplicates.size === 0) {
          console.log(`✅ ${language}/${namespace}.json: No duplicates found`);
          return;
        }

        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, content);
        console.log(`💾 Created backup: ${path.basename(backupPath)}`);

        // Remove duplicate lines
        const linesToRemove = new Set();
        duplicates.forEach((lineNumbers) => {
          lineNumbers.forEach(lineNum => linesToRemove.add(lineNum));
        });

        // Create new content without duplicate lines
        const newLines = [];
        lines.forEach((line, index) => {
          if (!linesToRemove.has(index)) {
            newLines.push(line);
          }
        });

        const newContent = newLines.join('\n');

        // Validate new JSON
        try {
          JSON.parse(newContent);
        } catch (jsonError) {
          console.error(`❌ JSON validation failed after removing duplicates from ${language}/${namespace}.json`);
          console.error(`   Error: ${jsonError.message}`);
          console.log(`   Original file preserved, backup available at: ${backupPath}`);
          return;
        }

        // Write cleaned content
        fs.writeFileSync(filePath, newContent);

        // Report results
        console.log(`🧹 ${language}/${namespace}.json: Fixed ${duplicates.size} duplicate keys`);
        duplicates.forEach((lineNumbers, key) => {
          console.log(`   • "${key}": removed ${lineNumbers.length} duplicates, kept last occurrence`);
        });

        totalFilesProcessed++;
        totalFilesFixed++;
        totalDuplicatesRemoved += Array.from(duplicates.values()).reduce((sum, arr) => sum + arr.length, 0);

      } catch (error) {
        console.error(`❌ Error processing ${language}/${namespace}.json: ${error.message}`);
      }
    });
  });

  console.log(`\n📊 SUMMARY:`);
  console.log(`   • Files processed: ${totalFilesProcessed}`);
  console.log(`   • Files fixed: ${totalFilesFixed}`);
  console.log(`   • Duplicate keys removed: ${totalDuplicatesRemoved}`);

  if (totalFilesFixed > 0) {
    console.log(`\n✅ Duplicate removal completed successfully!`);
    console.log(`💡 TIP: Backups were created with .backup.{timestamp} extension`);
    console.log(`🔄 Run 'npm run translation:duplicates' to verify all duplicates are gone`);
  } else {
    console.log(`\n✅ No duplicates found - all files are clean!`);
  }
}

/**
 * Scan React/TypeScript files for translation key usage
 */
function scanSourceFiles() {
  return trackPerformance('Scanning source files', () => {
    return getCached('source-scan', () => {
      console.log('Scanning source files for translation usage...');
      const usedKeys = new Map(); // Changed from Set to Map to store metadata
      const srcDir = process.env.NODE_ENV === 'test' ? TEST_SRC_DIR : SRC_DIR;

      function scanDirectory(dirPath) {
        try {
          const items = fs.readdirSync(dirPath);

          items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '__tests__' && item !== 'tests' && !item.includes('.test') && !item.includes('.spec')) {
              scanDirectory(fullPath);
            } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item) && !/\.(test|spec)\./.test(item) && !item.includes('.test.') && !item.includes('.spec.')) {
              const keys = extractTranslationKeys(fullPath);
              keys.forEach(keyInfo => {
                // Store the full metadata, using key as the map key for uniqueness
                usedKeys.set(keyInfo.key, keyInfo);
              });
            }
          });
        } catch (error) {
          console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
        }
      }

      scanDirectory(srcDir);
      return usedKeys; // Return Map instead of Set
    });
  });
}

/**
 * Validate translation keys against naming conventions and best practices
 */
function validateTranslationKeys(translations) {
  const violations = {
    invalidPatterns: [],
    inconsistentNaming: [],
    nestedObjects: [],
    specialChars: [],
    caseIssues: [],
    namespaceIssues: []
  };

  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    namespaces.forEach(namespace => {
      const namespaceTranslations = translations[language][namespace];

      if (!namespaceTranslations) return;

      // Check for nested objects (should be flattened)
      function checkNested(obj, path = '') {
        Object.keys(obj).forEach(key => {
          const fullPath = path ? `${path}.${key}` : key;
          const value = obj[key];

          if (typeof value === 'object' && value !== null) {
            violations.nestedObjects.push({
              language,
              namespace,
              key: fullPath,
              issue: 'NESTED_OBJECT',
              message: 'Translation files should use flat keys, not nested objects',
              suggestion: 'Flatten nested objects using dot notation'
            });
            checkNested(value, fullPath);
          } else {
            // Validate individual key patterns
            validateKeyPattern(key, fullPath, language, namespace, violations);
          }
        });
      }

      checkNested(namespaceTranslations);
    });
  });

  return violations;
}

/**
 * Validate individual key naming patterns
 */
function validateKeyPattern(key, fullPath, language, namespace, violations) {
  // Check for invalid characters
  if (/[^a-zA-Z0-9._-]/.test(key)) {
    violations.specialChars.push({
      language,
      namespace,
      key: fullPath,
      issue: 'INVALID_CHARS',
      message: `Key contains invalid characters: ${key}`,
      suggestion: 'Use only letters, numbers, dots, underscores, and hyphens'
    });
  }

  // Check for inconsistent case patterns
  if (key.includes('_') && key.includes('.')) {
    violations.inconsistentNaming.push({
      language,
      namespace,
      key: fullPath,
      issue: 'MIXED_SEPARATORS',
      message: 'Key uses both underscores and dots as separators',
      suggestion: 'Use either dots (.) or underscores (_) consistently'
    });
  }

  // Check for camelCase vs kebab-case consistency
  const hasCamelCase = /[a-z][A-Z]/.test(key);
  const hasKebabCase = /-[a-zA-Z]/.test(key);

  if (hasCamelCase && hasKebabCase) {
    violations.caseIssues.push({
      language,
      namespace,
      key: fullPath,
      issue: 'MIXED_CASE',
      message: 'Key mixes camelCase and kebab-case patterns',
      suggestion: 'Use consistent naming convention (camelCase or kebab-case)'
    });
  }

  // Check for very long keys
  if (key.length > 50) {
    violations.invalidPatterns.push({
      language,
      namespace,
      key: fullPath,
      issue: 'KEY_TOO_LONG',
      message: `Key is too long (${key.length} characters)`,
      suggestion: 'Keep keys under 50 characters for maintainability'
    });
  }

  // Check for very short keys
  if (key.length < 3) {
    violations.invalidPatterns.push({
      language,
      namespace,
      key: fullPath,
      issue: 'KEY_TOO_SHORT',
      message: `Key is too short (${key.length} characters)`,
      suggestion: 'Use descriptive key names (at least 3 characters)'
    });
  }

  // Check for numeric-only keys
  if (/^\d+$/.test(key)) {
    violations.invalidPatterns.push({
      language,
      namespace,
      key: fullPath,
      issue: 'NUMERIC_KEY',
      message: 'Key consists only of numbers',
      suggestion: 'Use descriptive names instead of numeric keys'
    });
  }

  // Check for reserved words
  const reservedWords = ['null', 'undefined', 'true', 'false', 'class', 'function', 'var', 'let', 'const'];
  if (reservedWords.includes(key.toLowerCase())) {
    violations.invalidPatterns.push({
      language,
      namespace,
      key: fullPath,
      issue: 'RESERVED_WORD',
      message: `Key uses reserved word: ${key}`,
      suggestion: 'Avoid using programming language reserved words'
    });
  }

  // Check namespace consistency (should match filename)
  if (!fullPath.startsWith(`${namespace}.`) && fullPath !== key) {
    violations.namespaceIssues.push({
      language,
      namespace,
      key: fullPath,
      issue: 'NAMESPACE_MISMATCH',
      message: `Key doesn't follow namespace pattern: ${namespace}`,
      suggestion: `Use namespace prefix: ${namespace}.${key}`
    });
  }
}

/**
 * Extract translation keys from a single file
 */
function extractTranslationKeys(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = new Map(); // Use Map to store key metadata

    // Pattern 1: t('key') or t('namespace:key') - NO fallback
    const pattern1 = /t\(['"]([^'"]+)['"](?!\s*,)/g;
    let match;
    while ((match = pattern1.exec(content)) !== null) {
      const key = match[1];
      if (!keys.has(key)) {
        keys.set(key, {
          key: key,
          hasFallback: false,
          fallbackText: null,
          context: filePath,
          priority: 'critical'
        });
      }
    }

    // Pattern 2: t('key', 'fallback') or t('namespace:key', 'fallback') - HAS fallback
    const pattern2 = /t\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]/g;
    while ((match = pattern2.exec(content)) !== null) {
      const key = match[1];
      const fallback = match[2];
      keys.set(key, {
        key: key,
        hasFallback: true,
        fallbackText: fallback,
        context: filePath,
        priority: 'warning'
      });
    }

    return Array.from(keys.values());
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Find translation keys that exist in JSON but are never used in code
 */
function findUnusedKeys(translations, usedKeys) {
  const unused = {};
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    unused[language] = {};

    namespaces.forEach(namespace => {
      unused[language][namespace] = [];
      
      if (translations[language][namespace]) {
        const namespaceKeys = Object.keys(translations[language][namespace]);

        namespaceKeys.forEach(key => {
          const fullKey = `${namespace}:${key}`;
          if (!usedKeys.has(fullKey) && !usedKeys.has(key)) {
            unused[language][namespace].push(key);
          }
        });
      }
    });
  });

  return unused;
}

/**
 * Find translation keys that are used in code but don't exist in JSON
 */
function findMissingKeysInCode(translations, usedKeys) {
  const missing = [];
  const allAvailableKeys = new Set();
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  // Collect all available keys from translations
  languages.forEach(language => {
    namespaces.forEach(namespace => {
      if (translations[language][namespace]) {
        Object.keys(translations[language][namespace]).forEach(key => {
          allAvailableKeys.add(`${namespace}:${key}`);
        });
      }
    });
  });

  // Find keys that are used but not available, preserving metadata
  usedKeys.forEach((keyInfo, key) => {
    if (!allAvailableKeys.has(key)) {
      // Include the full metadata (hasFallback, fallbackText, context)
      missing.push({
        key: key,
        hasFallback: keyInfo.hasFallback,
        fallbackText: keyInfo.fallbackText,
        context: keyInfo.context,
        priority: keyInfo.hasFallback ? 'warning' : 'critical'
      });
    }
  });

  return missing;
}

/**
 * Check for consistency issues (same key with different data types)
 */
function checkConsistency(translations) {
  const inconsistencies = [];
  const allKeys = getAllKeys(translations);

  allKeys.forEach(fullKey => {
    const [namespace, key] = fullKey.split(':');
    const types = new Set();

    LANGUAGES.forEach(language => {
      const value = translations[language][namespace][key];
      if (value !== undefined) {
        types.add(typeof value);
      }
    });

    if (types.size > 1) {
      inconsistencies.push({
        key: fullKey,
        types: Array.from(types),
        languages: LANGUAGES
      });
    }
  });

  return inconsistencies;
}

/**
 * Calculate translation completeness for each language
 */
function calculateCompleteness(translations) {
  const allKeys = getAllKeys(translations);
  const completeness = {};
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    let translatedKeysInLang = 0;

    namespaces.forEach(namespace => {
      const namespaceTranslations = translations[language][namespace];
      if (namespaceTranslations) {

        // Count how many keys from allKeys exist in this language
        allKeys.forEach(fullKey => {
          const [ns, key] = fullKey.split(':');
          if (ns === namespace && namespaceTranslations[key]) {
            translatedKeysInLang++;
          }
        });
      }
    });

    completeness[language] = {
      total: allKeys.length,
      translated: translatedKeysInLang,
      percentage: Math.round((translatedKeysInLang / allKeys.length) * 100)
    };
  });

  return completeness;
}


/**
 * Generate summary report
 */
function generateSummaryReport(translations, includeSourceScan = false) {
  const allKeys = getAllKeys(translations);
  const missing = findMissingTranslations(translations);
  const duplicates = findDuplicateKeys(translations);
  const inconsistencies = checkConsistency(translations);
  const completeness = calculateCompleteness(translations);

  // Source code analysis (optional, as it can be slow)
  let usedKeys = [];
  let unused = {};
  let missingInCode = [];

  if (includeSourceScan) {
    console.log('Scanning source files for translation usage...');
    usedKeys = scanSourceFiles();
    unused = findUnusedKeys(translations, usedKeys);
    missingInCode = findMissingKeysInCode(translations, usedKeys);
  }

  console.log('='.repeat(60));
  console.log('TRANSLATION VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`Languages: ${LANGUAGES.join(', ')}`);
  console.log(`Namespaces: ${NAMESPACES.join(', ')}`);
  console.log(`Total unique keys: ${allKeys.length}`);
  console.log('');

  // Completeness summary
  console.log('TRANSLATION COMPLETENESS:');
  LANGUAGES.forEach(language => {
    const comp = completeness[language];
    console.log(`  ${language}: ${comp.translated}/${comp.total} keys (${comp.percentage}%)`);
  });
  console.log('');

  // Missing translations summary
  let totalMissing = 0;
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;
  
  languages.forEach(language => {
    namespaces.forEach(namespace => {
      if (missing[language] && missing[language][namespace]) {
        totalMissing += missing[language][namespace].length;
      }
    });
  });

  console.log(`Missing translations: ${totalMissing}`);
  if (totalMissing > 0) {
    languages.forEach(language => {
      const langMissing = namespaces.reduce((sum, ns) => {
        return sum + (missing[language] && missing[language][ns] ? missing[language][ns].length : 0);
      }, 0);
      if (langMissing > 0) {
        console.log(`  - ${language}: ${langMissing} missing`);
      }
    });
  }
  console.log('');

  // Duplicates summary
  let totalDuplicates = 0;
  languages.forEach(language => {
    namespaces.forEach(namespace => {
      if (duplicates[language] && duplicates[language][namespace]) {
        totalDuplicates += duplicates[language][namespace].length;
      }
    });
  });

  console.log(`Duplicate keys: ${totalDuplicates}`);
  console.log('');

  console.log(`Type inconsistencies: ${inconsistencies.length}`);

  if (includeSourceScan) {
    console.log('');
    console.log('SOURCE CODE ANALYSIS:');
    console.log(`Translation keys used in code: ${usedKeys.length}`);

    let totalUnused = 0;
    LANGUAGES.forEach(language => {
      NAMESPACES.forEach(namespace => {
        totalUnused += unused[language][namespace].length;
      });
    });
    console.log(`Unused translation keys: ${totalUnused}`);
    console.log(`Missing keys in translations: ${missingInCode.length}`);
  }

  return {
    totalKeys: allKeys.length,
    missing: totalMissing,
    duplicates: totalDuplicates,
    inconsistencies: inconsistencies.length,
    completeness,
    sourceAnalysis: includeSourceScan ? {
      usedKeys: usedKeys.length,
      unused: totalUnused,
      missingInCode: missingInCode.length,
      details: {
        usedKeys,
        unused,
        missingInCode
      }
    } : null,
    details: {
      missing,
      duplicates,
      inconsistencies
    }
  };
}

/**
 * Generate detailed report
 */
function generateDetailedReport(translations, reportType = 'all', includeSourceScan = false) {
  const missing = findMissingTranslations(translations);
  const duplicates = findDuplicateKeys(translations);
  const inconsistencies = checkConsistency(translations);

  // Source code analysis
  let usedKeys = [];
  let unused = {};
  let missingInCode = [];
  let orphaned = {};

  if (includeSourceScan || reportType === 'unused' || reportType === 'missing-in-code' || 
      reportType === 'orphaned' || reportType === 'source-analysis') {
    console.log('Scanning source files for translation usage...');
    usedKeys = scanSourceFiles();
    unused = findUnusedKeys(translations, usedKeys);
    missingInCode = findMissingKeysInCode(translations, usedKeys);
    orphaned = findOrphanedTranslations(translations);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DETAILED REPORT');
  console.log('='.repeat(60));

  if (reportType === 'all' || reportType === 'missing') {
    console.log('\nMISSING TRANSLATIONS:');
    console.log('-'.repeat(40));

    const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
    const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;
    
    languages.forEach(language => {
      let hasMissing = false;
      namespaces.forEach(namespace => {
        if (missing[language] && missing[language][namespace] && missing[language][namespace].length > 0) {
          if (!hasMissing) {
            console.log(`\n${language.toUpperCase()}:`);
            hasMissing = true;
          }
          console.log(`  ${namespace}: ${missing[language][namespace].join(', ')}`);
        }
      });
      if (!hasMissing) {
        console.log(`\n${language.toUpperCase()}: No missing translations`);
      }
    });
  }

  if (reportType === 'all' || reportType === 'duplicates') {
    console.log('\n\nDUPLICATE KEYS:');
    console.log('-'.repeat(40));

    const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
    const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

    let hasAnyDuplicates = false;
    languages.forEach(language => {
      let hasDuplicates = false;
      namespaces.forEach(namespace => {
        if (duplicates[language] && duplicates[language][namespace] && duplicates[language][namespace].length > 0) {
          if (!hasDuplicates) {
            console.log(`\n${language.toUpperCase()}:`);
            hasDuplicates = true;
            hasAnyDuplicates = true;
          }
          console.log(`  ${namespace}: ${duplicates[language][namespace].join(', ')}`);
        }
      });
    });

    if (!hasAnyDuplicates) {
      console.log('✅ None found - all translation keys are unique!');
    } else {
      // Calculate total duplicates from the results
      let totalDuplicatesCount = 0;
      Object.values(duplicates).forEach(langData => {
        Object.values(langData).forEach(namespaceData => {
          totalDuplicatesCount += namespaceData.length;
        });
      });
      console.log(`\n📊 SUMMARY: ${totalDuplicatesCount} duplicate keys found across all files`);
      console.log('💡 TIP: Remove duplicate keys to prevent translation inconsistencies');
      console.log('⚠️  WARNING: JSON parsing keeps only the last occurrence of duplicate keys');
    }
  }

  if (reportType === 'all' || reportType === 'inconsistencies') {
    console.log('\n\nTYPE INCONSISTENCIES:');
    console.log('-'.repeat(40));

    if (inconsistencies.length > 0) {
      inconsistencies.forEach(inc => {
        console.log(`${inc.key}: ${inc.types.join(' vs ')}`);
      });
    } else {
      console.log('None found');
    }
  }

  if (reportType === 'all' || reportType === 'unused' || reportType === 'source-analysis') {
    console.log('\n\nUNUSED TRANSLATIONS:');
    console.log('-'.repeat(40));

    let hasUnused = false;
    LANGUAGES.forEach(language => {
      NAMESPACES.forEach(namespace => {
        if (unused[language] && unused[language][namespace] && unused[language][namespace].length > 0) {
          if (!hasUnused) {
            hasUnused = true;
          }
          console.log(`\n${language.toUpperCase()}:`);
          console.log(`  ${namespace}: ${unused[language][namespace].join(', ')}`);
        }
      });
    });

    if (!hasUnused) {
      console.log('None found');
    }
  }

  if (reportType === 'all' || reportType === 'orphaned' || reportType === 'source-analysis') {
    console.log('\n\nORPHANED TRANSLATIONS:');
    console.log('-'.repeat(40));

    let hasOrphaned = false;
    LANGUAGES.forEach(language => {
      NAMESPACES.forEach(namespace => {
        if (orphaned[language] && orphaned[language][namespace] && orphaned[language][namespace].length > 0) {
          if (!hasOrphaned) {
            hasOrphaned = true;
          }
          console.log(`\n${language.toUpperCase()}:`);
          console.log(`  ${namespace}: ${orphaned[language][namespace].join(', ')}`);
        }
      });
    });

    if (!hasOrphaned) {
      console.log('None found');
    }
  }

  if (reportType === 'all' || reportType === 'missing-in-code' || reportType === 'source-analysis') {
    console.log('\n\nMISSING KEYS IN SOURCE CODE:');
    console.log('-'.repeat(40));

    if (missingInCode.length > 0) {
      missingInCode.forEach(keyInfo => {
        const fallbackIndicator = keyInfo.hasFallback ? ' (with fallback)' : ' (no fallback)';
        const context = keyInfo.context ? ` - ${keyInfo.context.split('/').pop()}` : '';
        console.log(`  ${keyInfo.key}${fallbackIndicator}${context}`);
      });
      console.log(`\n📊 Total missing keys: ${missingInCode.length}`);
    } else {
      console.log('None found - all used keys are properly translated!');
    }
  }
}



/**
 * Export report to JSON file
 */
function exportReport(translations, filename = 'translation-report.json') {
  const report = generateSummaryReport(translations);
  const detailedMissing = findMissingTranslations(translations);
  const detailedDuplicates = findDuplicateKeys(translations);
  const detailedInconsistencies = checkConsistency(translations);

  const exportData = {
    generatedAt: new Date().toISOString(),
    languages: process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES,
    namespaces: process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES,
    summary: report,
    details: {
      missing: detailedMissing,
      duplicates: detailedDuplicates,
      inconsistencies: detailedInconsistencies
    }
  };

  try {
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`\nReport exported to ${filename}`);
  } catch (error) {
    console.error(`Error exporting report: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'summary';

  // Check for cache clearing option
  const shouldClearCache = args.includes('--clear-cache') || args.includes('--no-cache');

  // Clear cache if requested
  if (shouldClearCache) {
    clearCache();
    console.log('🧹 Cache cleared');
  }

  // Load all translations
  console.log('Loading translation files...');
  const translations = loadAllTranslations();

  switch (command) {
    case 'summary':
      generateSummaryReport(translations);
      break;

    case 'detailed':
      generateSummaryReport(translations);
      generateDetailedReport(translations);
      break;

    case 'missing':
      generateDetailedReport(translations, 'missing');
      break;

    case 'duplicates':
      // Clear cache for duplicates check to ensure fresh data
      clearCache();
      console.log('🔄 Re-loading translation files for accurate duplicates detection...');
      const freshTranslations = loadAllTranslations();
      generateDetailedReport(freshTranslations, 'duplicates');
      break;

    case 'fix-duplicates':
      // Safely remove duplicate keys, keeping the last occurrence
      clearCache();
      fixDuplicateKeys();
      break;

    case 'inconsistencies':
      generateDetailedReport(translations, 'inconsistencies');
      break;

    case 'unused':
      generateDetailedReport(translations, 'unused');
      break;

    case 'orphaned':
      generateDetailedReport(translations, 'orphaned');
      break;

    case 'scan':
    case 'source-analysis':
      generateDetailedReport(translations, 'source-analysis');
      break;

    case 'export-missing':
      const exportLang = args[1] || 'en';
      console.log(`🔍 Analyzing translation completeness for ${exportLang}...`);

      // First, check for keys completely missing from ALL translation files
      console.log('Scanning source code for translation usage...');
      const usedKeys = scanSourceFiles();
      const completelyMissingKeys = findMissingKeysInCode(translations, usedKeys);

      // Get normally missing translations (exist in source, missing in target)
      const missingKeys = findMissingTranslations(translations);

      let hasCompletelyMissing = completelyMissingKeys.length > 0;
      let hasNormalMissing = missingKeys[exportLang] && Object.values(missingKeys[exportLang]).some(arr => arr.length > 0);

      if (!hasCompletelyMissing && !hasNormalMissing) {
        console.log(`✅ No missing translations found for ${exportLang}`);
        console.log('All translation keys are properly covered!');
        break;
      }

      const exportData = {};
      let completelyMissingCount = 0;
      let normalMissingCount = 0;

      // Handle keys completely missing from ALL translation files
      if (hasCompletelyMissing) {
        console.log('⚠️  Found keys missing from ALL translation files:');
        if (!exportData['_completely_missing']) {
          exportData['_completely_missing'] = {};
        }

        completelyMissingKeys.forEach(keyInfo => {
          const [namespace, keyName] = keyInfo.key.includes(':') ? keyInfo.key.split(':') : ['unknown', keyInfo.key];
          if (!exportData['_completely_missing'][namespace]) {
            exportData['_completely_missing'][namespace] = {};
          }
          exportData['_completely_missing'][namespace][keyName] = {
            original: null,
            context: keyInfo.context,
            needs_translation: true,
            issue: 'MISSING_FROM_ALL_FILES',
            has_fallback: keyInfo.hasFallback,
            fallback_text: keyInfo.fallbackText,
            priority: keyInfo.priority,
            solution: keyInfo.hasFallback
              ? 'Add this key to translation files for proper internationalization'
              : 'CRITICAL: Add this key to translation files - app may show raw key names'
          };
          completelyMissingCount++;
          const priorityIcon = keyInfo.priority === 'critical' ? '🔴' : '🟡';
          console.log(`   ${priorityIcon} ${keyInfo.key} (${keyInfo.hasFallback ? 'has fallback' : 'no fallback'})`);
        });
      }

      // Handle normal missing translations (exist in source, missing in target)
      if (hasNormalMissing) {
        Object.keys(missingKeys[exportLang]).forEach(namespace => {
          if (missingKeys[exportLang][namespace] && Array.isArray(missingKeys[exportLang][namespace])) {
            if (!exportData[namespace]) {
              exportData[namespace] = {};
            }

            missingKeys[exportLang][namespace].forEach(key => {
              // Find the source translation
              const sourceLang = exportLang === 'en' ? 'ar' : 'en';
              if (translations[sourceLang] && translations[sourceLang][namespace] && translations[sourceLang][namespace][key]) {
                exportData[namespace][key] = {
                  original: translations[sourceLang][namespace][key],
                  context: `${namespace}.${key}`,
                  needs_translation: true,
                  source_language: sourceLang
                };
                normalMissingCount++;
              }
            });
          }
        });
      }

      // Generate the export file
      const exportFilename = `missing-translations-${exportLang}.json`;
      fs.writeFileSync(exportFilename, JSON.stringify(exportData, null, 2));

      console.log(`\n📊 EXPORT SUMMARY:`);
      console.log(`• Completely missing keys: ${completelyMissingCount}`);
      console.log(`• Normal missing translations: ${normalMissingCount}`);
      console.log(`• Total: ${completelyMissingCount + normalMissingCount}`);
      console.log(`• Exported to: ${exportFilename}`);

      if (hasCompletelyMissing) {
        const criticalCount = completelyMissingKeys.filter(k => k.priority === 'critical').length;
        const warningCount = completelyMissingKeys.filter(k => k.priority === 'warning').length;

        console.log(`\n🔴 CRITICAL ISSUES: ${criticalCount} keys without fallbacks`);
        console.log(`🟡 WARNING ISSUES: ${warningCount} keys with fallbacks`);
        console.log('\n💡 PRIORITY ORDER:');
        console.log('1. 🔴 Critical keys (no fallback) - App may show raw key names');
        console.log('2. 🟡 Warning keys (has fallback) - App works but not internationalized');
        console.log('3. ✅ Normal missing - Source exists, just needs translation');
      }

      console.log('\nYou can now send this file to translators or use it with translation management tools.');
      break;

    case 'export':
      const filename = args[1] || 'translation-report.json';
      console.log(`Exporting report to ${filename}...`);
      exportReport(translations, filename);
      break;

    case 'validate':
      console.log('🔍 Validating translation keys against naming conventions...');
      const violations = validateTranslationKeys(translations);

      // Count total violations
      const totalViolations = Object.values(violations).reduce((sum, arr) => sum + arr.length, 0);

      if (totalViolations === 0) {
        console.log('✅ All translation keys follow the naming conventions!');
        console.log('🎉 No violations found.');
        break;
      }

      console.log(`\n⚠️  Found ${totalViolations} translation guide violations:`);
      console.log('=' .repeat(60));

      // Display violations by category
      Object.entries(violations).forEach(([category, issues]) => {
        if (issues.length > 0) {
          console.log(`\n🔧 ${category.replace(/([A-Z])/g, ' $1').toUpperCase()} (${issues.length}):`);
          console.log('-'.repeat(40));

          issues.forEach(issue => {
            console.log(`❌ ${issue.language}/${issue.namespace}: ${issue.key}`);
            console.log(`   Issue: ${issue.message}`);
            console.log(`   Suggestion: ${issue.suggestion}`);
            console.log('');
          });
        }
      });

      console.log('💡 SUMMARY:');
      console.log(`• Nested Objects: ${violations.nestedObjects.length}`);
      console.log(`• Invalid Patterns: ${violations.invalidPatterns.length}`);
      console.log(`• Inconsistent Naming: ${violations.inconsistentNaming.length}`);
      console.log(`• Special Characters: ${violations.specialChars.length}`);
      console.log(`• Case Issues: ${violations.caseIssues.length}`);
      console.log(`• Namespace Issues: ${violations.namespaceIssues.length}`);
      console.log(`\n📋 Total: ${totalViolations} violations`);

      if (totalViolations > 0) {
        console.log('\n🔧 FIXING VIOLATIONS:');
        console.log('1. Use flat keys instead of nested objects');
        console.log('2. Follow consistent naming (camelCase or kebab-case)');
        console.log('3. Use only letters, numbers, dots, underscores, hyphens');
        console.log('4. Keep keys descriptive and under 50 characters');
        console.log('5. Avoid reserved words and numeric-only keys');
        console.log('6. Use proper namespace prefixes');
      }
      break;

    case 'help':
    default:
      console.log(`
Translation Validator Tool for Caryo Marketplace

Usage: node translation-validator.js <command> [options]

Commands:
  summary              Show summary report with completeness percentages (default)
  detailed             Show detailed report with all issues
  missing              Show only missing translations
  duplicates           Show only duplicate keys
  inconsistencies      Show only type inconsistencies
  unused               Show unused translation keys (not found in source code)
  orphaned             Show orphaned translations (exist but never used)
  scan                 Perform source code analysis for translation usage
  source-analysis      Complete source code analysis (alias for scan)
  export [filename]    Export detailed report to JSON file
  export-missing [lang] Export missing translations + detect keys missing from ALL files
  validate             Validate translation keys against naming conventions
  help                 Show this help

Examples:
  node translation-validator.js summary
  node translation-validator.js detailed
  node translation-validator.js missing
  node translation-validator.js unused
  node translation-validator.js scan
  node translation-validator.js export report.json
  node translation-validator.js export-missing en  # Detects all missing scenarios
  node translation-validator.js validate           # Check naming convention compliance

Current Status:
  - Languages: ${LANGUAGES.join(', ')}
  - Namespaces: ${NAMESPACES.join(', ')}
  - Total keys loaded: ${Object.keys(translations).length > 0 ? 'Available' : 'None'}
  - Use 'npm run translation:summary' for quick overview
      `);
      break;
  }
}

// Simple caching mechanism
const cache = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function getCached(key, fn) {
  // Make cache keys environment-specific to avoid test/prod conflicts
  const envKey = `${process.env.NODE_ENV || 'production'}:${key}`;
  const cached = cache.get(envKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TIMEOUT) {
    return cached.data;
  }

  const result = fn();
  cache.set(envKey, { data: result, timestamp: Date.now() });
  return result;
}

function clearCache() {
  cache.clear();
}

// Performance monitoring
function trackPerformance(label, fn) {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PERF) {
    console.log(`⏱️  ${label}: ${duration}ms`);
  }

  return result;
}

// Run the tool
if (require.main === module) {
  const startTime = Date.now();

  try {
    main();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    const totalTime = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PERF) {
      console.log(`\n🏁 Total execution time: ${totalTime}ms`);
    }
  }
}

module.exports = {
  // Core analysis functions (ANALYSIS-ONLY - no modifications)
  loadAllTranslations,
  findMissingTranslations,
  findOrphanedTranslations,
  findDuplicateKeys,
  checkConsistency,
  calculateCompleteness,
  scanSourceFiles,
  findUnusedKeys,
  findMissingKeysInCode,
  generateSummaryReport,
  generateDetailedReport,
  loadTranslationFile,
  exportReport,
  extractTranslationKeys,
  validateTranslationKeys,
  validateKeyPattern,
  trackPerformance,
  getCached,
  clearCache,
  fixDuplicateKeys
};
