// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn()
}));

// Create mock for clearSessionCache
let mockClearSessionCache: jest.MockedFunction<any>;

// Mock the auth utils functions
jest.mock('../auth', () => ({
  ...jest.requireActual('../auth'),
  clearSessionCache: () => mockClearSessionCache(),
  handleLogout: jest.requireActual('../auth').handleLogout
}));

import { handleLogout } from '../auth';

describe('handleLogout', () => {
  let mockSignOut: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize mock
    mockClearSessionCache = jest.fn();

    // Set up mocks
    mockSignOut = require('next-auth/react').signOut;

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

  it('should successfully logout and redirect', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/dashboard');

    expect(mockClearSessionCache).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/dashboard'
    });
    expect(window.location.href).toBe('/dashboard');
  });

  it('should handle logout errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('Logout failed'));
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/');

    expect(mockClearSessionCache).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/'
    });
    expect(window.location.href).toBe('/');
    expect(consoleSpy).toHaveBeenCalledWith('❌ Logout error:', expect.any(Error));

    consoleSpy.mockRestore();
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

  it('should handle logout with delay', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/');

    expect(mockClearSessionCache).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/'
    });
  }, 10000);

  it('should handle logout gracefully', async () => {
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    // Should complete without errors
    await expect(handleLogout('/')).resolves.toBeUndefined();

    expect(mockClearSessionCache).toHaveBeenCalled();
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

  it('should log logout process', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockSignOut.mockResolvedValue(undefined);
    mockClearSessionCache.mockImplementation(() => {});

    await handleLogout('/');

    expect(consoleSpy).toHaveBeenCalledWith('🚪 Starting logout process...');
    expect(consoleSpy).toHaveBeenCalledWith('✅ NextAuth signout completed');

    consoleSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    mockSignOut.mockRejectedValue(new Error('Logout failed'));
    mockClearSessionCache.mockImplementation(() => {});

    // Should not throw error and still redirect
    await expect(handleLogout('/')).resolves.toBeUndefined();

    expect(window.location.href).toBe('/');
  });
});
