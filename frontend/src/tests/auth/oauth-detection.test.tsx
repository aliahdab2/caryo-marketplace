import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import ProfilePage from '@/app/[locale]/(protected)/dashboard/account/page';
// Import our i18n mock
import '../mocks/i18n-mock';

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestQueryWrapper';
  return Wrapper;
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/en/dashboard/account',
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock the session context
jest.mock('@/hooks/useOptimizedSession');

// Removed unused ExtendedUser test interface

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockUseOptimizedSession = useOptimizedSession as jest.MockedFunction<typeof useOptimizedSession>;

describe('OAuth User Detection in Profile Page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should hide change password for Google OAuth users (provider field)', () => {
    // Set up localStorage to indicate OAuth
    localStorage.setItem('authMethod', 'oauth');

    mockUseOptimizedSession.mockReturnValue({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@gmail.com',
        image: 'https://lh3.googleusercontent.com/a/xyz',
        roles: ['USER'],
        isAdmin: false,
        isDealer: false,
        accessToken: 'mock-token'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
      session: null,
      refreshSession: jest.fn()
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    // Should not show change password section for OAuth users
    expect(screen.queryByText(/Change Password/i)).not.toBeInTheDocument();

    // Should show the green OAuth authentication section
    expect(screen.getByText(/Google Authentication/)).toBeInTheDocument();
    expect(screen.getByText(/Active/)).toBeInTheDocument();
  });

  it('should hide change password for Google OAuth users (image URL)', () => {
    mockUseOptimizedSession.mockReturnValue({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@gmail.com',
        image: 'https://lh3.googleusercontent.com/a/xyz',
        roles: ['USER'],
        isAdmin: false,
        isDealer: false,
        accessToken: 'mock-token'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
      session: null,
      refreshSession: jest.fn()
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    // Should not show change password section for OAuth users
    expect(screen.queryByText(/Change Password/i)).not.toBeInTheDocument();

    // Should show OAuth authentication section
    expect(screen.getByText(/Google Authentication/)).toBeInTheDocument();
  });

  it('should show change password for regular email/password users', () => {
    mockUseOptimizedSession.mockReturnValue({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@email.com',
        image: null,
        roles: ['USER'],
        isAdmin: false,
        isDealer: false,
        accessToken: 'mock-token'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
      session: null,
      refreshSession: jest.fn()
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    // Should show change password section for regular users
    expect(screen.getByText(/Change Password/)).toBeInTheDocument();

    // Should not show OAuth authentication section
    expect(screen.queryByText(/Google Authentication/)).not.toBeInTheDocument();

    // Should show two-factor authentication setup for regular users
    expect(screen.getAllByText(/Two-Factor Authentication/).length).toBeGreaterThan(0);
  });
});
