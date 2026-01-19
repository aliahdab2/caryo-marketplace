import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast, { ToastProps } from '../Toast';

// Mock the react-icons
jest.mock('react-icons/md', () => ({
  MdCheckCircle: () => <span data-testid="icon-success">✓</span>,
  MdError: () => <span data-testid="icon-error">✕</span>,
  MdWarning: () => <span data-testid="icon-warning">⚠</span>,
  MdInfo: () => <span data-testid="icon-info">ℹ</span>,
  MdClose: () => <span data-testid="icon-close">×</span>,
}));

describe('Toast', () => {
  const defaultProps: ToastProps = {
    message: 'Test message',
    visible: true,
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders when visible is true', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(<Toast {...defaultProps} visible={false} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders with title when provided', () => {
    render(<Toast {...defaultProps} title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders success type correctly', () => {
    render(<Toast {...defaultProps} type="success" />);
    expect(screen.getByTestId('icon-success')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
  });

  it('renders error type correctly', () => {
    render(<Toast {...defaultProps} type="error" />);
    expect(screen.getByTestId('icon-error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
  });

  it('renders warning type correctly', () => {
    render(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByTestId('icon-warning')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
  });

  it('renders info type correctly (default)', () => {
    render(<Toast {...defaultProps} type="info" />);
    expect(screen.getByTestId('icon-info')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50');
  });

  it('shows close button when dismissible is true (default)', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
  });

  it('hides close button when dismissible is false', () => {
    render(<Toast {...defaultProps} dismissible={false} />);
    expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close notification'));

    // Wait for the animation delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-hides after autoHideDuration', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} autoHideDuration={3000} onClose={onClose} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Advance to trigger auto-hide
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Wait for animation
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto-hide when autoHideDuration is 0', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} autoHideDuration={0} onClose={onClose} />);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('closes on Escape key press when dismissible', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape key when not dismissible', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} dismissible={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Toast {...defaultProps} className="my-custom-class" />);
    expect(screen.getByRole('alert')).toHaveClass('my-custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<Toast {...defaultProps} />);
    const alert = screen.getByRole('alert');

    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('updates visibility when visible prop changes', () => {
    const { rerender } = render(<Toast {...defaultProps} visible={false} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<Toast {...defaultProps} visible={true} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
