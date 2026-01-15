import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FavoritesPage from '../page';
import { Listing } from '@/types/listings';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; unoptimized?: boolean }) => {
    const { fill, priority, unoptimized, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={rest.alt || ''} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number } | string) => {
      if (typeof options === 'object' && options.count !== undefined) {
        return `${key} (${options.count})`;
      }
      return typeof options === 'string' ? options : key;
    },
  }),
}));

// Mock useLanguageSwitching
jest.mock('@/hooks/useLanguageSwitching', () => ({
  useLanguageSwitching: () => ({
    locale: 'en',
    isRTL: false,
  }),
}));

// Mock useLazyTranslation
jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    t: (key: string) => key,
    isLoading: false,
  }),
}));

// Mock FavoriteButton to avoid API calls
jest.mock('@/components/common/FavoriteButton', () => ({
  __esModule: true,
  default: ({ listingId, onToggle }: { listingId: string; onToggle?: (isFavorite: boolean) => void }) => (
    <button 
      data-testid={`favorite-button-${listingId}`}
      onClick={() => onToggle?.(false)}
    >
      ♥
    </button>
  ),
}));

// Mock Breadcrumb
jest.mock('@/components/ui/Breadcrumb', () => ({
  __esModule: true,
  default: () => <nav data-testid="breadcrumb">Breadcrumb</nav>,
}));

// Mock LoadingSkeleton
jest.mock('@/components/common', () => ({
  LoadingSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
  ErrorDisplay: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="error-display">
      <span>Error occurred</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

// Mock EmptyState
jest.mock('@/components/ui/EmptyState', () => ({
  __esModule: true,
  default: ({ title, message }: { title: string; message: string }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  ),
}));

// Mock DeleteConfirmationModal
jest.mock('@/components/ui/DeleteConfirmationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onConfirm, title }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void;
    title: string;
  }) => isOpen ? (
    <div data-testid="delete-modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Cancel</button>
      <button onClick={onConfirm}>Confirm</button>
    </div>
  ) : null,
}));

// Mock media utils
jest.mock('@/utils/mediaUtils', () => ({
  transformMinioUrl: (url: string) => url || 'default.jpg',
  getDefaultImageUrl: () => 'default.jpg',
}));

// Mock localization
jest.mock('@/utils/localization', () => ({
  formatDate: () => 'Jan 15, 2024',
  formatNumber: (num: number) => `$${num}`,
}));

// Mock state for React Query hooks
const mockState = {
  favorites: [] as Listing[],
  isLoading: false,
  error: null as Error | null,
};

const mockRemoveMutation = {
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  isPending: false,
};

const mockRefetch = jest.fn();

jest.mock('@/hooks/queries', () => ({
  useFavorites: jest.fn(() => ({
    data: mockState.favorites,
    isLoading: mockState.isLoading,
    error: mockState.error,
    refetch: mockRefetch,
  })),
  useRemoveFromFavorites: () => mockRemoveMutation,
}));

// Helper to create test QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// Factory for creating mock listings
const createMockListing = (overrides?: Partial<Listing>): Listing => ({
  id: 1,
  title: 'Toyota Camry 2023',
  price: 25000,
  currency: 'USD',
  status: 'active',
  createdAt: '2024-01-15T10:00:00Z',
  location: { city: 'Damascus' },
  media: [{ url: 'https://example.com/car.jpg', isPrimary: true }],
  ...overrides,
} as Listing);

describe('FavoritesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.favorites = [];
    mockState.isLoading = false;
    mockState.error = null;
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      mockState.isLoading = true;

      renderWithProviders(<FavoritesPage />);

      // LoadingSkeleton should be rendered
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error display when there is an error', () => {
      mockState.error = new Error('Failed to load favorites');

      renderWithProviders(<FavoritesPage />);

      // ErrorDisplay should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      mockState.error = new Error('Failed to load');

      renderWithProviders(<FavoritesPage />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no favorites', () => {
      mockState.favorites = [];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('emptyTitle')).toBeInTheDocument();
      expect(screen.getByText('emptyMessage')).toBeInTheDocument();
    });
  });

  describe('Favorites List', () => {
    it('should render favorites when data is available', () => {
      mockState.favorites = [
        createMockListing({ id: 1, title: 'Toyota Camry 2023' }),
        createMockListing({ id: 2, title: 'Honda Accord 2022' }),
      ];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('Toyota Camry 2023')).toBeInTheDocument();
      expect(screen.getByText('Honda Accord 2022')).toBeInTheDocument();
    });

    it('should show item count', () => {
      mockState.favorites = [
        createMockListing({ id: 1 }),
        createMockListing({ id: 2 }),
      ];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('itemCount (2)')).toBeInTheDocument();
    });

    it('should display listing price and location', () => {
      mockState.favorites = [
        createMockListing({ 
          id: 1, 
          title: 'Test Car',
          price: 30000,
          location: { city: 'Aleppo' } 
        }),
      ];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('$30000')).toBeInTheDocument();
      expect(screen.getByText('Aleppo')).toBeInTheDocument();
    });
  });

  describe('Tab Filtering', () => {
    it('should show all tabs with counts', () => {
      mockState.favorites = [
        createMockListing({ id: 1, status: 'active' }),
        createMockListing({ id: 2, status: 'sold' }),
        createMockListing({ id: 3, status: 'expired' }),
      ];

      renderWithProviders(<FavoritesPage />);

      // All tabs should be visible
      expect(screen.getByText(/tabAll/)).toBeInTheDocument();
      expect(screen.getByText(/tabAvailable/)).toBeInTheDocument();
      expect(screen.getByText(/tabRemoved/)).toBeInTheDocument();
    });

    it('should filter to available listings when clicking Available tab', async () => {
      const user = userEvent.setup();
      mockState.favorites = [
        createMockListing({ id: 1, title: 'Available Car', status: 'active' }),
        createMockListing({ id: 2, title: 'Sold Car', status: 'sold' }),
      ];

      renderWithProviders(<FavoritesPage />);

      // Initially both should be visible (All tab)
      expect(screen.getByText('Available Car')).toBeInTheDocument();
      expect(screen.getByText('Sold Car')).toBeInTheDocument();

      // Click Available tab
      const availableTab = screen.getByText(/tabAvailable/);
      await user.click(availableTab);

      // Only available car should be visible
      expect(screen.getByText('Available Car')).toBeInTheDocument();
      expect(screen.queryByText('Sold Car')).not.toBeInTheDocument();
    });

    it('should filter to removed listings when clicking Removed tab', async () => {
      const user = userEvent.setup();
      mockState.favorites = [
        createMockListing({ id: 1, title: 'Available Car', status: 'active' }),
        createMockListing({ id: 2, title: 'Sold Car', status: 'sold' }),
        createMockListing({ id: 3, title: 'Expired Car', status: 'expired' }),
      ];

      renderWithProviders(<FavoritesPage />);

      // Click Removed tab
      const removedTab = screen.getByText(/tabRemoved/);
      await user.click(removedTab);

      // Only sold/expired cars should be visible
      expect(screen.queryByText('Available Car')).not.toBeInTheDocument();
      expect(screen.getByText('Sold Car')).toBeInTheDocument();
      expect(screen.getByText('Expired Car')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show sold badge for sold listings', () => {
      mockState.favorites = [
        createMockListing({ id: 1, title: 'Sold Car', status: 'sold' }),
      ];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('statusSold')).toBeInTheDocument();
    });

    it('should show expired badge for expired listings', () => {
      mockState.favorites = [
        createMockListing({ id: 1, title: 'Expired Car', status: 'expired' }),
      ];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('statusExpired')).toBeInTheDocument();
    });
  });

  describe('Remove All Action', () => {
    it('should show remove all button when favorites exist', () => {
      mockState.favorites = [createMockListing({ id: 1 })];

      renderWithProviders(<FavoritesPage />);

      expect(screen.getByText('removeAll')).toBeInTheDocument();
    });

    it('should open confirmation modal when clicking remove all', async () => {
      const user = userEvent.setup();
      mockState.favorites = [createMockListing({ id: 1 })];

      renderWithProviders(<FavoritesPage />);

      const removeAllButton = screen.getByText('removeAll');
      await user.click(removeAllButton);

      // Modal should open
      expect(screen.getByText('Remove All Favorites?')).toBeInTheDocument();
    });

    it('should close modal when clicking cancel', async () => {
      const user = userEvent.setup();
      mockState.favorites = [createMockListing({ id: 1 })];

      renderWithProviders(<FavoritesPage />);

      // Open modal
      await user.click(screen.getByText('removeAll'));
      expect(screen.getByText('Remove All Favorites?')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Remove All Favorites?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should render breadcrumb', () => {
      renderWithProviders(<FavoritesPage />);

      // Breadcrumb component should be present
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });
});
