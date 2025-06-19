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
const mockFetch = jest.fn();
global.fetch = mockFetch;

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

describe('Password Change Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Setup default fetch mock for the roles API call that happens on mount
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/auth/social-login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ roles: ['USER'] })
        } as Partial<Response> as Response);
      }
      // Return a default rejection for unmocked calls
      return Promise.reject(new Error('Unmocked fetch call: ' + url));
    });
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
    expect(screen.getByText('Change Password')).toBeInTheDocument();
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
    const [changePasswordButton] = screen.getAllByRole('button', { name: 'Change Password' });
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
    const [changePasswordButton] = screen.getAllByRole('button', { name: 'Change Password' });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
    });

    // Fill form with mismatched passwords
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    // Get the submit button specifically (second one is in the modal)
    const [, submitButton] = screen.getAllByRole('button', { name: 'Change Password' });

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
    // Setup fetch mock for both role refresh and password change
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/auth/social-login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ roles: ['USER'] })
        } as Partial<Response> as Response);
      }
      if (typeof url === 'string' && url.includes('/api/auth/change-password')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ message: 'Password changed successfully' })
        } as Partial<Response> as Response);
      }
      return Promise.reject(new Error('Unmocked fetch call: ' + url));
    });

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
    const changePasswordButton = screen.getByRole('button', { name: 'Change Password' });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
    });

    // Fill form with valid data
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    // Get the submit button specifically (second one is in the modal)
    const [, submitButton] = screen.getAllByRole('button', { name: 'Change Password' });

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    fireEvent.click(submitButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should handle API errors correctly', async () => {
    // Setup fetch mock for role refresh (success) and password change (error)
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/auth/social-login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ roles: ['USER'] })
        } as Partial<Response> as Response);
      }
      if (typeof url === 'string' && url.includes('/api/auth/change-password')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ message: 'Invalid current password' })
        } as Partial<Response> as Response);
      }
      return Promise.reject(new Error('Unmocked fetch call: ' + url));
    });

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
    const [changePasswordButton] = screen.getAllByRole('button', { name: 'Change Password' });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
    });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    // Get the submit button specifically (second one is in the modal)
    const [, submitButton] = screen.getAllByRole('button', { name: 'Change Password' });

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
