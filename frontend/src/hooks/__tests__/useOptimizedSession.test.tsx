import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useOptimizedSession, useOptimizedUser, useOptimizedAuthStatus } from '../useOptimizedSession';
import * as authUtils from '@/utils/auth';

// Mock the auth utils
jest.mock('@/utils/auth');
const mockGetSession = authUtils.getSession as jest.MockedFunction<typeof authUtils.getSession>;

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useSession as mockUseSession } from 'next-auth/react';

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useOptimizedSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useOptimizedSession', () => {
    it('should return loading state initially', () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useOptimizedSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('loading');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return authenticated state when session exists', async () => {
      const mockSessionData = {
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
          roles: ['ROLE_USER'],
          isAdmin: false,
        },
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z',
      };

      (mockUseSession as jest.Mock).mockReturnValue({
        data: mockSessionData,
        status: 'authenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue(mockSessionData);

      const { result } = renderHook(() => useOptimizedSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('authenticated');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER'],
        isAdmin: false,
        accessToken: 'mock-token',
      });
    });

    it('should return unauthenticated state when no session', async () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue(null);

      const { result } = renderHook(() => useOptimizedSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('unauthenticated');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should provide refreshSession function', async () => {
      const mockUpdate = jest.fn();
      (mockUseSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: mockUpdate,
      });

      mockGetSession.mockResolvedValue(null);

      const { result } = renderHook(() => useOptimizedSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refreshSession).toBe('function');
      
      // Test refresh function
      await result.current.refreshSession();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('useOptimizedUser', () => {
    it('should return user data when authenticated', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER'],
        isAdmin: false,
      };

      (mockUseSession as jest.Mock).mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useOptimizedUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toEqual(mockUser);
      });
    });

    it('should return null when unauthenticated', async () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue(null);

      const { result } = renderHook(() => useOptimizedUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBeNull();
      });
    });
  });

  describe('useOptimizedAuthStatus', () => {
    it('should return correct auth status for authenticated user', async () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue({ user: { id: '123' } });

      const { result } = renderHook(() => useOptimizedAuthStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.status).toBe('authenticated');
    });

    it('should return correct auth status for unauthenticated user', async () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue(null);

      const { result } = renderHook(() => useOptimizedAuthStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.status).toBe('unauthenticated');
    });

    it('should return loading state initially', () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useOptimizedAuthStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('loading');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Performance and Caching', () => {
    it('should deduplicate concurrent session calls', async () => {
      (mockUseSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue({ user: { id: '123' } });

      // Use the same wrapper instance to share QueryClient
      const Wrapper = createWrapper();

      // Render multiple hooks simultaneously with the same wrapper
      const { result: result1 } = renderHook(() => useOptimizedSession(), {
        wrapper: Wrapper,
      });
      const { result: result2 } = renderHook(() => useOptimizedUser(), {
        wrapper: Wrapper,
      });
      const { result: result3 } = renderHook(() => useOptimizedAuthStatus(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current).toBeTruthy();
        expect(result3.current.isLoading).toBe(false);
      });

      // Should only call getSession once due to React Query deduplication
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it('should cache session data and not refetch immediately', async () => {
      const wrapper = createWrapper();
      
      (mockUseSession as jest.Mock).mockReturnValue({
        data: { user: { id: '123' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockGetSession.mockResolvedValue({ user: { id: '123' } });

      // First render
      const { result: result1, unmount } = renderHook(() => useOptimizedSession(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      unmount();

      // Second render should use cached data
      const { result: result2 } = renderHook(() => useOptimizedSession(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should still only have called getSession once due to caching
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });
  });
});
