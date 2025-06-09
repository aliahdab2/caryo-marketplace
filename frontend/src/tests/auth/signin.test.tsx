import React from 'react';
import { act as rtlAct, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from '@/app/auth/signin/page';
import { signIn, useSession } from 'next-auth/react';
// Import our i18n mock
import '../mocks/i18n-mock';

// Import the type for the mock and the mock itself for calling static methods
// Corrected import path for SimpleVerificationProps
import { type SimpleVerificationProps } from '@/types/components'; 
import SimpleVerificationDefault from '@/components/auth/SimpleVerification';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
}));

// Define mockRouter for consistent use throughout tests
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterPrefetch = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterForward = jest.fn();

// Module-level state for the SimpleVerification mock
let mockIsVerified = true;
const mockOnVerified = jest.fn(); // This is the global spy for tests
let lastOnVerifiedProp: ((isVerified: boolean) => void) | null = null;

// Define an interface for the mock component that includes the static method
interface MockSimpleVerificationComponentType extends React.FC<SimpleVerificationProps> {
  triggerVerification: (status: boolean) => void;
}

// Rename this function to comply with Jest's out-of-scope variable naming convention
// This function will be called by the jest.mock factory.
// It needs to return the mock component.
function mockCreateSimpleVerificationComponent(): MockSimpleVerificationComponentType {
  const ComponentInstance: MockSimpleVerificationComponentType = (({ onVerified, autoStart }) => {
    lastOnVerifiedProp = onVerified; // Store the onVerified prop from SignInPage

    // Moved the autoStart logic into useEffect to prevent state update during render
    jest.requireActual('react').useEffect(() => {
      if (autoStart && typeof onVerified === 'function') {
        onVerified(mockIsVerified);
        mockOnVerified(mockIsVerified); // Also call the global spy immediately
      }
    }, [onVerified, autoStart, mockIsVerified]); // Dependencies for the effect

    // Original useEffect for handling subsequent changes (can be merged or kept separate)
    jest.requireActual('react').useEffect(() => {
      // This useEffect can handle subsequent changes if autoStart is true
      // and mockIsVerified changes, or other dynamic autoStart behaviors.
      if (autoStart) {
        // Example: if mockIsVerified could change independently and needs to re-trigger onVerified
        // if (typeof onVerified === 'function') {
        //   onVerified(mockIsVerified);
        // }
        // mockOnVerified(mockIsVerified);
      }
    }, [onVerified, autoStart, mockIsVerified]);

    return jest.requireActual('react').createElement('div', { 'data-testid': 'verification-component' }, mockIsVerified ? 'Verified' : 'Not Verified');
  }) as MockSimpleVerificationComponentType;

  ComponentInstance.triggerVerification = (status: boolean) => {
    if (lastOnVerifiedProp) {
      lastOnVerifiedProp(status); // Call SignInPage's handler
    }
    mockOnVerified(status); // Call the global test spy
    mockIsVerified = status; // Update global for mock's display text

    // Force re-render of components using the mock, if necessary, by updating a state
    // This might involve a more complex setup if direct state manipulation is needed
    // For now, relying on parent component re-render due to state change from lastOnVerifiedProp
  };

  return ComponentInstance;
}

// Now, the jest.mock call. This will be hoisted.
// The factory () => mockCreateSimpleVerificationComponent() will be executed.
// mockCreateSimpleVerificationComponent is a function declaration, so it's hoisted and available.
jest.mock('@/components/auth/SimpleVerification', () => mockCreateSimpleVerificationComponent());


jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: mockRouterPrefetch,
    back: mockRouterBack,
    forward: mockRouterForward,
  })),
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

// Test suite
describe('SignInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear individual mock functions for the router
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
    mockRouterPrefetch.mockClear();
    mockRouterBack.mockClear();
    mockRouterForward.mockClear();

    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null, url: '/dashboard' });
    
    // Reset state for SimpleVerification mock
    mockIsVerified = true; 
    mockOnVerified.mockClear();
    lastOnVerifiedProp = null; // Reset the stored onVerified callback

    // Ensure the triggerVerification on the *actual imported mock* is the one from createMockSimpleVerificationComponent
    // This step might be redundant if the mock is freshly created via the factory each time,
    // but good to be aware of if state needs to be reset on the mock's "static" part.
    // For now, createMockSimpleVerificationComponent sets it up correctly.
  });

  test('renders the sign-in form correctly', async () => {
    render(<SignInPage />);
    expect(screen.getByRole('heading', { name: /sign_in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign_in/i })).toBeInTheDocument(); // Changed from signIn to sign_in
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
    const mockSignIn = jest.fn().mockResolvedValue({ ok: true, error: null, url: '/' });
    (signIn as jest.Mock).mockImplementation(mockSignIn);
    // No need to mock useRouter().push here as it's done globally and cleared in beforeEach

    render(<SignInPage />);

    await rtlAct(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      // Simulate verification completion
      const verificationComponent = screen.getByTestId('verification-component');
      fireEvent.click(verificationComponent); // This is a mock, actual interaction might differ
      await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    });

    const submitButton = screen.getByRole('button', { name: /sign_in/i }); // Changed from signIn to sign_in
    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.click(submitButton);
    });
    
    // Check that signIn was called with the right parameters
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
        redirect: false,
        username: 'testuser',
        password: 'password123',
      }));
    });
    
    // Check successful login message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/login successful/i);
    });
  });

  test('handles sign-in error', async () => {
    const mockError = 'Invalid credentials';
    const mockSignIn = jest.fn().mockResolvedValue({ ok: false, error: mockError, url: null });
    (signIn as jest.Mock).mockImplementation(mockSignIn);
    // No need to mock useRouter().push here

    render(<SignInPage />);

    await rtlAct(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      // Simulate verification completion
      const verificationComponent = screen.getByTestId('verification-component');
      fireEvent.click(verificationComponent); // This is a mock, actual interaction might differ
      await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    });

    const submitButton = screen.getByRole('button', { name: /sign_in/i }); // Changed from signIn to sign_in
    await rtlAct(async () => { // Use renamed rtlAct here
      await userEvent.click(submitButton);
    });
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i);
    });
  });

  test('button is disabled when verification is not complete', async () => {
    // Set initial state for this specific test
    mockIsVerified = false; 

    render(<SignInPage />);

    // Initial state: verification not complete.
    let button = screen.getByRole('button', { name: /sign_in/i });
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(false));
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-70'); 
    expect(button).toHaveClass('cursor-not-allowed');

    // Simulate verification completion by calling the static method on the imported mock
    rtlAct(() => {
      (SimpleVerificationDefault as MockSimpleVerificationComponentType).triggerVerification(true);
    });

    // Wait for the button to become enabled and all classes to update correctly
    await waitFor(() => {
      // Re-query the button inside waitFor to ensure we have the latest state
      button = screen.getByRole('button', { name: /sign_in/i }); 
      expect(button).toBeEnabled();
      expect(button).not.toHaveClass('opacity-70');
      expect(button).not.toHaveClass('cursor-not-allowed');
      // The button receives 'hover-lift' when enabled, not 'opacity-100'
      expect(button).toHaveClass('hover-lift'); 
    });
  });
});
