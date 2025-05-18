import { render, screen, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { LoginForm } from '@/components/auth/LoginForm';
import userEvent from '@testing-library/user-event';
import { useState as useStateMock } from 'react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation - use manual mock with default exports
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn()
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn()
  }))
}));

// Mock React's useState
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
}));

describe('LoginForm with Google OAuth', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  const mockSetState = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock useRouter implementation
    useRouter.mockReturnValue(mockRouter);
    
    // Mock useSearchParams implementation
    useSearchParams.mockReturnValue(new URLSearchParams());
    
    // Mock useState implementation
    useStateMock.mockImplementation((initialState) => [initialState, mockSetState]);
  });

  test('should call signIn with google provider when Google button is clicked', async () => {
    // Setup
    render(<LoginForm />);
    
    // Find Google sign-in button (adjust the selector based on your actual component)
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click the Google button
    await userEvent.click(googleButton);
    
    // Verify signIn was called with correct parameters
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
  });

  test('should show loading state while Google authentication is in progress', async () => {
    // Mock signIn to be a slow promise
    signIn.mockImplementationOnce(() => new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true, error: null }), 1000);
    }));
    
    // Setup
    render(<LoginForm />);
    
    // Find Google sign-in button
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click the button
    await userEvent.click(googleButton);
    
    // Expect loading state to be activated
    expect(mockSetState).toHaveBeenCalledWith(true);
  });

  test('should handle errors during Google sign-in', async () => {
    // Mock signIn to return an error
    signIn.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      error: 'Google authentication failed'
    }));
    
    // Setup
    render(<LoginForm />);
    
    // Find Google sign-in button
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click the button
    await userEvent.click(googleButton);
    
    // Verify error state is updated
    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledWith('Google authentication failed');
    });
  });
});
