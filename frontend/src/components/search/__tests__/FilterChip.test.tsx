import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterChip from '../FilterChip';

describe('FilterChip', () => {
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label', () => {
    render(<FilterChip label="Test Filter" onRemove={mockOnRemove} />);
    expect(screen.getByText('Test Filter')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    render(<FilterChip label="Test Filter" onRemove={mockOnRemove} />);
    
    const removeButton = screen.getByRole('button', { name: /remove filter/i });
    fireEvent.click(removeButton);
    
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('renders with custom remove button label', () => {
    render(
      <FilterChip 
        label="Test Filter" 
        onRemove={mockOnRemove} 
        removeButtonLabel="Remove test filter"
      />
    );
    
    expect(screen.getByRole('button', { name: /remove test filter/i })).toBeInTheDocument();
  });

  it('renders with icon when provided', () => {
    const TestIcon = () => <div data-testid="test-icon">🚗</div>;
    
    render(
      <FilterChip 
        label="Test Filter" 
        onRemove={mockOnRemove} 
        icon={<TestIcon />}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FilterChip 
        label="Test Filter" 
        onRemove={mockOnRemove} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has correct default styling classes', () => {
    const { container } = render(
      <FilterChip label="Test Filter" onRemove={mockOnRemove} />
    );
    
    const chip = container.firstChild as HTMLElement;
    expect(chip).toHaveClass(
      'group',
      'inline-flex',
      'items-center',
      'bg-gray-100',
      'border',
      'border-gray-200',
      'rounded-full',
      'px-3',
      'py-2',
      'text-sm',
      'font-medium',
      'text-gray-700'
    );
  });

  it('renders close icon', () => {
    render(<FilterChip label="Test Filter" onRemove={mockOnRemove} />);
    
    // The MdClose icon should be present
    const removeButton = screen.getByRole('button');
    expect(removeButton.querySelector('svg')).toBeInTheDocument();
  });
}); 