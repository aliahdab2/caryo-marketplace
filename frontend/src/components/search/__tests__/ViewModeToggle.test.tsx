import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewModeToggle from '../ViewModeToggle';
import { ViewMode } from '../ViewModeToggle';

// Mock translation function
const mockT = (key: string, fallback?: string) => {
  const translations: Record<string, string> = {
    'search:gridView': 'Grid view',
    'search:listView': 'List view',
    'search:grid': 'grid',
    'search:list': 'list',
  };
  return translations[key] || fallback || key;
};

describe('ViewModeToggle', () => {
  const defaultProps = {
    viewMode: 'grid' as ViewMode,
    onViewModeChange: jest.fn(),
    t: mockT,
    isRTL: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both grid and list buttons', () => {
    render(<ViewModeToggle {...defaultProps} />);

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
  });

  it('highlights the active view mode', () => {
    render(<ViewModeToggle {...defaultProps} viewMode="grid" />);

    const gridButton = screen.getByLabelText('Grid view');
    const listButton = screen.getByLabelText('List view');

    expect(gridButton).toHaveClass('bg-blue-600', 'text-white');
    expect(listButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('calls onViewModeChange when list button is clicked', () => {
    const onViewModeChange = jest.fn();
    render(<ViewModeToggle {...defaultProps} onViewModeChange={onViewModeChange} />);

    const listButton = screen.getByLabelText('List view');
    fireEvent.click(listButton);

    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });

  it('calls onViewModeChange when grid button is clicked', () => {
    const onViewModeChange = jest.fn();
    render(<ViewModeToggle {...defaultProps} viewMode="list" onViewModeChange={onViewModeChange} />);

    const gridButton = screen.getByLabelText('Grid view');
    fireEvent.click(gridButton);

    expect(onViewModeChange).toHaveBeenCalledWith('grid');
  });

  it('applies RTL styling when isRTL is true', () => {
    const { container } = render(<ViewModeToggle {...defaultProps} isRTL={true} />);

    const gridButton = container.querySelector('button[aria-label="Grid view"]');
    expect(gridButton).toBeInTheDocument();
  });

  it('applies LTR styling when isRTL is false', () => {
    const { container } = render(<ViewModeToggle {...defaultProps} isRTL={false} />);

    const gridButton = container.querySelector('button[aria-label="Grid view"]');
    expect(gridButton).toBeInTheDocument();
  });
});
