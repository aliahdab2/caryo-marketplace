import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationDropdown from '../LocationDropdown';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { Governorate } from '@/services/api';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdKeyboardArrowDown: () => <div data-testid="arrow-down-icon" />
}));

const mockGovernorate: Governorate = {
  id: 1,
  displayNameEn: 'Cairo',
  displayNameAr: 'القاهرة',
  slug: 'cairo'
};

const mockProps = {
  filters: {} as AdvancedSearchFilters,
  setFilters: jest.fn(),
  showLocationDropdown: false,
  setShowLocationDropdown: jest.fn(),
  governorates: [mockGovernorate],
  currentLanguage: 'en',
  t: jest.fn((key: string, fallback?: string, options?: { count?: number }) => {
    const translations: Record<string, string> = {
      'locationFilterLabel': 'Filter by location',
      'allLocations': 'All Governorates',
      'locationOptions': 'Location options',
      'clear': 'Clear',
      'show': 'Show',
      'locationsSelected': `${options?.count || 0} locations selected`
    };
    return translations[key] || fallback || key;
  })
};

describe('LocationDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LocationDropdown {...mockProps} />);
    expect(screen.getByRole('button', { name: /filter by location/i })).toBeInTheDocument();
  });

  it('shows default text when no locations selected', () => {
    render(<LocationDropdown {...mockProps} />);
    expect(screen.getByText('All Governorates')).toBeInTheDocument();
  });

  it('shows selected location name when one location is selected', () => {
    const propsWithSelection = {
      ...mockProps,
      filters: { locations: ['cairo'] } as AdvancedSearchFilters
    };
    render(<LocationDropdown {...propsWithSelection} />);
    expect(screen.getByText('Cairo')).toBeInTheDocument();
  });

  it('shows count when multiple locations are selected', () => {
    const propsWithMultipleSelection = {
      ...mockProps,
      filters: { locations: ['cairo', 'alexandria'] } as AdvancedSearchFilters
    };
    render(<LocationDropdown {...propsWithMultipleSelection} />);
    expect(screen.getByText('2 locations selected')).toBeInTheDocument();
  });

  it('toggles dropdown when button is clicked', () => {
    render(<LocationDropdown {...mockProps} />);
    const button = screen.getByRole('button', { name: /filter by location/i });
    
    fireEvent.click(button);
    expect(mockProps.setShowLocationDropdown).toHaveBeenCalledWith(true);
  });

  it('renders dropdown options when open', () => {
    const propsWithDropdownOpen = {
      ...mockProps,
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithDropdownOpen} />);
    
    expect(screen.getByText('Cairo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('handles location selection', () => {
    const propsWithDropdownOpen = {
      ...mockProps,
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithDropdownOpen} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockProps.setFilters).toHaveBeenCalledWith({
      locations: ['cairo']
    });
  });

  it('handles location deselection', () => {
    const propsWithSelection = {
      ...mockProps,
      filters: { locations: ['cairo'] } as AdvancedSearchFilters,
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithSelection} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockProps.setFilters).toHaveBeenCalledWith({});
  });

  it('handles clear button click', () => {
    const propsWithDropdownOpen = {
      ...mockProps,
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithDropdownOpen} />);
    
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    expect(mockProps.setFilters).toHaveBeenCalledWith({});
  });

  it('handles show button click', () => {
    const propsWithDropdownOpen = {
      ...mockProps,
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithDropdownOpen} />);
    
    const showButton = screen.getByText('Show');
    fireEvent.click(showButton);
    
    expect(mockProps.setShowLocationDropdown).toHaveBeenCalledWith(false);
  });

  it('displays Arabic names when currentLanguage is ar', () => {
    const propsWithArabic = {
      ...mockProps,
      currentLanguage: 'ar',
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithArabic} />);
    
    expect(screen.getByText('القاهرة')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(LocationDropdown.displayName).toBe('LocationDropdown');
  });
});
