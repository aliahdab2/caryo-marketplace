import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import ProfilePage from '@/app/(protected)/dashboard/profile/page';
// Import our i18n mock
import '../mocks/i18n-mock';

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
        accessToken: 'mock-token'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true
    });

    render(<ProfilePage />);

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
        accessToken: 'mock-token'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true
    });

    render(<ProfilePage />);

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
        accessToken: 'mock-token'
      },
      status: 'authenticated',
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ProfilePage />);

    // Should show change password section for regular users
    expect(screen.getByText(/Change Password/)).toBeInTheDocument();
    
    // Should not show OAuth authentication section
    expect(screen.queryByText(/Google Authentication/)).not.toBeInTheDocument();
    
    // Should show two-factor authentication setup for regular users
    expect(screen.getByText(/Two-Factor Authentication/)).toBeInTheDocument();
  });
});
