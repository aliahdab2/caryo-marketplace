import React from 'react';
import { act as rtlAct, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from '@/app/auth/signin/page';
import { signIn, useSession } from 'next-auth/react';
// Import our i18n mock
import '../mocks/i18n-mock';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
}));

// Define mockRouter for consistent use throughout tests
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn(key => {
      if (key === 'error') {
        return null; // Prevent interference from error param handling
      }
      if (key === 'callbackUrl') {
        return '/';
      }
      return undefined;
    }),
  }),
  usePathname: jest.fn().mockReturnValue('/auth/signin'),
}));

// Mock window.location for redirection tests
let mockWindowLocation: Location;

beforeAll(() => {
  mockWindowLocation = window.location;
  // TypeScript-safe way to mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      ...mockWindowLocation,
      assign: jest.fn(),
      replace: jest.fn(),
      href: '',
    },
    writable: true
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    value: mockWindowLocation,
    writable: true,
  });
});

// Control verification state with this variable
let mockIsVerified = true;
const mockOnVerified = jest.fn();

jest.mock('@/components/auth/SimpleVerification', () => {
  return {
    __esModule: true,
    default: function MockSimpleVerification({ onVerified, autoStart }: { onVerified: (isVerified: boolean) => void; autoStart?: boolean }) {
      // Use useEffect from jest's mock, which doesn't reference out-of-scope variables
      jest.requireActual('react').useEffect(() => {
        if (autoStart) {
          try {
            if (typeof onVerified === 'function') {
              // Use the imported rtlAct instead of act
              onVerified(mockIsVerified);
            }
          } catch (e) {
            console.error('Error calling onVerified prop in MockSimpleVerification:', e);
          }
          mockOnVerified(mockIsVerified);
        }
      }, [onVerified, autoStart]);

      return jest.requireActual('react').createElement('div', { 'data-testid': 'verification-component' }, mockIsVerified ? 'Verified' : 'Not Verified');
    }
  };
});

// Test suite
describe('SignInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null, url: '/dashboard' });
    rtlAct(() => { mockIsVerified = true; });
    mockOnVerified.mockClear();
  });

  test('renders the sign-in form correctly', async () => {
    render(<SignInPage />);
    expect(screen.getByRole('heading', { name: /sign_in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign_in/i })).toBeInTheDocument();
    // Wait for verification component to appear
    await waitFor(() => {
        expect(screen.getByTestId('verification-component')).toBeInTheDocument();
    });
  });

  test('shows validation errors when form is submitted with empty fields', async () => {
    const { container } = render(<SignInPage />);
    
    // Wait for initial verification to complete
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    
    // Get the form directly
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    
    // Submit the form directly using fireEvent.submit
    await rtlAct(async () => {
      if (form) {
        fireEvent.submit(form);
      }
    });
    
    // Check that error message is shown and sign in function not called
    await waitFor(() => {
      const errorAlert = screen.queryByRole('alert');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert).toHaveTextContent(/fieldRequired/i);
    });
    
    expect(signIn).not.toHaveBeenCalled();
  });

  test('handles successful sign-in', async () => {
    render(<SignInPage />);
    
    // Wait for verification to complete
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    
    // Fill out the form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await rtlAct(async () => {
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
    });

    const submitButton = screen.getByRole('button', { name: /sign_in/i });
    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.click(submitButton);
    });
    
    // Check that signIn was called with the right parameters
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        username: 'testuser',
        password: 'password123',
      });
    });
    
    // Check successful login message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/login successful/i);
    });
  });

  test('handles sign-in error', async () => {
    // Mock signIn to return an error
    (signIn as jest.Mock).mockResolvedValueOnce({ error: 'Invalid credentials', ok: false });
    
    render(<SignInPage />);
    
    // Wait for verification to complete
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    
    // Fill out the form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await rtlAct(async () => {
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'wrongpassword');
    });

    const submitButton = screen.getByRole('button', { name: /sign_in/i });
    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.click(submitButton);
    });
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i);
    });
  });

  test('button is disabled when verification is not complete', async () => {
    // Set verification to false for this test
    rtlAct(() => { mockIsVerified = false; });
    
    render(<SignInPage />);
    
    // Wait for verification to fail
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(false));
    
    const button = screen.getByRole('button', { name: /sign_in/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-70');
    expect(button).toHaveClass('cursor-not-allowed');
  });
});
