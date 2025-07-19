import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    
    expect(screen.getByLabelText('Min Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Price')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // min input
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
    
    const minInput = screen.getByLabelText('Min Price');
    await user.clear(minInput);
    await user.type(minInput, '15000');
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(15000, 100000);
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
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(<PriceSlider {...defaultProps} onChange={onChange} />);
    
    const minInput = screen.getByLabelText('Min Price');
    await user.clear(minInput);
    await user.type(minInput, '150000'); // Above maxRange
    
    // Should be constrained to maxRange - step
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(99000, 100000);
    });
  });

  it('can be configured without inputs or labels', () => {
    render(
      <PriceSlider 
        {...defaultProps} 
        showInputs={false} 
        showLabels={false} 
      />
    );
    
    expect(screen.queryByLabelText('Min Price')).not.toBeInTheDocument();
    expect(screen.queryByText('$0')).not.toBeInTheDocument();
  });

  it('applies custom styling props', () => {
    render(
      <PriceSlider 
        {...defaultProps} 
        trackColor="bg-red-500"
        thumbColor="bg-red-600"
        className="custom-slider"
      />
    );
    
    const container = document.querySelector('.custom-slider');
    expect(container).toBeInTheDocument();
  });

  it('validates props and shows warnings', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    render(
      <PriceSlider 
        {...defaultProps} 
        minRange={100} 
        maxRange={50} // Invalid: min > max
      />
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'PriceSlider: minRange should be less than maxRange'
    );
    
    consoleSpy.mockRestore();
  });
});
