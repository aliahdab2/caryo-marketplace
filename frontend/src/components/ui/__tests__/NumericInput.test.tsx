import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NumericInput from '../NumericInput';

describe('NumericInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with initial value', () => {
    render(<NumericInput value="123" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('123');
  });

  it('accepts English numerals', () => {
    render(<NumericInput value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '123' } });

    expect(mockOnChange).toHaveBeenCalledWith('123');
  });

  it('accepts Arabic numerals and converts them', () => {
    render(<NumericInput value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');

    // Arabic numerals: ٢٠٢٠ (2020)
    fireEvent.change(input, { target: { value: '٢٠٢٠' } });

    expect(mockOnChange).toHaveBeenCalledWith('2020');
  });

  it('filters out non-numeric characters including spaces', () => {
    render(<NumericInput value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '12 34 abc 56' } });

    expect(mockOnChange).toHaveBeenCalledWith('123456');
  });

  it('handles mixed Arabic and English numerals', () => {
    render(<NumericInput value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');

    // Mixed: 12٣4 (1234)
    fireEvent.change(input, { target: { value: '12٣4' } });

    expect(mockOnChange).toHaveBeenCalledWith('1234');
  });

  it('handles empty input', () => {
    render(<NumericInput value="123" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('applies error styling when error prop is true', () => {
    render(<NumericInput value="" onChange={mockOnChange} error={true} />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('border-red-300');
  });

  it('applies disabled styling when disabled prop is true', () => {
    render(<NumericInput value="" onChange={mockOnChange} disabled={true} />);
    const input = screen.getByRole('textbox');

    expect(input).toBeDisabled();
    expect(input).toHaveClass('opacity-50');
  });

  it('validates min value on blur', () => {
    render(<NumericInput value="5" onChange={mockOnChange} min={10} />);
    const input = screen.getByRole('textbox');

    fireEvent.blur(input);

    expect(mockOnChange).toHaveBeenCalledWith('10');
  });

  it('validates max value on blur', () => {
    render(<NumericInput value="150" onChange={mockOnChange} max={100} />);
    const input = screen.getByRole('textbox');

    fireEvent.blur(input);

    expect(mockOnChange).toHaveBeenCalledWith('100');
  });
});