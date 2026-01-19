import { render, screen, fireEvent, act } from '@testing-library/react';
import SortDropdown from '../SortDropdown';

// Mock hooks
jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock('@/utils/languageDirection', () => ({
  useLanguageDirection: () => ({
    dirClass: 'ltr',
    isRTL: false,
  }),
}));

// Mock sort utils
jest.mock('@/utils/sortUtils', () => ({
  getSortDisplayText: (sort: string) => {
    const map: Record<string, string> = {
      'createdAt,desc': 'Newest First',
      'price,asc': 'Price: Low to High',
      'price,desc': 'Price: High to Low',
      'mileage,asc': 'Mileage: Low to High',
    };
    return map[sort] || sort;
  },
  SORT_OPTIONS: [
    { value: 'createdAt,desc', label: 'sortNewest', fallback: 'Newest First' },
    { value: 'price,asc', label: 'sortPriceLow', fallback: 'Price: Low to High' },
    { value: 'price,desc', label: 'sortPriceHigh', fallback: 'Price: High to Low' },
    { value: 'mileage,asc', label: 'sortMileageLow', fallback: 'Mileage: Low to High' },
  ],
}));

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdSort: () => <span data-testid="sort-icon">↕</span>,
  MdKeyboardArrowDown: () => <span data-testid="arrow-icon">▼</span>,
}));

describe('SortDropdown', () => {
  const defaultProps = {
    selectedSort: 'createdAt,desc',
    onSortChange: jest.fn(),
    onSearchTrigger: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sort button', () => {
    render(<SortDropdown {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays current sort selection', () => {
    render(<SortDropdown {...defaultProps} />);
    expect(screen.getByText(/Newest First/)).toBeInTheDocument();
  });

  it('shows sort icon', () => {
    render(<SortDropdown {...defaultProps} />);
    expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
  });

  it('shows dropdown arrow', () => {
    render(<SortDropdown {...defaultProps} />);
    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(<SortDropdown {...defaultProps} />);

    // Dropdown should not be visible initially
    expect(screen.queryByText('Price: Low to High')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(screen.getByRole('button'));

    // Dropdown should now be visible
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
  });

  it('displays all sort options in dropdown', () => {
    render(<SortDropdown {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Newest First')).toBeInTheDocument();
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
    expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
    expect(screen.getByText('Mileage: Low to High')).toBeInTheDocument();
  });

  it('calls onSortChange when option is selected', () => {
    const onSortChange = jest.fn();
    render(<SortDropdown {...defaultProps} onSortChange={onSortChange} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Price: Low to High'));

    expect(onSortChange).toHaveBeenCalledWith('price,asc');
  });

  it('calls onSearchTrigger when option is selected', () => {
    const onSearchTrigger = jest.fn();
    render(<SortDropdown {...defaultProps} onSearchTrigger={onSearchTrigger} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Price: Low to High'));

    expect(onSearchTrigger).toHaveBeenCalledTimes(1);
  });

  it('closes dropdown after selection', () => {
    render(<SortDropdown {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Price: Low to High'));

    // Dropdown should be closed (only one "Price: Low to High" should be visible - in the button)
    expect(screen.queryAllByText('Price: Low to High')).toHaveLength(0);
  });

  it('closes dropdown on Escape key', async () => {
    jest.useFakeTimers();

    render(<SortDropdown {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    // Wait for event listener to be added
    act(() => {
      jest.advanceTimersByTime(150);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Price: Low to High')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('highlights currently selected option', () => {
    render(<SortDropdown {...defaultProps} selectedSort="price,asc" />);

    fireEvent.click(screen.getByRole('button'));

    const selectedOption = screen.getByText('Price: Low to High');
    expect(selectedOption).toHaveClass('bg-blue-50');
    expect(selectedOption).toHaveClass('text-blue-700');
  });

  it('has proper accessibility label', () => {
    render(<SortDropdown {...defaultProps} />);
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('has focus styles on button', () => {
    render(<SortDropdown {...defaultProps} />);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-blue-500');
  });

  it('toggles dropdown on repeated clicks', () => {
    render(<SortDropdown {...defaultProps} />);

    // Get the main trigger button by aria-label
    const triggerButton = screen.getByLabelText('Sort by');

    // First click - open
    fireEvent.click(triggerButton);
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();

    // Second click - close
    fireEvent.click(triggerButton);
    expect(screen.queryByText('Price: Low to High')).not.toBeInTheDocument();

    // Third click - open again
    fireEvent.click(triggerButton);
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
  });
});
