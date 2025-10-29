import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from '../PasswordInput';
import '../../../tests/mocks/i18n-mock';

describe('PasswordInput', () => {
  const defaultProps = {
    id: 'test-password',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with password type by default', () => {
    render(<PasswordInput {...defaultProps} />);

    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with lock icon', () => {
    render(<PasswordInput {...defaultProps} />);

    // Check for the lock icon (SVG path)
    const lockIcon = document.querySelector('svg path[d="M7 11V7a5 5 0 0 1 10 0v4"]');
    expect(lockIcon).toBeInTheDocument();
  });

  it('renders with visibility toggle button', () => {
    render(<PasswordInput {...defaultProps} />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label', 'showPassword');
  });

  it('toggles password visibility when button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const input = document.getElementById('test-password') as HTMLInputElement;
    const toggleButton = screen.getByRole('button');

    // Initially should be password type
    expect(input).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'showPassword');

    // Click to show password
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'hidePassword');

    // Click to hide password again
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'showPassword');
  });

  it('calls onChange when input value changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    render(<PasswordInput {...defaultProps} onChange={mockOnChange} />);

    const input = document.getElementById('test-password') as HTMLInputElement;

    await user.type(input, 'test123');

    expect(mockOnChange).toHaveBeenCalledTimes(7); // One for each character
  });

  it('disables toggle button when input is disabled', () => {
    render(<PasswordInput {...defaultProps} disabled />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<PasswordInput {...defaultProps} className="custom-class" />);

    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveClass('custom-class');
  });

  it('sets correct autoComplete attribute', () => {
    render(<PasswordInput {...defaultProps} autoComplete="new-password" />);

    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveAttribute('autocomplete', 'new-password');
  });

  it('shows eye icon when password is hidden', () => {
    render(<PasswordInput {...defaultProps} />);

    // Check for the eye icon (show password)
    const eyeIcon = document.querySelector('svg path[d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"]');
    expect(eyeIcon).toBeInTheDocument();
  });

  it('shows eye-slash icon when password is visible', async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const toggleButton = screen.getByRole('button');

    // Click to show password
    await user.click(toggleButton);

    // Check for the eye-slash icon (hide password)
    const eyeSlashIcon = document.querySelector('svg path[d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"]');
    expect(eyeSlashIcon).toBeInTheDocument();
  });
});
