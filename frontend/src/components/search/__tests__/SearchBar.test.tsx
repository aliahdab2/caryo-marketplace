import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { Governorate } from '@/services/api';

// Mock LocationDropdown since it's a dependency
jest.mock('../LocationDropdown', () => {
  return function MockLocationDropdown({ filters, setFilters, currentLanguage, t }: any) {
    return (
      <div data-testid="location-dropdown">
        <button
          onClick={() => setFilters({ ...filters, governorateId: [1] })}
          data-testid="mock-location-filter"
        >
          {t('locationFilter', 'Location Filter')} - {currentLanguage}
        </button>
      </div>
    );
  };
});

// Mock icons
jest.mock('react-icons/md', () => ({
  MdClose: () => <div data-testid="close-icon" />,
  MdSearch: () => <div data-testid="search-icon" />,
}));

describe('SearchBar', () => {
  const mockT = (key: string, fallback?: string) => fallback || key;
  const mockGovernorate: Governorate = {
    id: 1,
    displayNameEn: 'Test Governorate',
    displayNameAr: 'محافظة تجريبية'
  };

  const defaultProps = {
    searchQuery: '',
    setSearchQuery: jest.fn(),
    searchLoading: false,
    handleSearch: jest.fn(),
    filters: {
      brandId: undefined,
      modelId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
      minMileage: undefined,
      maxMileage: undefined,
      transmission: [],
      fuelType: [],
      bodyType: [],
      sellerType: [],
      governorateId: [],
      condition: undefined,
      hasImages: false,
      sortBy: 'newest' as const,
      searchQuery: ''
    } as AdvancedSearchFilters,
    setFilters: jest.fn(),
    showLocationDropdown: false,
    setShowLocationDropdown: jest.fn(),
    governorates: [mockGovernorate],
    currentLanguage: 'en',
    t: mockT
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search input with correct placeholder', () => {
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")');
    });

    it('renders search button', () => {
      render(<SearchBar {...defaultProps} />);
      
      const searchButton = screen.getByRole('button', { name: /search for cars/i });
      expect(searchButton).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders location dropdown component', () => {
      render(<SearchBar {...defaultProps} />);
      
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
    });

    it('displays loading spinner when searchLoading is true', () => {
      render(<SearchBar {...defaultProps} searchLoading={true} />);
      
      const loadingSpinner = screen.getByRole('button', { name: /search for cars/i });
      expect(loadingSpinner).toBeInTheDocument();
      
      // Check for loading spinner and sr-only text
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  describe('Search Input Functionality', () => {
    it('calls setSearchQuery when typing in input', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'T');
      
      // Check that setSearchQuery was called
      expect(defaultProps.setSearchQuery).toHaveBeenCalledWith('T');
    });

    it('displays current search query in input', () => {
      render(<SearchBar {...defaultProps} searchQuery="BMW X3" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('BMW X3');
    });

    it('calls handleSearch when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} searchQuery="test query" />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Enter}');
      
      expect(defaultProps.handleSearch).toHaveBeenCalled();
    });
  });

  describe('Clear Button Functionality', () => {
    it('shows clear button when there is search text', () => {
      render(<SearchBar {...defaultProps} searchQuery="test search" />);
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('does not show clear button when search query is empty', () => {
      render(<SearchBar {...defaultProps} searchQuery="" />);
      
      const clearButton = screen.queryByRole('button', { name: /clear search/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('clears search query when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} searchQuery="test search" />);
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(defaultProps.setSearchQuery).toHaveBeenCalledWith('');
    });
  });

  describe('Search Button Functionality', () => {
    it('calls handleSearch when search button is clicked with query', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} searchQuery="test query" />);
      
      const searchButton = screen.getByRole('button', { name: /search for cars/i });
      await user.click(searchButton);
      
      expect(defaultProps.handleSearch).toHaveBeenCalled();
    });

    it('does not call handleSearch when search button is clicked without query', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} searchQuery="" />);
      
      const searchButton = screen.getByRole('button', { name: /search for cars/i });
      await user.click(searchButton);
      
      expect(defaultProps.handleSearch).not.toHaveBeenCalled();
    });

    it('does not call handleSearch when search button is clicked with only whitespace', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} searchQuery="   " />);
      
      const searchButton = screen.getByRole('button', { name: /search for cars/i });
      await user.click(searchButton);
      
      expect(defaultProps.handleSearch).not.toHaveBeenCalled();
    });
  });

  describe('RTL Language Support', () => {
    it('applies RTL classes for Arabic language', () => {
      render(<SearchBar {...defaultProps} currentLanguage="ar" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('dir', 'rtl');
      expect(input).toHaveClass('text-right', 'dir-rtl');
    });

    it('applies LTR classes for English language', () => {
      render(<SearchBar {...defaultProps} currentLanguage="en" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('dir', 'ltr');
      expect(input).toHaveClass('text-left');
    });

    it('positions clear button correctly for RTL', () => {
      render(<SearchBar {...defaultProps} currentLanguage="ar" searchQuery="test" />);
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toHaveClass('left-2', 'sm:left-20');
    });

    it('positions clear button correctly for LTR', () => {
      render(<SearchBar {...defaultProps} currentLanguage="en" searchQuery="test" />);
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toHaveClass('right-2', 'sm:right-20');
    });
  });

  describe('Integration with LocationDropdown', () => {
    it('passes correct props to LocationDropdown', () => {
      render(<SearchBar {...defaultProps} />);
      
      const locationDropdown = screen.getByTestId('location-dropdown');
      expect(locationDropdown).toBeInTheDocument();
      
      // Test that LocationDropdown receives current language
      expect(screen.getByText('Location Filter - en')).toBeInTheDocument();
    });

    it('updates filters when LocationDropdown changes', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} />);
      
      const mockLocationButton = screen.getByTestId('mock-location-filter');
      await user.click(mockLocationButton);
      
      expect(defaultProps.setFilters).toHaveBeenCalledWith({
        ...defaultProps.filters,
        governorateId: [1]
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search for cars by make, model, or location');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
      
      const searchButton = screen.getByRole('button', { name: /search for cars/i });
      expect(searchButton).toHaveAttribute('aria-label', 'Search for cars');
    });

    it('provides screen reader help text', () => {
      render(<SearchBar {...defaultProps} />);
      
      const helpText = screen.getByText('Enter car make, model, or location and press Enter or click Search button');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveClass('sr-only');
    });

    it('provides screen reader text for loading state', () => {
      render(<SearchBar {...defaultProps} searchLoading={true} />);
      
      const loadingText = screen.getByText('Searching...');
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveClass('sr-only');
    });

    it('has proper label association', () => {
      render(<SearchBar {...defaultProps} />);
      
      const label = screen.getByLabelText('Search for cars by make, model, or location');
      const input = screen.getByRole('textbox');
      expect(label).toBe(input);
    });
  });

  describe('Responsive Design', () => {
    it('applies mobile-first responsive classes', () => {
      render(<SearchBar {...defaultProps} />);
      
      const container = screen.getByRole('textbox').closest('.space-y-3');
      expect(container).toHaveClass('sm:space-y-0', 'sm:flex', 'sm:flex-row', 'sm:gap-3');
    });

    it('applies responsive button positioning', () => {
      render(<SearchBar {...defaultProps} />);
      
      const searchButton = screen.getByRole('button', { name: /search for cars/i });
      expect(searchButton).toHaveClass('sm:absolute', 'sm:top-1', 'sm:bottom-1');
    });
  });

  describe('Custom Translation Function', () => {
    it('uses provided translation function', () => {
      const customT = jest.fn().mockReturnValue('Custom Translation');
      render(<SearchBar {...defaultProps} t={customT} />);
      
      expect(customT).toHaveBeenCalledWith('searchLabel', 'Search for cars by make, model, or location');
      expect(customT).toHaveBeenCalledWith('placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")');
      expect(customT).toHaveBeenCalledWith('search', 'Search');
    });
  });
});
