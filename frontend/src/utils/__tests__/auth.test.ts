// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn()
}));

import { handleLogout, clearSessionCache } from '../auth';
import { signOut } from 'next-auth/react';

describe('handleLogout', () => {
  let mockSignOut: jest.MockedFunction<typeof signOut>;
  let mockClearSessionCache: jest.MockedFunction<() => void>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on the actual clearSessionCache function
    mockClearSessionCache = jest.fn();
    jest.spyOn({ clearSessionCache }, 'clearSessionCache').mockImplementation(mockClearSessionCache);

    // Set up mocks
    mockSignOut = jest.mocked(signOut);

    // Mock window.location.href
    const mockLocation = {
      href: '',
      pathname: '/',
      search: '',
      hash: ''
    };

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });

    // Mock localStorage and sessionStorage
    const mockStorage = {
      removeItem: jest.fn(),
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true
    });
  });

  it('should redirect to a custom path after logout', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/dashboard');

    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/dashboard'
    });
    expect(window.location.href).toBe('/dashboard');
  });

  it('should clear all storage data', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/');

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('userRoles');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('username');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth-redirect');
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('user-preferences');
  });

  it('should use default redirect path when none provided', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout();

    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/'
    });
    expect(window.location.href).toBe('/');
  });

  it('should complete logout without errors', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/');

    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/'
    });
  });

  it('should handle errors gracefully', async () => {
    mockSignOut.mockRejectedValue(new Error('Logout failed'));
    mockClearSessionCache.mockImplementation(() => {});

    // Should not throw error and still redirect
    await expect(handleLogout('/')).resolves.toBeUndefined();

    expect(window.location.href).toBe('/');
  });
});
