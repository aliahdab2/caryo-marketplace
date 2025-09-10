/**
 * Integration tests for OAuth role parsing and session management
 * Tests the critical bug fix where frontend wasn't parsing roles correctly from backend response
 */

import { authOptions } from '@/lib/auth-config';

// Mock fetch for backend API calls
global.fetch = jest.fn();

describe('OAuth Role Integration Tests', () => {
  beforeEach(() => {
    // Enhanced cleanup to prevent state leakage
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.resetModules();

    // Clear fetch mocks specifically
    if (global.fetch && typeof global.fetch.mockClear === 'function') {
      (global.fetch as jest.Mock).mockClear();
    }

    // Reset any stored state
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    // Additional cleanup after each test
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Backend Response Parsing - Critical Bug Fix', () => {
    it('should correctly parse roles from backend JwtResponse format', async () => {
      // Mock backend response in the correct JwtResponse format
      const mockBackendResponse = {
        token: 'jwt_token_123',
        type: 'Bearer',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ROLE_USER'] // Roles are directly in response, not nested under 'user'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      // Mock Google profile and account
      const mockProfile = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: '123456789'
      };

      const mockUser = { 
        id: '1', 
        name: 'Test User', 
        email: 'test@example.com' 
      };

      // Test the signIn callback directly from the real auth config
      const signInCallback = authOptions.callbacks?.signIn;
      expect(signInCallback).toBeDefined();

      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect(result).toBe(true);
        
        // Verify the user object was augmented with roles from the correct path
        // This is the critical fix - roles should come from response.roles, not response.user.roles
        expect((mockUser as Record<string, unknown>).roles).toEqual(['ROLE_USER']);
        expect((mockUser as Record<string, unknown>).token).toBe('jwt_token_123');
        expect((mockUser as Record<string, unknown>).provider).toBe('google');
      }
    });

    it('should handle backend response with multiple roles', async () => {
      const mockBackendResponse = {
        token: 'jwt_token_admin',
        type: 'Bearer',
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['ROLE_USER', 'ROLE_ADMIN'] // Multiple roles
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const mockProfile = {
        email: 'admin@example.com',
        name: 'Admin User'
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: '987654321'
      };

      const mockUser = { 
        id: '2', 
        name: 'Admin User', 
        email: 'admin@example.com' 
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect(result).toBe(true);
        expect((mockUser as Record<string, unknown>).roles).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
      }
    });

    it('should handle backend response with empty roles array', async () => {
      const mockBackendResponse = {
        token: 'jwt_token_noroles',
        type: 'Bearer',
        id: 3,
        username: 'noroles',
        email: 'noroles@example.com',
        roles: [] // Empty roles array
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const mockProfile = {
        email: 'noroles@example.com',
        name: 'No Roles User'
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: '555666777'
      };

      const mockUser = { 
        id: '3', 
        name: 'No Roles User', 
        email: 'noroles@example.com' 
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect(result).toBe(true);
        expect((mockUser as Record<string, unknown>).roles).toEqual([]);
      }
    });

    it('should handle backend response without roles field', async () => {
      const mockBackendResponse = {
        token: 'jwt_token_missing_roles',
        type: 'Bearer',
        id: 4,
        username: 'missingroles',
        email: 'missing@example.com'
        // No roles field
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const mockProfile = {
        email: 'missing@example.com',
        name: 'Missing Roles User'
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: '111222333'
      };

      const mockUser = { 
        id: '4', 
        name: 'Missing Roles User', 
        email: 'missing@example.com' 
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect(result).toBe(true);
        // Should default to empty array when roles field is missing
        expect((mockUser as Record<string, unknown>).roles).toEqual([]);
      }
    });

    it('should handle backend authentication failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const mockProfile = { email: 'fail@example.com', name: 'Fail User' };
      const mockAccount = { provider: 'google', providerAccountId: '000111222' };
      const mockUser = { id: '1', name: 'Fail User', email: 'fail@example.com' };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect(result).toBe(false);
      }
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const mockProfile = { email: 'network@example.com', name: 'Network User' };
      const mockAccount = { provider: 'google', providerAccountId: '777888999' };
      const mockUser = { id: '1', name: 'Network User', email: 'network@example.com' };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect(result).toBe(false);
      }
    });
  });

  describe('JWT Token Handling', () => {
    it('should correctly extract token from backend response', async () => {
      const mockBackendResponse = {
        token: 'correct_jwt_token',
        type: 'Bearer',
        id: 1,
        username: 'tokentest',
        email: 'token@example.com',
        roles: ['ROLE_USER']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const mockProfile = { email: 'token@example.com', name: 'Token Test' };
      const mockAccount = { provider: 'google', providerAccountId: '999888777' };
      const mockUser = { id: '1', name: 'Token Test', email: 'token@example.com' };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect((mockUser as Record<string, unknown>).token).toBe('correct_jwt_token');
      }
    });

    it('should handle alternative token field names', async () => {
      const mockBackendResponse = {
        accessToken: 'alternative_token', // Using accessToken instead of token
        type: 'Bearer',
        id: 1,
        username: 'alttoken',
        email: 'alt@example.com',
        roles: ['ROLE_USER']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse),
      });

      const mockProfile = { email: 'alt@example.com', name: 'Alt Token' };
      const mockAccount = { provider: 'google', providerAccountId: '444555666' };
      const mockUser = { id: '1', name: 'Alt Token', email: 'alt@example.com' };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: mockProfile
        });

        expect((mockUser as Record<string, unknown>).token).toBe('alternative_token');
      }
    });
  });

  describe('Session Management Integration', () => {
    it('should pass roles correctly through JWT callback', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();

      if (jwtCallback) {
        const mockUser = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
          token: 'jwt_token_123'
        };

        const mockToken = {
          sub: '1',
          name: 'Test User',
          email: 'test@example.com'
        };

        const result = await jwtCallback({
          token: mockToken,
          user: mockUser
        });

        expect(result.roles).toEqual(['ROLE_USER']);
        expect(result.accessToken).toBe('jwt_token_123');
      }
    });

    it('should correctly map JWT data to session', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      expect(sessionCallback).toBeDefined();

      if (sessionCallback) {
        const mockToken = {
          sub: '1',
          name: 'Test User',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
          accessToken: 'jwt_token_123'
        };

        const mockSession = {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com'
          },
          expires: '2024-12-31'
        };

        const result = await sessionCallback({
          session: mockSession,
          token: mockToken
        });

        expect(result.user.roles).toEqual(['ROLE_USER']);
        expect(result.accessToken).toBe('jwt_token_123');
        // Note: isAdmin is computed by useOptimizedSession hook, not by session callback
      }
    });

    it('should correctly identify admin users', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      if (sessionCallback) {
        const mockToken = {
          sub: '2',
          name: 'Admin User',
          email: 'admin@example.com',
          roles: ['ROLE_USER', 'ROLE_ADMIN'],
          accessToken: 'admin_token_456'
        };

        const mockSession = {
          user: {
            id: '2',
            name: 'Admin User',
            email: 'admin@example.com'
          },
          expires: '2024-12-31'
        };

        const result = await sessionCallback({
          session: mockSession,
          token: mockToken
        });

        expect(result.user.roles).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
        // Note: isAdmin is computed by useOptimizedSession hook, not by session callback
      }
    });
  });
});