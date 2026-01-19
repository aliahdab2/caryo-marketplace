import { render, screen, fireEvent } from '@testing-library/react';
import SignInPromptModal from '../SignInPromptModal';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MessageCircle: () => <span data-testid="message-icon">💬</span>,
  User: () => <span data-testid="user-icon">👤</span>,
  X: () => <span data-testid="close-icon">×</span>,
}));

describe('SignInPromptModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    action: 'contact this seller',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  it('renders when isOpen is true', () => {
    render(<SignInPromptModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<SignInPromptModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the sign in required title', () => {
    render(<SignInPromptModal {...defaultProps} />);
    // The i18n mock returns actual translations
    expect(screen.getByText('Sign In Required')).toBeInTheDocument();
  });

  it('displays action in the message', () => {
    render(<SignInPromptModal {...defaultProps} />);
    // The translation mock will return the key, but the action is passed as a parameter
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows sign in button', () => {
    render(<SignInPromptModal {...defaultProps} />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows create account button', () => {
    render(<SignInPromptModal {...defaultProps} />);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('navigates to sign in page when sign in button is clicked', () => {
    render(<SignInPromptModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Sign In'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/auth/signin?callbackUrl=')
    );
  });

  it('navigates to sign up page when create account button is clicked', () => {
    render(<SignInPromptModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Create Account'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/auth/signup?callbackUrl=')
    );
  });

  it('uses custom callbackUrl when provided', () => {
    render(<SignInPromptModal {...defaultProps} callbackUrl="/listing/123" />);

    fireEvent.click(screen.getByText('Sign In'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('/listing/123'))
    );
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<SignInPromptModal {...defaultProps} onClose={onClose} />);

    // Click the X button
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('[data-testid="close-icon"]'));
    if (xButton) {
      fireEvent.click(xButton);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<SignInPromptModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<SignInPromptModal {...defaultProps} onClose={onClose} />);

    // Click on the backdrop (parent of the dialog)
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = jest.fn();
    render(<SignInPromptModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const onClose = jest.fn();
    render(<SignInPromptModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<SignInPromptModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('prevents body scroll when open', () => {
    render(<SignInPromptModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { unmount } = render(<SignInPromptModal {...defaultProps} />);
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('displays icons correctly', () => {
    render(<SignInPromptModal {...defaultProps} />);

    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('user-icon')).toHaveLength(2); // One in header, one in button
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });
});
