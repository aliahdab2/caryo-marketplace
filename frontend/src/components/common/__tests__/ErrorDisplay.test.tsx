import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '../ErrorDisplay';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('ErrorDisplay', () => {
  it('should render error message from Error object', () => {
    const error = new Error('Test error message');
    render(<ErrorDisplay error={error} />);
    // The error message appears in the paragraph, title is generic
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render error message from string', () => {
    render(<ErrorDisplay error="String error message" />);
    expect(screen.getByText('String error message')).toBeInTheDocument();
  });

  it('should render default message for null error', () => {
    render(<ErrorDisplay error={null} />);
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(<ErrorDisplay error="Test error" title="Custom Error Title" />);
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('should render retry button when retry function is provided', () => {
    const retry = jest.fn();
    render(<ErrorDisplay error="Test error" retry={retry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call retry function when retry button is clicked', () => {
    const retry = jest.fn();
    render(<ErrorDisplay error="Test error" retry={retry} />);
    
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when retry is not provided', () => {
    render(<ErrorDisplay error="Test error" />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('should detect network error and show appropriate title', () => {
    render(<ErrorDisplay error="Network request failed" />);
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
  });

  it('should have alert role for accessibility', () => {
    render(<ErrorDisplay error="Test error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ErrorDisplay error="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
