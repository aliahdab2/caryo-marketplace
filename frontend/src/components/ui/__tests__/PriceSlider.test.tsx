import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PriceSlider from '../PriceSlider';

describe('PriceSlider', () => {
  const defaultProps = {
    onChange: jest.fn(),
    minRange: 0,
    maxRange: 100000,
    step: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default values', () => {
    render(<PriceSlider {...defaultProps} />);
    
    expect(screen.getByLabelText('Lowest price')).toBeInTheDocument();
    expect(screen.getByLabelText('Highest price')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('')).toHaveLength(2); // Both min and max inputs start empty
  });

  it('displays initial price values correctly', () => {
    render(
      <PriceSlider 
        {...defaultProps} 
        minPrice={10000} 
        maxPrice={50000} 
      />
    );
    
    expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
  });

  it('calls onChange when input values change', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<PriceSlider {...defaultProps} onChange={onChange} />);
    
    const minInput = screen.getByLabelText('Lowest price');
    await user.clear(minInput);
    await user.type(minInput, '15000');
    
    await waitFor(() => {
      // onChange is called for each keystroke, so check that final call has correct values
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall).toEqual([15000, undefined]); // maxVal should be undefined when at maxRange
    });
  });

  it('handles keyboard navigation on slider thumbs', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<PriceSlider {...defaultProps} onChange={onChange} />);
    
    const minThumb = screen.getByRole('slider', { name: 'Minimum price' });
    minThumb.focus();
    
    await user.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('respects min and max constraints', async () => {
    const onChange = jest.fn();
    
    render(<PriceSlider {...defaultProps} onChange={onChange} />);
    
    const minInput = screen.getByLabelText('Lowest price');
    
    // Instead of typing character by character, simulate pasting the full value
    fireEvent.change(minInput, { target: { value: '150000' } });
    
    // Should be constrained to maxRange - step
    await waitFor(() => {
      // onChange should be called with the constrained value
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall).toEqual([99000, undefined]); // Constrained to maxRange - step
    });
  });

  it('can be configured without inputs', () => {
    render(
      <PriceSlider 
        {...defaultProps} 
        showInputs={false} 
      />
    );
    
    expect(screen.queryByLabelText('Lowest price')).not.toBeInTheDocument();
  });

  it('applies custom styling props', () => {
    render(
      <PriceSlider 
        {...defaultProps} 
        className="custom-slider"
      />
    );
    
    const container = document.querySelector('.custom-slider');
    expect(container).toBeInTheDocument();
  });

  it('validates props and shows warnings', () => {
    // Store the current (modified) console.warn and get access to original
    const currentWarn = console.warn;
    const originalWarn = jest.fn();
    
    // Temporarily replace with our spy that captures the call
    console.warn = originalWarn;
    
    render(
      <PriceSlider 
        {...defaultProps} 
        minRange={100} 
        maxRange={50} // Invalid: min > max
      />
    );
    
    expect(originalWarn).toHaveBeenCalledWith(
      'PriceSlider: minRange should be less than maxRange'
    );
    
    // Restore the modified console.warn
    console.warn = currentWarn;
  });
});
