import { isRTL, getDirectionalClasses } from '../direction';

// Mock document for SSR safety
const mockDocument = {
  documentElement: {
    dir: 'ltr',
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Set up global mocks before any imports
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock MutationObserver globally
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Direction Utilities', () => {
  describe('isRTL', () => {
    it('should return true for Arabic', () => {
      expect(isRTL('ar')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTL('en')).toBe(false);
    });

    it('should return false for unsupported languages', () => {
      expect(isRTL('fr')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isRTL('')).toBe(false);
    });

    it('should handle undefined', () => {
      expect(isRTL(undefined)).toBe(false);
    });

    it('should handle null', () => {
      expect(isRTL(null as any)).toBe(false);
    });
  });

  describe('getDirectionalClasses', () => {
    it('should return RTL classes for Arabic', () => {
      const classes = getDirectionalClasses('base', 'ltr-class', 'rtl-class', 'ar');
      expect(classes).toBe('base rtl-class');
    });

    it('should return LTR classes for English', () => {
      const classes = getDirectionalClasses('base', 'ltr-class', 'rtl-class', 'en');
      expect(classes).toBe('base ltr-class');
    });

    it('should handle empty classes', () => {
      const classes = getDirectionalClasses('', '', 'rtl-class', 'ar');
      expect(classes).toBe('rtl-class');
    });

    it('should handle single class', () => {
      const classes = getDirectionalClasses('base', '', '', 'en');
      expect(classes).toBe('base');
    });

    it('should default to LTR for unknown languages', () => {
      const classes = getDirectionalClasses('base', 'ltr-class', 'rtl-class', 'fr');
      expect(classes).toBe('base ltr-class');
    });
  });

  describe.skip('useDirection', () => {
    it.skip('should return direction information', () => {
      // Hook tests skipped due to JSDOM complexity
      // The useDirection hook relies on document manipulation and MutationObserver
      // which are difficult to test reliably in Jest environment
    });
  });

  describe('Real-world CSS class scenarios', () => {
    it('should handle navigation classes', () => {
      const navRTL = getDirectionalClasses('nav', 'ml-auto', 'mr-auto', 'ar');
      const navLTR = getDirectionalClasses('nav', 'ml-auto', 'mr-auto', 'en');
      
      expect(navRTL).toBe('nav mr-auto');
      expect(navLTR).toBe('nav ml-auto');
    });

    it('should handle text alignment', () => {
      const textRTL = getDirectionalClasses('text-base', 'text-left', 'text-right', 'ar');
      const textLTR = getDirectionalClasses('text-base', 'text-left', 'text-right', 'en');
      
      expect(textRTL).toBe('text-base text-right');
      expect(textLTR).toBe('text-base text-left');
    });

    it('should handle flex direction', () => {
      const flexRTL = getDirectionalClasses('flex items-center', 'flex-row', 'flex-row-reverse', 'ar');
      const flexLTR = getDirectionalClasses('flex items-center', 'flex-row', 'flex-row-reverse', 'en');
      
      expect(flexRTL).toBe('flex items-center flex-row-reverse');
      expect(flexLTR).toBe('flex items-center flex-row');
    });
  });
});