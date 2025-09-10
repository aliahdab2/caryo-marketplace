#!/usr/bin/env node

/**
 * Translation Integrity Checker
 * Validates that:
 * 1. Same keys exist in both EN and AR files
 * 2. English translations are actually in English
 * 3. Arabic translations are actually in Arabic
 * 4. No cross-contamination between languages
 */

const fs = require('fs');
const path = require('path');

class TranslationIntegrityChecker {
  constructor() {
    this.localesDir = path.resolve(__dirname, '..', '..', '..', 'public', 'locales');
    this.languages = ['en', 'ar'];
    this.namespaces = [];
    this.results = {
      totalFiles: 0,
      consistentFiles: 0,
      missingKeys: [],
      extraKeys: [],
      languageIssues: [],
      duplicates: [],
      summary: {}
    };
  }

  /**
   * Get all translation files for a language
   */
  getTranslationFiles(lang) {
    const langDir = path.join(this.localesDir, lang);
    if (!fs.existsSync(langDir)) {
      console.log(`❌ Language directory not found: ${langDir}`);
      return [];
    }

    return fs.readdirSync(langDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort();
  }

  /**
   * Load translation file
   */
  loadTranslationFile(lang, namespace) {
    const filePath = path.join(this.localesDir, lang, `${namespace}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.log(`❌ Error loading ${lang}/${namespace}.json: ${error.message}`);
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

      if (typeof value === 'string') {
        keys.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        keys.push(...this.getAllKeys(value, fullKey));
      }
    }

    return keys.sort();
  }

  /**
   * Check if text contains Arabic characters
   */
  containsArabic(text) {
    if (!text || typeof text !== 'string') return false;
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  }

  /**
   * Check if text contains only English characters
   */
  isEnglishOnly(text) {
    if (!text || typeof text !== 'string') return true;
    // Allow English letters, numbers, spaces, punctuation
    const englishOnlyRegex = /^[a-zA-Z0-9\s\.,!?\-\(\)\[\]{}:;"'\/\\|@#$%^&*+=_~`<>\u00A0-\u00FF]*$/;
    return englishOnlyRegex.test(text) && !this.containsArabic(text);
  }

  /**
   * Validate language consistency in a translation object
   */
  validateLanguage(obj, expectedLang, namespace, prefix = '') {
    const issues = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        if (expectedLang === 'en' && !this.isEnglishOnly(value)) {
          issues.push({
            key: fullKey,
            issue: 'Non-English text in English file',
            value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
            expectedLang: 'en'
          });
        } else if (expectedLang === 'ar' && !this.containsArabic(value) && value.trim() !== '') {
          issues.push({
            key: fullKey,
            issue: 'Non-Arabic text in Arabic file',
            value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
            expectedLang: 'ar'
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        issues.push(...this.validateLanguage(value, expectedLang, namespace, fullKey));
      }
    }

    return issues;
  }

  /**
   * Find duplicate values within a translation object
   */
  findDuplicateValues(obj, lang, namespace) {
    const valueMap = new Map();
    const duplicates = [];

    const checkValue = (value, keyPath) => {
      if (typeof value === 'string' && value.trim() !== '') {
        if (valueMap.has(value)) {
          const existingKey = valueMap.get(value);
          duplicates.push({
            value,
            keys: [existingKey, keyPath],
            namespace,
            language: lang
          });
        } else {
          valueMap.set(value, keyPath);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          checkValue(nestedValue, keyPath ? `${keyPath}.${nestedKey}` : nestedKey);
        }
      }
    };

    for (const [key, value] of Object.entries(obj)) {
      checkValue(value, key);
    }

    return duplicates;
  }

  /**
   * Compare keys between two translation objects
   */
  compareTranslations(enTranslations, arTranslations, namespace) {
    const enKeys = this.getAllKeys(enTranslations);
    const arKeys = this.getAllKeys(arTranslations);

    const missingInArabic = enKeys.filter(key => !arKeys.includes(key));
    const missingInEnglish = arKeys.filter(key => !enKeys.includes(key));
    const extraInArabic = arKeys.filter(key => !enKeys.includes(key));
    const extraInEnglish = enKeys.filter(key => !arKeys.includes(key));

    // Check for duplicate values within each language
    const enDuplicates = this.findDuplicateValues(enTranslations, 'en', namespace);
    const arDuplicates = this.findDuplicateValues(arTranslations, 'ar', namespace);

    return {
      namespace,
      enKeysCount: enKeys.length,
      arKeysCount: arKeys.length,
      missingInArabic,
      missingInEnglish,
      extraInArabic,
      extraInEnglish,
      enDuplicates,
      arDuplicates,
      isConsistent: missingInArabic.length === 0 && missingInEnglish.length === 0
    };
  }

  /**
   * Run comprehensive integrity check
   */
  async runIntegrityCheck() {
    console.log('🔍 TRANSLATION INTEGRITY CHECKER');
    console.log('=================================');
    console.log('Checking key consistency and language validity...\n');

    // Get all namespaces from English files
    const enNamespaces = this.getTranslationFiles('en');
    this.namespaces = enNamespaces;

    if (enNamespaces.length === 0) {
      console.log('❌ No English translation files found');
      return;
    }

    console.log(`📁 Found ${enNamespaces.length} namespaces: ${enNamespaces.join(', ')}\n`);

    for (const namespace of enNamespaces) {
      this.results.totalFiles++;
      console.log(`🔍 Checking: ${namespace}`);

      const enTranslations = this.loadTranslationFile('en', namespace);
      const arTranslations = this.loadTranslationFile('ar', namespace);

      if (!enTranslations || !arTranslations) {
        console.log(`  ❌ Failed to load translation files for ${namespace}\n`);
        continue;
      }

      // Check key consistency
      const comparison = this.compareTranslations(enTranslations, arTranslations, namespace);

      if (comparison.isConsistent) {
        console.log(`  ✅ Key consistency: ${comparison.enKeysCount} keys match`);
        this.results.consistentFiles++;
      } else {
        console.log(`  ⚠️  Key inconsistency:`);
        console.log(`     EN: ${comparison.enKeysCount} keys`);
        console.log(`     AR: ${comparison.arKeysCount} keys`);

        if (comparison.missingInArabic.length > 0) {
          console.log(`     ❌ ${comparison.missingInArabic.length} keys missing in Arabic`);
          this.results.missingKeys.push({
            namespace,
            language: 'ar',
            keys: comparison.missingInArabic
          });
        }

        if (comparison.missingInEnglish.length > 0) {
          console.log(`     ❌ ${comparison.missingInEnglish.length} keys missing in English`);
          this.results.missingKeys.push({
            namespace,
            language: 'en',
            keys: comparison.missingInEnglish
          });
        }
      }

      // Check for duplicates
      if (comparison.enDuplicates.length > 0 || comparison.arDuplicates.length > 0) {
        console.log(`  🚨 Duplicate values found:`);
        if (comparison.enDuplicates.length > 0) {
          console.log(`     📝 ${comparison.enDuplicates.length} duplicates in English`);
        }
        if (comparison.arDuplicates.length > 0) {
          console.log(`     📝 ${comparison.arDuplicates.length} duplicates in Arabic`);
        }
        this.results.duplicates.push(...comparison.enDuplicates, ...comparison.arDuplicates);
      }

      // Check language validity
      const enLanguageIssues = this.validateLanguage(enTranslations, 'en', namespace);
      const arLanguageIssues = this.validateLanguage(arTranslations, 'ar', namespace);

      if (enLanguageIssues.length > 0) {
        console.log(`  🚨 ${enLanguageIssues.length} English language issues`);
        this.results.languageIssues.push(...enLanguageIssues);
      }

      if (arLanguageIssues.length > 0) {
        console.log(`  🚨 ${arLanguageIssues.length} Arabic language issues`);
        this.results.languageIssues.push(...arLanguageIssues);
      }

      if (enLanguageIssues.length === 0 && arLanguageIssues.length === 0) {
        console.log(`  ✅ Language validation: All translations are in correct languages`);
      }

      console.log('');
    }

    this.printSummary();
  }

  /**
   * Print comprehensive summary
   */
  printSummary() {
    console.log('📊 INTEGRITY CHECK SUMMARY');
    console.log('==========================');

    const consistencyPercentage = Math.round((this.results.consistentFiles / this.results.totalFiles) * 100);

    console.log(`📁 Total namespaces checked: ${this.results.totalFiles}`);
    console.log(`✅ Consistent namespaces: ${this.results.consistentFiles} (${consistencyPercentage}%)`);
    console.log(`⚠️  Inconsistent namespaces: ${this.results.totalFiles - this.results.consistentFiles}`);
    console.log(`🚨 Language issues: ${this.results.languageIssues.length}`);
    console.log(`📝 Duplicate values: ${this.results.duplicates.length}`);

    if (this.results.missingKeys.length > 0) {
      console.log('\n🔴 MISSING KEYS:');
      this.results.missingKeys.forEach(missing => {
        console.log(`  • ${missing.namespace} (${missing.language}): ${missing.keys.length} missing keys`);
        missing.keys.slice(0, 5).forEach(key => {
          console.log(`    - ${key}`);
        });
        if (missing.keys.length > 5) {
          console.log(`    ... and ${missing.keys.length - 5} more`);
        }
      });
    }

    if (this.results.languageIssues.length > 0) {
      console.log('\n🚨 LANGUAGE ISSUES:');
      this.results.languageIssues.forEach(issue => {
        console.log(`  • ${issue.expectedLang}/${issue.key}: ${issue.issue}`);
        console.log(`    "${issue.value}"`);
      });
    }

    if (this.results.duplicates.length > 0) {
      console.log('\n📝 DUPLICATE VALUES:');
      this.results.duplicates.forEach(duplicate => {
        console.log(`  • ${duplicate.namespace} (${duplicate.language}): "${duplicate.value}"`);
        console.log(`    Keys: ${duplicate.keys.join(', ')}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (this.results.missingKeys.length > 0) {
      console.log('   • Add missing translation keys to maintain consistency');
      console.log('   • Use translation sync tools to identify specific missing keys');
    }

    if (this.results.languageIssues.length > 0) {
      console.log('   • Review language issues - ensure EN files contain English text only');
      console.log('   • Ensure AR files contain Arabic text only');
      console.log('   • Check for accidental copy-paste between languages');
    }

    if (this.results.duplicates.length > 0) {
      console.log('   • Review duplicate values - consider consolidating identical translations');
      console.log('   • Duplicates may indicate copy-paste errors or missing context');
    }

    if (consistencyPercentage === 100 && this.results.languageIssues.length === 0 && this.results.duplicates.length === 0) {
      console.log('   • 🎉 All translation files are perfectly consistent and properly localized!');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new TranslationIntegrityChecker();
  checker.runIntegrityCheck().catch(console.error);
}

module.exports = TranslationIntegrityChecker;
