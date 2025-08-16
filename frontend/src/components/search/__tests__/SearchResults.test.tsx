import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchResults from '../SearchResults';

// Mock translations
jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    t: (key: string, fallbackOrOptions?: unknown) => {
      if (typeof fallbackOrOptions === 'string') return fallbackOrOptions;
      if (fallbackOrOptions && typeof fallbackOrOptions === 'object' && 'defaultValue' in (fallbackOrOptions as Record<string, unknown>)) {
        return (fallbackOrOptions as { defaultValue?: string }).defaultValue || String(key);
      }
      return String(key);
    },
    ready: true
  })
}));

// Mock language direction
jest.mock('@/utils/languageDirection', () => ({
  useLanguageDirection: () => ({
    isRTL: false,
    dirClass: 'ltr'
  })
}));

// Mock announcements
jest.mock('@/hooks/useAccessibility', () => ({
  useAnnouncements: () => ({
    announce: jest.fn()
  })
}));

describe('SearchResults', () => {
  const mockProps = {
    carListings: null,
    isLoading: false,
    isManualSearch: false,
    error: null,
    onRetry: jest.fn(),
    onFavoriteToggle: jest.fn(),
    className: '',
    viewMode: 'grid' as const,
    onViewModeChange: jest.fn(),
    sortBy: 'date_new',
    onSortChange: jest.fn(),
    searchQuery: ''
  };

  it('renders without crashing', () => {
    render(<SearchResults {...mockProps} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<SearchResults {...mockProps} isLoading={true} />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<SearchResults {...mockProps} error="Test error" />);
    expect(screen.getByText('Error loading results')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<SearchResults {...mockProps} carListings={{ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10, last: true }} />);
    expect(screen.getByText('No cars found')).toBeInTheDocument();
  });
});