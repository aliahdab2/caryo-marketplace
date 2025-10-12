import { renderHook } from '@testing-library/react';
import { useDirection, isRTL, getClasses } from '../direction';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    i18n: { language: 'en' },
  })),
}));

const mockUseTranslation = require('react-i18next').useTranslation as jest.MockedFunction<any>;

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
      expect(isRTL('es')).toBe(false);
      expect(isRTL('de')).toBe(false);
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

  describe('getClasses', () => {
    it('should return RTL classes for Arabic', () => {
      const classes = getClasses('base', 'ltr-class', 'rtl-class', 'ar');
      expect(classes).toBe('base rtl-class');
    });

    it('should return LTR classes for English', () => {
      const classes = getClasses('base', 'ltr-class', 'rtl-class', 'en');
      expect(classes).toBe('base ltr-class');
    });

    it('should handle empty classes', () => {
      const classes = getClasses('', '', 'rtl-class', 'ar');
      expect(classes).toBe(' rtl-class');
    });

    it('should handle single class', () => {
      const classes = getClasses('base', '', '', 'en');
      expect(classes).toBe('base');
    });

    it('should default to LTR for unknown languages', () => {
      const classes = getClasses('base', 'ltr-class', 'rtl-class', 'fr');
      expect(classes).toBe('base ltr-class');
    });
  });

  describe('useDirection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return LTR for English', () => {
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'en' },
      });

      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(false);
      expect(result.current.isLTR).toBe(true);
      expect(result.current.direction).toBe('ltr');
    });

    it('should return RTL for Arabic', () => {
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'ar' },
      });

      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(true);
      expect(result.current.isLTR).toBe(false);
      expect(result.current.direction).toBe('rtl');
    });

    it('should provide direction classes', () => {
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'ar' },
      });

      const { result } = renderHook(() => useDirection());

      expect(result.current.dirClass).toBe('rtl');
      expect(result.current.oppositeClass).toBe('ltr');
    });

    it('should handle language changes', () => {
      const { result, rerender } = renderHook(() => useDirection());

      // Start with English
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'en' },
      });
      rerender();

      expect(result.current.isRTL).toBe(false);
      expect(result.current.direction).toBe('ltr');

      // Switch to Arabic
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'ar' },
      });
      rerender();

      expect(result.current.isRTL).toBe(true);
      expect(result.current.direction).toBe('rtl');
    });

    it('should provide getClasses helper function', () => {
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'ar' },
      });

      const { result } = renderHook(() => useDirection());

      const classes = result.current.getClasses('base', 'ltr-class', 'rtl-class');
      expect(classes).toBe('base rtl-class');
    });

    it('should provide getClasses helper for LTR', () => {
      mockUseTranslation.mockReturnValue({
        i18n: { language: 'en' },
      });

      const { result } = renderHook(() => useDirection());

      const classes = result.current.getClasses('base', 'ltr-class', 'rtl-class');
      expect(classes).toBe('base ltr-class');
    });

    it('should handle missing i18n object', () => {
      mockUseTranslation.mockReturnValue({
        i18n: null,
      });

      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(false);
      expect(result.current.direction).toBe('ltr');
    });

    it('should handle missing language property', () => {
      mockUseTranslation.mockReturnValue({
        i18n: {},
      });

      const { result } = renderHook(() => useDirection());

      expect(result.current.isRTL).toBe(false);
      expect(result.current.direction).toBe('ltr');
    });
  });

  describe('Real-world CSS class scenarios', () => {
    it('should handle navigation classes', () => {
      const navRTL = getClasses('nav', 'ml-auto', 'mr-auto', 'ar');
      const navLTR = getClasses('nav', 'ml-auto', 'mr-auto', 'en');
      
      expect(navRTL).toBe('nav mr-auto');
      expect(navLTR).toBe('nav ml-auto');
    });

    it('should handle text alignment', () => {
      const textRTL = getClasses('text-base', 'text-left', 'text-right', 'ar');
      const textLTR = getClasses('text-base', 'text-left', 'text-right', 'en');
      
      expect(textRTL).toBe('text-base text-right');
      expect(textLTR).toBe('text-base text-left');
    });

    it('should handle flex direction', () => {
      const flexRTL = getClasses('flex items-center', 'flex-row', 'flex-row-reverse', 'ar');
      const flexLTR = getClasses('flex items-center', 'flex-row', 'flex-row-reverse', 'en');
      
      expect(flexRTL).toBe('flex items-center flex-row-reverse');
      expect(flexLTR).toBe('flex items-center flex-row');
    });
  });
});