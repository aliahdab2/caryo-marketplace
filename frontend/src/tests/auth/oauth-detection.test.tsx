import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuthSession } from '@/hooks/useAuthSession';
import ProfilePage from '@/app/dashboard/profile/page';
// Import our i18n mock
import '../mocks/i18n-mock';

// Mock the auth session hook
jest.mock('@/hooks/useAuthSession');

// Extended user interface for testing OAuth users
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: string;
  roles?: string[];
}

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

const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;

describe('OAuth User Detection in Profile Page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should hide change password for Google OAuth users (provider field)', () => {
    // Set up localStorage to indicate OAuth
    localStorage.setItem('authMethod', 'oauth');
    
    mockUseAuthSession.mockReturnValue({
      session: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@gmail.com',
          image: 'https://lh3.googleusercontent.com/a/xyz',
          roles: ['USER']
        } as ExtendedUser,
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@gmail.com',
        image: 'https://lh3.googleusercontent.com/a/xyz',
        roles: ['USER']
      } as ExtendedUser,
      userRoles: ['USER'],
      isAdmin: false
    });

    render(<ProfilePage />);

    // Should not show change password section for OAuth users
    expect(screen.queryByText(/Change Password/i)).not.toBeInTheDocument();
    
    // Should show the green OAuth authentication section
    expect(screen.getByText(/dashboard\.googleAuth/)).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.active/)).toBeInTheDocument();
  });

  it('should hide change password for Google OAuth users (image URL)', () => {
    mockUseAuthSession.mockReturnValue({
      session: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@gmail.com',
          image: 'https://lh3.googleusercontent.com/a/xyz',
          roles: ['USER']
        } as ExtendedUser,
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@gmail.com',
        image: 'https://lh3.googleusercontent.com/a/xyz',
        roles: ['USER']
      } as ExtendedUser,
      userRoles: ['USER'],
      isAdmin: false
    });

    render(<ProfilePage />);

    // Should not show change password section for OAuth users
    expect(screen.queryByText(/Change Password/i)).not.toBeInTheDocument();
    
    // Should show OAuth authentication section
    expect(screen.getByText(/dashboard\.googleAuth/)).toBeInTheDocument();
  });

  it('should show change password for regular email/password users', () => {
    mockUseAuthSession.mockReturnValue({
      session: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@email.com',
          image: null,
          roles: ['USER']
        } as ExtendedUser,
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@email.com',
        image: null,
        roles: ['USER']
      } as ExtendedUser,
      userRoles: ['USER'],
      isAdmin: false
    });

    render(<ProfilePage />);

    // Should show change password section for regular users
    expect(screen.getByText(/dashboard\.changePassword/)).toBeInTheDocument();
    
    // Should not show OAuth authentication section
    expect(screen.queryByText(/dashboard\.googleAuth/)).not.toBeInTheDocument();
    
    // Should show two-factor authentication setup for regular users
    expect(screen.getByText(/dashboard\.twoFactorAuth/)).toBeInTheDocument();
  });
});
