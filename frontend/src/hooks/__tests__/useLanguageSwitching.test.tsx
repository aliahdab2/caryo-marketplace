import { renderHook, act } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguageSwitching } from '../useLanguageSwitching';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock the i18n config
jest.mock('@/app/i18n/config', () => ({
  isValidLocale: (locale: string): locale is 'en' | 'ar' => {
    return ['en', 'ar'].includes(locale);
  },
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('useLanguageSwitching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      refresh: jest.fn(),
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  describe('currentLang detection', () => {
    it('should detect English from URL path', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('en');
    });

    it('should detect Arabic from URL path', () => {
      mockUsePathname.mockReturnValue('/ar/search');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('ar');
    });

    it('should default to English for invalid locale', () => {
      mockUsePathname.mockReturnValue('/fr/invalid');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('en');
    });

    it('should default to English for root path', () => {
      mockUsePathname.mockReturnValue('/');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('en');
    });

    it('should handle complex nested paths', () => {
      mockUsePathname.mockReturnValue('/ar/dashboard/listings/new');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('ar');
    });
  });

  describe('oppositeLanguage', () => {
    it('should return Arabic when current is English', () => {
      mockUsePathname.mockReturnValue('/en/page');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.oppositeLanguage).toBe('ar');
    });

    it('should return English when current is Arabic', () => {
      mockUsePathname.mockReturnValue('/ar/page');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.oppositeLanguage).toBe('en');
    });
  });

  describe('buildLanguageUrl', () => {
    it('should build URL for different language', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());
      const url = result.current.buildLanguageUrl('ar');

      expect(url).toBe('/ar/dashboard');
    });

    it('should handle root path correctly', () => {
      mockUsePathname.mockReturnValue('/en');

      const { result } = renderHook(() => useLanguageSwitching());
      const url = result.current.buildLanguageUrl('ar');

      expect(url).toBe('/ar/');
    });

    it('should handle path without locale', () => {
      mockUsePathname.mockReturnValue('/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());
      const url = result.current.buildLanguageUrl('ar');

      expect(url).toBe('/ar/dashboard');
    });

    it('should handle complex nested paths', () => {
      mockUsePathname.mockReturnValue('/en/dashboard/listings/123/edit');

      const { result } = renderHook(() => useLanguageSwitching());
      const url = result.current.buildLanguageUrl('ar');

      expect(url).toBe('/ar/dashboard/listings/123/edit');
    });

    it('should handle paths with query parameters', () => {
      mockUsePathname.mockReturnValue('/en/search?brand=toyota&year=2020');

      const { result } = renderHook(() => useLanguageSwitching());
      const url = result.current.buildLanguageUrl('ar');

      expect(url).toBe('/ar/search?brand=toyota&year=2020');
    });
  });

  describe('switchLanguage', () => {
    it('should use SPA navigation by default', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      act(() => {
        result.current.switchLanguage('ar');
      });

      expect(mockPush).toHaveBeenCalledWith('/ar/dashboard');
      expect(window.location.href).toBe('');
    });

    it('should not switch if already on target language', () => {
      mockUsePathname.mockReturnValue('/ar/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      act(() => {
        result.current.switchLanguage('ar');
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should use full reload when forceReload is true', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      act(() => {
        result.current.switchLanguage('ar', false, true);
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(window.location.href).toBe('/ar/dashboard');
    });

    it('should fallback to full reload if SPA navigation fails', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      // Suppress console.warn for this test
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useLanguageSwitching());

      act(() => {
        result.current.switchLanguage('ar');
      });

      expect(mockPush).toHaveBeenCalledWith('/ar/dashboard');
      expect(window.location.href).toBe('/ar/dashboard');

      consoleSpy.mockRestore();
    });

    it('should log debug information when debug is enabled', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useLanguageSwitching());

      act(() => {
        result.current.switchLanguage('ar', true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '🔄 Language switch debug:',
        expect.objectContaining({
          currentPath: '/en/dashboard',
          currentLang: 'en',
          targetLang: 'ar',
          newPath: '/ar/dashboard',
          forceReload: false
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isCurrentLanguage', () => {
    it('should return true for current language', () => {
      mockUsePathname.mockReturnValue('/ar/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.isCurrentLanguage('ar')).toBe(true);
      expect(result.current.isCurrentLanguage('en')).toBe(false);
    });

    it('should handle English as default', () => {
      mockUsePathname.mockReturnValue('/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.isCurrentLanguage('en')).toBe(true);
      expect(result.current.isCurrentLanguage('ar')).toBe(false);
    });
  });

  describe('getLocalizedText', () => {
    it('should return Arabic text for Arabic locale', () => {
      mockUsePathname.mockReturnValue('/ar/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      const text = result.current.getLocalizedText('مرحبا', 'Hello');
      expect(text).toBe('مرحبا');
    });

    it('should return English text for English locale', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      const text = result.current.getLocalizedText('مرحبا', 'Hello');
      expect(text).toBe('Hello');
    });

    it('should default to English text for invalid locale', () => {
      mockUsePathname.mockReturnValue('/fr/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      const text = result.current.getLocalizedText('مرحبا', 'Hello');
      expect(text).toBe('Hello');
    });
  });

  describe('isRTL', () => {
    it('should return true for Arabic', () => {
      mockUsePathname.mockReturnValue('/ar/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.isRTL).toBe(true);
    });

    it('should return false for English', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.isRTL).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pathname', () => {
      mockUsePathname.mockReturnValue('');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('en');
      expect(result.current.buildLanguageUrl('ar')).toBe('/ar');
    });

    it('should handle pathname with only locale', () => {
      mockUsePathname.mockReturnValue('/ar');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('ar');
      expect(result.current.buildLanguageUrl('en')).toBe('/en/');
    });

    it('should handle pathname with trailing slash', () => {
      mockUsePathname.mockReturnValue('/en/dashboard/');

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('en');
      expect(result.current.buildLanguageUrl('ar')).toBe('/ar/dashboard');
    });

    it('should handle very long nested paths', () => {
      const longPath = '/en/dashboard/listings/123/edit/photos/upload/step/2';
      mockUsePathname.mockReturnValue(longPath);

      const { result } = renderHook(() => useLanguageSwitching());

      expect(result.current.currentLang).toBe('en');
      expect(result.current.buildLanguageUrl('ar')).toBe('/ar/dashboard/listings/123/edit/photos/upload/step/2');
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      mockUsePathname.mockReturnValue('/en/dashboard');

      const { result, rerender } = renderHook(() => useLanguageSwitching());

      const firstResult = result.current;

      // Rerender with same pathname
      rerender();

      // Values should be the same (functions are recreated but values stable)
      expect(result.current.currentLang).toBe(firstResult.currentLang);
      expect(result.current.oppositeLanguage).toBe(firstResult.oppositeLanguage);
      expect(result.current.isRTL).toBe(firstResult.isRTL);
    });
  });
});
