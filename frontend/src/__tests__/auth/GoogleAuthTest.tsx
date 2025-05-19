import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { signIn } from 'next-auth/react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock router functions
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

// Mock search params functions
const mockSearchParams = {
  get: jest.fn(),
  has: jest.fn(),
  forEach: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: jest.fn(() => '/auth/signin'),
}));

// Mock react-icons
jest.mock('react-icons/fc', () => ({
  FcGoogle: () => <div data-testid="google-icon">Google Icon</div>,
}));

// Mock i18n
const mockTranslations: Record<string, string> = {
  'auth.continueWithGoogle': 'Continue with Google',
  'auth.signingIn': 'Signing in...',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.signin': 'Sign In',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string } | string) => {
      const defaultValue = typeof options === 'string'
        ? options
        : (typeof options === 'object' && options !== null ? options.defaultValue : undefined);
      return mockTranslations[key] || defaultValue || key;
    },
    i18n: {
      changeLanguage: jest.fn().mockResolvedValue(undefined),
      language: 'en',
      isInitialized: true,
      resolvedLanguage: 'en',
      dir: () => 'ltr',
    },
  }),
}));

describe('GoogleSignInButton', () => {
  // Set up the user event
  const user = userEvent.setup();
  
  // Store the original console.error
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console.error to suppress specific messages during tests
    console.error = jest.fn((...args) => {
      // Don't log "Google sign in error" messages to keep test output clean
      if (args[0] === "Google sign in error") return;
      // Log all other errors normally
      originalConsoleError(...args);
    });

    // Mock signIn to resolve successfully by default
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null, url: '/' });
  });

  afterEach(() => {
    // Restore original console.error after tests
    console.error = originalConsoleError;
  });

  test('should render Google sign-in button with correct text and icon', () => {
    render(<GoogleSignInButton />);
    
    // Verify button content
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).toBeInTheDocument();
    expect(screen.getByTestId('google-icon')).toBeInTheDocument();
  });

  test('should call signIn with google provider when button is clicked', async () => {
    render(<GoogleSignInButton />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click the button
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Verify signIn was called with correct parameters
    expect(signIn).toHaveBeenCalledWith('google', { 
      callbackUrl: '/dashboard', 
      redirect: true 
    });
  });

  test('should show loading state and handle successful sign-in', async () => {
    // Create a controlled promise for signIn
    let resolveSignInPromise: (value: { ok: boolean; error?: string | null; url?: string }) => void;
    const signInPromise = new Promise<{ ok: boolean; error?: string | null; url?: string }>(resolve => {
      resolveSignInPromise = resolve;
    });
    
    (signIn as jest.Mock).mockReturnValue(signInPromise);
    
    render(<GoogleSignInButton />);
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click button and verify loading state
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Verify button is disabled during loading
    expect(googleButton).toBeDisabled();
    expect(googleButton).toHaveClass('opacity-70');
    expect(googleButton).toHaveClass('cursor-not-allowed');
    
    // Verify loading spinner is shown
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('animate-spin');
    
    // Resolve the sign-in promise
    await act(async () => {
      resolveSignInPromise!({ ok: true, url: '/dashboard' });
    });
    
    // Verify loading state is cleared
    await waitFor(() => {
      expect(googleButton).not.toBeDisabled();
      expect(googleButton).not.toHaveClass('opacity-70');
    });
  });

  test('should handle rejected promise during Google sign-in', async () => {
    // Mock signIn to reject with an error
    (signIn as jest.Mock).mockRejectedValue(new Error('Google authentication failed'));
    
    render(<GoogleSignInButton />);
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click button
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Wait for error message to appear
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/Google authentication failed/i);
      expect(errorElement).toHaveClass('text-red-600');
    });
    
    // Verify button is enabled again
    expect(googleButton).not.toBeDisabled();
  });

  test('should handle error in response object during Google sign-in', async () => {
    // Mock signIn to return a response with error (covers line 35 in component)
    (signIn as jest.Mock).mockResolvedValue({ 
      ok: false, 
      error: 'Access denied', 
      url: null 
    });
    
    render(<GoogleSignInButton />);
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click button
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Wait for error message to appear
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Access denied');
      expect(errorElement).toHaveClass('text-red-600');
    });
    
    // Verify button is enabled again
    expect(googleButton).not.toBeDisabled();
  });
  
  test('should handle custom callback URL', async () => {
    render(<GoogleSignInButton callbackUrl="/custom-page" />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click button
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Verify signIn was called with custom callbackUrl
    expect(signIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/custom-page',
      redirect: true
    });
  });
  
  test('should apply custom CSS class', () => {
    render(<GoogleSignInButton className="custom-class" />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).toHaveClass('custom-class');
  });
  
  test('should call onSuccess callback when provided and redirect is false', async () => {
    const mockOnSuccess = jest.fn();
    const successResponse = { ok: true, error: null, url: '/dashboard' };
    
    // Mock signIn to return a success response
    (signIn as jest.Mock).mockResolvedValue(successResponse);
    
    render(<GoogleSignInButton redirect={false} onSuccess={mockOnSuccess} />);
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click button
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Verify onSuccess was called with the response
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(successResponse);
    });
  });

  test('should call onError callback when sign-in fails', async () => {
    const mockOnError = jest.fn();
    const error = new Error('Authentication error');
    
    // Mock signIn to reject
    (signIn as jest.Mock).mockRejectedValue(error);
    
    render(<GoogleSignInButton onError={mockOnError} />);
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    
    // Click button
    await act(async () => {
      await user.click(googleButton);
    });
    
    // Verify onError was called with the error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });
});
