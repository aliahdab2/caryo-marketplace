/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useAuthSession, useAuthStatus, useAuthUser } from '../useAuthSession';

// Mock next-auth
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('useAuthSession hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAuthSession', () => {
    it('should return session data with derived values when authenticated', () => {
      const mockSession = {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['ROLE_USER', 'ROLE_ADMIN']
        },
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthSession());

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.status).toBe('authenticated');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.userRoles).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
      expect(result.current.isAdmin).toBe(true);
    });

    it('should return loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthSession());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.userRoles).toEqual([]);
      expect(result.current.isAdmin).toBe(false);
    });

    it('should return unauthenticated state when no session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthSession());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.userRoles).toEqual([]);
      expect(result.current.isAdmin).toBe(false);
    });

    it('should handle user without roles', () => {
      const mockSession = {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthSession());

      expect(result.current.userRoles).toEqual([]);
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('useAuthStatus', () => {
    it('should return correct status flags for loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthStatus());

      expect(result.current).toEqual({
        isLoading: true,
        isAuthenticated: false,
        isUnauthenticated: false
      });
    });

    it('should return correct status flags for authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: '1' }, expires: '2024-12-31' },
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthStatus());

      expect(result.current).toEqual({
        isLoading: false,
        isAuthenticated: true,
        isUnauthenticated: false
      });
    });

    it('should return correct status flags for unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthStatus());

      expect(result.current).toEqual({
        isLoading: false,
        isAuthenticated: false,
        isUnauthenticated: true
      });
    });
  });

  describe('useAuthUser', () => {
    it('should return user data with roles when authenticated', () => {
      const mockSession = {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['ROLE_USER', 'ROLE_ADMIN']
        },
        accessToken: 'mock-access-token',
        expires: '2024-12-31T23:59:59.999Z'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthUser());

      expect(result.current).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
        isAdmin: true,
        accessToken: 'mock-access-token'
      });
    });

    it('should return null when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthUser());

      expect(result.current).toBeNull();
    });

    it('should return null when loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthUser());

      expect(result.current).toBeNull();
    });

    it('should handle user without roles', () => {
      const mockSession = {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        accessToken: 'mock-access-token',
        expires: '2024-12-31T23:59:59.999Z'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result } = renderHook(() => useAuthUser());

      expect(result.current?.roles).toEqual([]);
      expect(result.current?.isAdmin).toBe(false);
      expect(result.current?.accessToken).toBe('mock-access-token');
    });
  });

  describe('memoization behavior', () => {
    it('should maintain stable references when data does not change', () => {
      const mockSession = {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          roles: ['ROLE_USER']
        },
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn()
      } as any);

      const { result, rerender } = renderHook(() => useAuthSession());
      const firstResult = result.current;

      // Rerender with same data
      rerender();
      const secondResult = result.current;

      // Should maintain reference equality due to memoization
      expect(firstResult).toBe(secondResult);
    });
  });
});
