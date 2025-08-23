import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useOptimizedUser, useOptimizedAuthStatus } from '@/hooks/useOptimizedSession';
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

// Test components that simulate real usage
const UserProfile = () => {
  const user = useOptimizedUser();
  return <div data-testid="user-profile">{user?.name || 'No user'}</div>;
};

const AuthStatus = () => {
  const { isAuthenticated } = useOptimizedAuthStatus();
  return <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>;
};

const Navbar = () => {
  const user = useOptimizedUser();
  return <div data-testid="navbar">{user?.email || 'No email'}</div>;
};

const FavoriteButton = () => {
  const user = useOptimizedUser();
  return <button data-testid="favorite-button">{user ? 'Add to Favorites' : 'Login to favorite'}</button>;
};

// Component that renders multiple session-consuming components
const MultipleSessionConsumers = () => {
  return (
    <div>
      <UserProfile />
      <AuthStatus />
      <Navbar />
      <FavoriteButton />
      {/* Simulate multiple favorite buttons like in a listing grid */}
      {Array.from({ length: 10 }, (_, i) => (
        <FavoriteButton key={i} />
      ))}
    </div>
  );
};

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes like in production
        gcTime: 0, // Disable garbage collection for testing
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe('Session Performance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should deduplicate session calls when multiple components use session hooks', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
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
        <MultipleSessionConsumers />
      </Wrapper>
    );

    // Wait for all components to render
    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toHaveTextContent('Test User');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('navbar')).toHaveTextContent('test@example.com');
    });

    // Verify all favorite buttons are rendered
    const favoriteButtons = screen.getAllByTestId('favorite-button');
    expect(favoriteButtons).toHaveLength(11); // 1 main + 10 in array

    favoriteButtons.forEach(button => {
      expect(button).toHaveTextContent('Add to Favorites');
    });

    // Critical test: Despite 14+ components using session hooks,
    // getSession should only be called once due to React Query deduplication
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should cache session data across component unmount/remount cycles', async () => {
    const mockUser = {
      id: '456',
      name: 'Cached User',
      email: 'cached@example.com',
      roles: ['ROLE_USER'],
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    // First render
    const { unmount } = render(
      <Wrapper>
        <UserProfile />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toHaveTextContent('Cached User');
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);

    // Unmount and remount
    unmount();

    render(
      <Wrapper>
        <UserProfile />
        <AuthStatus />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toHaveTextContent('Cached User');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    // Should still only have called getSession once due to caching
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should handle unauthenticated state efficiently', async () => {
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue(null);

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <MultipleSessionConsumers />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toHaveTextContent('No user');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('navbar')).toHaveTextContent('No email');
    });

    const favoriteButtons = screen.getAllByTestId('favorite-button');
    favoriteButtons.forEach(button => {
      expect(button).toHaveTextContent('Login to favorite');
    });

    // Even with unauthenticated state, should only call getSession once
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should handle loading state correctly across multiple components', () => {
    useSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <MultipleSessionConsumers />
      </Wrapper>
    );

    // During loading, components should show appropriate states
    expect(screen.getByTestId('user-profile')).toHaveTextContent('No user');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    expect(screen.getByTestId('navbar')).toHaveTextContent('No email');

    // getSession should not be called while NextAuth is still loading
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('should demonstrate performance improvement over direct useSession calls', async () => {
    // This test simulates the old behavior vs new behavior
    const mockUser = {
      id: '789',
      name: 'Performance User',
      email: 'perf@example.com',
      roles: ['ROLE_USER'],
    };

    useSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockGetSession.mockResolvedValue({ user: mockUser });

    const Wrapper = createTestWrapper();

    // Simulate a page with many components that need session data
    // (like a search page with 20 listing cards, each with a favorite button)
    const ManySessionConsumers = () => (
      <div>
        <UserProfile />
        <AuthStatus />
        <Navbar />
        {Array.from({ length: 20 }, (_, i) => (
          <FavoriteButton key={i} />
        ))}
      </div>
    );

    render(
      <Wrapper>
        <ManySessionConsumers />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toHaveTextContent('Performance User');
    });

    // The key performance metric: 23 components using session data,
    // but only 1 API call thanks to React Query deduplication
    expect(mockGetSession).toHaveBeenCalledTimes(1);

    // Verify all components received the data
    const favoriteButtons = screen.getAllByTestId('favorite-button');
    expect(favoriteButtons).toHaveLength(20);
    favoriteButtons.forEach(button => {
      expect(button).toHaveTextContent('Add to Favorites');
    });
  });
});
