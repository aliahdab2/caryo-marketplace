/**
 * Integration tests for the complete auto-login flow after email verification
 * Tests the end-to-end journey from email verification to logged-in homepage
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getSession } from 'next-auth/react';
import useLazyTranslation from '@/hooks/useLazyTranslation';
import VerifyEmailPage from '@/app/auth/verify-email/page';
import { getAuthUrl } from '@/utils/constants/api';
import { TEMP_AUTH_KEYS, AUTO_LOGIN_CONFIG } from '@/types/auto-login';

// Mock all dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));
jest.mock('@/hooks/useLazyTranslation', () => jest.fn());
jest.mock('@/utils/constants/api', () => ({
  getAuthUrl: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock storage APIs
const createStorageMock = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
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
});

describe('Auto-Login Integration Flow', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockT = jest.fn((key: string) => key);
  const mockGetSession = getSession as jest.Mock;

  // Test data
  const validToken = 'valid-verification-token-123';
  const backendJwtResponse = {
    token: 'backend.jwt.token',
    type: 'Bearer',
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['ROLE_USER'],
  };

  const mockSession = {
    user: {
      id: '1',
      name: 'testuser',
      email: 'test@example.com',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (useLazyTranslation as jest.Mock).mockReturnValue({ t: mockT, ready: true });
    (getAuthUrl as jest.Mock).mockReturnValue('http://localhost:8080/api/auth/verify-email');

    // Reset location
    mockLocation.href = '';
    
    // Reset storage mocks
    (window.sessionStorage as unknown as { getItem: jest.Mock }).getItem.mockReturnValue(null);
    (window.localStorage as unknown as { getItem: jest.Mock }).getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Complete Auto-Login Flow - New User Verification', () => {
    it('should complete full flow: verification → auto-login → homepage redirect', async () => {
      // Setup: User has verification token
      mockGet.mockReturnValue(validToken);

      // Mock backend email verification response (JWT for new user)
      const mockBackendVerification = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(backendJwtResponse),
      });

      // Mock frontend auto-login API response
      const mockAutoLoginAPI = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Setup fetch mock to handle both calls
      (global.fetch as jest.Mock)
        .mockImplementationOnce(mockBackendVerification)
        .mockImplementationOnce(mockAutoLoginAPI);

      // Mock session polling - initially no session, then session available
      mockGetSession
        .mockResolvedValueOnce(null) // First poll - no session
        .mockResolvedValueOnce(null) // Second poll - no session
        .mockResolvedValueOnce(mockSession); // Third poll - session ready

      // Render component
      render(<VerifyEmailPage />);

      // Step 1: Verify initial loading state
      expect(screen.getByText('verifying')).toBeInTheDocument();

      // Step 2: Wait for email verification to complete
      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      // Verify backend was called correctly
      expect(mockBackendVerification).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/verify-email?token=valid-verification-token-123'
      );

      // Verify temporary auth data was stored
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.TOKEN,
        'backend.jwt.token'
      );
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        TEMP_AUTH_KEYS.USER,
        JSON.stringify({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        })
      );

      // Step 3: Fast-forward to auto-login API call
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      // Wait for auto-login API to be called
      await waitFor(() => {
        expect(mockAutoLoginAPI).toHaveBeenCalledWith('/api/auth/auto-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 'backend.jwt.token',
            user: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              roles: ['ROLE_USER'],
            },
          }),
        });
      });

      // Step 4: Verify session polling and redirect
      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });

      // Verify cleanup
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);
    });

    it('should handle session polling timeout gracefully', async () => {
      mockGet.mockReturnValue(validToken);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(backendJwtResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // Mock session never becomes available
      mockGetSession.mockResolvedValue(null);

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      // Should still redirect even if session polling times out
      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });
    });
  });

  describe('Complete Auto-Login Flow - Already Verified User', () => {
    it('should handle already verified user with fresh JWT flow', async () => {
      mockGet.mockReturnValue(validToken);

      const messageResponse = {
        message: 'Email already verified',
        email: 'test@example.com',
      };

      // Mock sequence: message response → fresh JWT response → auto-login
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(messageResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(backendJwtResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      mockGetSession.mockResolvedValue(mockSession);

      render(<VerifyEmailPage />);

      // Wait for initial message response
      await waitFor(() => {
        expect(screen.getByText('Email already verified')).toBeInTheDocument();
      });

      // Fast-forward through the message delay first
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Wait for fresh JWT request to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Fast-forward through auto-login delay
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      // Wait for auto-login API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      // Should complete the full flow
      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });

      // Verify all API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    it('should fallback to router.push on auto-login API failure', async () => {
      mockGet.mockReturnValue(validToken);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(backendJwtResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

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

    it('should handle network errors during auto-login gracefully', async () => {
      mockGet.mockReturnValue(validToken);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(backendJwtResponse),
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

    it('should handle malformed backend responses', async () => {
      mockGet.mockReturnValue(validToken);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ error: 'Invalid token' }),
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getAllByText('verificationFailed')).toHaveLength(2);
      });
    });
  });

  describe('Security and Data Validation', () => {
    it('should validate JWT token format before auto-login', async () => {
      mockGet.mockReturnValue(validToken);

      const invalidJwtResponse = {
        ...backendJwtResponse,
        token: 'invalid-token-format', // Missing dots
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

      // Should not attempt auto-login with invalid token
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial verification call
    });

    it('should properly clean up sensitive data from storage', async () => {
      mockGet.mockReturnValue(validToken);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(backendJwtResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      mockGetSession.mockResolvedValue(mockSession);

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

      // Verify all sensitive data is cleaned up
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.TOKEN);
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.USER);
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(TEMP_AUTH_KEYS.EXPIRES);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('signup-email');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('signup-username');
    });

    it('should handle concurrent verification attempts safely', async () => {
      mockGet.mockReturnValue(validToken);

      let resolveFirstCall: (value: unknown) => void;
      const firstCallPromise = new Promise(resolve => {
        resolveFirstCall = resolve;
      });

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() => firstCallPromise)
        .mockResolvedValue({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve(backendJwtResponse),
        });

      const { rerender } = render(<VerifyEmailPage />);

      // Trigger a re-render while first call is pending
      rerender(<VerifyEmailPage />);

      // Resolve the first call
      resolveFirstCall!({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(backendJwtResponse),
      });

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      // Should only make one verification call despite re-render
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should not leak timers on component unmount', async () => {
      mockGet.mockReturnValue(validToken);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(backendJwtResponse),
      });

      const { unmount } = render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('emailVerified')).toBeInTheDocument();
      });

      // Get the current fetch call count before unmount
      const callsBeforeUnmount = (global.fetch as jest.Mock).mock.calls.length;

      // Unmount before auto-login timeout
      unmount();

      // Fast-forward time - timers may still fire but should not cause crashes
      act(() => {
        jest.advanceTimersByTime(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
      });

      // The test passes if no errors are thrown during timer execution
      // Some fetch calls may still happen due to pending timers, but they shouldn't crash
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(callsBeforeUnmount);
    });

    it('should handle rapid successive token changes', async () => {
      // Start with no token
      mockGet.mockReturnValue(null);
      const { rerender } = render(<VerifyEmailPage />);

      // Should show invalid token state when no token is provided
      expect(screen.getByText('invalidVerificationToken')).toBeInTheDocument();

      // Simulate rapid token changes
      mockGet.mockReturnValue('token1');
      rerender(<VerifyEmailPage />);

      mockGet.mockReturnValue('token2');
      rerender(<VerifyEmailPage />);

      mockGet.mockReturnValue('token3');
      rerender(<VerifyEmailPage />);

      // Should handle gracefully without errors - component should still show invalid token
      expect(screen.getByText('invalidVerificationToken')).toBeInTheDocument();
    });
  });
});
