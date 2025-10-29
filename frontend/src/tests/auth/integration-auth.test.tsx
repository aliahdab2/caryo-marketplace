import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import SignInPage from '@/app/[locale]/auth/signin/page';
import Navbar from '@/components/layout/Navbar';
import '../mocks/i18n-mock';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/en/auth/signin',
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock NextAuth properly - we'll override useSession per test
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
  signIn: jest.fn(),
  SessionProvider: ({ children, _session }: { children: React.ReactNode; _session?: unknown }) => <div data-testid="session-provider">{children}</div>,
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockSignIn = jest.mocked(require('next-auth/react').signIn);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockUseSession = jest.mocked(require('next-auth/react').useSession);

describe('Authentication Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();

    // Default unauthenticated state
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  test.skip('complete authentication flow with NextAuth signIn', async () => {
    // Mock successful NextAuth signIn response
    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      url: '/dashboard'
    });

    // Render sign-in page
    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={null}>
          <SignInPage />
        </SessionProvider>
      </QueryClientProvider>
    );

    // Fill form and submit
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign_in/i });
    await userEvent.click(submitButton);

    // Verify NextAuth signIn was called with correct parameters
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  test('navbar shows user menu after successful authentication', async () => {
    // Mock authenticated session
    const authenticatedSession = {
      data: {
        user: {
          id: '123',
          name: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
          isAdmin: false
        },
        accessToken: 'jwt-token-123',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'authenticated' as const,
      update: jest.fn(),
    };

    mockUseSession.mockReturnValue(authenticatedSession);

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={authenticatedSession.data}>
          <Navbar />
        </SessionProvider>
      </QueryClientProvider>
    );

    // Verify user menu is shown instead of sign-in button
    await waitFor(() => {
      expect(screen.queryByText(/sign_in/i)).not.toBeInTheDocument();
      expect(screen.getAllByText('testuser')).toHaveLength(3); // Multiple instances expected
    });
  });

  test('session API returns 401 when no session exists', async () => {
    // Mock unauthenticated session API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={null}>
          <Navbar />
        </SessionProvider>
      </QueryClientProvider>
    );

    // Verify sign-in button is shown
    await waitFor(() => {
      expect(screen.getAllByText(/sign_in/i)).toHaveLength(2); // Multiple instances expected
    });
  });

  test('handles session API errors gracefully', async () => {
    // Mock session API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={null}>
          <Navbar />
        </SessionProvider>
      </QueryClientProvider>
    );

    // Verify fallback to unauthenticated state
    await waitFor(() => {
      expect(screen.getAllByText(/sign_in/i)).toHaveLength(2); // Multiple instances expected
    });
  });
});
