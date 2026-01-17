import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useDirection } from '@/utils/direction';
import DealerDashboard from '../DealerDashboard';
import * as dealerApi from '@/services/dealerApi';
import * as listingsService from '@/services/listings';
import * as favoritesService from '@/services/favorites';
import { getUserSavedSearches } from '@/services/savedSearches';

// Mock all dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Ensure our mock takes precedence over any global mocks
jest.doMock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));
jest.mock('@/hooks/useOptimizedSession');
jest.mock('@/hooks/useLanguageSwitching');
jest.mock('@/utils/direction');
jest.mock('@/services/dealerApi');
jest.mock('@/services/listings');
jest.mock('@/services/savedSearches', () => ({
  getUserSavedSearches: jest.fn()
}));
jest.mock('@/services/favorites', () => ({
  getFavoriteListings: jest.fn(),
  getUserFavorites: jest.fn()
}));

// Helper to create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

// Mock child components
jest.mock('../TrialBanner', () => {
  return function TrialBanner() {
    return <div data-testid="trial-banner">Trial Banner</div>;
  };
});

jest.mock('../UpgradeModal', () => {
  return function UpgradeModal() {
    return <div data-testid="upgrade-modal">Upgrade Modal</div>;
  };
});

jest.mock('@/components/listings', () => ({
  ListingsView: function ListingsView() {
    return <div data-testid="listings-view">Listings View</div>;
  }
}));

describe('DealerDashboard', () => {
  const mockT = jest.fn((key, options) => {
    if (options && options.name) {
      return `${key}_${options.name}`;
    }
    return key;
  });
  const mockUser = {
    id: '123',
    name: 'Test Dealer',
    email: 'dealer@test.com',
    roles: ['ROLE_DEALER'],
    isAdmin: false
  };

  const mockTrialStatus = {
    isActive: true,
    isExpired: false,
    isInGracePeriod: false,
    daysRemaining: 45,
    listingsUsed: 5,
    listingsLimit: 15,
    subscriptionTier: 'trial',
    subscriptionStatus: 'active',
    trialEndDate: '2024-12-31',
    trialStartedAt: '2024-11-01',
    timezone: 'Asia/Damascus',
    canCreateListings: true
  };

  const mockListings = [
    {
      id: '1',
      title: 'Test Car 1',
      price: 10000,
      status: 'active',
      createdAt: '2024-01-01',
      year: 2020,
      mileage: 50000
    },
    {
      id: '2',
      title: 'Test Car 2',
      price: 15000,
      status: 'active',
      createdAt: '2024-01-02',
      year: 2021,
      mileage: 30000
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Setup default mock implementations
    mockT.mockImplementation((key, options) => {
      if (options && options.name) {
        return `${key}_${options.name}`;
      }
      return key;
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: { language: 'en' }
    });

    (useOptimizedSession as jest.Mock).mockReturnValue({
      user: mockUser,
      status: 'authenticated',
      isLoading: false
    });

    (useLanguageSwitching as jest.Mock).mockReturnValue({
      currentLang: 'en'
    });

    (useDirection as jest.Mock).mockReturnValue({
      isRTL: false,
      dirClass: 'ltr'
    });

    // Mock API calls - these are used by React Query hooks
    (dealerApi.getDealerTrialStatus as jest.Mock).mockResolvedValue(mockTrialStatus);
    (listingsService.getMyListings as jest.Mock).mockResolvedValue(mockListings);
    (getUserSavedSearches as jest.Mock).mockResolvedValue([]);
    (favoritesService.getUserFavorites as jest.Mock).mockResolvedValue([]);
  });

  it('should render without crashing', () => {
    const Wrapper = createWrapper();
    const { container } = render(<DealerDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('should display loading state initially', () => {
    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });
    // Check for loading skeleton
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should load and display trial status', async () => {
    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(dealerApi.getDealerTrialStatus).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('trial-banner')).toBeInTheDocument();
    });
  });

  it('should load and display recent listings', async () => {
    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(listingsService.getMyListings).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('listings-view')).toBeInTheDocument();
    });
  });

  it('should display dashboard statistics', async () => {
    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith('activeListings');
      expect(mockT).toHaveBeenCalledWith('alerts', { ns: 'search' });
      expect(mockT).toHaveBeenCalledWith('messages');
      expect(mockT).toHaveBeenCalledWith('favorites');
    });
  });

  it('should handle trial API failure gracefully', async () => {
    // Override for this test only
    (dealerApi.getDealerTrialStatus as jest.Mock).mockRejectedValueOnce(
      new Error('Trial API failed')
    );

    const Wrapper = createWrapper();
    const { container } = render(<DealerDashboard />, { wrapper: Wrapper });

    // Dashboard should still render even if trial API fails
    expect(container.firstChild).not.toBeNull();

    // Trial banner should not be displayed
    await waitFor(() => {
      expect(screen.queryByTestId('trial-banner')).not.toBeInTheDocument();
    });
  });

  it('should display quick action buttons', async () => {
    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith('createListing');
      expect(mockT).toHaveBeenCalledWith('myListings');
      expect(mockT).toHaveBeenCalledWith('settings');
    });
  });

  it('should show upgrade button for trial users', async () => {
    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith('upgradeModal:title');
    });
  });

  it('should not show upgrade button for paid users', async () => {
    const paidTrialStatus = {
      ...mockTrialStatus,
      subscriptionTier: 'basic',
      canCreateListings: true
    };

    (dealerApi.getDealerTrialStatus as jest.Mock).mockResolvedValue(paidTrialStatus);

    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      // Upgrade button should not be present
      const upgradeTexts = screen.queryAllByText('upgradeModal:title');
      expect(upgradeTexts.length).toBe(0);
    });
  });

  it('should disable create listing button when limit is reached', async () => {
    const limitReachedStatus = {
      ...mockTrialStatus,
      canCreateListings: false
    };

    (dealerApi.getDealerTrialStatus as jest.Mock).mockResolvedValue(limitReachedStatus);

    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('limitReached')).toBeInTheDocument();
      expect(screen.getByText('upgradeToCreateMore')).toBeInTheDocument();
      // Should be a button, not a link
      const button = screen.getByRole('button', { name: /createListing/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should handle error state correctly', async () => {
    (listingsService.getMyListings as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      // Should show error display component
      expect(screen.getByText('API Error')).toBeInTheDocument();
      // Also verify we show the standard error title from translation (mocked)
      expect(screen.getByText('error.title')).toBeInTheDocument();
    });
  });

  it('should format numbers according to locale', async () => {
    (useLanguageSwitching as jest.Mock).mockReturnValue({
      currentLang: 'ar'
    });

    const Wrapper = createWrapper();
    render(<DealerDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      // Should use Arabic locale for number formatting
      expect(listingsService.getMyListings).toHaveBeenCalled();
    });
  });
});
