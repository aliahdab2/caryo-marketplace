import React from 'react';
import { act as rtlAct, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from '@/app/auth/signin/page';
import { signIn, useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';

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

// Mock translations for i18n
const mockTranslations: Record<string, string> = {
  'auth.usernamePasswordRequired': 'Username and password are required.',
  'auth.verificationRequired': 'Verification required before login.',
  'errors:errors.invalidCredentials': 'Invalid username or password. Please try again.',
  'auth.signin': 'Sign In',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.loginSuccess': 'Login successful!',
  'auth.redirecting': 'Redirecting...',
  'auth.dontHaveAccount': "Don't have an account?",
  'auth.signup': 'Sign up',
  'auth.securityCheck': 'Security Check',
  'auth.securityCheckCompleted': 'Security check completed.',
  'auth.pleaseVerifyFirst': 'Please verify your device first.',
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
      getFixedT: () => (k: string, o?: { defaultValue?: string } | string) => {
        const dv = typeof o === 'string' 
          ? o 
          : (typeof o === 'object' && o !== null ? o.defaultValue : undefined);
        return mockTranslations[k] || dv || k;
      }
    },
  }),
}));

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
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
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
    if (form) {
      await rtlAct(async () => {
        fireEvent.submit(form);
      });
    }

    // Check if error alert is in the document
    await waitFor(() => {
      const errorAlert = screen.queryByRole('alert');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert).toHaveTextContent(/username and password are required/i);
    });
    
    expect(signIn).not.toHaveBeenCalled();
  });

  test('handles successful sign-in', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
    });

    render(<SignInPage />);    
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));

    await rtlAct(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/login successful!.*redirecting.../i);
    });
  });

  test('handles sign-in error', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      ok: false,
      error: 'Invalid credentials',
    });

    render(<SignInPage />);    
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));

    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/invalid username or password. please try again./i);
    });
    expect(signIn).toHaveBeenCalledWith('credentials', {
      username: 'testuser',
      password: 'wrongpassword',
      redirect: false,
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('button is disabled when verification is not complete', async () => {
    await rtlAct(async () => { // Use renamed rtlAct here
      mockIsVerified = false;
    });
    
    render(<SignInPage />);    
    // Wait for the mock to propagate the unverified state
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(false));

    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-70');
    expect(button).toHaveClass('cursor-not-allowed');
  });
});
