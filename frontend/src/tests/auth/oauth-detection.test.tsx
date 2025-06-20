import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import ProfilePage from '@/app/dashboard/profile/page';
// Import our i18n mock
import '../mocks/i18n-mock';

// Mock next-auth
jest.mock('next-auth/react');

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

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('OAuth User Detection in Profile Page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should hide change password for Google OAuth users (provider field)', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@gmail.com',
          provider: 'google',
          roles: ['USER']
        } as ExtendedUser,
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      update: jest.fn()
    });

    render(<ProfilePage />);

    // Should not show change password button for OAuth users
    expect(screen.queryByText(/changePassword/i)).not.toBeInTheDocument();
    
    // Should show Google authentication info instead
    expect(screen.getByText(/Google Authentication/i)).toBeInTheDocument();
    expect(screen.getByText(/signed in with your Google account/i)).toBeInTheDocument();
    
    // Should not show traditional 2FA setup for OAuth users
    expect(screen.queryByText(/setupTwoFactor/i)).not.toBeInTheDocument();
    
    // Should show Google security management instead
    expect(screen.getByText(/Security is managed by your Google account/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage on Google/i)).toBeInTheDocument();
    
    // Should show Google security management instead
    expect(screen.getByText(/Security is managed by your Google account/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage on Google/i)).toBeInTheDocument();
  });

  it('should hide change password for Google OAuth users (image URL)', () => {
    mockUseSession.mockReturnValue({
      data: {
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
      update: jest.fn()
    });

    render(<ProfilePage />);

    // Should not show change password button for OAuth users
    expect(screen.queryByText(/changePassword/i)).not.toBeInTheDocument();
    
    // Should show Google authentication info instead
    expect(screen.getByText(/Google Authentication/i)).toBeInTheDocument();
  });

  it('should show change password for regular email/password users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@email.com',
          provider: 'credentials',
          roles: ['USER']
        } as ExtendedUser,
        accessToken: 'mock-token',
        expires: '2024-12-31T23:59:59.999Z'
      },
      status: 'authenticated',
      update: jest.fn()
    });

    render(<ProfilePage />);

    // Should show change password button for regular users
    expect(screen.getByText(/change password/i)).toBeInTheDocument();
    
    // Should not show Google authentication info
    expect(screen.queryByText(/Google Authentication/i)).not.toBeInTheDocument();
    
    // Should show traditional 2FA setup for regular users
    expect(screen.getByText(/setup two.factor/i)).toBeInTheDocument();
    
    // Should not show Google security management
    expect(screen.queryByText(/Security is managed by your Google account/i)).not.toBeInTheDocument();
  });
});
