import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimpleVerification from '@/components/auth/SimpleVerification';

// Mock the useLazyTranslation hook
jest.mock('@/hooks/useLazyTranslation', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    t: jest.fn((key: string) => key), // Simplified t mock
    i18n: {
      isInitialized: true,
      language: 'en',
      loadNamespaces: jest.fn().mockResolvedValue(undefined),
    },
    ready: true,
  })),
}));

describe('SimpleVerification Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders with a placeholder when autoStart is false and idle', () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);
    expect(screen.getByTestId('placeholder-div')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();
  });

  test('calls onVerified, shows success icon, then hides it when autoStart is true', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={true} />);
    
    expect(screen.getByTestId('verifying-spinner')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1500); // Verification duration
    });
    
    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('verifying-spinner')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000); // Success icon display duration
    });

    await waitFor(() => {
      expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('placeholder-div')).toBeInTheDocument();
  });

  test('is idle initially when autoStart is false', () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);
    expect(screen.getByTestId('placeholder-div')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();
    // Ensure no spinner is shown initially
    expect(screen.queryByTestId('verifying-spinner')).not.toBeInTheDocument();
  });

  test('auto-verifies after 3s, shows success, then hides icon, when autoStart is false', async () => {
    const mockOnVerified = jest.fn();
    render(<SimpleVerification onVerified={mockOnVerified} autoStart={false} />);

    expect(screen.getByTestId('placeholder-div')).toBeInTheDocument();
    expect(mockOnVerified).not.toHaveBeenCalled();

    // Advance time just before auto-verify should trigger
    act(() => {
      jest.advanceTimersByTime(2900);
    });
    expect(mockOnVerified).not.toHaveBeenCalled();
    expect(screen.getByTestId('placeholder-div')).toBeInTheDocument(); // Still idle

    // Advance time to trigger auto-verify (total 3000ms or slightly more)
    act(() => {
      jest.advanceTimersByTime(200); 
    });

    await waitFor(() => expect(screen.getByTestId('verifying-spinner')).toBeInTheDocument());
    expect(screen.queryByTestId('placeholder-div')).not.toBeInTheDocument();
    
    // Advance time for the verification process itself
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalledWith(true);
    });
    expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('verifying-spinner')).not.toBeInTheDocument();

    // Advance time for success icon to disappear
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('placeholder-div')).toBeInTheDocument();
  });

  // Test for 'does not auto-verify if clicked before 3-second timeout (autoStart false)' was removed
  // as the click interaction is no longer present and its core concern is covered by the component's new logic.
});
