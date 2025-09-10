#!/usr/bin/env node

/**
 * Translation Validator Tool
 * Validates translation files for Caryo Marketplace
 *
 * Features:
 * - Find missing translations across languages
 * - Find orphaned translations (keys without usage)
 * - Scan React/TypeScript files for translation key usage
 * - Identify unused translation keys
 * - Generate comprehensive reports
 * - Auto-fix capabilities
 * - Consistency checking
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', '..', 'public', 'locales');
const SRC_DIR = path.join(__dirname, '..', '..', 'src');
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
    return JSON.parse(content);
  } catch (_error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`Warning: Could not load ${language}/${namespace}.json`);
    }
    return {};
  }
}

/**
 * Load all translation files
 */
function loadAllTranslations() {
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
  const duplicates = {};
  const languages = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;

  languages.forEach(language => {
    duplicates[language] = {};

    namespaces.forEach(namespace => {
      duplicates[language][namespace] = [];
      const namespaceTranslations = translations[language][namespace];
      if (namespaceTranslations) {
        const keys = Object.keys(namespaceTranslations);
        const seen = new Set();

        keys.forEach(key => {
          if (seen.has(key)) {
            duplicates[language][namespace].push(key);
          }
          seen.add(key);
        });
      }
    });
  });

  return duplicates;
}

/**
 * Scan React/TypeScript files for translation key usage
 */
function scanSourceFiles() {
  const usedKeys = new Set();
  const srcDir = process.env.NODE_ENV === 'test' ? TEST_SRC_DIR : SRC_DIR;

  function scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
          const keys = extractTranslationKeys(fullPath);
          keys.forEach(key => usedKeys.add(key));
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  scanDirectory(srcDir);
  return usedKeys;
}

/**
 * Extract translation keys from a single file
 */
function extractTranslationKeys(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = new Set();

    // Pattern 1: t('key') or t('namespace:key')
    const pattern1 = /t\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = pattern1.exec(content)) !== null) {
      keys.add(match[1]);
    }

    // Pattern 2: t('key', 'fallback') or t('namespace:key', 'fallback')
    const pattern2 = /t\(['"]([^'"]+)['"]\s*,\s*['"][^'"]*['"]/g;
    while ((match = pattern2.exec(content)) !== null) {
      keys.add(match[1]);
    }

    // Pattern 3: t(variable) - these are dynamic and can't be statically analyzed
    // We'll skip these for now as they require runtime analysis

    return Array.from(keys);
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

  // Find keys that are used but not available
  usedKeys.forEach(usedKey => {
    if (!allAvailableKeys.has(usedKey)) {
      missing.push(usedKey);
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
 * Clean up translations by removing unused or orphaned keys
 */
function cleanupTranslations(translations, cleanupType = 'unused') {
  let cleaned = 0;
  
  if (cleanupType === 'unused') {
    console.log('Scanning source files for unused keys...');
    const usedKeys = scanSourceFiles();
    const unused = findUnusedKeys(translations, usedKeys);
    
    LANGUAGES.forEach(language => {
      NAMESPACES.forEach(namespace => {
        if (unused[language] && unused[language][namespace]) {
          unused[language][namespace].forEach(key => {
            if (translations[language][namespace] && translations[language][namespace][key]) {
              delete translations[language][namespace][key];
              cleaned++;
              console.log(`Removed unused key: ${language}/${namespace}:${key}`);
            }
          });
        }
      });
    });
  } else if (cleanupType === 'orphaned') {
    const orphaned = findOrphanedTranslations(translations);
    
    LANGUAGES.forEach(language => {
      NAMESPACES.forEach(namespace => {
        if (orphaned[language] && orphaned[language][namespace]) {
          orphaned[language][namespace].forEach(key => {
            if (translations[language][namespace] && translations[language][namespace][key]) {
              delete translations[language][namespace][key];
              cleaned++;
              console.log(`Removed orphaned key: ${language}/${namespace}:${key}`);
            }
          });
        }
      });
    });
  }
  
  return cleaned;
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
      console.log('None found');
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
      missingInCode.forEach(key => {
        console.log(`  ${key}`);
      });
    } else {
      console.log('None found');
    }
  }
}

/**
 * Auto-fix missing translations by copying from source language
 */
function autoFixMissingTranslations(translations, sourceLanguage = 'ar', targetLanguage = null) {
  const missing = findMissingTranslations(translations);
  let fixed = 0;

  const targetLanguages = targetLanguage ? [targetLanguage] : LANGUAGES.filter(lang => lang !== sourceLanguage);

  targetLanguages.forEach(language => {
    if (missing[language]) {
      Object.keys(missing[language]).forEach(namespace => {
        if (missing[language][namespace] && Array.isArray(missing[language][namespace])) {
          missing[language][namespace].forEach(key => {
            if (translations[sourceLanguage] && translations[sourceLanguage][namespace] && translations[sourceLanguage][namespace][key]) {
              const sourceValue = translations[sourceLanguage][namespace][key];
              translations[language][namespace][key] = sourceValue;
              fixed++;
              console.log(`Added ${language}/${namespace}:${key} <- ${sourceLanguage} (value: "${sourceValue}")`);

              // Debug: Check if the key was actually added
              if (translations[language][namespace][key] === sourceValue) {
                console.log(`✓ Verified: ${language}/${namespace}:${key} = "${sourceValue}"`);
              } else {
                console.log(`✗ Failed to set: ${language}/${namespace}:${key}`);
              }
            } else {
              console.log(`✗ Source missing: ${sourceLanguage}/${namespace}:${key}`);
            }
          });
        }
      });
    }
  });

  console.log(`\nAuto-fixed ${fixed} missing translations`);
  return fixed;
}

/**
 * Save translations back to files
 */
function saveTranslations(translations) {
  console.log('=== SAVE_TRANSLATIONS FUNCTION CALLED ===');
  const langs = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;
  const baseDir = process.env.NODE_ENV === 'test' ? TEST_LOCALES_DIR : LOCALES_DIR;

  console.log(`Saving translations to base directory: ${baseDir}`);
  console.log(`Languages: ${langs.join(', ')}`);
  console.log(`Namespaces: ${namespaces.join(', ')}`);

  langs.forEach(language => {
    namespaces.forEach(namespace => {
      const filePath = path.join(baseDir, language, `${namespace}.json`);
      const content = JSON.stringify(translations[language][namespace], null, 2);

      console.log(`Attempting to save: ${filePath}`);
      console.log(`Keys in ${language}/${namespace}:`, Object.keys(translations[language][namespace]).length);

      // Check if adaptiveCruise is in the content
      if (content.includes('adaptiveCruise')) {
        console.log(`✓ adaptiveCruise found in ${language}/${namespace} content`);
      } else {
        console.log(`✗ adaptiveCruise NOT found in ${language}/${namespace} content`);
      }

      try {
        fs.writeFileSync(filePath, content + '\n', 'utf8');
        console.log(`✓ Updated ${language}/${namespace}.json`);
      } catch (error) {
        console.error(`✗ Error saving ${language}/${namespace}.json:`, error.message);
        console.error(`File path: ${filePath}`);
      }
    });
  });
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
      generateDetailedReport(translations, 'duplicates');
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

    case 'cleanup':
      const cleanupType = args[1] || 'unused'; // 'unused' or 'orphaned'
      console.log(`Cleaning up ${cleanupType} translations...`);
      const cleaned = cleanupTranslations(translations, cleanupType);
      if (cleaned > 0) {
        if (args.includes('--yes')) {
          saveTranslations(translations);
          console.log(`Cleaned up ${cleaned} ${cleanupType} translations and saved changes!`);
        } else {
          console.log(`Found ${cleaned} ${cleanupType} translations to clean up. Use --yes to save changes.`);
        }
      } else {
        console.log(`No ${cleanupType} translations found to clean up.`);
      }
      break;

    case 'fix':
      const sourceLang = args[1] || 'ar'; // Default to Arabic as source (more complete)
      const targetLang = args[2] || 'en'; // Default to English as target (less complete)
      console.log(`Auto-fixing missing translations using ${sourceLang} as source...`);
      console.log(`Args received: [${args.join(', ')}]`);
      console.log(`Has --yes flag: ${args.includes('--yes')}`);
      const fixed = autoFixMissingTranslations(translations, sourceLang, targetLang);
      console.log(`Fixed count: ${fixed}`);
      if (fixed > 0) {
        console.log('Checking --yes flag for saving...');
        if (args.includes('--yes')) {
          console.log('Calling saveTranslations...');
          saveTranslations(translations);
          console.log('Changes saved!');
        } else {
          console.log(`Auto-fixed ${fixed} missing translations. Use --yes to save changes.`);
        }
      } else {
        console.log('No missing translations found to fix.');
      }
      break;

    case 'export':
      const filename = args[1] || 'translation-report.json';
      console.log(`Exporting report to ${filename}...`);
      exportReport(translations, filename);
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
  fix [source] [target] Auto-fix missing translations by copying from source
  cleanup [type]       Remove unused or orphaned translations (type: unused|orphaned)
  export [filename]    Export detailed report to JSON file
  help                 Show this help

Options:
  --yes                Skip confirmation when fixing

Examples:
  node translation-validator.js summary
  node translation-validator.js detailed
  node translation-validator.js missing
  node translation-validator.js unused
  node translation-validator.js scan
  node translation-validator.js cleanup unused --yes
  node translation-validator.js fix en ar --yes
  node translation-validator.js export report.json

Current Status:
  - Languages: ${LANGUAGES.join(', ')}
  - Namespaces: ${NAMESPACES.join(', ')}
  - Total keys loaded: ${Object.keys(translations).length > 0 ? 'Available' : 'None'}
  - Use 'npm run translation:summary' for quick overview
      `);
      break;
  }
}

// Run the tool
if (require.main === module) {
  main();
}

module.exports = {
  loadAllTranslations,
  findMissingTranslations,
  findOrphanedTranslations,
  findDuplicateKeys,
  checkConsistency,
  calculateCompleteness,
  scanSourceFiles,
  findUnusedKeys,
  findMissingKeysInCode,
  cleanupTranslations,
  generateSummaryReport,
  generateDetailedReport,
  autoFixMissingTranslations,
  loadTranslationFile,
  saveTranslations,
  exportReport
};
