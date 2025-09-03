/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import VerifyEmailPage from '../page';
import { getAuthUrl } from '@/utils/constants/api';
import { TEMP_AUTH_KEYS, AUTO_LOGIN_CONFIG } from '@/types/auto-login';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@/hooks/useLazyTranslation', () => {
  return jest.fn(() => {});
});

jest.mock('@/utils/constants/api', () => ({
  getAuthUrl: jest.fn(),
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('VerifyEmailPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
    });

    (getAuthUrl as jest.Mock).mockReturnValue('http://localhost:8080/api/auth/verify-email');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Token Validation', () => {
    it('should show error when no token is provided', async () => {
      mockGet.mockReturnValue(null);

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });

      expect(mockT).toHaveBeenCalledWith('invalidVerificationToken');
    });

    it('should make API call when token is provided', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({
          message: 'Email verified successfully',
        }),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/auth/verify-email?token=valid-token'
        );
      });
    });
  });

  describe('JWT Response Handling (Auto-Login)', () => {
    const jwtResponse = {
      token: 'jwt.token.here',
      type: 'Bearer',
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
    };

    it('should handle JWT response and store temporary auth data', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(jwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          TEMP_AUTH_KEYS.TOKEN,
          jwtResponse.token
        );
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.USER,
        JSON.stringify({
          id: jwtResponse.id,
          username: jwtResponse.username,
          email: jwtResponse.email,
          roles: jwtResponse.roles,
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.EXPIRES,
        expect.any(String)
      );
    });

    it('should call auto-login API and redirect to homepage after delay', async () => {
      mockGet.mockReturnValue('valid-token');
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

      // Mock window.location
      const mockLocation = { href: '' };
      delete (window as unknown as { location: unknown }).location;
      (window as unknown as { location: typeof mockLocation }).location = mockLocation;

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalled();
      });

      // Fast-forward the timeout
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      await waitFor(() => {
        // Should call auto-login API
        expect(fetch).toHaveBeenCalledWith('/api/auth/auto-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              roles: ['ROLE_USER']
            }
          })
        });
      });

      await waitFor(() => {
        // Should redirect via window.location.href
        expect(mockLocation.href).toBe('/');
      }, { timeout: 3000 });
    });

    it('should clean up localStorage after JWT response', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(jwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('signup-email');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('signup-username');
      });
    });

    it('should show success status for JWT response', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(jwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('emailVerified')).toHaveLength(2);
      });
    });
  });

  describe('Message Response Handling (Already Verified)', () => {
    const messageResponse = {
      message: 'Email already verified',
      email: 'test@example.com',
    };

    it('should handle message response and attempt fresh JWT request', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => 'application/json',
          },
          json: () => Promise.resolve(messageResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(jwtResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // Mock window.location
      const mockLocation = { href: '' };
      delete (window as unknown as { location: unknown }).location;
      (window as unknown as { location: typeof mockLocation }).location = mockLocation;

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('emailVerified')).toHaveLength(2);
      });

      // Fast-forward the timeout
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        // Should attempt to get fresh JWT
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/verify-email?token='),
          expect.objectContaining({ method: 'GET' })
        );
      });

      await waitFor(() => {
        // Should redirect via window.location.href after successful auto-login
        expect(window.location.href).toBe('/');
      }, { timeout: 3000 });
    });

    it('should not store temporary auth data for message response', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(messageResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('emailVerified')).toHaveLength(2);
      });

      expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.TOKEN,
        expect.anything()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({
          message: 'Invalid token',
        }),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });
    });

    it('should handle network errors', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });

      expect(mockT).toHaveBeenCalledWith('verificationError');
    });

    it('should handle non-JSON responses', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'text/html',
        },
        json: () => Promise.resolve({}),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });
    });
  });

  describe('UI States', () => {
    it('should show loading state initially', () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<VerifyEmailPage />);

      expect(screen.getAllByText('verifying')).toHaveLength(2);
    });

    it('should show success state after verification', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({
          message: 'Email verified successfully',
        }),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('emailVerified')).toHaveLength(2);
      });
    });

    it('should show error state for failed verification', async () => {
      mockGet.mockReturnValue('valid-token');
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({
          message: 'Token expired',
        }),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });
    });
  });
});
