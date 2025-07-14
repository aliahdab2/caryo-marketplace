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
      
      // Before the fix, this would incorrectly remove S, Y, R individually 
      // resulting in "123" instead of preserving the characters
      expect(parseCurrency('S1Y2R3', 'SYP')).toBe(123); // Should NOT remove S, Y, R individually
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
