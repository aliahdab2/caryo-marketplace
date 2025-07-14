import { parseCurrency } from '../currency';

describe('Currency Utils', () => {
  describe('parseCurrency', () => {
    test('parses SYR symbol correctly (multi-character)', () => {
      // Test cases for SYR (multi-character symbol)
      expect(parseCurrency('SYR 12500', 'SYP')).toBe(12500);
      expect(parseCurrency('12500 SYR', 'SYP')).toBe(12500);
      expect(parseCurrency('SYR12500', 'SYP')).toBe(12500);
      expect(parseCurrency('12,500 SYR', 'SYP')).toBe(12500);
    });

    test('parses USD symbol correctly (single character)', () => {
      // Test cases for USD (single character symbol)
      expect(parseCurrency('$1500', 'USD')).toBe(1500);
      expect(parseCurrency('1500$', 'USD')).toBe(1500);
      expect(parseCurrency('$1,500', 'USD')).toBe(1500);
      expect(parseCurrency('$ 1500', 'USD')).toBe(1500);
    });

    test('removes symbol completely, not individual characters', () => {
      // This tests the bug fix - previously 'S', 'Y', 'R' were removed individually
      expect(parseCurrency('SYR123SYR', 'SYP')).toBe(123);
      
      // This string contains individual letters S, Y, R mixed with numbers
      // The function should NOT remove individual characters, so this should be NaN
      expect(parseCurrency('S1Y2R3', 'SYP')).toBeNaN(); // Should NOT remove S, Y, R individually
    });

    test('handles edge cases', () => {
      expect(parseCurrency('', 'USD')).toBeNaN();
      expect(parseCurrency('abc', 'USD')).toBeNaN();
      expect(parseCurrency('$', 'USD')).toBeNaN();
      expect(parseCurrency('SYR', 'SYP')).toBeNaN();
    });

    test('handles invalid currency codes', () => {
      expect(parseCurrency('€100', 'EUR')).toBeNaN(); // EUR not supported
    });

    test('handles decimal amounts', () => {
      expect(parseCurrency('$1500.50', 'USD')).toBe(1500.50);
      expect(parseCurrency('SYR 12500.75', 'SYP')).toBe(12500.75);
    });
  });
});
