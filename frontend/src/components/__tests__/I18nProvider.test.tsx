import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';

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

// Mock i18n exports - simple mock that avoids async complications
jest.mock('@/utils/i18nExports', () => ({
  __esModule: true,
  default: {
    isInitialized: true,
    language: 'en',
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    loadNamespaces: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18next-provider">{children}</div>,
}));

// Import after mocks
import I18nProvider from '../I18nProvider';

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Test component
const TestComponent = () => <div data-testid="test-content">Test Content</div>;

describe('I18nProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render and initialize correctly', async () => {
    mockUsePathname.mockReturnValue('/en/test');

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for initialization to complete and provider to render
    await waitFor(() => {
      expect(screen.getByTestId('i18next-provider')).toBeInTheDocument();
    });
  });

  it('should handle different locales', async () => {
    mockUsePathname.mockReturnValue('/ar/dashboard');

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('i18next-provider')).toBeInTheDocument();
    });
  });

  it('should call loadNamespaces on mount', () => {
    const mockI18n = require('@/utils/i18nExports').default;
    mockUsePathname.mockReturnValue('/en/test');
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(mockI18n.loadNamespaces).toHaveBeenCalled();
  });

  it('should handle invalid locales', async () => {
    mockUsePathname.mockReturnValue('/invalid/test');

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('i18next-provider')).toBeInTheDocument();
    });
  });

  it('should handle root path', async () => {
    mockUsePathname.mockReturnValue('/');

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('i18next-provider')).toBeInTheDocument();
    });
  });
});