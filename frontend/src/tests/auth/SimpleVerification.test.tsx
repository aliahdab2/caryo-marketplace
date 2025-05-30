import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// Import the actual component
import SimpleVerification from '@/components/auth/SimpleVerification';

// Mock the i18n hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => {
      const translations: Record<string, string> = {
        'clickToVerify': 'Click to verify',
        'verifying': 'Verifying...',
        'verified': 'Verified',
        'verificationControl': 'Verification control'
      };
      return translations[key] || key;
    })
  }))
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

  test('renders with "Click to verify" when autoStart is false', () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);
    expect(screen.getByText('Click to verify')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();
  });

  test('calls onVerified and shows success after timeout when autoStart is true', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={true} />);
    
    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    // Ensure the DOM updates after onVerified is called
    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  test('calls onVerified and shows success when clicked (autoStart is false)', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);
    
    expect(screen.getByText('Click to verify')).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByText('Click to verify'));
    });
    
    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    await waitFor(() => {
        expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  test('auto-verifies after 3 seconds if idle, autoStart is false, and not clicked', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);

    expect(screen.getByText('Click to verify')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2900);
    });
    expect(mockOnVerified).not.toHaveBeenCalled();
    // Check state before the 3-second auto-verify triggers
    await waitFor(() => expect(screen.getByText('Click to verify')).toBeInTheDocument());

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
    await waitFor(() => expect(screen.getByText('Verified')).toBeInTheDocument());
  });

  test('does not auto-verify if clicked before 3-second timeout (autoStart false)', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);

    expect(screen.getByText('Click to verify')).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(screen.getByText('Click to verify'));
    });
    await waitFor(() => expect(screen.getByText('Verifying...')).toBeInTheDocument());

    // Advance time past the 3-second mark - it should not trigger auto-verify again
    act(() => {
        jest.advanceTimersByTime(3100); 
    });

    // Still verifying due to click, onVerified not called yet by auto-timer
    // The click handler sets state to 'verifying' synchronously.
    // The onVerified callback is inside a setTimeout(1500) in handleVerify.
    // So, after 3100ms, the 1500ms timer from handleVerify has already fired.
    await waitFor(() => expect(mockOnVerified).toHaveBeenCalledWith(true));
    expect(mockOnVerified).toHaveBeenCalledTimes(1); 
    await waitFor(() => expect(screen.getByText('Verified')).toBeInTheDocument());

    // Let's ensure no other timers are pending that could call onVerified again
    act(() => {
        jest.runOnlyPendingTimers();
    });
    expect(mockOnVerified).toHaveBeenCalledTimes(1);
  });
});
