import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPills from '../FilterPills';
import { FilterType } from '@/hooks/useSearchFilters';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdFilterList: () => <div data-testid="filter-list-icon">Filter List</div>,
}));

describe('FilterPills', () => {
  const mockSetActiveFilterModal = jest.fn();
  const mockIsFilterActive = jest.fn();
  const mockGetFilterDisplayText = jest.fn();
  const mockT = (key: string, fallback?: string) => fallback || key;

  const defaultProps = {
    setActiveFilterModal: mockSetActiveFilterModal,
    isFilterActive: mockIsFilterActive,
    getFilterDisplayText: mockGetFilterDisplayText,
    t: mockT
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockIsFilterActive.mockReturnValue(false);
    mockGetFilterDisplayText.mockImplementation((filterType: FilterType) => {
      const displayNames: Record<FilterType, string> = {
        makeModel: 'Make & Model',
        price: 'Price',
        year: 'Year',
        mileage: 'Mileage',
        transmission: 'Transmission',
        fuelType: 'Fuel Type',
        bodyStyle: 'Body Style',
        sellerType: 'Seller Type',
        allFilters: 'All Filters'
      };
      return displayNames[filterType] || filterType;
    });
  });

  describe('Rendering', () => {
    it('renders the filter pills container', () => {
      render(<FilterPills {...defaultProps} />);
      
      const container = screen.getByRole('button', { name: /show all filters/i })
        .closest('.mb-4.bg-white.dark\\:bg-gray-800');
      expect(container).toHaveClass('mb-4', 'bg-white', 'rounded-lg', 'border', 'p-3', 'shadow-sm');
    });

    it('renders the "Show All Filters" button', () => {
      render(<FilterPills {...defaultProps} />);
      
      const showAllFiltersButton = screen.getByRole('button', { name: /show all filters/i });
      expect(showAllFiltersButton).toBeInTheDocument();
      expect(screen.getByText('Show all filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-list-icon')).toBeInTheDocument();
    });

    it('renders all filter pill buttons', () => {
      render(<FilterPills {...defaultProps} />);
      
      const filterTypes: FilterType[] = [
        'makeModel', 'price', 'year', 'mileage', 
        'transmission', 'fuelType', 'bodyStyle', 'sellerType'
      ];
      
      filterTypes.forEach(filterType => {
        const displayText = mockGetFilterDisplayText(filterType);
        const filterButton = screen.getByRole('button', { name: `Filter by ${displayText}` });
        expect(filterButton).toBeInTheDocument();
        expect(screen.getByText(displayText)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Pill Interactions', () => {
    it('calls setActiveFilterModal when "Show All Filters" button is clicked', async () => {
      const user = userEvent.setup();
      render(<FilterPills {...defaultProps} />);
      
      const showAllFiltersButton = screen.getByRole('button', { name: /show all filters/i });
      await user.click(showAllFiltersButton);
      
      expect(mockSetActiveFilterModal).toHaveBeenCalledWith('allFilters');
    });

    it('calls setActiveFilterModal with correct filter type when filter pill is clicked', async () => {
      const user = userEvent.setup();
      render(<FilterPills {...defaultProps} />);
      
      const makeModelButton = screen.getByRole('button', { name: /filter by make & model/i });
      await user.click(makeModelButton);
      
      expect(mockSetActiveFilterModal).toHaveBeenCalledWith('makeModel');
    });

    it('calls setActiveFilterModal for each filter type', async () => {
      const user = userEvent.setup();
      render(<FilterPills {...defaultProps} />);
      
      const filterTypes: FilterType[] = [
        'makeModel', 'price', 'year', 'mileage', 
        'transmission', 'fuelType', 'bodyStyle', 'sellerType'
      ];
      
      for (const filterType of filterTypes) {
        const displayText = mockGetFilterDisplayText(filterType);
        const filterButton = screen.getByRole('button', { name: `Filter by ${displayText}` });
        await user.click(filterButton);
        
        expect(mockSetActiveFilterModal).toHaveBeenCalledWith(filterType);
      }
    });
  });

  describe('Active State Handling', () => {
    it('applies active styles when filter is active', () => {
      mockIsFilterActive.mockImplementation((filterType: FilterType) => filterType === 'price');
      
      render(<FilterPills {...defaultProps} />);
      
      const priceButton = screen.getByRole('button', { name: /filter by price/i });
      expect(priceButton).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white');
    });

    it('applies inactive styles when filter is not active', () => {
      mockIsFilterActive.mockReturnValue(false);
      
      render(<FilterPills {...defaultProps} />);
      
      const priceButton = screen.getByRole('button', { name: /filter by price/i });
      expect(priceButton).toHaveClass('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
    });

    it('shows animated background for active filters', () => {
      mockIsFilterActive.mockImplementation((filterType: FilterType) => filterType === 'year');
      
      render(<FilterPills {...defaultProps} />);
      
      const yearButton = screen.getByRole('button', { name: /filter by year/i });
      const animatedBackground = yearButton.querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r.from-blue-400.to-blue-600');
      expect(animatedBackground).toBeInTheDocument();
    });

    it('does not show animated background for inactive filters', () => {
      mockIsFilterActive.mockReturnValue(false);
      
      render(<FilterPills {...defaultProps} />);
      
      const yearButton = screen.getByRole('button', { name: /filter by year/i });
      const animatedBackground = yearButton.querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r.from-blue-400.to-blue-600');
      expect(animatedBackground).not.toBeInTheDocument();
    });
  });

  describe('Display Text Integration', () => {
    it('uses getFilterDisplayText for button labels', () => {
      mockGetFilterDisplayText.mockImplementation((filterType: FilterType) => {
        if (filterType === 'makeModel') return 'Custom Make & Model';
        return filterType;
      });
      
      render(<FilterPills {...defaultProps} />);
      
      expect(screen.getByText('Custom Make & Model')).toBeInTheDocument();
      expect(mockGetFilterDisplayText).toHaveBeenCalledWith('makeModel');
    });

    it('calls getFilterDisplayText for all filter types', () => {
      render(<FilterPills {...defaultProps} />);
      
      const filterTypes: FilterType[] = [
        'makeModel', 'price', 'year', 'mileage', 
        'transmission', 'fuelType', 'bodyStyle', 'sellerType'
      ];
      
      filterTypes.forEach(filterType => {
        expect(mockGetFilterDisplayText).toHaveBeenCalledWith(filterType);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all buttons', () => {
      render(<FilterPills {...defaultProps} />);
      
      const showAllFiltersButton = screen.getByRole('button', { name: /show all filters/i });
      expect(showAllFiltersButton).toHaveAttribute('aria-label', 'Show all filters');
      
      const filterTypes: FilterType[] = [
        'makeModel', 'price', 'year', 'mileage', 
        'transmission', 'fuelType', 'bodyStyle', 'sellerType'
      ];
      
      filterTypes.forEach(filterType => {
        const displayText = mockGetFilterDisplayText(filterType);
        const filterButton = screen.getByRole('button', { name: `Filter by ${displayText}` });
        expect(filterButton).toHaveAttribute('aria-label', `Filter by ${displayText}`);
      });
    });

    it('maintains keyboard accessibility', () => {
      render(<FilterPills {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Translation Function Integration', () => {
    it('uses provided translation function for "Show All Filters" text', () => {
      const customT = jest.fn().mockReturnValue('Custom Translation');
      render(<FilterPills {...defaultProps} t={customT} />);
      
      expect(customT).toHaveBeenCalledWith('showAllFilters', 'Show all filters');
      expect(screen.getByText('Custom Translation')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive wrapper classes', () => {
      render(<FilterPills {...defaultProps} />);
      
      const container = screen.getByRole('button', { name: /show all filters/i }).closest('.flex-wrap');
      expect(container).toHaveClass('flex', 'flex-wrap', 'gap-2');
    });

    it('applies responsive container structure', () => {
      render(<FilterPills {...defaultProps} />);
      
      const outerContainer = screen.getByRole('button', { name: /show all filters/i })
        .closest('.mb-4');
      expect(outerContainer).toHaveClass('mb-4', 'bg-white', 'rounded-lg', 'border', 'p-3', 'shadow-sm');
    });
  });

  describe('Hover Effects and Animations', () => {
    it('includes ripple effect elements', () => {
      render(<FilterPills {...defaultProps} />);
      
      const showAllFiltersButton = screen.getByRole('button', { name: /show all filters/i });
      const rippleEffect = showAllFiltersButton.querySelector('.absolute.inset-0.rounded-xl.overflow-hidden');
      expect(rippleEffect).toBeInTheDocument();
    });

    it('applies transform and transition classes for interactions', () => {
      render(<FilterPills {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all', 'duration-300', 'transform', 'hover:scale-[1.02]');
      });
    });
  });
});
