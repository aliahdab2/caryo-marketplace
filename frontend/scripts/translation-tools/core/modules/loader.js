/**
 * Translation File Loader Module
 * Handles loading and parsing of translation JSON files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'public', 'locales');
const LANGUAGES = ['en', 'ar'];

/**
 * Discover namespaces from disk rather than a hardcoded list.
 *
 * The list used to be hardcoded and had gone stale: it named 12 namespaces
 * while public/locales held 24, so more than half the translation files —
 * admin, dealer, payment, settings, subscription and others — were never
 * checked for missing keys or duplicates by CI. Reading the directory keeps
 * coverage complete and stops it drifting again when a namespace is added.
 *
 * The union across languages is used deliberately: a namespace present in one
 * language but not the other must be reported as missing keys, not silently
 * skipped.
 */
function discoverNamespaces() {
  const found = new Set();

  LANGUAGES.forEach(language => {
    const dir = path.join(LOCALES_DIR, language);
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir)
      .filter(file => file.endsWith('.json'))
      .forEach(file => found.add(path.basename(file, '.json')));
  });

  return [...found].sort();
}

const NAMESPACES = discoverNamespaces();

/**
 * Load translation file with enhanced error handling
 */
function loadTranslationFile(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file is empty
    if (!content.trim()) {
      console.warn(`⚠️  File ${language}/${namespace}.json is empty`);
      return {};
    }

    // Try to parse JSON
    const parsed = JSON.parse(content);

    // Validate that it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      console.error(`❌ Invalid JSON structure in ${language}/${namespace}.json - expected object, got ${typeof parsed}`);
      return {};
    }

    // Check for duplicate keys in the raw file content
    const lines = content.split('\n');
    const keyPattern = /^\s*"([^"]+)":/;
    const seenKeys = new Map();
    const duplicatesInFile = [];

    lines.forEach((line, index) => {
      const match = line.match(keyPattern);
      if (match) {
        const key = match[1];
        if (seenKeys.has(key)) {
          duplicatesInFile.push(key);
          console.error(`🚨 DUPLICATE KEY FOUND in ${language}/${namespace}.json at line ${index + 1}: "${key}"`);
          console.error(`   First occurrence: line ${seenKeys.get(key)}`);
        } else {
          seenKeys.set(key, index + 1);
        }
      }
    });

    if (duplicatesInFile.length > 0) {
      console.error(`❌ ${language}/${namespace}.json contains ${duplicatesInFile.length} duplicate keys: ${duplicatesInFile.join(', ')}`);
    }

    return parsed;
  } catch (error) {
    console.error(`❌ Failed to load ${language}/${namespace}.json: ${error.message}`);
    if (process.env.NODE_ENV !== 'test' || process.env.DEBUG_TRANSLATIONS) {
      console.error(`   Error details:`, error);
    }
    return {};
  }
}

/**
 * Load all translation files
 */
function loadAllTranslations() {
  console.log('Loading translation files...');

  const translations = {};

  LANGUAGES.forEach(language => {
    translations[language] = {};

    NAMESPACES.forEach(namespace => {
      translations[language][namespace] = loadTranslationFile(language, namespace);
    });
  });

  return translations;
}

module.exports = {
  loadTranslationFile,
  loadAllTranslations,
  LOCALES_DIR,
  LANGUAGES,
  NAMESPACES
};
