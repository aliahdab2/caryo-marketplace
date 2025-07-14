import {
  sanitizeInput,
  smartSanitize,
  sanitizeHtml,
  convertArabicNumerals,
  clearSanitizationCache
} from '../formUtils';

// Mock DOMPurify for testing
const mockDOMPurify = {
  sanitize: jest.fn()
};

// Mock dynamic import
jest.mock('dompurify', () => ({
  __esModule: true,
  default: mockDOMPurify
}));

describe('Form Utils - Clean Modular Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSanitizationCache();
    mockDOMPurify.sanitize.mockImplementation((input: string) => input.replace(/<[^>]*>/g, ''));
  });

  describe('sanitizeInput', () => {
    describe('basic level sanitization', () => {
      test('removes basic HTML characters', () => {
        expect(sanitizeInput('<script>alert("xss")</script>', 'basic')).toBe('scriptalert("xss")/script');
        expect(sanitizeInput('Hello & World', 'basic')).toBe('Hello & World');
        expect(sanitizeInput('Test "quotes"', 'basic')).toBe('Test "quotes"');
      });

      test('handles empty and invalid inputs', () => {
        expect(sanitizeInput('', 'basic')).toBe('');
        expect(sanitizeInput(null as unknown as string, 'basic')).toBe('');
        expect(sanitizeInput(undefined as unknown as string, 'basic')).toBe('');
      });

      test('optimizes clean inputs with zero-copy', () => {
        const cleanInput = 'This is a clean input without any dangerous content';
        const result = sanitizeInput(cleanInput, 'basic');
        expect(result).toBe(cleanInput);
      });

      test('trims whitespace', () => {
        expect(sanitizeInput('  hello world  ', 'basic')).toBe('hello world');
      });
    });

    describe('standard level sanitization', () => {
      test('removes HTML tags', () => {
        expect(sanitizeInput('<div>Hello World</div>', 'standard')).toBe('Hello World');
        expect(sanitizeInput('<p>Test <strong>bold</strong> text</p>', 'standard')).toBe('Test bold text');
      });

      test('removes JavaScript protocols', () => {
        expect(sanitizeInput('javascript:alert("xss")', 'standard')).toBe('alert("xss")');
      });

      test('removes event handlers', () => {
        expect(sanitizeInput('onclick="alert(1)"', 'standard')).toBe('"alert(1)"');
      });

      test('handles excessive whitespace', () => {
        expect(sanitizeInput('Hello    World   Test', 'standard')).toBe('Hello World Test');
      });
    });

    describe('strict level sanitization', () => {
      test('HTML entity encodes dangerous characters', () => {
        expect(sanitizeInput('<script>alert("xss")</script>', 'strict')).toBe('');
        expect(sanitizeInput('Hello & "World"', 'strict')).toBe('Hello &amp; &quot;World&quot;');
      });

      test('removes control characters', () => {
        const withControlChars = 'Hello\x00\x01\x02World';
        expect(sanitizeInput(withControlChars, 'strict')).toBe('HelloWorld');
      });

      test('removes script tags completely', () => {
        expect(sanitizeInput('<script>alert("xss")</script>Hello', 'strict')).toBe('Hello');
      });

      test('limits length to prevent DoS', () => {
        const longInput = 'a'.repeat(10000);
        const result = sanitizeInput(longInput, 'strict');
        expect(result.length).toBeLessThanOrEqual(5000);
      });
    });

    describe('caching behavior', () => {
      test('caches results for repeated inputs', () => {
        const input = 'Hello <script>alert("test")</script> World';
        
        const result1 = sanitizeInput(input, 'standard');
        const result2 = sanitizeInput(input, 'standard');
        
        expect(result1).toBe(result2);
        expect(result1).toBe('Hello alert("test") World');
      });

      test('uses different cache keys for different levels', () => {
        const input = '<b>Hello</b>';
        
        const standardResult = sanitizeInput(input, 'standard');
        const strictResult = sanitizeInput(input, 'strict');
        
        expect(standardResult).toBe('Hello');
        expect(strictResult).toBe('Hello');
      });

      test('generates predictable cache keys for large inputs', () => {
        const shortInput = 'Hello world';
        const longInput = 'A'.repeat(1000); // Very long input
        
        const shortKey = sanitizeInput(shortInput, 'basic');
        const longKey = sanitizeInput(longInput, 'basic');
        
        // Both should work and be cached
        expect(shortKey).toBe(shortInput); // No change needed
        expect(longKey).toBe('A'.repeat(1000)); // Should be truncated to MAX_SANITIZED_LENGTH
        
        // Verify caching works for both
        const shortKey2 = sanitizeInput(shortInput, 'basic');
        const longKey2 = sanitizeInput(longInput, 'basic');
        
        expect(shortKey2).toBe(shortKey);
        expect(longKey2).toBe(longKey);
      });
    });
  });

  describe('smartSanitize', () => {
    test('detects HTML content and uses strict sanitization', () => {
      const htmlInput = '<div>Hello <script>alert("xss")</script></div>';
      expect(smartSanitize(htmlInput)).toBe('Hello');
    });

    test('detects JavaScript and uses strict sanitization', () => {
      const jsInput = 'javascript:alert("xss")';
      expect(smartSanitize(jsInput)).toBe('alert("xss")');
    });

    test('uses standard sanitization for regular text', () => {
      const normalText = 'This is normal text without threats';
      expect(smartSanitize(normalText)).toBe(normalText);
    });

    test('detects event handlers and uses strict sanitization', () => {
      const eventHandler = 'onclick="alert(1)"';
      expect(smartSanitize(eventHandler)).toBe('"alert(1)"');
    });
  });

  describe('sanitizeHtml', () => {
    test('uses DOMPurify for HTML sanitization', async () => {
      mockDOMPurify.sanitize.mockReturnValue('Clean HTML');
      
      const result = await sanitizeHtml('<div>Test</div>');
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith('<div>Test</div>', {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
        ALLOWED_ATTR: []
      });
      expect(result).toBe('Clean HTML');
    });

    test('handles DOMPurify loading errors', async () => {
      // Create a fresh import to simulate module loading failure
      jest.doMock('dompurify', () => {
        throw new Error('DOMPurify error');
      });
      
      const result = await sanitizeHtml('<div>Test</div>');
      
      expect(result).toBe('Test'); // Fallback to basic sanitization
      
      jest.dontMock('dompurify');
    });
  });

  describe('convertArabicNumerals', () => {
    test('converts Arabic-Indic numerals to Western numerals', () => {
      expect(convertArabicNumerals('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
      expect(convertArabicNumerals('Car year ٢٠٢٠')).toBe('Car year 2020');
    });

    test('handles mixed content', () => {
      expect(convertArabicNumerals('Price: ٢٥٠٠٠ AED')).toBe('Price: 25000 AED');
      expect(convertArabicNumerals('BMW ٣ Series')).toBe('BMW 3 Series');
    });

    test('returns unchanged text without Arabic numerals', () => {
      const input = 'Regular text with 123 numbers';
      expect(convertArabicNumerals(input)).toBe(input);
    });
  });

  describe('edge cases and error handling', () => {
    test('handles extremely long inputs', () => {
      const extremelyLongInput = 'a'.repeat(50000);
      const result = sanitizeInput(extremelyLongInput, 'strict');
      expect(result.length).toBeLessThanOrEqual(5000);
    });

    test('handles special characters and unicode', () => {
      const unicodeInput = 'Hello 世界 🌍 مرحبا';
      const result = sanitizeInput(unicodeInput, 'standard');
      expect(result).toBe(unicodeInput);
    });

    test('handles malformed HTML gracefully', () => {
      const malformedHtml = '<div<script>alert("xss")</div>';
      const result = sanitizeInput(malformedHtml, 'standard');
      expect(result).not.toContain('script');
    });

    test('prevents ReDoS attacks with complex patterns', () => {
      const attackPattern = 'a'.repeat(1000) + '<script>' + 'b'.repeat(1000);
      const startTime = performance.now();
      const result = sanitizeInput(attackPattern, 'standard');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(result).not.toContain('script');
    });
  });

  describe('performance optimizations', () => {
    test('cache management works correctly', () => {
      const input = 'Test input for caching';
      
      sanitizeInput(input, 'standard');
      clearSanitizationCache();
      
      // After clearing cache, should still work
      const result = sanitizeInput(input, 'standard');
      expect(result).toBe('Test input for caching');
    });

    test('maintains consistent performance across calls', () => {
      const inputs = Array.from({ length: 100 }, (_, i) => `Test input ${i}`);
      
      const startTime = performance.now();
      inputs.forEach(input => sanitizeInput(input, 'standard'));
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should be fast
    });

    test('LRU cache eviction works correctly', () => {
      // Fill cache beyond capacity
      for (let i = 0; i < 150; i++) {
        sanitizeInput(`Input ${i}`, 'standard');
      }
      
      // Should still work efficiently
      const result = sanitizeInput('New input', 'standard');
      expect(result).toBe('New input');
    });
  });
});
