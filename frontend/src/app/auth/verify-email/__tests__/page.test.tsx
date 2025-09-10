import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useLazyTranslation from '@/hooks/useLazyTranslation';
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

jest.mock('@/hooks/useLazyTranslation');

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
  writable: true,
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
  writable: true,
});

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true,
});

describe('VerifyEmailPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockT = jest.fn((key: string) => key);

  const jwtResponse = {
    token: 'valid.jwt.token',
    type: 'Bearer',
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['ROLE_USER'],
  };

  const messageResponse = {
    message: 'Email already verified',
    email: 'test@example.com',
  };

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

    (useLazyTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      ready: true,
    });

    (getAuthUrl as jest.Mock).mockReturnValue('http://localhost:8080/api/auth/verify-email');

    // Reset location mock
    mockLocation.href = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Token Validation', () => {
    it('should show error when no token is provided', async () => {
      mockGet.mockReturnValue(null);

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('invalidVerificationToken')).toBeInTheDocument();
      });

      expect(mockT).toHaveBeenCalledWith('invalidVerificationToken');
    });

    it('should show error when empty token is provided', async () => {
      mockGet.mockReturnValue('');

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('invalidVerificationToken')).toBeInTheDocument();
      });
    });
  });

  describe('Email Verification - JWT Response (New User)', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(jwtResponse),
      });
    });

    it('should handle successful verification with JWT response', async () => {
      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/verify-email?token=valid-token-123'
      );
    });

    it('should store temporary auth data in sessionStorage', async () => {
      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          TEMP_AUTH_KEYS.TOKEN,
          'valid.jwt.token'
        );
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.USER,
        JSON.stringify({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        })
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.EXPIRES,
        expect.any(String)
      );
    });

    it('should clean up localStorage after successful verification', async () => {
      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('signup-email');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('signup-username');
      });
    });

    it('should call auto-login API after delay', async () => {
      const mockAutoLoginFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(jwtResponse),
        })
        .mockImplementation(mockAutoLoginFetch);

      render(<VerifyEmailPage />);

      // Wait for initial verification
      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      // Fast-forward the timeout
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      await waitFor(() => {
        expect(mockAutoLoginFetch).toHaveBeenCalledWith('/api/auth/auto-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 'valid.jwt.token',
            user: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              roles: ['ROLE_USER'],
            },
          }),
        });
      });
    });

    it('should redirect to homepage after successful auto-login', async () => {
      const mockAutoLoginFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(jwtResponse),
        })
        .mockImplementation(mockAutoLoginFetch);

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });

      // Should clean up sessionStorage after successful auto-login
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);
    });

    it('should handle invalid JWT token format', async () => {
      const invalidJwtResponse = {
        ...jwtResponse,
        token: 'invalid-token', // Missing dots
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(invalidJwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });

      expect(mockT).toHaveBeenCalledWith('verificationFailed');
    });
  });

  describe('Email Verification - Message Response (Already Verified)', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
    });

    it('should handle message response and attempt fresh JWT request', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(messageResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(jwtResponse),
        });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Email already verified')).toBeInTheDocument();
      });

      // Should attempt to get fresh JWT
      act(() => {
        jest.advanceTimersByTime(1000); // Wait for the setTimeout in the component
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle fresh JWT response after message response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(messageResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(jwtResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Email already verified')).toBeInTheDocument();
      });

      // Fast-forward through the first timeout (fresh JWT request)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Wait for the fresh JWT request to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      // Fast-forward through the auto-login delay
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3);
      }, { timeout: 3000 });

      expect(fetch).toHaveBeenNthCalledWith(3, '/api/auth/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid.jwt.token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            roles: ['ROLE_USER'],
          },
        }),
      });
    });

    it('should handle failed fresh JWT request gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(messageResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Email already verified')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      // Should still show the message response content
      expect(screen.getByText('Email already verified')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('verificationError')).toBeInTheDocument();
      });

      expect(mockT).toHaveBeenCalledWith('verificationError');
    });

    it('should handle non-JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html',
        },
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('verificationError')).toBeInTheDocument();
      });
    });

    it('should handle server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('verificationFailed')).toBeInTheDocument();
      });
    });

    it('should handle auto-login API failures gracefully', async () => {
      const mockAutoLoginFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(jwtResponse),
        })
        .mockImplementation(mockAutoLoginFetch);

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle auto-login API network errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(jwtResponse),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('UI States', () => {
    it('should show loading state initially', () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<VerifyEmailPage />);

      expect(screen.getByText('verifying')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show success state after verification', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(jwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      // Should show success icon
      const successIcon = document.querySelector('.bg-green-100 svg');
      expect(successIcon).toBeInTheDocument();
    });

    it('should show error state on failure', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('verificationError')).toBeInTheDocument();
      });

      // Should show error icon
      const errorIcon = document.querySelector('.bg-red-100 svg');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show back to home link', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(jwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('backToHome')).toBeInTheDocument();
      });

      const homeLink = screen.getByText('backToHome').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Email Display', () => {
    it('should display success message after JWT verification', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(jwtResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });
    });

    it('should display success message from message response', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(messageResponse),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Email already verified')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup timers on unmount', async () => {
      mockGet.mockReturnValue('valid-token-123');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(jwtResponse),
      });

      const { unmount } = render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      // Unmount before timeout completes
      unmount();

      // Fast-forward time - should not cause any errors
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      // No assertions needed - just ensuring no errors are thrown
    });
  });
});
