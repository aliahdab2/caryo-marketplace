#!/usr/bin/env node

/**
 * 🛡️ Safe Orphaned Translation Verification Script
 *
 * This script helps verify that the orphaned translation detection is working correctly
 * before you use the actual orphaned removal tool.
 *
 * USAGE: node scripts/translation-tools/verify-orphaned.js
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ ORPHANED TRANSLATION VERIFICATION');
console.log('=====================================');
console.log('');

// Test cases to verify
const testCases = [
  {
    key: 'showing',
    namespace: 'common',
    description: 'Commonly used pagination key',
    expected: 'NOT_ORPHANED'
  },
  {
    key: 'alreadyHaveAccount',
    namespace: 'auth',
    description: 'Auth-related key that might be orphaned',
    expected: 'CHECK_MANUALLY'
  },
  {
    key: 'appName',
    namespace: 'common',
    description: 'App name key that might be orphaned',
    expected: 'CHECK_MANUALLY'
  },
  {
    key: 'sellerTypeCountsError',
    namespace: 'errors',
    description: 'Error key that should be missing (not orphaned)',
    expected: 'MISSING'
  }
];

console.log('🔍 TESTING INDIVIDUAL KEYS:');
console.log('-'.repeat(50));

testCases.forEach(testCase => {
  const { key, namespace, description, expected } = testCase;

  // Check if key exists in translation files
  let existsInEn = false;
  let existsInAr = false;

  try {
    const enTranslations = JSON.parse(fs.readFileSync(`./public/locales/en/${namespace}.json`, 'utf8'));
    existsInEn = enTranslations[key] !== undefined;
  } catch (e) {
    // File doesn't exist or key not found
  }

  try {
    const arTranslations = JSON.parse(fs.readFileSync(`./public/locales/ar/${namespace}.json`, 'utf8'));
    existsInAr = arTranslations[key] !== undefined;
  } catch (e) {
    // File doesn't exist or key not found
  }

  // Check if key is used in source code (simplified check)
  const usedInCode = searchKeyInSource(`${namespace}:${key}`) || searchKeyInSource(key);

  console.log(`${key}:`);
  console.log(`  📝 Description: ${description}`);
  console.log(`  🇺🇸 EN exists: ${existsInEn ? '✅' : '❌'}`);
  console.log(`  🇸🇦 AR exists: ${existsInAr ? '✅' : '❌'}`);
  console.log(`  💻 Used in code: ${usedInCode ? '✅' : '❌'}`);

  if (!existsInEn && !existsInAr) {
    console.log(`  🎯 STATUS: MISSING (not orphaned - needs to be added)`);
  } else if (existsInEn && existsInAr && !usedInCode) {
    console.log(`  🎯 STATUS: ORPHANED (exists but not used - safe to remove)`);
  } else if (usedInCode) {
    console.log(`  🎯 STATUS: ACTIVE (in use - do not remove)`);
  } else {
    console.log(`  🎯 STATUS: INCONSISTENT (check manually)`);
  }

  console.log('');
});

console.log('🔧 VERIFICATION STEPS:');
console.log('-'.repeat(50));
console.log('1. ✅ Run: npm run translation:orphaned-safe');
console.log('2. 🔍 Manually check a few keys from the output');
console.log('3. 🧪 Verify they are indeed not used in your components');
console.log('4. 📋 If confident, then run: npm run translation:orphaned');
console.log('');
console.log('⚠️  SAFETY TIP: Always backup translation files before removal!');
console.log('💾 Backup command: cp -r public/locales public/locales.backup');

function searchKeyInSource(searchKey) {
  // Simple grep search for the key in source files
  try {
    const { execSync } = require('child_process');
    const result = execSync(`grep -r "${searchKey}" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | head -1`, { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch (e) {
    return false;
  }
}

console.log('');
console.log('✅ VERIFICATION COMPLETE');
console.log('Review the results above before proceeding with orphaned key removal.');
