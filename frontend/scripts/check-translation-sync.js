#!/usr/bin/env node

/**
 * Translation Synchronization Validator
 * Checks that English and Arabic translation files have matching keys
 */

const fs = require('fs');
const path = require('path');

class TranslationSyncValidator {
  constructor() {
    this.localesDir = path.join(process.cwd(), 'public', 'locales');
    this.englishDir = path.join(this.localesDir, 'en');
    this.arabicDir = path.join(this.localesDir, 'ar');
    this.results = {
      totalFiles: 0,
      syncedFiles: 0,
      issues: []
    };
  }

  /**
   * Get all translation files from a language directory
   */
  getTranslationFiles(langDir) {
    if (!fs.existsSync(langDir)) {
      console.log(`⚠️  Directory not found: ${langDir}`);
      return [];
    }

    return fs.readdirSync(langDir)
      .filter(file => file.endsWith('.json'))
      .sort();
  }

  /**
   * Load and parse a translation file
   */
  loadTranslationFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all keys from a translation object (including nested)
   */
  getAllKeys(obj, prefix = '') {
    const keys = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object - recurse
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        // Leaf value
        keys.push(fullKey);
      }
    }

    return keys.sort();
  }

  /**
   * Compare keys between English and Arabic files
   */
  compareFileKeys(enFile, arFile) {
    const enPath = path.join(this.englishDir, enFile);
    const arPath = path.join(this.arabicDir, arFile);

    const enTranslations = this.loadTranslationFile(enPath);
    const arTranslations = this.loadTranslationFile(arPath);

    if (!enTranslations || !arTranslations) {
      return null;
    }

    const enKeys = this.getAllKeys(enTranslations);
    const arKeys = this.getAllKeys(arTranslations);

    // Find missing keys
    const missingInArabic = enKeys.filter(key => !arKeys.includes(key));
    const missingInEnglish = arKeys.filter(key => !enKeys.includes(key));

    // Find extra keys
    const extraInArabic = arKeys.filter(key => !enKeys.includes(key));
    const extraInEnglish = enKeys.filter(key => !arKeys.includes(key));

    return {
      file: enFile,
      enKeysCount: enKeys.length,
      arKeysCount: arKeys.length,
      missingInArabic: missingInArabic.length,
      missingInEnglish: missingInEnglish.length,
      extraInArabic: extraInArabic.length,
      extraInEnglish: extraInEnglish.length,
      details: {
        missingInArabic,
        missingInEnglish,
        extraInArabic,
        extraInEnglish
      }
    };
  }

  /**
   * Validate all translation files
   */
  validateAll() {
    console.log('🔍 TRANSLATION SYNCHRONIZATION VALIDATOR');
    console.log('========================================');
    console.log('Checking that English and Arabic files have matching keys...\n');

    const enFiles = this.getTranslationFiles(this.englishDir);

    if (enFiles.length === 0) {
      console.log('❌ No English translation files found');
      return;
    }

    for (const enFile of enFiles) {
      this.results.totalFiles++;
      console.log(`📁 Checking: ${enFile}`);

      const comparison = this.compareFileKeys(enFile, enFile);

      if (!comparison) {
        console.log(`  ❌ Failed to load files\n`);
        continue;
      }

      console.log(`  EN: ${comparison.enKeysCount} keys`);
      console.log(`  AR: ${comparison.arKeysCount} keys`);

      if (comparison.missingInArabic.length === 0 &&
          comparison.missingInEnglish.length === 0) {
        console.log(`  ✅ PERFECT SYNC - Keys match exactly!\n`);
        this.results.syncedFiles++;
      } else {
        console.log(`  ⚠️  SYNC ISSUES:`);

        if (comparison.missingInArabic.length > 0) {
          console.log(`     - ${comparison.missingInArabic.length} keys missing in Arabic`);
        }
        if (comparison.missingInEnglish.length > 0) {
          console.log(`     - ${comparison.missingInEnglish.length} keys missing in English`);
        }
        if (comparison.extraInArabic.length > 0) {
          console.log(`     - ${comparison.extraInArabic.length} extra keys in Arabic`);
        }
        if (comparison.extraInEnglish.length > 0) {
          console.log(`     - ${comparison.extraInEnglish.length} extra keys in English`);
        }

        // Store issue details
        this.results.issues.push({
          file: enFile,
          ...comparison.details
        });

        console.log('');
      }
    }

    this.printSummary();
  }

  /**
   * Print final summary
   */
  printSummary() {
    console.log('📊 SYNCHRONIZATION SUMMARY');
    console.log('==========================');

    const syncedPercentage = Math.round((this.results.syncedFiles / this.results.totalFiles) * 100);

    console.log(`📁 Total files checked: ${this.results.totalFiles}`);
    console.log(`✅ Perfectly synced: ${this.results.syncedFiles} (${syncedPercentage}%)`);
    console.log(`⚠️  With issues: ${this.results.totalFiles - this.results.syncedFiles}`);

    if (this.results.issues.length > 0) {
      console.log('\n🔧 ISSUES FOUND:');
      this.results.issues.forEach(issue => {
        console.log(`  • ${issue.file}:`);
        if (issue.missingInArabic.length > 0) {
          console.log(`    - Missing in Arabic: ${issue.missingInArabic.length} keys`);
        }
        if (issue.missingInEnglish.length > 0) {
          console.log(`    - Missing in English: ${issue.missingInEnglish.length} keys`);
        }
        if (issue.extraInArabic.length > 0) {
          console.log(`    - Extra in Arabic: ${issue.extraInArabic.length} keys`);
        }
        if (issue.extraInEnglish.length > 0) {
          console.log(`    - Extra in English: ${issue.extraInEnglish.length} keys`);
        }
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (syncedPercentage < 100) {
      console.log('   • Run translation sync to identify specific missing keys');
      console.log('   • Add missing translations to maintain consistency');
      console.log('   • Consider removing extra keys or adding them to both languages');
    } else {
      console.log('   • All translation files are perfectly synchronized! 🎉');
    }
  }

  /**
   * Show detailed differences for a specific file
   */
  showFileDifferences(fileName) {
    console.log(`📋 DETAILED DIFFERENCES: ${fileName}`);
    console.log('=====================================');

    const comparison = this.compareFileKeys(fileName, fileName);

    if (!comparison) {
      console.log('❌ Could not load files');
      return;
    }

    if (comparison.details.missingInArabic.length > 0) {
      console.log('\n🔴 MISSING IN ARABIC:');
      comparison.details.missingInArabic.forEach(key => {
        console.log(`   • ${key}`);
      });
    }

    if (comparison.details.missingInEnglish.length > 0) {
      console.log('\n🔴 MISSING IN ENGLISH:');
      comparison.details.missingInEnglish.forEach(key => {
        console.log(`   • ${key}`);
      });
    }

    if (comparison.details.extraInArabic.length > 0) {
      console.log('\n🟡 EXTRA IN ARABIC (not in English):');
      comparison.details.extraInArabic.forEach(key => {
        console.log(`   • ${key}`);
      });
    }

    if (comparison.details.extraInEnglish.length > 0) {
      console.log('\n🟡 EXTRA IN ENGLISH (not in Arabic):');
      comparison.details.extraInEnglish.forEach(key => {
        console.log(`   • ${key}`);
      });
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new TranslationSyncValidator();

  // Check command line arguments
  const args = process.argv.slice(2);
  if (args.length >= 1 && args[0] === '--file') {
    // Show detailed differences for a specific file
    const fileName = args[1];
    validator.showFileDifferences(fileName);
  } else {
    // Validate all files
    validator.validateAll();
  }
}

module.exports = TranslationSyncValidator;
