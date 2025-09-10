const translate = require('google-translate-api');
const fs = require('fs');
const path = require('path');

/**
 * AI Translation Service
 * Provides automated translation using Google Translate API
 */
class AITranslator {
  constructor() {
    this.rateLimitDelay = 100; // ms between requests
    this.lastRequestTime = 0;
  }

  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language (e.g., 'en')
   * @param {string} toLang - Target language (e.g., 'ar')
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, fromLang, toLang) {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
      }
      this.lastRequestTime = Date.now();

      console.log(`Translating: "${text}" from ${fromLang} to ${toLang}`);

      const result = await translate(text, { from: fromLang, to: toLang });
      const translatedText = result.text;

      console.log(`✅ Translated: "${translatedText}"`);

      return translatedText;
    } catch (error) {
      console.error(`❌ Translation failed for "${text}":`, error.message);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Translate a single translation key
   * @param {string} key - Translation key
   * @param {string} sourceText - Source text to translate
   * @param {string} fromLang - Source language
   * @param {string} toLang - Target language
   * @returns {Promise<{key: string, original: string, translated: string}>}
   */
  async translateKey(key, sourceText, fromLang, toLang) {
    const translatedText = await this.translateText(sourceText, fromLang, toLang);
    return {
      key,
      original: sourceText,
      translated: translatedText
    };
  }

  /**
   * Translate multiple keys with batch processing
   * @param {Array<{key: string, text: string}>} keys - Array of key-text pairs
   * @param {string} fromLang - Source language
   * @param {string} toLang - Target language
   * @returns {Promise<Array<{key: string, original: string, translated: string}>>}
   */
  async translateBatch(keys, fromLang, toLang) {
    console.log(`\n🚀 Starting AI translation of ${keys.length} keys from ${fromLang} to ${toLang}`);
    console.log('=' .repeat(60));

    const results = [];
    let completed = 0;

    for (const { key, text } of keys) {
      try {
        const result = await this.translateKey(key, text, fromLang, toLang);
        results.push(result);

        completed++;
        if (completed % 10 === 0 || completed === keys.length) {
          console.log(`📊 Progress: ${completed}/${keys.length} keys translated`);
        }
      } catch (error) {
        console.error(`❌ Failed to translate key "${key}":`, error.message);
        // Still add the result with original text
        results.push({
          key,
          original: text,
          translated: text
        });
      }
    }

    console.log('=' .repeat(60));
    console.log(`✅ AI translation completed! ${results.length} keys processed`);

    return results;
  }

  /**
   * Translate missing translations in a translation file
   * @param {Object} sourceTranslations - Complete translations (source language)
   * @param {Object} targetTranslations - Incomplete translations (target language)
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @param {string} namespace - Translation namespace
   * @returns {Promise<Object>} Updated target translations
   */
  async translateMissingTranslations(sourceTranslations, targetTranslations, fromLang, toLang, namespace) {
    const missingKeys = [];
    const updatedTranslations = { ...targetTranslations };

    // Find all keys in source that are missing in target
    const sourceKeys = this.getAllKeys(sourceTranslations);

    for (const key of sourceKeys) {
      if (!this.hasKey(targetTranslations, key)) {
        const sourceText = this.getNestedValue(sourceTranslations, key);
        if (sourceText && typeof sourceText === 'string') {
          missingKeys.push({ key, text: sourceText });
        }
      }
    }

    if (missingKeys.length === 0) {
      console.log(`ℹ️ No missing translations found for ${namespace} (${fromLang} → ${toLang})`);
      return targetTranslations;
    }

    console.log(`🔍 Found ${missingKeys.length} missing translations in ${namespace}`);

    // Translate missing keys
    const translationResults = await this.translateBatch(missingKeys, fromLang, toLang);

    // Update target translations
    for (const result of translationResults) {
      this.setNestedValue(updatedTranslations, result.key, result.translated);
    }

    console.log(`✅ Updated ${namespace} with ${translationResults.length} AI-translated keys`);

    return updatedTranslations;
  }

  /**
   * Get all translation keys from a nested object
   * @param {Object} obj - Translation object
   * @param {string} prefix - Key prefix for nested objects
   * @returns {Array<string>} Array of keys
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

    return keys;
  }

  /**
   * Check if a nested key exists in an object
   * @param {Object} obj - Object to check
   * @param {string} keyPath - Dot-separated key path
   * @returns {boolean}
   */
  hasKey(obj, keyPath) {
    const keys = keyPath.split('.');
    let current = obj;

    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object to get value from
   * @param {string} keyPath - Dot-separated key path
   * @returns {any}
   */
  getNestedValue(obj, keyPath) {
    const keys = keyPath.split('.');
    let current = obj;

    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested value in object
   * @param {Object} obj - Object to set value in
   * @param {string} keyPath - Dot-separated key path
   * @param {any} value - Value to set
   */
  setNestedValue(obj, keyPath, value) {
    const keys = keyPath.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

module.exports = AITranslator;
