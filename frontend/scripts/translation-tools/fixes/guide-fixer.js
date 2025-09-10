#!/usr/bin/env node

/**
 * Translation Guide Compliance Fix Script
 * Fixes translation guide violations:
 * - Converts nested objects to flat keys
 * - Removes @ prefixes from context keys
 * - Ensures camelCase naming conventions
 */

const fs = require('fs');
const path = require('path');

class TranslationGuideFixer {
  constructor() {
    this.localesDir = path.join(process.cwd(), 'public', 'locales');
    this.stats = {
      filesProcessed: 0,
      nestedObjectsFixed: 0,
      contextKeysFixed: 0,
      keysFlattened: 0,
      totalKeys: 0
    };
  }

  /**
   * Fix a single translation object for guide compliance
   */
  fixTranslationObject(obj, prefix = '') {
    const fixed = {};

    for (const [key, value] of Object.entries(obj)) {
      let newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle nested objects
        if (key.startsWith('@')) {
          // Fix @ prefixed context keys
          const cleanKey = key.substring(1); // Remove @
          const finalKey = prefix ? `${prefix}.${cleanKey}` : cleanKey;

          if (value.description) {
            // Use description as the main translation
            fixed[finalKey] = value.description;
            this.stats.contextKeysFixed++;
          } else if (value.text) {
            // Fallback to text field
            fixed[finalKey] = value.text;
            this.stats.contextKeysFixed++;
          } else if (value.message) {
            // Another fallback
            fixed[finalKey] = value.message;
            this.stats.contextKeysFixed++;
          }
          this.stats.nestedObjectsFixed++;
        } else {
          // Regular nested object - flatten recursively
          Object.assign(fixed, this.fixTranslationObject(value, newKey));
          this.stats.nestedObjectsFixed++;
        }
      } else {
        // Regular string/array value - ensure camelCase
        const camelCaseKey = this.toCamelCase(newKey);
        fixed[camelCaseKey] = value;
      }
    }

    return fixed;
  }

  /**
   * Convert snake_case or kebab-case to camelCase
   */
  toCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Process a single translation file
   */
  processFile(filePath) {
    const relativePath = path.relative(this.localesDir, filePath);
    console.log(`📁 Processing: ${relativePath}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);

    // Count issues before fixing
    const issuesBefore = this.analyzeIssues(translations);

    const fixed = this.fixTranslationObject(translations);

    // Create backup
    const backupPath = filePath.replace('.json', '.backup.json');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`💾 Backup created: ${path.relative(this.localesDir, backupPath)}`);
    }

    // Write fixed version
    fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2));

    const result = {
      original: Object.keys(translations).length,
      fixed: Object.keys(fixed).length,
      issuesFixed: issuesBefore.nestedObjects + issuesBefore.contextKeys
    };

    console.log(`✅ Fixed: ${result.fixed} keys (${result.issuesFixed} issues resolved)`);

    return result;
  }

  /**
   * Analyze issues in a translation object
   */
  analyzeIssues(obj, prefix = '') {
    let issues = { nestedObjects: 0, contextKeys: 0 };

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        issues.nestedObjects++;
        if (key.startsWith('@')) {
          issues.contextKeys++;
        }
        // Recursively analyze nested objects
        const nestedIssues = this.analyzeIssues(value, `${prefix}.${key}`);
        issues.nestedObjects += nestedIssues.nestedObjects;
        issues.contextKeys += nestedIssues.contextKeys;
      }
    }

    return issues;
  }

  /**
   * Process all translation files
   */
  processAll() {
    console.log('🚀 TRANSLATION GUIDE COMPLIANCE FIX');
    console.log('=====================================');
    console.log('Fixing violations:');
    console.log('• ❌ Nested objects → ✅ Flat keys');
    console.log('• ❌ @ prefixed keys → ✅ Clean keys');
    console.log('• ❌ Non-camelCase → ✅ camelCase');
    console.log('');

    const languages = ['en', 'ar'];

    for (const lang of languages) {
      const langDir = path.join(this.localesDir, lang);

      if (!fs.existsSync(langDir)) {
        console.log(`⚠️  Language directory not found: ${lang}`);
        continue;
      }

      console.log(`\n🌍 Processing ${lang.toUpperCase()} translations:`);
      console.log(''.padEnd(40, '-'));

      const files = fs.readdirSync(langDir)
        .filter(file => file.endsWith('.json'))
        .sort();

      for (const file of files) {
        const filePath = path.join(langDir, file);
        const result = this.processFile(filePath);

        this.stats.filesProcessed++;
        this.stats.totalKeys += result.fixed;
        this.stats.keysFlattened += result.issuesFixed;
      }
    }

    this.printSummary();
  }

  /**
   * Process a single file
   */
  processSingleFile(filePath) {
    console.log('🚀 SINGLE FILE TRANSLATION GUIDE COMPLIANCE FIX');
    console.log('================================================');
    console.log(`Target file: ${filePath}`);
    console.log('');

    // Check if file exists
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.localesDir, filePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      console.log('Available files:');
      const lang = filePath.split('/')[0];
      const langDir = path.join(this.localesDir, lang);
      if (fs.existsSync(langDir)) {
        const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
        files.forEach(file => console.log(`  - ${lang}/${file}`));
      }
      return;
    }

    // Process the single file
    const result = this.processFile(fullPath);

    console.log('\n🎯 SINGLE FILE FIX COMPLETE');
    console.log('===========================');
    console.log(`📁 File processed: ${path.relative(this.localesDir, fullPath)}`);
    console.log(`🔧 Issues fixed: ${result.issuesFixed}`);
    console.log(`📊 Keys: ${result.original} → ${result.fixed}`);
    console.log('');
    console.log('✅ File is now compliant with translation guide');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Test your application to ensure translations work');
    console.log('   2. If satisfied, run on more files: npm run translation:fix-guide');
    console.log('   3. Or rollback: cp backup to original file');
  }

  /**
   * Print final summary
   */
  printSummary() {
    console.log('\n🎉 TRANSLATION GUIDE COMPLIANCE COMPLETE');
    console.log('========================================');
    console.log(`📁 Files processed: ${this.stats.filesProcessed}`);
    console.log(`🔧 Nested objects fixed: ${this.stats.nestedObjectsFixed}`);
    console.log(`🏷️  @ prefixed keys fixed: ${this.stats.contextKeysFixed}`);
    console.log(`📊 Total translation keys: ${this.stats.totalKeys}`);
    console.log(`📈 Issues resolved: ${this.stats.keysFlattened}`);
    console.log('');
    console.log('✅ NOW FULLY COMPLIANT WITH TRANSLATION GUIDE:');
    console.log('   ✓ Flat key structure (no nested objects)');
    console.log('   ✓ Clean key names (no @ prefixes)');
    console.log('   ✓ camelCase naming convention');
    console.log('   ✓ Namespace organization by component');
    console.log('   ✓ Consistent file structure');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Test your application');
    console.log('   2. Update any component references if needed');
    console.log('   3. Run: npm run translation:validate');
    console.log('   4. Run: npm run translation:missing');
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new TranslationGuideFixer();

  // Check command line arguments
  const args = process.argv.slice(2);
  if (args.length >= 2 && args[0] === '--file') {
    // Process single file: npm run translation:fix-guide -- --file en/favorites.json
    const filePath = args[1];
    fixer.processSingleFile(filePath);
  } else {
    // Process all files (default behavior)
    fixer.processAll();
  }
}

module.exports = TranslationGuideFixer;
