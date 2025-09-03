/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import VerifyEmailPage from '@/app/auth/verify-email/page';
import Home from '@/app/page';
import { TEMP_AUTH_KEYS, AUTO_LOGIN_CONFIG } from '@/types/auto-login';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

jest.mock('@/hooks/useLazyTranslation', () => {
  const mockHook = jest.fn(() => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
    ready: true,
  }));
  
  return {
    __esModule: true,
    default: mockHook, // For default imports
    useLazyTranslation: mockHook, // For named imports
  };
});

jest.mock('@/utils/constants/api', () => ({
  getAuthUrl: jest.fn(() => 'http://localhost:8080/api/auth/verify-email'),
}));

jest.mock('@/components/search/HomeSearchBar', () => {
  return function MockHomeSearchBar() {
    return <div data-testid="home-search-bar">Search Bar</div>;
  };
});

jest.mock('@/components/home/HomeCarListings', () => {
  return function MockHomeCarListings() {
    return <div data-testid="home-car-listings">Car Listings</div>;
  };
});

jest.mock('@/services/publicApi', () => ({
  fetchLatestListingsPublic: jest.fn(() => Promise.resolve([])),
  subscribeToNewsletter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock storage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window methods
const mockLocation = {
  href: 'http://localhost:3000',
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const mockHistory = {
  replaceState: jest.fn(),
};
Object.defineProperty(window, 'history', {
  value: mockHistory,
});

describe('Auto-Login Integration Flow', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete Auto-Login Flow', () => {
    const _mockCurrentTime = 1000000000000; // Fixed timestamp (unused)
    const jwtResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
      type: 'Bearer',
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
    };

    it('should complete full auto-login flow from email verification to homepage', async () => {
      // Step 1: Email verification with JWT response
      mockGet.mockReturnValue('verification-token');
      
      // Setup fetch mocks for both calls
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => 'application/json',
          },
          json: () => Promise.resolve(jwtResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { unmount } = render(<VerifyEmailPage />);

      // Wait for verification to complete
      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          TEMP_AUTH_KEYS.TOKEN,
          jwtResponse.token
        );
      });

      // Verify temp user data is stored
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.USER,
        JSON.stringify({
          id: jwtResponse.id,
          username: jwtResponse.username,
          email: jwtResponse.email,
          roles: jwtResponse.roles,
        })
      );

      // Verify expiration is set
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.EXPIRES,
        expect.any(String)
      );

      // Fast-forward redirect timer
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      // Verify redirect to homepage with auto-login parameter
      expect(mockPush).toHaveBeenCalledWith('/?auto-login=true');

      unmount();

      // Step 2: Homepage auto-login
      jest.clearAllMocks();

      // Re-setup fetch mock for auto-login API call
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Mock homepage search params
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      // Mock session storage with stored data
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case TEMP_AUTH_KEYS.TOKEN:
            return jwtResponse.token;
          case TEMP_AUTH_KEYS.USER:
            return JSON.stringify({
              id: jwtResponse.id,
              username: jwtResponse.username,
              email: jwtResponse.email,
              roles: jwtResponse.roles,
            });
          case TEMP_AUTH_KEYS.EXPIRES:
            return (Date.now() + 3600000).toString(); // 1 hour from now (very safe)
          default:
            return null;
        }
      });

      render(<Home />);

      // Wait for auto-login API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/auto-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: jwtResponse.token,
            user: {
              id: jwtResponse.id,
              username: jwtResponse.username,
              email: jwtResponse.email,
              roles: jwtResponse.roles,
            },
          }),
        });
      });

      // Verify cleanup after successful auto-login
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);

      // Verify URL cleanup
      expect(mockHistory.replaceState).toHaveBeenCalled();

      // Verify page reload
      expect(mockLocation.reload).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle expired tokens gracefully', async () => {
      // Setup homepage with expired token
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case TEMP_AUTH_KEYS.TOKEN:
            return 'expired.jwt.token';
          case TEMP_AUTH_KEYS.USER:
            return JSON.stringify({
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              roles: ['ROLE_USER'],
            });
          case TEMP_AUTH_KEYS.EXPIRES:
            return (Date.now() - 1000).toString(); // Expired 1 second ago
          default:
            return null;
        }
      });

      render(<Home />);

      // Should clean up expired data without making API call
      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle auto-login API failures', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case TEMP_AUTH_KEYS.TOKEN:
            return 'valid.jwt.token';
          case TEMP_AUTH_KEYS.USER:
            return JSON.stringify({
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              roles: ['ROLE_USER'],
            });
          case TEMP_AUTH_KEYS.EXPIRES:
            return (Date.now() + 300000).toString();
          default:
            return null;
        }
      });

      // Mock API failure
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Session creation failed' }),
      });

      render(<Home />);

      // Should clean up on failure
      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      });
    });
  });

  describe('Security Validations', () => {
    it('should validate JWT token format', async () => {
      mockGet.mockReturnValue('verification-token');

      // Mock response with invalid token format
      const invalidJwtResponse = {
        token: 'invalid-token-format', // Missing dots
        type: 'Bearer',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ROLE_USER'],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(invalidJwtResponse),
      });

      render(<VerifyEmailPage />);

      // Should not store invalid token
      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });

      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.TOKEN,
        'invalid-token-format'
      );
    });

    it('should validate user data structure', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      // Mock invalid user data
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case TEMP_AUTH_KEYS.TOKEN:
            return 'valid.jwt.token';
          case TEMP_AUTH_KEYS.USER:
            return JSON.stringify({
              id: 'invalid', // Should be number
              username: 'testuser',
              // Missing email
              roles: 'ROLE_USER', // Should be array
            });
          case TEMP_AUTH_KEYS.EXPIRES:
            return (Date.now() + 300000).toString();
          default:
            return null;
        }
      });

      render(<Home />);

      // Should clean up invalid data without making API call
      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      });

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
