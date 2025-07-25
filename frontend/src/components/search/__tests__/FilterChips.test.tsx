import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterChips from '../FilterChips';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdClose: () => <div data-testid="close-icon" />,
  MdDeleteSweep: () => <div data-testid="delete-sweep-icon" />
}));

const mockFilters: AdvancedSearchFilters = {
  brands: ['toyota'],
  models: ['camry'],
  minPrice: 10000,
  maxPrice: 50000,
  minYear: 2020,
  maxYear: 2024,
  transmissionId: 1,
  fuelTypeId: 2,
  bodyStyleIds: [3],
  sellerTypeIds: [1, 2]
};

const mockProps = {
  filters: {} as AdvancedSearchFilters,
  isFilterActive: jest.fn((_filterType: FilterType) => false),
  filterCount: 0,
  updateFiltersAndState: jest.fn(),
  getBrandDisplayNameFromSlug: jest.fn((slug: string) => slug === 'toyota' ? 'Toyota' : 'Unknown'),
  getModelDisplayNameFromSlug: jest.fn((slug: string) => slug === 'camry' ? 'Camry' : 'Unknown'),
  getFilterDisplayText: jest.fn((filterType: FilterType) => `${filterType} filter`),
  getTransmissionDisplayName: jest.fn(() => 'Automatic'),
  getFuelTypeDisplayName: jest.fn(() => 'Gasoline'),
  getBodyStyleDisplayName: jest.fn(() => 'Sedan'),
  getSellerTypeDisplayName: jest.fn(() => 'Dealer'),
  selectedMake: null,
  selectedModel: null,
  referenceData: {
    bodyStyles: [
      { id: 3, name: 'sedan', displayNameEn: 'Sedan', displayNameAr: 'سيدان' }
    ]
  },
  t: jest.fn((key: string, fallback?: string) => fallback || key)
};

describe('FilterChips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no filters are active', () => {
    const { container } = render(<FilterChips {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders filter chips when filters are active', () => {
    const propsWithActiveFilters = {
      ...mockProps,
      filters: mockFilters,
      isFilterActive: jest.fn(() => true),
      filterCount: 5
    };
    
    render(<FilterChips {...propsWithActiveFilters} />);
    
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Camry')).toBeInTheDocument();
    expect(screen.getByText('Clear (5)')).toBeInTheDocument();
  });

  it('handles clear all button click', () => {
    const propsWithActiveFilters = {
      ...mockProps,
      filters: mockFilters,
      isFilterActive: jest.fn(() => true),
      filterCount: 5
    };
    
    render(<FilterChips {...propsWithActiveFilters} />);
    
    const clearAllButton = screen.getByText('Clear (5)');
    fireEvent.click(clearAllButton);
    
    expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
      brands: undefined,
      models: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
      minMileage: undefined,
      maxMileage: undefined,
      transmissionId: undefined,
      fuelTypeId: undefined,
      bodyStyleIds: undefined,
      sellerTypeIds: undefined
    }, {
      selectedMake: null,
      selectedModel: null
    });
  });

  it('handles brand chip removal', () => {
    const propsWithBrand = {
      ...mockProps,
      filters: { brands: ['toyota'] },
      isFilterActive: jest.fn(() => true)
    };
    
    render(<FilterChips {...propsWithBrand} />);
    
    const removeButton = screen.getAllByTestId('close-icon')[0];
    fireEvent.click(removeButton.parentElement!);
    
    expect(mockProps.updateFiltersAndState).toHaveBeenCalled();
  });

  it('handles model chip removal', () => {
    const propsWithModel = {
      ...mockProps,
      filters: { models: ['camry'] },
      isFilterActive: jest.fn(() => true)
    };
    
    render(<FilterChips {...propsWithModel} />);
    
    const removeButton = screen.getAllByTestId('close-icon')[0];
    fireEvent.click(removeButton.parentElement!);
    
    expect(mockProps.updateFiltersAndState).toHaveBeenCalled();
  });

  it('renders price chip when price filters are set', () => {
    const propsWithPrice = {
      ...mockProps,
      filters: { minPrice: 10000, maxPrice: 50000 },
      isFilterActive: jest.fn((filterType: FilterType) => filterType === 'price'),
      getFilterDisplayText: jest.fn(() => '$10,000 - $50,000')
    };
    
    render(<FilterChips {...propsWithPrice} />);
    
    expect(screen.getByText('$10,000 - $50,000')).toBeInTheDocument();
  });

  it('renders transmission chip when transmission filter is set', () => {
    const propsWithTransmission = {
      ...mockProps,
      filters: { transmissionId: 1 },
      isFilterActive: jest.fn((filterType: FilterType) => filterType === 'transmission')
    };
    
    render(<FilterChips {...propsWithTransmission} />);
    
    expect(screen.getByText('Automatic')).toBeInTheDocument();
  });

  it('renders seller type chips when seller type filters are set', () => {
    const propsWithSellerTypes = {
      ...mockProps,
      filters: { sellerTypeIds: [1, 2] },
      isFilterActive: jest.fn((filterType: FilterType) => filterType === 'sellerType')
    };
    
    render(<FilterChips {...propsWithSellerTypes} />);
    
    const dealerChips = screen.getAllByText('Dealer');
    expect(dealerChips).toHaveLength(2);
  });

  it('renders body style chips with icons when body style filters are set', () => {
    const propsWithBodyStyles = {
      ...mockProps,
      filters: { bodyStyleIds: [3] },
      isFilterActive: jest.fn((filterType: FilterType) => filterType === 'bodyStyle')
    };
    
    render(<FilterChips {...propsWithBodyStyles} />);
    
    expect(screen.getByText('Sedan')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(FilterChips.displayName).toBe('FilterChips');
  });
});
