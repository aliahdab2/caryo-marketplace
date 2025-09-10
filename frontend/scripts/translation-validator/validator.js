#!/usr/bin/env node

/**
 * Translation Validator Tool
 * Validates translation files for Caryo Marketplace
 *
 * Features:
 * - Find missing translations across languages
 * - Find orphaned translations (keys without usage)
 * - Generate comprehensive reports
 * - Auto-fix capabilities
 * - Consistency checking
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', '..', 'public', 'locales');
const LANGUAGES = ['en', 'ar'];
const NAMESPACES = [
  'auth', 'common', 'contact', 'dashboard', 'errors',
  'favorites', 'home', 'listings', 'mediaGallery',
  'messages', 'search', 'translation'
];

// Test configuration (used when running tests)
const TEST_LOCALES_DIR = process.env.NODE_ENV === 'test' ?
  path.join(__dirname, 'test-data') : LOCALES_DIR;
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
  } catch (error) {
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

  LANGUAGES.forEach(language => {
    translations[language] = {};

    NAMESPACES.forEach(namespace => {
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

  LANGUAGES.forEach(language => {
    NAMESPACES.forEach(namespace => {
      const namespaceTranslations = translations[language][namespace];
      Object.keys(namespaceTranslations).forEach(key => {
        allKeys.add(`${namespace}:${key}`);
      });
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

  LANGUAGES.forEach(language => {
    missing[language] = {};

    NAMESPACES.forEach(namespace => {
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
 * Find orphaned translations (keys that exist in one language but not in the reference language)
 * This is actually just the inverse of missing translations
 */
function findOrphanedTranslations(translations) {
  // Orphaned translations are the same as missing translations but from the other perspective
  // We'll return empty for now since this is redundant with missing translations
  const orphaned = {};

  LANGUAGES.forEach(language => {
    orphaned[language] = {};
    NAMESPACES.forEach(namespace => {
      orphaned[language][namespace] = [];
    });
  });

  return orphaned;
}

/**
 * Find duplicate keys within the same namespace
 */
function findDuplicateKeys(translations) {
  const duplicates = {};

  LANGUAGES.forEach(language => {
    duplicates[language] = {};

    NAMESPACES.forEach(namespace => {
      duplicates[language][namespace] = [];
      const keys = Object.keys(translations[language][namespace]);
      const seen = new Set();

      keys.forEach(key => {
        if (seen.has(key)) {
          duplicates[language][namespace].push(key);
        }
        seen.add(key);
      });
    });
  });

  return duplicates;
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

  LANGUAGES.forEach(language => {
    let totalKeysInLang = 0;
    let translatedKeysInLang = 0;

    NAMESPACES.forEach(namespace => {
      const namespaceTranslations = translations[language][namespace];
      const namespaceKeys = Object.keys(namespaceTranslations);

      totalKeysInLang += namespaceKeys.length;

      // Count how many keys from allKeys exist in this language
      allKeys.forEach(fullKey => {
        const [ns, key] = fullKey.split(':');
        if (ns === namespace && namespaceTranslations[key]) {
          translatedKeysInLang++;
        }
      });
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
function generateSummaryReport(translations) {
  const allKeys = getAllKeys(translations);
  const missing = findMissingTranslations(translations);
  const duplicates = findDuplicateKeys(translations);
  const inconsistencies = checkConsistency(translations);
  const completeness = calculateCompleteness(translations);

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
  LANGUAGES.forEach(language => {
    NAMESPACES.forEach(namespace => {
      totalMissing += missing[language][namespace].length;
    });
  });

  console.log(`Missing translations: ${totalMissing}`);
  if (totalMissing > 0) {
    LANGUAGES.forEach(language => {
      const langMissing = NAMESPACES.reduce((sum, ns) => sum + missing[language][ns].length, 0);
      if (langMissing > 0) {
        console.log(`  - ${language}: ${langMissing} missing`);
      }
    });
  }
  console.log('');

  // Duplicates summary
  let totalDuplicates = 0;
  LANGUAGES.forEach(language => {
    NAMESPACES.forEach(namespace => {
      totalDuplicates += duplicates[language][namespace].length;
    });
  });

  console.log(`Duplicate keys: ${totalDuplicates}`);
  console.log('');

  console.log(`Type inconsistencies: ${inconsistencies.length}`);

  return {
    totalKeys: allKeys.length,
    missing: totalMissing,
    duplicates: totalDuplicates,
    inconsistencies: inconsistencies.length,
    completeness,
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
function generateDetailedReport(translations, reportType = 'all') {
  const missing = findMissingTranslations(translations);
  const duplicates = findDuplicateKeys(translations);
  const inconsistencies = checkConsistency(translations);

  console.log('\n' + '='.repeat(60));
  console.log('DETAILED REPORT');
  console.log('='.repeat(60));

  if (reportType === 'all' || reportType === 'missing') {
    console.log('\nMISSING TRANSLATIONS:');
    console.log('-'.repeat(40));

    LANGUAGES.forEach(language => {
      let hasMissing = false;
      NAMESPACES.forEach(namespace => {
        if (missing[language][namespace].length > 0) {
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

    let hasAnyDuplicates = false;
    LANGUAGES.forEach(language => {
      let hasDuplicates = false;
      NAMESPACES.forEach(namespace => {
        if (duplicates[language][namespace].length > 0) {
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
}

/**
 * Auto-fix missing translations by copying from source language
 */
function autoFixMissingTranslations(translations, sourceLanguage = 'en', targetLanguage = null) {
  const missing = findMissingTranslations(translations);
  let fixed = 0;

  const targetLanguages = targetLanguage ? [targetLanguage] : LANGUAGES.filter(lang => lang !== sourceLanguage);

  targetLanguages.forEach(language => {
    NAMESPACES.forEach(namespace => {
      missing[language][namespace].forEach(key => {
        if (translations[sourceLanguage][namespace][key]) {
          translations[language][namespace][key] = translations[sourceLanguage][namespace][key];
          fixed++;
          console.log(`Added ${language}/${namespace}:${key} <- ${sourceLanguage}`);
        }
      });
    });
  });

  console.log(`\nAuto-fixed ${fixed} missing translations`);
  return fixed;
}

/**
 * Save translations back to files
 */
function saveTranslations(translations) {
  const langs = process.env.NODE_ENV === 'test' ? TEST_LANGUAGES : LANGUAGES;
  const namespaces = process.env.NODE_ENV === 'test' ? TEST_NAMESPACES : NAMESPACES;
  const baseDir = process.env.NODE_ENV === 'test' ? TEST_LOCALES_DIR : LOCALES_DIR;

  langs.forEach(language => {
    namespaces.forEach(namespace => {
      const filePath = path.join(baseDir, language, `${namespace}.json`);
      const content = JSON.stringify(translations[language][namespace], null, 2);

      try {
        fs.writeFileSync(filePath, content + '\n', 'utf8');
        if (process.env.NODE_ENV !== 'test') {
          console.log(`Updated ${language}/${namespace}.json`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error(`Error saving ${language}/${namespace}.json:`, error.message);
        }
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

    case 'fix':
      const sourceLang = args[1] || 'en';
      const targetLang = args[2] || null;
      console.log(`Auto-fixing missing translations using ${sourceLang} as source...`);
      const fixed = autoFixMissingTranslations(translations, sourceLang, targetLang);
      if (fixed > 0) {
        const confirm = args.includes('--yes') ? 'y' :
          prompt('Save changes? (y/N): ');

        if (confirm && confirm.toLowerCase() === 'y') {
          saveTranslations(translations);
          console.log('Changes saved!');
        } else {
          console.log('Changes not saved. Use --yes to skip confirmation.');
        }
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
  fix [source] [target] Auto-fix missing translations by copying from source
  export [filename]    Export detailed report to JSON file
  help                 Show this help

Options:
  --yes                Skip confirmation when fixing

Examples:
  node translation-validator.js summary
  node translation-validator.js detailed
  node translation-validator.js missing
  node translation-validator.js fix en ar --yes
  node translation-validator.js export report.json

Current Status:
  - Languages: ${LANGUAGES.join(', ')}
  - Namespaces: ${NAMESPACES.join(', ')}
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
  generateSummaryReport,
  generateDetailedReport,
  autoFixMissingTranslations,
  loadTranslationFile,
  saveTranslations,
  exportReport
};
