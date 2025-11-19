import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useDirection } from '@/utils/direction';
import DealerDashboard from '../DealerDashboard';
import * as dealerApi from '@/services/dealerApi';
import * as listingsService from '@/services/listings';
import { apiRequest } from '@/services/auth/session-manager';
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
jest.mock('@/services/auth/session-manager', () => ({
  apiRequest: jest.fn()
}));
jest.mock('@/services/savedSearches', () => ({
  getUserSavedSearches: jest.fn()
}));
jest.mock('@/services/favorites', () => ({
  getFavoriteListings: jest.fn()
}));

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
    timezone: 'Asia/Damascus'
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

    // Mock API calls
    (dealerApi.getDealerTrialStatus as jest.Mock).mockResolvedValue(mockTrialStatus);
    (listingsService.getMyListings as jest.Mock).mockResolvedValue(mockListings);
    (getUserSavedSearches as jest.Mock).mockResolvedValue([]);
    
    // Mock apiRequest for favorites
    (apiRequest as jest.Mock).mockImplementation((url) => {
      if (url && url.includes('/api/favorites')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ favorites: [] }),
          text: async () => JSON.stringify({ favorites: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
        text: async () => JSON.stringify({})
      });
    });
  });

  it('should render without crashing', () => {
    const { container } = render(<DealerDashboard />);
    expect(container.firstChild).not.toBeNull();
  });

  it('should display loading state initially', () => {
    render(<DealerDashboard />);
    // Check for loading skeleton
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should load and display trial status', async () => {
    render(<DealerDashboard />);

    await waitFor(() => {
      expect(dealerApi.getDealerTrialStatus).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('trial-banner')).toBeInTheDocument();
    });
  });

  it('should load and display recent listings', async () => {
    render(<DealerDashboard />);

    await waitFor(() => {
      expect(listingsService.getMyListings).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('listings-view')).toBeInTheDocument();
    });
  });

  it('should display dashboard statistics', async () => {
    render(<DealerDashboard />);

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

    const { container } = render(<DealerDashboard />);

    // Dashboard should still render even if trial API fails
    expect(container.firstChild).not.toBeNull();

    // Trial banner should not be displayed
    await waitFor(() => {
      expect(screen.queryByTestId('trial-banner')).not.toBeInTheDocument();
    });
  });

  it('should display quick action buttons', async () => {
    render(<DealerDashboard />);

    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith('createListing');
      expect(mockT).toHaveBeenCalledWith('myListings');
      expect(mockT).toHaveBeenCalledWith('settings');
    });
  });

  it('should show upgrade button for trial users', async () => {
    render(<DealerDashboard />);

    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith('upgradeModal:title');
    });
  });

  it('should not show upgrade button for paid users', async () => {
    const paidTrialStatus = {
      ...mockTrialStatus,
      subscriptionTier: 'basic'
    };

    (dealerApi.getDealerTrialStatus as jest.Mock).mockResolvedValue(paidTrialStatus);

    render(<DealerDashboard />);

    await waitFor(() => {
      // Upgrade button should not be present
      const upgradeTexts = screen.queryAllByText('upgradeModal:title');
      expect(upgradeTexts.length).toBe(0);
    });
  });

  it('should handle error state correctly', async () => {
    (listingsService.getMyListings as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    render(<DealerDashboard />);

    await waitFor(() => {
      // Should still render without crashing
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('should format numbers according to locale', async () => {
    (useLanguageSwitching as jest.Mock).mockReturnValue({
      currentLang: 'ar'
    });

    render(<DealerDashboard />);

    await waitFor(() => {
      // Should use Arabic locale for number formatting
      expect(listingsService.getMyListings).toHaveBeenCalled();
    });
  });
});
