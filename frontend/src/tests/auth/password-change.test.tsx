import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import ProfilePage from '@/app/dashboard/profile/page';
// Import our i18n mock
import '../mocks/i18n-mock';

// Mock next-auth
jest.mock('next-auth/react');

// Mock fetch
global.fetch = jest.fn();

// Extended user interface for testing
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
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Password Change Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should show change password button for regular users', () => {
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

    // Should show change password button
    expect(screen.getByText(/changePassword/i)).toBeInTheDocument();
  });

  it('should open password change modal when button is clicked', async () => {
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

    // Click the change password button
    const changePasswordButton = screen.getByText(/changePassword/i);
    fireEvent.click(changePasswordButton);

    // Should show the modal
    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
    });
  });

  it('should validate password form correctly', async () => {
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

    // Open modal
    const changePasswordButton = screen.getByText(/changePassword/i);
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
    });

    // Fill form with mismatched passwords
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByText('Change Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    });
  });

  it('should successfully change password with valid inputs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' })
    } as Response);

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

    // Open modal
    const changePasswordButton = screen.getByText(/changePassword/i);
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
    });

    // Fill form with valid data
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByText('Change Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    fireEvent.click(submitButton);

    // Should call the API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        })
      });
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    });
  });

  it('should handle API errors correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid current password' })
    } as Response);

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

    // Open modal and submit form
    const changePasswordButton = screen.getByText(/changePassword/i);
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
    });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitButton = screen.getByText('Change Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'wrongpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid current password')).toBeInTheDocument();
    });
  });
});
