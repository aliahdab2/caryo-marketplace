import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import I18nProvider from '../I18nProvider';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock i18n config
jest.mock('@/app/i18n/config', () => ({
  isValidLocale: (locale: string): locale is 'en' | 'ar' => {
    return ['en', 'ar'].includes(locale);
  },
}));

// Mock i18n exports - define mock object first
const mockI18n = {
  isInitialized: false,
  language: 'en',
  changeLanguage: jest.fn(),
  loadNamespaces: jest.fn(),
  on: jest.fn(),
};

jest.mock('@/utils/i18nExports', () => ({
  __esModule: true,
  default: mockI18n,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18next-provider">{children}</div>,
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Test component
const TestComponent = () => <div data-testid="test-content">Test Content</div>;

describe('I18nProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset i18n mock state
    mockI18n.isInitialized = false;
    mockI18n.language = 'en';
    mockI18n.changeLanguage.mockResolvedValue(undefined);
    mockI18n.loadNamespaces.mockResolvedValue(undefined);
    
    // Reset document attributes
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  describe('Locale Detection', () => {
    it('should detect English locale from URL', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('should detect Arabic locale from URL', async () => {
      mockUsePathname.mockReturnValue('/ar/search');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('ar');
    });

    it('should default to English for invalid locale', async () => {
      mockUsePathname.mockReturnValue('/fr/invalid');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('should default to English for root path', async () => {
      mockUsePathname.mockReturnValue('/');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle complex nested paths', async () => {
      mockUsePathname.mockReturnValue('/ar/dashboard/listings/123/edit');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('ar');
    });
  });

  describe('I18n Initialization', () => {
    it('should wait for i18n initialization when not initialized', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = false;

      // Mock the initialization promise
      mockI18n.on.mockImplementation((event, callback) => {
        if (event === 'initialized') {
          setTimeout(callback, 10);
        }
      });

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Should show loading initially
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(mockI18n.on).toHaveBeenCalledWith('initialized', expect.any(Function));
    });

    it('should skip initialization wait when already initialized', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(mockI18n.on).not.toHaveBeenCalled();
    });

    it('should load required namespaces', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(mockI18n.loadNamespaces).toHaveBeenCalledWith(['common', 'listings', 'errors']);
    });

    it('should handle initialization errors gracefully', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;
      mockI18n.changeLanguage.mockRejectedValue(new Error('Failed to change language'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error initializing i18n:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Optimization', () => {
    it('should not re-initialize when locale has not changed', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;
      mockI18n.language = 'en';

      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Clear mocks after first render
      jest.clearAllMocks();

      // Rerender with same pathname
      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Should not call changeLanguage again
      expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
    });

    it('should re-initialize when locale changes', async () => {
      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Start with English
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;
      mockI18n.language = 'en';

      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');

      // Clear mocks
      jest.clearAllMocks();

      // Switch to Arabic
      mockUsePathname.mockReturnValue('/ar/dashboard');
      mockI18n.language = 'ar';

      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('ar');
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('should only load namespaces once', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;

      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Clear mocks after first render
      const loadNamespacesCalls = mockI18n.loadNamespaces.mock.calls.length;
      jest.clearAllMocks();

      // Rerender
      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Should not load namespaces again
      expect(mockI18n.loadNamespaces).not.toHaveBeenCalled();
    });
  });

  describe('Document Attributes', () => {
    it('should set correct attributes for English', async () => {
      mockUsePathname.mockReturnValue('/en/page');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });

    it('should set correct attributes for Arabic', async () => {
      mockUsePathname.mockReturnValue('/ar/page');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('should update attributes when language changes', async () => {
      mockI18n.isInitialized = true;

      const { rerender } = render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Start with English
      mockUsePathname.mockReturnValue('/en/page');
      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.lang).toBe('en');
        expect(document.documentElement.dir).toBe('ltr');
      });

      // Switch to Arabic
      mockUsePathname.mockReturnValue('/ar/page');
      rerender(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.lang).toBe('ar');
        expect(document.documentElement.dir).toBe('rtl');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while initializing', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = false;

      // Mock delayed initialization
      mockI18n.on.mockImplementation((event, callback) => {
        if (event === 'initialized') {
          setTimeout(callback, 50);
        }
      });

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Should show loading indicator
      const loadingIndicator = screen.getByTestId('loading-bar');
      expect(loadingIndicator).toBeInTheDocument();

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Loading indicator should be gone
      expect(screen.queryByTestId('loading-bar')).not.toBeInTheDocument();
    });

    it('should not show loading indicator when already mounted and initialized', async () => {
      mockUsePathname.mockReturnValue('/en/dashboard');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Should not show loading indicator
      expect(screen.queryByTestId('loading-bar')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pathname', async () => {
      mockUsePathname.mockReturnValue('');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });

    it('should handle pathname with only locale', async () => {
      mockUsePathname.mockReturnValue('/ar');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('should handle pathname with query parameters', async () => {
      mockUsePathname.mockReturnValue('/en/search?brand=toyota');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('en');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle very long nested paths', async () => {
      mockUsePathname.mockReturnValue('/ar/dashboard/listings/123/edit/photos/upload');
      mockI18n.isInitialized = true;

      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });
  });
});
