/**
 * Translation Validator - Refactored Main Entry Point
 * Orchestrates all translation validation tasks using modular components
 */

const { loadAllTranslations } = require('./modules/loader');
const { findDuplicateKeys, fixDuplicateKeys } = require('./modules/duplicates');
const { findMissingTranslations, findOrphanedTranslations, exportMissingTranslations } = require('./modules/missing');
const { clearCache, trackPerformance, safeWriteFile } = require('./modules/utils');
const fs = require('fs');
const path = require('path');

// Import configuration from loader
const { LOCALES_DIR, LANGUAGES } = require('./modules/loader');

/**
 * Generate summary report
 */
function generateSummaryReport(translations) {
  return trackPerformance('Summary Report', () => {
    console.log('\n============================================================');
    console.log('TRANSLATION VALIDATION REPORT');
    console.log('============================================================');

    const missingData = findMissingTranslations(translations);
    const duplicateResults = findDuplicateKeys(translations, { verbose: false });

    console.log(`Languages: ${LANGUAGES.join(', ')}`);
    console.log(`Total unique keys: ${missingData.totalUniqueKeys}`);
    console.log(`\nTRANSLATION COMPLETENESS:`);

    LANGUAGES.forEach(lang => {
      const stats = missingData.completenessStats[lang];
      const percentage = stats.total > 0 ? ((stats.translated / stats.total) * 100).toFixed(1) : '0.0';
      console.log(`  ${lang}: ${stats.translated}/${stats.total} keys (${percentage}%)`);
    });

    const totalMissing = LANGUAGES.reduce((sum, lang) =>
      sum + missingData.completenessStats[lang].missing, 0);

    console.log(`\nMissing translations: ${totalMissing}`);
    LANGUAGES.forEach(lang => {
      const missing = missingData.completenessStats[lang].missing;
      if (missing > 0) {
        console.log(`  - ${lang}: ${missing} missing`);
      }
    });

    console.log(`\nDuplicate keys: ${duplicateResults.totalDuplicates}`);
    if (duplicateResults.totalDuplicates > 0) {
      console.log(`  - Files affected: ${duplicateResults.summary.filesWithDuplicates}`);
      console.log(`  - Languages affected: ${duplicateResults.summary.languagesAffected.join(', ')}`);
    }
  });
}

/**
 * Generate detailed report
 */
function generateDetailedReport(translations, reportType = 'all') {
  console.log('\n============================================================');
  console.log('DETAILED REPORT');
  console.log('============================================================');

  if (reportType === 'all' || reportType === 'missing') {
    const missingData = findMissingTranslations(translations);
    console.log('\nMISSING TRANSLATIONS:');
    console.log('----------------------------------------');

    LANGUAGES.forEach(language => {
      const missing = missingData.missingByLanguage[language];
      if (Object.keys(missing).length > 0) {
        console.log(`\n${language.toUpperCase()}:`);
        Object.entries(missing).forEach(([namespace, keys]) => {
          if (keys && keys.length > 0) {
            console.log(`  ${namespace}: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? ` (+${keys.length - 10} more)` : ''}`);
          }
        });
      }
    });
  }

  if (reportType === 'all' || reportType === 'orphaned') {
    const orphanedData = findOrphanedTranslations(translations);
    console.log('\n\nORPHANED TRANSLATIONS:');
    console.log('----------------------------------------');

    LANGUAGES.forEach(language => {
      const orphaned = orphanedData.orphanedByLanguage[language];
      if (Object.keys(orphaned).length > 0) {
        console.log(`\n${language.toUpperCase()}:`);
        Object.entries(orphaned).forEach(([namespace, keys]) => {
          if (keys && keys.length > 0) {
            console.log(`  ${namespace}: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? ` (+${keys.length - 10} more)` : ''}`);
          }
        });
      }
    });
  }

  if (reportType === 'all' || reportType === 'duplicates') {
    console.log('\n\nDUPLICATE KEYS:');
    console.log('----------------------------------------');
    findDuplicateKeys(translations);
  }

  if (reportType === 'all') {
    const missingData = findMissingTranslations(translations);
    const duplicateResults = findDuplicateKeys(translations, { verbose: false });

    if (duplicateResults.totalDuplicates === 0) {
      console.log('\n✅ None found - all translation keys are unique!');
    } else {
      console.log(`\n📊 SUMMARY: ${duplicateResults.totalDuplicates} duplicate keys found across ${duplicateResults.summary.filesWithDuplicates} files`);
      console.log(`🌍 Languages affected: ${duplicateResults.summary.languagesAffected.join(', ')}`);
      console.log('💡 TIP: Remove duplicate keys to prevent translation inconsistencies');
      console.log('⚠️  WARNING: JSON parsing keeps only the last occurrence of duplicate keys');
    }
  }
}

/**
 * Export detailed report to JSON file
 */
function exportReport(translations, filename = 'translation-report.json') {
  console.log(`📄 Generating detailed report: ${filename}`);

  const missingData = findMissingTranslations(translations);
  const orphanedData = findOrphanedTranslations(translations);
  const duplicateResults = findDuplicateKeys(translations, { verbose: false });

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUniqueKeys: missingData.totalUniqueKeys,
      completeness: missingData.completenessStats,
      totalMissing: LANGUAGES.reduce((sum, lang) => sum + missingData.completenessStats[lang].missing, 0),
      duplicates: duplicateResults
    },
    details: {
      missing: missingData.missingByLanguage,
      orphaned: orphanedData.orphanedByLanguage,
      duplicates: duplicateResults.duplicatesByFile
    }
  };

  safeWriteFile(path.join(process.cwd(), filename), JSON.stringify(report, null, 2));
  console.log(`✅ Report exported to ${filename}`);
}

/**
 * Export missing translations for a specific language
 */
function exportMissingTranslationsForLanguage(translations, language, filename = null) {
  const missingData = findMissingTranslations(translations);
  const exportData = exportMissingTranslations(missingData, language);

  const outputFilename = filename || `missing-translations-${language}.json`;
  safeWriteFile(path.join(process.cwd(), outputFilename), JSON.stringify(exportData, null, 2));
  console.log(`✅ Missing translations for ${language} exported to ${outputFilename}`);
}

/**
 * Main function - CLI entry point
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
      const duplicateResults = findDuplicateKeys(freshTranslations, { verbose: true });

      if (duplicateResults.totalDuplicates === 0) {
        console.log('\n✅ No duplicates found - all translation keys are unique!');
      } else {
        console.log(`\n🚨 Found ${duplicateResults.totalDuplicates} duplicate keys:`);
        console.log(`📁 Files affected: ${duplicateResults.summary.filesWithDuplicates}`);
        console.log(`🌍 Languages affected: ${duplicateResults.summary.languagesAffected.join(', ')}`);

        // Show detailed breakdown
        Object.entries(duplicateResults.duplicatesByFile).forEach(([file, analysis]) => {
          console.log(`\n📄 ${file}:`);
          analysis.duplicates.forEach(dup => {
            console.log(`   "${dup.key}": ${dup.count} occurrences (lines: ${dup.occurrences.join(', ')})`);
          });
        });
      }
      break;

    case 'fix-duplicates':
      // Safely remove duplicate keys, keeping the last occurrence
      clearCache();
      fixDuplicateKeys();
      break;

    case 'orphaned':
      generateDetailedReport(translations, 'orphaned');
      break;

    case 'export':
      exportReport(translations);
      break;

    case 'export-missing':
      const language = args[1] || 'en';
      exportMissingTranslationsForLanguage(translations, language);
      break;

    default:
      console.log('❌ Unknown command:', command);
      console.log('\nAvailable commands:');
      console.log('  summary         - Show completeness summary');
      console.log('  detailed        - Show all detailed reports');
      console.log('  missing         - Show missing translations');
      console.log('  duplicates      - Show duplicate keys');
      console.log('  fix-duplicates  - Safely remove duplicate keys');
      console.log('  orphaned        - Show orphaned translations');
      console.log('  export          - Export detailed JSON report');
      console.log('  export-missing  - Export missing translations for a language');
      process.exit(1);
  }
}

// CLI interface
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
  generateSummaryReport,
  generateDetailedReport,
  exportReport,
  exportMissingTranslationsForLanguage,
  main
};
