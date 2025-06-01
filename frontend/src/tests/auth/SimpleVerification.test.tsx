import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// Import the actual component
import SimpleVerification from '@/components/auth/SimpleVerification';

// Mock the useLazyTranslation hook directly
jest.mock('@/hooks/useLazyTranslation', () => ({
  __esModule: true, // This is important for ES6 modules
  default: jest.fn(() => ({
    t: jest.fn((key: string, defaultValue?: string) => { // Added defaultValue
      const translations: Record<string, string> = {
        // Updated translations to match component usage
        'verificationControl': 'Verification Control', // Used as a heading
        'startVerification': 'Start Verification',     // Button text when idle
        'verificationPending': 'Verification pending. Click start or wait for auto-verification.', // Text when idle
        'verifying': 'Verifying...',                 // Text when verifying
        'verified': 'Verified Successfully!',        // Text when success
        'loading': 'Loading...',
      };
      return translations[key] || defaultValue || key; // Return defaultValue if provided
    }),
    i18n: {
      isInitialized: true,
      language: 'en',
      loadNamespaces: jest.fn().mockResolvedValue(undefined),
      // Add other i18n properties if needed by the hook
    },
    ready: true, // Set ready to true so the component doesn't show loading indefinitely
  })),
}));

describe('SimpleVerification Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers(); // Ensure all timers are run before clearing
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders with "Start Verification" button and pending text when autoStart is false', () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);
    // Expect the button used to initiate verification
    expect(screen.getByRole('button', { name: 'Start Verification' })).toBeInTheDocument();
    // Expect the pending text
    expect(screen.getByText('Verification pending. Click start or wait for auto-verification.')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();
  });

  test('calls onVerified and shows success after timeout when autoStart is true', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={true} />);
    
    // Expect "Verifying..." text
    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    // Ensure the DOM updates after onVerified is called
    await waitFor(() => {
      // Expect "Verified Successfully!" text
      expect(screen.getByText('Verified Successfully!')).toBeInTheDocument();
    });
  });

  test('calls onVerified and shows success when "Start Verification" is clicked (autoStart is false)', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);
    
    // Expect the button and click it
    const startButton = screen.getByRole('button', { name: 'Start Verification' });
    expect(startButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(startButton);
    });
    
    // Expect "Verifying..." text
    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    await waitFor(() => {
      // Expect "Verified Successfully!" text
      expect(screen.getByText('Verified Successfully!')).toBeInTheDocument();
    });
  });

  test('auto-verifies after 3 seconds if idle, autoStart is false, and not clicked', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);

    // Expect initial idle state text
    expect(screen.getByText('Verification pending. Click start or wait for auto-verification.')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2900);
    });
    expect(mockOnVerified).not.toHaveBeenCalled();
    // Check state before the 3-second auto-verify triggers
    await waitFor(() => expect(screen.getByText('Verification pending. Click start or wait for auto-verification.')).toBeInTheDocument());

    act(() => {
      jest.advanceTimersByTime(200); // Total 3100ms, should trigger auto-verify
    });

    // Should start verifying
    await waitFor(() => expect(screen.getByText('Verifying...')).toBeInTheDocument());
    
    act(() => {
      jest.advanceTimersByTime(1500); // Advance time for the verification process itself
    });

    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    // Expect "Verified Successfully!" text
    await waitFor(() => expect(screen.getByText('Verified Successfully!')).toBeInTheDocument());
  });

  test('does not auto-verify if clicked before 3-second timeout (autoStart false)', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);

    // Expect the button and click it
    const startButton = screen.getByRole('button', { name: 'Start Verification' });
    expect(startButton).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(startButton);
    });
    await waitFor(() => expect(screen.getByText('Verifying...')).toBeInTheDocument());

    // Advance time past the 3-second mark - it should not trigger auto-verify again
    act(() => {
        jest.advanceTimersByTime(3100); 
    });

    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    expect(mockOnVerified).toHaveBeenCalledTimes(1); 
    // Expect "Verified Successfully!" text
    await waitFor(() => expect(screen.getByText('Verified Successfully!')).toBeInTheDocument());

    // Let's ensure no other timers are pending that could call onVerified again
    act(() => {
        jest.runOnlyPendingTimers();
    });
    expect(mockOnVerified).toHaveBeenCalledTimes(1);
  });
});
