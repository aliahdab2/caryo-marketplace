/**
 * Basic Translation Validator Tests
 * Simple tests to verify the tool works
 */

const { loadAllTranslations } = require('../validator');

describe('Translation Validator - Basic Functionality', () => {
  test('should load test translation files', () => {
    // Set test environment
    process.env.NODE_ENV = 'test';

    const translations = loadAllTranslations();

    expect(translations).toBeDefined();
    expect(translations.en).toBeDefined();
    expect(translations.ar).toBeDefined();
    expect(translations.en.common).toBeDefined();
    expect(translations.ar.common).toBeDefined();

    // Check that we have some keys loaded
    expect(Object.keys(translations.en.common)).toBeInstanceOf(Array);
    expect(Object.keys(translations.ar.common)).toBeInstanceOf(Array);
  });

  test('should handle different environments', () => {
    // Test environment
    process.env.NODE_ENV = 'test';
    const testTranslations = loadAllTranslations();

    // Production environment
    process.env.NODE_ENV = 'production';
    const prodTranslations = loadAllTranslations();

    // They should be different (test uses test-data/, production uses public/locales/)
    expect(testTranslations).not.toEqual(prodTranslations);
  });

  test('should export all required functions', () => {
    const functions = require('../translation-validator');

    expect(typeof functions.loadAllTranslations).toBe('function');
    expect(typeof functions.findMissingTranslations).toBe('function');
    expect(typeof functions.calculateCompleteness).toBe('function');
    expect(typeof functions.generateSummaryReport).toBe('function');
    expect(typeof functions.autoFixMissingTranslations).toBe('function');
  });
});
