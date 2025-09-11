#!/usr/bin/env node

/**
 * Check Incomplete Translations
 * Shows keys that exist in one language but are missing in another
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING INCOMPLETE TRANSLATIONS');
console.log('=====================================\n');

// Load translation files
const enFiles = fs.readdirSync('./public/locales/en/');
const arFiles = fs.readdirSync('./public/locales/ar/');

const namespaces = ['auth', 'common', 'contact', 'dashboard', 'errors', 'favorites', 'home', 'listings', 'mediaGallery', 'messages', 'search', 'translation'];

let totalMissingEn = 0;
let totalMissingAr = 0;
let totalKeys = 0;

console.log('MISSING TRANSLATIONS BY NAMESPACE:');
console.log('===================================\n');

namespaces.forEach(namespace => {
  const enFile = `./public/locales/en/${namespace}.json`;
  const arFile = `./public/locales/ar/${namespace}.json`;

  if (!fs.existsSync(enFile) || !fs.existsSync(arFile)) {
    console.log(`⚠️  ${namespace}: Files missing`);
    return;
  }

  try {
    const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));

    // Get all unique keys
    const allKeys = new Set([...Object.keys(enData), ...Object.keys(arData)]);

    const missingEn = [];
    const missingAr = [];

    allKeys.forEach(key => {
      if (!enData[key]) missingEn.push(key);
      if (!arData[key]) missingAr.push(key);
    });

    totalKeys += allKeys.size;

    if (missingEn.length > 0 || missingAr.length > 0) {
      console.log(`${namespace.toUpperCase()}:`);
      if (missingEn.length > 0) {
        console.log(`  🇺🇸 EN missing (${missingEn.length}): ${missingEn.slice(0, 5).join(', ')}${missingEn.length > 5 ? ` +${missingEn.length - 5} more` : ''}`);
        totalMissingEn += missingEn.length;
      }
      if (missingAr.length > 0) {
        console.log(`  🇸🇦 AR missing (${missingAr.length}): ${missingAr.slice(0, 5).join(', ')}${missingAr.length > 5 ? ` +${missingAr.length - 5} more` : ''}`);
        totalMissingAr += missingAr.length;
      }
      console.log('');
    }
  } catch (error) {
    console.log(`❌ ${namespace}: Error reading files - ${error.message}\n`);
  }
});

console.log('📊 SUMMARY:');
console.log('===========');
console.log(`Total unique keys: ${totalKeys}`);
console.log(`EN missing: ${totalMissingEn} keys`);
console.log(`AR missing: ${totalMissingAr} keys`);
console.log(`Total incomplete: ${totalMissingEn + totalMissingAr} translations`);

const enCompleteness = ((totalKeys - totalMissingEn) / totalKeys * 100).toFixed(1);
const arCompleteness = ((totalKeys - totalMissingAr) / totalKeys * 100).toFixed(1);

console.log(`EN completeness: ${enCompleteness}%`);
console.log(`AR completeness: ${arCompleteness}%`);

console.log('\n✅ Check complete!');
