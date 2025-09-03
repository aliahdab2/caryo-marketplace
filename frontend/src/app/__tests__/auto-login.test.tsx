/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import Home from '../page';
import { TEMP_AUTH_KEYS } from '@/types/auto-login';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
    i18n: { language: 'en' },
    ready: true,
  })),
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

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/?auto-login=true',
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock window.history
const mockHistory = {
  replaceState: jest.fn(),
};
Object.defineProperty(window, 'history', {
  value: mockHistory,
});

describe('Home Page Auto-Login', () => {
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  describe('Auto-Login Flow', () => {
    const validTempUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
    };

    const validTempToken = 'valid.jwt.token';
    const validExpiration = (Date.now() + 300000).toString(); // 5 minutes from now

    beforeEach(() => {
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case TEMP_AUTH_KEYS.TOKEN:
            return validTempToken;
          case TEMP_AUTH_KEYS.USER:
            return JSON.stringify(validTempUser);
          case TEMP_AUTH_KEYS.EXPIRES:
            return validExpiration;
          default:
            return null;
        }
      });
    });

    it('should trigger auto-login when auto-login parameter is present', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/auto-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: validTempToken,
            user: validTempUser,
          }),
        });
      });
    });

    it('should clean up session storage on successful auto-login', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);
      });
    });

    it('should clean up URL parameters on successful auto-login', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockHistory.replaceState).toHaveBeenCalled();
      });
    });

    it('should reload page on successful auto-login', async () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockLocation.reload).toHaveBeenCalled();
      });
    });
  });

  describe('Auto-Login Error Handling', () => {
    it('should clean up on API error', async () => {
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

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Authentication failed' }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);
      });
    });

    it('should clean up on network error', async () => {
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

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      });
    });

    it('should clean up expired tokens', async () => {
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
            return (Date.now() - 1000).toString(); // Expired 1 second ago
          default:
            return null;
        }
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);
      });

      // Should not make API call for expired tokens
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should clean up invalid user data', async () => {
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
              id: 'invalid', // Should be number
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

      render(<Home />);

      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      });

      // Should not make API call for invalid user data
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('No Auto-Login Scenarios', () => {
    it('should not trigger auto-login when parameter is missing', () => {
      mockGet.mockReturnValue(null);

      render(<Home />);

      expect(fetch).not.toHaveBeenCalled();
      expect(mockSessionStorage.getItem).not.toHaveBeenCalled();
    });

    it('should not trigger auto-login when temp data is missing', () => {
      mockGet.mockImplementation((param: string) => {
        if (param === 'auto-login') return 'true';
        return null;
      });

      mockSessionStorage.getItem.mockReturnValue(null);

      render(<Home />);

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
