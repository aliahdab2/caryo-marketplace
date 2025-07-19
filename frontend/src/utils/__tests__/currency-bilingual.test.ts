/**
 * Test file for bilingual curr    test('should format SYP correctly for both locales', () => {
      const englishResult = formatCurrency(testAmount, 'SYP', 'en-US');
      const arabicResult = formatCurrency(testAmount, 'SYP', 'ar');
      
      // SYP uses "SYP" as currency code, not "SYR"
      expect(englishResult).toContain('SYP');
      expect(arabicResult).toContain('SYP');
    });rmatting
 * Tests both English and Arabic locale support in the currency utilities
 */

import { formatCurrency, formatAmount, formatCurrencyCompact, DEFAULT_CURRENCY } from '../currency';

describe('Currency Bilingual Support', () => {
  const testAmount = 25000;

  describe('formatCurrency', () => {
    test('should format USD correctly for English locale', () => {
      const result = formatCurrency(testAmount, 'USD', 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('25,000');
    });

    test('should format USD correctly for Arabic locale', () => {
      const result = formatCurrency(testAmount, 'USD', 'ar-SY');
      expect(result).toContain('$');
      // Arabic formatting uses Arabic-Indic numerals
      expect(result).toMatch(/٢٥|25/); // Should contain either Arabic or ASCII numerals
    });

    test('should handle language codes correctly', () => {
      const englishResult = formatCurrency(testAmount, 'USD', 'en');
      const arabicResult = formatCurrency(testAmount, 'USD', 'ar');
      
      expect(englishResult).toContain('$');
      expect(arabicResult).toContain('$');
      // Both should be formatted but may differ in number representation
      expect(englishResult).toBeTruthy();
      expect(arabicResult).toBeTruthy();
    });

    test('should format SYP correctly for both locales', () => {
      const englishResult = formatCurrency(testAmount, 'SYP', 'en');
      const arabicResult = formatCurrency(testAmount, 'SYP', 'ar');
      
      expect(englishResult).toContain('SYP');
      // Arabic uses the Arabic currency symbol for SYP
      expect(arabicResult).toMatch(/ل\.س\.|SYP/); // Contains Arabic pound symbol or SYP
    });
  });

  describe('formatAmount', () => {
    test('should format amounts correctly for both locales', () => {
      const englishResult = formatAmount(testAmount, DEFAULT_CURRENCY, 'en');
      const arabicResult = formatAmount(testAmount, DEFAULT_CURRENCY, 'ar');
      
      expect(englishResult).toBeTruthy();
      expect(arabicResult).toBeTruthy();
      expect(englishResult).toContain('$');
      expect(arabicResult).toContain('$');
    });

    test('should handle string amounts', () => {
      const englishResult = formatAmount('25000', DEFAULT_CURRENCY, 'en');
      const arabicResult = formatAmount('25000', DEFAULT_CURRENCY, 'ar');
      
      expect(englishResult).toBeTruthy();
      expect(arabicResult).toBeTruthy();
    });

    test('should handle invalid amounts gracefully', () => {
      expect(formatAmount('invalid', DEFAULT_CURRENCY, 'en')).toBe('');
      expect(formatAmount('invalid', DEFAULT_CURRENCY, 'ar')).toBe('');
      expect(formatAmount(null as unknown as string, DEFAULT_CURRENCY, 'en')).toBe('');
      expect(formatAmount(undefined as unknown as string, DEFAULT_CURRENCY, 'ar')).toBe('');
    });
  });

  describe('formatCurrencyCompact', () => {
    test('should format large amounts compactly for both locales', () => {
      const largeAmount = 1250000;
      const englishResult = formatCurrencyCompact(largeAmount, DEFAULT_CURRENCY, 'en');
      const arabicResult = formatCurrencyCompact(largeAmount, DEFAULT_CURRENCY, 'ar');
      
      expect(englishResult).toBeTruthy();
      expect(arabicResult).toBeTruthy();
      // Should contain compact notation (M for million or similar)
      expect(englishResult.length).toBeLessThan(15); // Compact should be shorter
      expect(arabicResult.length).toBeLessThan(15);
    });
  });

  describe('Error handling and fallbacks', () => {
    test('should handle unsupported currencies gracefully', () => {
      const result = formatCurrency(testAmount, 'INVALID', 'en');
      // Should fallback to default currency (USD)
      expect(result).toContain('$');
    });

    test('should handle invalid locales gracefully', () => {
      const result = formatCurrency(testAmount, DEFAULT_CURRENCY, 'invalid-locale');
      // Should not throw and should return some formatted result
      expect(result).toBeTruthy();
    });
  });
});
