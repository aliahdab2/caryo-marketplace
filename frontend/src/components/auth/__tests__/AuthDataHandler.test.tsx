import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import AuthDataHandler from '../AuthDataHandler';
import * as authUtils from '@/utils/auth';

// Mock the auth utils
jest.mock('@/utils/auth');
const mockGetSession = authUtils.getSession as jest.MockedFunction<typeof authUtils.getSession>;

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const { useSession } = require('next-auth/react');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for the backend API call
global.fetch = jest.fn();

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe('AuthDataHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    (fetch as jest.Mock).mockClear();
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should store auth data in localStorage when user is authenticated', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
      isAdmin: true,
      accessToken: 'mock-access-token',
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'Test User');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userRoles', JSON.stringify(['ROLE_USER', 'ROLE_ADMIN']));
    });
  });

  it('should fetch roles from backend when not available in session', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      accessToken: 'mock-access-token',
      // No roles in session
    };

    const mockBackendResponse = {
      roles: ['ROLE_USER', 'ROLE_PREMIUM'],
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          email: 'test@example.com',
          name: 'Test User',
          providerAccountId: 'auth-handler-request',
          image: 'https://example.com/avatar.jpg',
        }),
      });
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userRoles', JSON.stringify(['ROLE_USER', 'ROLE_PREMIUM']));
    });
  });

  it('should use default roles when backend call fails', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      accessToken: 'mock-access-token',
      // No roles in session
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    // Mock fetch to fail
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userRoles', JSON.stringify(['ROLE_USER']));
    });
  });

  it('should clear localStorage when user is unauthenticated', async () => {
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue(null);

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('username');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userRoles');
    });
  });

  it('should not update localStorage if session has not changed', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      accessToken: 'mock-access-token',
      roles: ['ROLE_USER'],
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    const { rerender } = render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3); // authToken, username, userRoles
    });

    // Clear the mock calls
    localStorageMock.setItem.mockClear();

    // Rerender with the same session data
    rerender(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    // Should not call setItem again since session hasn't changed
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should handle localStorage errors gracefully', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      accessToken: 'mock-access-token',
      roles: ['ROLE_USER'],
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    // Mock localStorage to throw an error
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage is full');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error storing auth data in localStorage:', expect.any(Error));
    });
  });

  it('should not process session data while loading', () => {
    useSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <AuthDataHandler />
      </Wrapper>
    );

    // Should not interact with localStorage while loading
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });
});
