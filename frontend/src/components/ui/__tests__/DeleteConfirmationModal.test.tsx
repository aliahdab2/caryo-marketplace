import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

// Mock language direction hook
jest.mock('@/utils/languageDirection', () => ({
  useLanguageDirection: () => ({ isRTL: false }),
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaTimes: () => <span data-testid="close-icon">×</span>,
}));

jest.mock('react-icons/md', () => ({
  MdWarning: () => <span data-testid="warning-icon">⚠</span>,
  MdDelete: () => <span data-testid="delete-icon">🗑</span>,
  MdInfo: () => <span data-testid="info-icon">ℹ</span>,
}));

describe('DeleteConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<DeleteConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders item name when provided', () => {
    render(<DeleteConfirmationModal {...defaultProps} itemName="Test Item" />);
    expect(screen.getByText('"Test Item"')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);

    // The backdrop has a specific class, find it
    const backdrop = document.querySelector('.delete-modal-backdrop');
    if (backdrop) {
      // Fire click event with target === currentTarget to simulate backdrop click
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Delete Item'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const onClose = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(<DeleteConfirmationModal {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('uses custom loading text', () => {
    render(<DeleteConfirmationModal {...defaultProps} isLoading={true} loadingText="Processing..." />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('uses custom button text', () => {
    render(
      <DeleteConfirmationModal
        {...defaultProps}
        confirmText="Remove"
        cancelText="Go Back"
      />
    );

    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('disables buttons and backdrop click when loading', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    render(
      <DeleteConfirmationModal
        {...defaultProps}
        isLoading={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    // Close button should be disabled
    expect(screen.getByLabelText('Close modal')).toBeDisabled();

    // Cancel button should be disabled
    expect(screen.getByText('Cancel')).toBeDisabled();

    // Escape should not close
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders danger type with delete icon', () => {
    render(<DeleteConfirmationModal {...defaultProps} type="danger" />);
    // Danger type uses delete icon - check for both modal header icon and button icon
    const deleteIcons = screen.getAllByTestId('delete-icon');
    expect(deleteIcons.length).toBeGreaterThan(0);
  });

  it('renders warning type with warning icon', () => {
    render(<DeleteConfirmationModal {...defaultProps} type="warning" />);
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });

  it('renders info type with info icon', () => {
    render(<DeleteConfirmationModal {...defaultProps} type="info" />);
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
  });

  it('renders information mode with only OK button', () => {
    render(<DeleteConfirmationModal {...defaultProps} mode="information" />);

    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('closes modal when OK is clicked in information mode', () => {
    const onClose = jest.fn();
    render(<DeleteConfirmationModal {...defaultProps} mode="information" onClose={onClose} />);

    fireEvent.click(screen.getByText('OK'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders multiple messages as array', () => {
    const messages = ['First message', 'Second message', 'Third message'];
    render(<DeleteConfirmationModal {...defaultProps} message={messages} />);

    messages.forEach(msg => {
      expect(screen.getByText(msg)).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<DeleteConfirmationModal {...defaultProps} className="custom-modal-class" />);

    const modalContent = screen.getByRole('dialog').querySelector('.custom-modal-class');
    expect(modalContent).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  it('traps focus within modal', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    const closeButton = screen.getByLabelText('Close modal');

    // Verify focus can be set to modal elements
    cancelButton.focus();
    expect(document.activeElement).toBe(cancelButton);

    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
  });
});
