import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteButton from '@/components/common/FavoriteButton';
import { useSession } from 'next-auth/react';
import * as sessionManager from '@/services/auth/session-manager';
import { createMockSession } from '@/tests/mocks/session-mock';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  getSession: jest.fn(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  ...jest.requireActual('@/tests/mocks/i18n-mock'),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'listings.addToFavorites': 'Add to favorites',
        'listings.removeFromFavorites': 'Remove from favorites',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock session-manager module
jest.mock('@/services/auth/session-manager', () => ({
  apiRequest: jest.fn(),
  validateSession: jest.fn(),
}));

describe('FavoriteButton Component', () => {
  // Common test props
  const defaultProps = {
    listingId: 'list123',
    onToggle: jest.fn(),
  };
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default authenticated session using createMockSession
    const mockSession = createMockSession();
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    
    // Default session validation
    (sessionManager.validateSession as jest.Mock).mockResolvedValue({
      isValid: true,
      needsRefresh: false,
      isExpired: false,
      redirectToLogin: false,
    });
    
    // Default API request mock for successful response
    (sessionManager.apiRequest as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('true'),
        json: () => Promise.resolve({ isFavorite: true }),
      });
    });
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  // Test initial rendering
  test('renders correctly with default props', async () => {
    render(<FavoriteButton {...defaultProps} />);
    
    // Verify button is present with correct aria-label
    const button = screen.getByRole('button', { name: /Add to favorites/i });
    expect(button).toBeInTheDocument();
    
    // Wait for status check to complete
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalled();
    });
  });

  // Test with different variants and sizes
  test('renders with different variants and sizes', async () => {
    const { rerender } = render(
      <FavoriteButton 
        {...defaultProps} 
        variant="outline" 
        size="lg" 
      />
    );
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('border-2'); // outline variant
    expect(button).toHaveClass('w-12', 'h-12'); // lg size
    
    // Re-render with different props
    rerender(
      <FavoriteButton 
        {...defaultProps} 
        variant="filled" 
        size="sm" 
        showText={true}
      />
    );
    
    button = screen.getByRole('button');
    expect(button).not.toHaveClass('border-2'); // filled variant
    expect(button).not.toHaveClass('w-12', 'h-12'); // not lg size
    expect(button).toHaveClass('rounded-lg'); // with text
  });

  // Test toggling favorite state
  test('toggles favorite state when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    
    // Mock API responses for check and toggle
    (sessionManager.apiRequest as jest.Mock)
      // First call: Check favorite status (returns not favorited)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('false'),
        json: () => Promise.resolve({ isFavorite: false }),
      }))
      // Second call: Add to favorites
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      }))
      // Third call: Check favorite status again or Remove from favorites
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      }));
    
    // Render with initialFavorite=false to be explicit
    render(<FavoriteButton listingId="list123" onToggle={onToggle} initialFavorite={false} />);
    
    // Wait for initial status check to complete
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalledTimes(1);
    });
    
    // Initially not favorited
    let button = screen.getByRole('button', { name: /Add to favorites/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toHaveAttribute('fill', 'none');
    
    // Click to add to favorites
    await user.click(button);
    
    // Check that API was called to add to favorites and onToggle was triggered
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalledTimes(2);
      expect(onToggle).toHaveBeenCalledWith(true);
    });
    
    // Button should now show "Remove from favorites"
    button = screen.getByRole('button', { name: /Remove from favorites/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    
    // Now click again to remove from favorites
    await user.click(button);
    
    // Check API was called to remove from favorites
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalledTimes(3);
      expect(onToggle).toHaveBeenCalledWith(false);
    });
    
    // Button should show "Add to favorites" again
    await waitFor(() => {
      button = screen.getByRole('button', { name: /Add to favorites/i });
      expect(button).toBeInTheDocument();
      expect(button.querySelector('svg')).toHaveAttribute('fill', 'none');
    });
  });

  // Test handling authentication errors
  test('handles authentication errors', async () => {
    // Mock localStorage
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    
    const user = userEvent.setup();
    
    // Mock valid session check but auth error on API request
    (sessionManager.validateSession as jest.Mock).mockResolvedValue({
      isValid: true,
      needsRefresh: false,
      isExpired: false,
      redirectToLogin: false,
    });
    
    // Make API requests predictable - fail the second one with auth error
    (sessionManager.apiRequest as jest.Mock).mockClear();
    (sessionManager.apiRequest as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ isFavorite: false }),
        text: () => Promise.resolve('false'),
      }))
      .mockImplementationOnce(() => Promise.reject(new Error('Unauthorized')));
    
    const onToggle = jest.fn();
    
    // Setup console spy before rendering
    const consoleWarnSpy = jest.spyOn(console, 'warn');
    consoleWarnSpy.mockImplementation((msg, ...args) => {
      // Let the original function run, but intercept for test assertions
      console.log('Console warning intercepted:', msg, ...args);
    });
    
    // Render component
    render(<FavoriteButton listingId="list123" onToggle={onToggle} />);
    
    // Wait for initial status check
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalled();
    });
    
    // Clear previous calls to make testing easier
    mockSetItem.mockClear();
    (sessionManager.apiRequest as jest.Mock).mockClear();
    consoleWarnSpy.mockClear();
    
    // Click button to try adding to favorites - this should trigger our auth error
    const button = screen.getByRole('button', { name: /Add to favorites/i });
    await user.click(button);
    
    // Wait for pending action to be stored in localStorage
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(
        'pendingFavoriteAction', 
        expect.stringContaining('list123')
      );
    });
    
    // Verify console warning was triggered
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[FAVORITE] API request failed when toggling favorite:',
      expect.anything()
    );
    
    // The onToggle callback shouldn't be called on failure
    expect(onToggle).not.toHaveBeenCalled();
    
    // Cleanup
    mockSetItem.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // Test unauthenticated state
  test('renders with unauthenticated session', async () => {
    const user = userEvent.setup();
    
    // Mock an unauthenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    const onToggle = jest.fn();
    render(<FavoriteButton listingId="list123" onToggle={onToggle} />);
    
    // Verify the button is rendered in default state
    const button = screen.getByRole('button', { name: /Add to favorites/i });
    expect(button).toBeInTheDocument();
    
    // Make sure it's not showing heart fill
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    
    // Click the button and verify localStorage is used to store pending action
    await user.click(button);
    
    // Since we're unauthenticated, clicking should store a pending action
    const pendingActionJSON = localStorage.getItem('pendingFavoriteAction');
    expect(pendingActionJSON).not.toBeNull();
    
    if (pendingActionJSON) {
      const pendingAction = JSON.parse(pendingActionJSON);
      expect(pendingAction.listingId).toBe('list123');
      expect(pendingAction.action).toBe('add');
    }
    
    // The onToggle callback should not be called when unauthenticated
    expect(onToggle).not.toHaveBeenCalled();
  });

  // Test with initial favorite state
  test('renders with initial favorite state', async () => {
    render(<FavoriteButton {...defaultProps} initialFavorite={true} />);
    
    // Should initially render as favorited
    const button = screen.getByRole('button', { name: /Remove from favorites/i });
    expect(button).toBeInTheDocument();
    
    // But will check server state after mount
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalled();
    });
  });

  // Test with showText prop
  test('shows text when showText prop is true', async () => {
    const user = userEvent.setup();
    
    // Mock API to return not favorited status
    (sessionManager.apiRequest as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('false'),
        json: () => Promise.resolve({ isFavorite: false }),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('true'),
        json: () => Promise.resolve({ isFavorite: true }),
      }));
    
    render(<FavoriteButton {...defaultProps} showText={true} initialFavorite={false} />);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalled();
    });
    
    // Verify initial text is displayed
    let buttonWithText = screen.getByRole('button');
    const initialText = buttonWithText.querySelector('.ml-2.text-sm');
    expect(initialText).toBeInTheDocument();
    expect(initialText?.textContent).toBe('Add to favorites');
    
    // Check button has different styling with text
    expect(buttonWithText).toHaveClass('rounded-lg');
    expect(buttonWithText).toHaveClass('px-3');
    expect(buttonWithText).not.toHaveClass('rounded-full');
    
    // Click to toggle favorite
    await user.click(buttonWithText);
    
    // Wait for toggle to complete
    await waitFor(() => {
      expect(sessionManager.apiRequest).toHaveBeenCalledTimes(2);
    });
    
    // Text should now say "Remove from favorites"
    buttonWithText = screen.getByRole('button');
    const updatedText = buttonWithText.querySelector('.ml-2.text-sm');
    expect(updatedText).toBeInTheDocument();
    expect(updatedText?.textContent).toBe('Remove from favorites');
  });

  // Test error handling for missing listing ID
  test('handles missing listing ID', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<FavoriteButton listingId="" />);
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
    
    consoleSpy.mockRestore();
  });

  // Test loading state
  test('shows loading state during API operations', async () => {
    const user = userEvent.setup();
    
    // Slow API response to show loading state
    let resolveApiPromise: (value: unknown) => void;
    (sessionManager.apiRequest as jest.Mock).mockImplementation(() => 
      new Promise((resolve) => {
        resolveApiPromise = resolve;
      })
    );
    
    render(<FavoriteButton {...defaultProps} />);
    
    // Check initial loading state
    expect(screen.queryByText('Loading')).toBeNull();
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should show loading spinner
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    
    // Resolve API promise
    resolveApiPromise!({
      ok: true,
      status: 200,
      text: () => Promise.resolve('true'),
      json: () => Promise.resolve({ isFavorite: true }),
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(button.querySelector('.animate-spin')).toBeNull();
    });
  });
});
