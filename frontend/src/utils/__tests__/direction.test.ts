import { renderHook } from '@testing-library/react';
import { useDirection, isRTL, getDirectionalClasses } from '../direction';

// Mock document
const mockDocument = {
  documentElement: {
    dir: 'ltr',
  },
};
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock MutationObserver
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

  describe('useDirection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset document direction to LTR
      mockDocument.documentElement.dir = 'ltr';
    });

    it('should return LTR for English', () => {
      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(false);
      expect(result.current.isLTR).toBe(true);
      expect(result.current.direction).toBe('ltr');
    });

    it('should return RTL for Arabic', () => {
      // Set document direction to RTL
      mockDocument.documentElement.dir = 'rtl';
      
      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(true);
      expect(result.current.isLTR).toBe(false);
      expect(result.current.direction).toBe('rtl');
    });

    it('should provide direction classes', () => {
      // Set document direction to RTL
      mockDocument.documentElement.dir = 'rtl';
      
      const { result } = renderHook(() => useDirection());

      const classes = result.current.getClasses('base', 'ltr-class', 'rtl-class');
      expect(classes).toBe('base rtl-class');
    });

    it('should handle language changes', () => {
      const { result, rerender } = renderHook(() => useDirection());

      // Start with LTR
      expect(result.current.isRTL).toBe(false);
      expect(result.current.direction).toBe('ltr');

      // Change to RTL
      mockDocument.documentElement.dir = 'rtl';
      rerender();

      expect(result.current.isRTL).toBe(true);
      expect(result.current.direction).toBe('rtl');
    });

    it('should provide getClasses helper function', () => {
      // Set document direction to RTL
      mockDocument.documentElement.dir = 'rtl';
      
      const { result } = renderHook(() => useDirection());

      const classes = result.current.getClasses('base', 'ltr-class', 'rtl-class');
      expect(classes).toBe('base rtl-class');
    });

    it('should provide getClasses helper for LTR', () => {
      const { result } = renderHook(() => useDirection());

      const classes = result.current.getClasses('base', 'ltr-class', 'rtl-class');
      expect(classes).toBe('base ltr-class');
    });

    it('should handle missing i18n object', () => {
      const { result } = renderHook(() => useDirection());

      expect(result.current.direction).toBe('ltr');
      expect(result.current.isRTL).toBe(false);
      expect(result.current.isLTR).toBe(true);
    });

    it('should handle missing language property', () => {
      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(false);
      expect(result.current.direction).toBe('ltr');
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