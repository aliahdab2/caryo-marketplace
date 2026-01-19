import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../SearchBar';

// Mock LocationDropdown
jest.mock('../LocationDropdown', () => {
  return function MockLocationDropdown() {
    return <div data-testid="location-dropdown">Location Dropdown</div>;
  };
});

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdClose: () => <span data-testid="close-icon">×</span>,
  MdSearch: () => <span data-testid="search-icon">🔍</span>,
}));

describe('SearchBar', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: jest.fn(),
    searchLoading: false,
    handleSearch: jest.fn(),
    filters: {
      governorates: [],
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
      minMileage: undefined,
      maxMileage: undefined,
      transmissions: [],
      fuelTypes: [],
      bodyStyles: [],
      sellerTypes: [],
      brandId: undefined,
      modelId: undefined,
    },
    setFilters: jest.fn(),
    showLocationDropdown: false,
    setShowLocationDropdown: jest.fn(),
    governorates: [],
    currentLanguage: 'en',
    t: (key: string, fallback?: string) => fallback || key,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the search button', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByLabelText('Search for cars')).toBeInTheDocument();
  });

  it('renders location dropdown', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Search for cars/)).toBeInTheDocument();
  });

  it('calls setSearchQuery when typing', () => {
    const setSearchQuery = jest.fn();
    render(<SearchBar {...defaultProps} setSearchQuery={setSearchQuery} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Toyota' } });
    expect(setSearchQuery).toHaveBeenCalledWith('Toyota');
  });

  it('calls handleSearch when Enter is pressed', () => {
    const handleSearch = jest.fn();
    render(<SearchBar {...defaultProps} handleSearch={handleSearch} />);

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  it('calls handleSearch when search button is clicked with query', () => {
    const handleSearch = jest.fn();
    render(<SearchBar {...defaultProps} searchQuery="Toyota" handleSearch={handleSearch} />);

    fireEvent.click(screen.getByLabelText('Search for cars'));
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  it('does not call handleSearch when search button clicked with empty query', () => {
    const handleSearch = jest.fn();
    render(<SearchBar {...defaultProps} searchQuery="" handleSearch={handleSearch} />);

    fireEvent.click(screen.getByLabelText('Search for cars'));
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it('shows clear button when there is search text', () => {
    render(<SearchBar {...defaultProps} searchQuery="Toyota" />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('does not show clear button when search is empty', () => {
    render(<SearchBar {...defaultProps} searchQuery="" />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    const setSearchQuery = jest.fn();
    render(<SearchBar {...defaultProps} searchQuery="Toyota" setSearchQuery={setSearchQuery} />);

    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(setSearchQuery).toHaveBeenCalledWith('');
  });

  it('shows loading state when searchLoading is true', () => {
    render(<SearchBar {...defaultProps} searchLoading={true} />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows search text when not loading', () => {
    render(<SearchBar {...defaultProps} searchLoading={false} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('applies RTL direction for Arabic', () => {
    render(<SearchBar {...defaultProps} currentLanguage="ar" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('dir', 'rtl');
  });

  it('applies LTR direction for English', () => {
    render(<SearchBar {...defaultProps} currentLanguage="en" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('dir', 'ltr');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search for cars by make, model, or location');
    expect(input).toHaveAttribute('aria-describedby', 'search-help');
  });

  it('has screen reader only label', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByText('Search for cars by make, model, or location')).toHaveClass('sr-only');
  });

  it('has screen reader help text', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByText(/Enter car make, model, or location/)).toHaveClass('sr-only');
  });

  it('renders search icon', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });
});
