/**
 * Translation Consistency Module
 * Validates consistency across translations
 */

const fs = require('fs');
const path = require('path');
const { LOCALES_DIR, LANGUAGES, NAMESPACES } = require('./loader');

/**
 * Validate translation key consistency across languages
 */
function validateKeyConsistency(translations) {
  console.log('🔍 Validating translation key consistency...');

  const results = {
    totalKeys: 0,
    consistentKeys: 0,
    inconsistentKeys: 0,
    issues: [],
    keyCoverage: {}
  };

  // Collect all keys from all languages
  const allKeys = new Set();
  LANGUAGES.forEach(lang => {
    NAMESPACES.forEach(ns => {
      const keys = Object.keys(translations[lang][ns] || {});
      keys.forEach(key => allKeys.add(`${ns}:${key}`));
    });
  });

  results.totalKeys = allKeys.size;

  // Check consistency for each key
  allKeys.forEach(fullKey => {
    const [namespace, key] = fullKey.split(':');
    const keyPresence = {};

    LANGUAGES.forEach(lang => {
      const translation = translations[lang][namespace]?.[key];
      keyPresence[lang] = {
        exists: translation !== undefined,
        value: translation,
        length: translation ? String(translation).length : 0
      };
    });

    const existingCount = Object.values(keyPresence).filter(p => p.exists).length;
    const totalLanguages = LANGUAGES.length;

    if (existingCount === totalLanguages) {
      results.consistentKeys++;
    } else if (existingCount > 0) {
      results.inconsistentKeys++;

      // Check for value consistency
      const values = Object.values(keyPresence)
        .filter(p => p.exists)
        .map(p => p.value);

      const uniqueValues = [...new Set(values)];
      const hasDifferentValues = uniqueValues.length > 1;

      results.issues.push({
        key: fullKey,
        type: 'missing_translations',
        missingIn: LANGUAGES.filter(lang => !keyPresence[lang].exists),
        coverage: `${existingCount}/${totalLanguages}`,
        hasDifferentValues,
        values: hasDifferentValues ? uniqueValues : null
      });
    } else {
      // This shouldn't happen as we only process keys that exist somewhere
      results.issues.push({
        key: fullKey,
        type: 'orphaned_key',
        message: 'Key exists in collection but not in any language'
      });
    }
  });

  return results;
}

/**
 * Validate translation value patterns
 */
function validateValuePatterns(translations) {
  console.log('🔍 Validating translation value patterns...');

  const patterns = {
    placeholders: /\{\{.*?\}\}|\$\{.*?\}/g,
    htmlTags: /<[^>]*>/g,
    specialChars: /[&<>"']/g,
    longValues: /^.{200,}$/ // Values longer than 200 chars
  };

  const results = {
    patterns: {},
    issues: []
  };

  // Initialize pattern results
  Object.keys(patterns).forEach(pattern => {
    results.patterns[pattern] = { count: 0, files: [] };
  });

  LANGUAGES.forEach(language => {
    NAMESPACES.forEach(namespace => {
      const nsTranslations = translations[language][namespace] || {};
      const fileKey = `${language}/${namespace}.json`;

      Object.entries(nsTranslations).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Check each pattern
          Object.entries(patterns).forEach(([patternName, regex]) => {
            if (regex.test(value)) {
              results.patterns[patternName].count++;
              if (!results.patterns[patternName].files.includes(fileKey)) {
                results.patterns[patternName].files.push(fileKey);
              }

              // Add specific issues for certain patterns
              if (patternName === 'placeholders') {
                const placeholders = value.match(regex) || [];
                results.issues.push({
                  type: 'placeholder_usage',
                  key: `${namespace}:${key}`,
                  file: fileKey,
                  placeholders: placeholders,
                  value: value
                });
              }

              if (patternName === 'longValues') {
                results.issues.push({
                  type: 'long_translation',
                  key: `${namespace}:${key}`,
                  file: fileKey,
                  length: value.length,
                  value: value.substring(0, 100) + '...'
                });
              }
            }
          });
        }
      });
    });
  });

  return results;
}

/**
 * Generate consistency report
 */
function generateConsistencyReport(translations) {
  const keyConsistency = validateKeyConsistency(translations);
  const valuePatterns = validateValuePatterns(translations);

  console.log('\n📊 TRANSLATION CONSISTENCY REPORT');
  console.log('===================================');

  console.log(`\n🔑 Key Consistency:`);
  console.log(`   Total keys: ${keyConsistency.totalKeys}`);
  console.log(`   Consistent: ${keyConsistency.consistentKeys}`);
  console.log(`   Inconsistent: ${keyConsistency.inconsistentKeys}`);
  console.log(`   Coverage: ${((keyConsistency.consistentKeys / keyConsistency.totalKeys) * 100).toFixed(1)}%`);

  if (keyConsistency.issues.length > 0) {
    console.log(`\n⚠️  Consistency Issues:`);
    keyConsistency.issues.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.key}: missing in ${issue.missingIn.join(', ')}`);
    });
    if (keyConsistency.issues.length > 10) {
      console.log(`   ... and ${keyConsistency.issues.length - 10} more issues`);
    }
  }

  console.log(`\n🔍 Value Patterns:`);
  Object.entries(valuePatterns.patterns).forEach(([pattern, data]) => {
    if (data.count > 0) {
      console.log(`   ${pattern}: ${data.count} occurrences in ${data.files.length} files`);
    }
  });

  if (valuePatterns.issues.length > 0) {
    console.log(`\n💡 Pattern Issues:`);
    const placeholderIssues = valuePatterns.issues.filter(i => i.type === 'placeholder_usage');
    const longValueIssues = valuePatterns.issues.filter(i => i.type === 'long_translation');

    if (placeholderIssues.length > 0) {
      console.log(`   Placeholders: ${placeholderIssues.length} keys use placeholders`);
    }
    if (longValueIssues.length > 0) {
      console.log(`   Long values: ${longValueIssues.length} translations > 200 chars`);
    }
  }

  return {
    keyConsistency,
    valuePatterns,
    summary: {
      overallHealth: keyConsistency.consistentKeys / keyConsistency.totalKeys,
      issuesCount: keyConsistency.issues.length + valuePatterns.issues.length
    }
  };
}

module.exports = {
  validateKeyConsistency,
  validateValuePatterns,
  generateConsistencyReport
};
