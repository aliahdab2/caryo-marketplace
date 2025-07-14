import {
  sanitizeInput,
  smartSanitize,
  sanitizeHtml,
  sanitizeListingData,
  batchSanitize,
  convertArabicNumerals,
  sanitizeSearchQuery,
  clearSanitizationCache
} from '../formUtils';
import { ListingFormData } from '@/types/listings';

// Mock DOMPurify for testing
const mockDOMPurify = {
  sanitize: jest.fn()
};

// Mock dynamic import
jest.mock('dompurify', () => ({
  __esModule: true,
  default: mockDOMPurify
}));

describe('Form Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSanitizationCache();
    mockDOMPurify.sanitize.mockImplementation((input: string) => input.replace(/<[^>]*>/g, ''));
  });

  describe('sanitizeInput', () => {
    describe('basic level sanitization', () => {
      test('removes basic HTML characters', () => {
        const input = 'Hello <script>alert("xss")</script> World';
        const result = sanitizeInput(input, 'basic');
        expect(result).toBe('Hello scriptalert("xss")/script World');
      });

      test('handles empty and invalid inputs', () => {
        expect(sanitizeInput('', 'basic')).toBe('');
        expect(sanitizeInput(null as never, 'basic')).toBe('');
        expect(sanitizeInput(undefined as never, 'basic')).toBe('');
        expect(sanitizeInput(123 as never, 'basic')).toBe('');
      });

      test('optimizes clean inputs with zero-copy', () => {
        const cleanInput = 'This is a clean input with no dangerous content';
        const result = sanitizeInput(cleanInput, 'basic');
        expect(result).toBe(cleanInput);
      });

      test('trims whitespace', () => {
        const input = '  Hello World  ';
        const result = sanitizeInput(input, 'basic');
        expect(result).toBe('Hello World');
      });
    });

    describe('standard level sanitization', () => {
      test('removes HTML tags', () => {
        const input = 'Hello <div>test</div> <span>world</span>';
        const result = sanitizeInput(input, 'standard');
        expect(result).toBe('Hello test world');
      });

      test('removes JavaScript protocols', () => {
        const input = 'Click <a href="javascript:alert(1)">here</a>';
        const result = sanitizeInput(input, 'standard');
        expect(result).toBe('Click here');
      });

      test('removes event handlers', () => {
        const input = 'Test onclick="malicious()" onmouseover="bad()"';
        const result = sanitizeInput(input, 'standard');
        expect(result).toBe('Test "malicious()" "bad()"');
      });

      test('handles excessive whitespace', () => {
        const input = 'Hello    world    test';
        const result = sanitizeInput(input, 'standard');
        expect(result).toBe('Hello world test');
      });
    });

    describe('strict level sanitization', () => {
      test('HTML entity encodes dangerous characters', () => {
        const input = 'Test & "quotes" <tags> \'apostrophes\'';
        const result = sanitizeInput(input, 'strict');
        expect(result).toContain('&amp;');
        expect(result).toContain('&quot;');
        // Tags are removed by HTML_TAGS pattern before entity encoding, so only one space
        expect(result).toBe('Test &amp; &quot;quotes&quot; &#x27;apostrophes&#x27;');
      });

      test('removes control characters', () => {
        const input = 'Test\x00\x01\x02 content';
        const result = sanitizeInput(input, 'strict');
        expect(result).toBe('Test content');
      });

      test('removes script tags completely', () => {
        const input = 'Safe <script>alert("xss")</script> content';
        const result = sanitizeInput(input, 'strict');
        expect(result).toBe('Safe content');
      });

      test('limits length to prevent DoS', () => {
        const longInput = 'A'.repeat(1500);
        const result = sanitizeInput(longInput, 'strict');
        expect(result.length).toBe(1000);
      });
    });

    describe('caching behavior', () => {
      test('caches results for repeated inputs', () => {
        const input = 'Test input for caching';
        
        const result1 = sanitizeInput(input, 'standard');
        const result2 = sanitizeInput(input, 'standard');
        
        expect(result1).toBe(result2);
      });

      test('uses different cache keys for different levels', () => {
        const input = 'Test <b>bold</b> content';
        
        const basicResult = sanitizeInput(input, 'basic');
        const standardResult = sanitizeInput(input, 'standard');
        
        expect(basicResult).not.toBe(standardResult);
      });
    });
  });

  describe('smartSanitize', () => {
    test('detects HTML content and uses strict sanitization', () => {
      const htmlInput = '<div>HTML content</div>';
      const result = smartSanitize(htmlInput);
      // HTML tags are stripped, content remains
      expect(result).toBe('HTML content');
    });

    test('detects JavaScript and uses strict sanitization', () => {
      const jsInput = 'javascript:alert("xss")';
      const result = smartSanitize(jsInput);
      expect(result).toBe('alert("xss")');
    });

    test('uses standard sanitization for regular text', () => {
      const normalInput = 'Regular text content';
      const result = smartSanitize(normalInput);
      expect(result).toBe(normalInput);
    });

    test('detects event handlers and uses strict sanitization', () => {
      const eventInput = 'onclick="malicious()" test';
      const result = smartSanitize(eventInput);
      expect(result).toBe('"malicious()" test');
    });
  });

  describe('sanitizeHtml', () => {
    test('uses DOMPurify for HTML sanitization', async () => {
      const htmlInput = '<p>Safe paragraph</p><script>alert("xss")</script>';
      mockDOMPurify.sanitize.mockReturnValue('<p>Safe paragraph</p>');
      
      const result = await sanitizeHtml(htmlInput);
      
      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(htmlInput, expect.any(Object));
      expect(result).toBe('<p>Safe paragraph</p>');
    });

    test('handles DOMPurify loading errors', async () => {
      // Mock import failure
      jest.doMock('dompurify', () => {
        throw new Error('DOMPurify load failed');
      });
      
      const htmlInput = '<p>Test content</p>';
      const result = await sanitizeHtml(htmlInput);
      
      // Should fallback to basic sanitization
      expect(result).toBe('Test content');
    });
  });

  describe('sanitizeListingData', () => {
  test('sanitizes car listing data appropriately', () => {
    const listingData: Partial<ListingFormData> = {
      title: 'Great <script>alert("xss")</script> Car',
      description: 'Amazing car with <b>features</b>',
      make: '5', // Dropdown ID value - should not be sanitized
      model: '12', // Dropdown ID value - should not be sanitized  
      price: '25000',
      mileage: '50,000 km',
      year: '2020'
    };

    const result = sanitizeListingData(listingData);

    expect(result.title).toBe('Great Car');
    expect(result.description).toBe('Amazing car with features');
    expect(result.make).toBe('5'); // Dropdown IDs are safe and not sanitized
    expect(result.model).toBe('12'); // Dropdown IDs are safe and not sanitized
    expect(result.price).toBe('25000');
  });

    test('handles missing fields gracefully', () => {
      const partialData: Partial<ListingFormData> = {
        title: 'Car Title',
        price: '15000'
      };

      const result = sanitizeListingData(partialData);

      expect(result.title).toBe('Car Title');
      expect(result.price).toBe('15000');
      expect(result.description).toBeUndefined();
    });
  });

  describe('batchSanitize', () => {
    test('sanitizes array of inputs', () => {
      const inputs = [
        'Clean input',
        '<script>alert("xss")</script>',
        'Another <b>input</b>',
        'onclick="bad()" test'
      ];

      const results = batchSanitize(inputs, 'standard');

      expect(results).toHaveLength(4);
      expect(results[0]).toBe('Clean input');
      expect(results[1]).toBe('alert("xss")');
      expect(results[2]).toBe('Another input');
      expect(results[3]).toBe('"bad()" test');
    });

    test('handles empty array', () => {
      const result = batchSanitize([], 'standard');
      expect(result).toEqual([]);
    });

    test('processes large batches efficiently', () => {
      const largeArray = Array(1000).fill('Test <script>alert("xss")</script> input');
      
      const startTime = performance.now();
      const results = batchSanitize(largeArray, 'standard');
      const endTime = performance.now();
      
      expect(results).toHaveLength(1000);
      expect(results[0]).toBe('Test alert("xss") input');
      // Should complete reasonably quickly (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('convertArabicNumerals', () => {
    test('converts Arabic-Indic numerals to Western numerals', () => {
      const arabicText = 'السعر ١٢٣٤٥٦٧٨٩٠ ريال';
      const result = convertArabicNumerals(arabicText);
      expect(result).toBe('السعر 1234567890 ريال');
    });

    test('handles mixed content', () => {
      const mixedText = 'Year ٢٠٢٠ - Mileage ٥٠,٠٠٠ km';
      const result = convertArabicNumerals(mixedText);
      expect(result).toBe('Year 2020 - Mileage 50,000 km');
    });

    test('returns unchanged text without Arabic numerals', () => {
      const englishText = 'Price 25000 SAR';
      const result = convertArabicNumerals(englishText);
      expect(result).toBe(englishText);
    });
  });

  describe('sanitizeSearchQuery', () => {
    test('normalizes search query', () => {
      const query = '  Toyota    Camry   2020  ';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('Toyota Camry 2020');
    });

    test('preserves Arabic text', () => {
      const query = 'تويوتا ٢٠٢٠';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('تويوتا ٢٠٢٠');
    });

    test('handles empty search query', () => {
      expect(sanitizeSearchQuery('')).toBe('');
      expect(sanitizeSearchQuery('   ')).toBe('');
    });

    test('removes extra whitespace', () => {
      const query = 'BMW    X5    luxury    car';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('BMW X5 luxury car');
    });

    test('removes dangerous scripts', () => {
      const query = 'BMW <script>alert("xss")</script> car';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('BMW car');
    });

    test('limits length when specified', () => {
      const longQuery = 'A'.repeat(300);
      const result = sanitizeSearchQuery(longQuery, { maxLength: 50 });
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('edge cases and error handling', () => {
    test('handles extremely long inputs', () => {
      const veryLongInput = 'A'.repeat(10000);
      const result = sanitizeInput(veryLongInput, 'strict');
      expect(result.length).toBe(1000); // Should be truncated
    });

    test('handles special characters and unicode', () => {
      const unicodeInput = 'Test 🚗 emoji and ñoñó special chars';
      const result = sanitizeInput(unicodeInput, 'standard');
      expect(result).toContain('🚗');
      expect(result).toContain('ñoñó');
    });

    test('handles malformed HTML gracefully', () => {
      const malformedHtml = '<div><span>Unclosed tags <script>';
      const result = sanitizeInput(malformedHtml, 'strict');
      expect(result).toContain('Unclosed tags');
    });

    test('prevents ReDoS attacks with complex patterns', () => {
      const complexInput = 'a'.repeat(1000) + '<script>' + 'b'.repeat(1000);
      
      const startTime = performance.now();
      const result = sanitizeInput(complexInput, 'strict');
      const endTime = performance.now();
      
      // Should complete quickly even with complex input
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.length).toBe(1000); // Truncated for DoS prevention
    });
  });

  describe('performance optimizations', () => {
    test('cache management works correctly', () => {
      // Test that cache can be cleared
      sanitizeInput('test input', 'standard');
      clearSanitizationCache();
      
      // After clearing cache, same input should still work
      const result = sanitizeInput('test input', 'standard');
      expect(result).toBe('test input');
    });

    test('maintains consistent performance across calls', () => {
      const testInput = 'Performance test <script>alert("test")</script>';
      const times: number[] = [];
      
      // Measure multiple calls
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        sanitizeInput(`${testInput} ${i}`, 'standard');
        const end = performance.now();
        times.push(end - start);
      }
      
      // Performance should be consistent (no outliers > 10x average)
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxAcceptableTime = avgTime * 10;
      
      times.forEach(time => {
        expect(time).toBeLessThan(maxAcceptableTime);
      });
    });
  });
});
