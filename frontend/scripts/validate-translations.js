#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../public/locales');
const SUPPORTED_LANGUAGES = ['en', 'ar'];

/**
 * Validate translation files for consistency
 */
function validateTranslations() {
  const issues = [];
  const translationFiles = {};
  
  // Load all translation files
  SUPPORTED_LANGUAGES.forEach(lang => {
    const langDir = path.join(LOCALES_DIR, lang);
    if (!fs.existsSync(langDir)) {
      issues.push(`Missing language directory: ${lang}`);
      return;
    }
    
    translationFiles[lang] = {};
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = path.join(langDir, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        translationFiles[lang][file] = content;
      } catch (error) {
        issues.push(`Invalid JSON in ${lang}/${file}: ${error.message}`);
      }
    });
  });
  
  // Check for missing files
  const englishFiles = Object.keys(translationFiles.en || {});
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (lang === 'en') return;
    
    const langFiles = Object.keys(translationFiles[lang] || {});
    englishFiles.forEach(file => {
      if (!langFiles.includes(file)) {
        issues.push(`Missing translation file: ${lang}/${file}`);
      }
    });
  });
  
  // Check for missing keys
  englishFiles.forEach(file => {
    const englishKeys = Object.keys(translationFiles.en[file] || {});
    
    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang === 'en') return;
      
      const langKeys = Object.keys(translationFiles[lang]?.[file] || {});
      englishKeys.forEach(key => {
        if (!langKeys.includes(key)) {
          issues.push(`Missing translation key: ${lang}/${file} - "${key}"`);
        }
      });
    });
  });
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ All translations are valid and complete!');
    return true;
  } else {
    console.log('❌ Translation validation failed:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }
}

if (require.main === module) {
  const isValid = validateTranslations();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateTranslations };
