import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoogleSignInButton from '../GoogleSignInButton';
import { signIn } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getProviders: jest.fn(),
}));

// Mock the useLazyTranslation hook
jest.mock('@/hooks/useLazyTranslation', () => ({
  __esModule: true,
  default: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        continueWithGoogle: 'Continue with Google',
        signingIn: 'Signing in...',
        loading: 'Loading...',
        googleSignInNotConfigured: 'Google Sign-In is not configured',
        googleSignInUnavailable: 'Google Sign-In is unavailable',
      };
      return translations[key] || key;
    },
    ready: true,
  }),
}));

// Mock react-icons
jest.mock('react-icons/fc', () => ({
  FcGoogle: () => <span data-testid="google-icon">G</span>,
}));

describe('GoogleSignInButton', () => {
  const mockSignIn = signIn as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ ok: true, error: null });
    // Set NODE_ENV to test to skip provider check
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true, configurable: true });
  });

  it('renders the button with Google icon', async () => {
    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
    });
  });

  it('displays "Continue with Google" text', async () => {
    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });
  });

  it('calls signIn with google provider when clicked', async () => {
    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', expect.objectContaining({
        callbackUrl: '/dashboard',
        redirect: true,
      }));
    });
  });

  it('uses custom callbackUrl when provided', async () => {
    render(<GoogleSignInButton callbackUrl="/profile" />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', expect.objectContaining({
        callbackUrl: '/profile',
      }));
    });
  });

  it('shows loading spinner while signing in', async () => {
    // Make signIn take time
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('disables button while signing in', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('calls onSuccess callback on successful sign-in', async () => {
    const onSuccess = jest.fn();
    mockSignIn.mockResolvedValue({ ok: true, error: null });

    render(<GoogleSignInButton onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onError callback on sign-in error', async () => {
    const onError = jest.fn();
    mockSignIn.mockResolvedValue({ ok: false, error: 'AccessDenied' });

    render(<GoogleSignInButton onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('AccessDenied');
    });
  });

  it('displays error message when sign-in fails', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'AccessDenied' });

    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('handles exception during sign-in', async () => {
    const onError = jest.fn();
    mockSignIn.mockRejectedValue(new Error('Network error'));

    render(<GoogleSignInButton onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('applies custom className', async () => {
    render(<GoogleSignInButton className="my-custom-class" />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-custom-class');
    });
  });

  it('has proper accessibility attributes', async () => {
    render(<GoogleSignInButton />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Continue with Google');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('shows aria-busy when loading', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

    render(<GoogleSignInButton />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('uses redirect prop correctly', async () => {
    render(<GoogleSignInButton redirect={false} />);

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', expect.objectContaining({
        redirect: false,
      }));
    });
  });
});
