import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterModal from '../FilterModal';
import { FilterType } from '@/hooks/useSearchFilters';

// Mock the child components
jest.mock('@/components/ui/PriceSlider', () => {
  return function MockPriceSlider() {
    return <div data-testid="price-slider">PriceSlider</div>;
  };
});

jest.mock('@/components/ui/MileageSlider', () => {
  return function MockMileageSlider() {
    return <div data-testid="mileage-slider">MileageSlider</div>;
  };
});

jest.mock('@/components/ui/YearSlider', () => {
  return function MockYearSlider() {
    return <div data-testid="year-slider">YearSlider</div>;
  };
});

jest.mock('@/components/ui/FilterModalContainer', () => {
  return {
    FilterModalContainer: function MockFilterModalContainer({ children }: { children: React.ReactNode }) {
      return <div data-testid="filter-modal-container">{children}</div>;
    }
  };
});

// Mock the icons
jest.mock('@/utils/carIcons', () => ({
  getCarIcon: jest.fn(() => <div data-testid="car-icon">🚗</div>)
}));

// Mock API calls
jest.mock('@/services/api', () => ({
  fetchBrandCounts: jest.fn(() => Promise.resolve({ toyota: 150, honda: 120 })),
  fetchModelCounts: jest.fn(() => Promise.resolve({ camry: 50, corolla: 45, civic: 40 }))
}));

const mockProps = {
  filterType: 'makeModel' as FilterType,
  onClose: jest.fn(),
  filters: {
    brands: [],
    models: [],
    minPrice: undefined,
    maxPrice: undefined,
    minYear: undefined,
    maxYear: undefined,
    minMileage: undefined,
    maxMileage: undefined,
    transmissionId: undefined,
    fuelTypeId: undefined,
    bodyStyleIds: undefined,
    sellerTypeIds: undefined,
    location: undefined
  },
  setFilters: jest.fn(),
  selectedMake: null,
  selectedModel: null,
  carMakes: [
    { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota', name: 'Toyota', isActive: true },
    { id: 2, displayNameEn: 'Honda', displayNameAr: 'هوندا', slug: 'honda', name: 'Honda', isActive: true }
  ],
  availableModels: [
    { id: 1, displayNameEn: 'Camry', displayNameAr: 'كامري', slug: 'camry', name: 'Camry', isActive: true, brand: { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota', name: 'Toyota', isActive: true } },
    { id: 2, displayNameEn: 'Corolla', displayNameAr: 'كورولا', slug: 'corolla', name: 'Corolla', isActive: true, brand: { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota', name: 'Toyota', isActive: true } }
  ],
  allModels: [
    { id: 1, displayNameEn: 'Camry', displayNameAr: 'كامري', slug: 'camry', name: 'Camry', isActive: true, brand: { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota', name: 'Toyota', isActive: true } },
    { id: 2, displayNameEn: 'Corolla', displayNameAr: 'كورولا', slug: 'corolla', name: 'Corolla', isActive: true, brand: { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota', name: 'Toyota', isActive: true } },
    { id: 3, displayNameEn: 'Civic', displayNameAr: 'سيفيك', slug: 'civic', name: 'Civic', isActive: true, brand: { id: 2, displayNameEn: 'Honda', displayNameAr: 'هوندا', slug: 'honda', name: 'Honda', isActive: true } }
  ],
  isLoadingBrands: false,
  isLoadingModels: false,
  isLoadingAllModels: false,
  referenceData: {
    transmissions: [
      { id: 1, displayNameEn: 'Manual', displayNameAr: 'يدوي', name: 'manual' }
    ],
    fuelTypes: [
      { id: 1, displayNameEn: 'Gasoline', displayNameAr: 'بنزين', name: 'gasoline' }
    ],
    bodyStyles: [
      { id: 1, displayNameEn: 'Sedan', displayNameAr: 'سيدان', name: 'sedan' }
    ],
    sellerTypes: [
      { id: 1, displayNameEn: 'Dealer', displayNameAr: 'معرض', name: 'dealer' }
    ],
    carConditions: [
      { id: 1, displayNameEn: 'New', displayNameAr: 'جديد', name: 'new' }
    ],
    driveTypes: [
      { id: 1, displayNameEn: 'FWD', displayNameAr: 'دفع أمامي', name: 'fwd' }
    ]
  },
  isLoadingReferenceData: false,
  sellerTypeCounts: { dealer: 5 },
  bodyStyleCounts: { sedan: 3 },
  carListings: { 
    totalElements: 10, 
    content: [], 
    page: 0, 
    size: 20, 
    totalPages: 1, 
    last: true 
  },
  currentLanguage: 'en',
  isRTL: false,
  dirClass: 'ltr',
  t: jest.fn((key: string, fallback?: string) => fallback || key),
  updateFiltersAndState: jest.fn(),
  handleInputChange: jest.fn(),
  clearSpecificFilter: jest.fn()
};

describe('FilterModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FilterModal {...mockProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders make/model filter correctly', () => {
    render(<FilterModal {...mockProps} filterType="makeModel" />);
    expect(screen.getByPlaceholderText('Search for make or model')).toBeInTheDocument();
    expect(screen.getByText('Make & Model')).toBeInTheDocument();
  });

  it('renders price filter correctly', () => {
    render(<FilterModal {...mockProps} filterType="price" />);
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByTestId('price-slider')).toBeInTheDocument();
  });

  it('renders year filter correctly', () => {
    render(<FilterModal {...mockProps} filterType="year" />);
    expect(screen.getByTestId('year-slider')).toBeInTheDocument();
  });

  it('renders mileage filter correctly', () => {
    render(<FilterModal {...mockProps} filterType="mileage" />);
    expect(screen.getByTestId('mileage-slider')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<FilterModal {...mockProps} />);
    const closeButton = screen.getByLabelText('Close filter modal');
    closeButton.click();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('displays correct button text with listing count for makeModel filter', () => {
    render(<FilterModal {...mockProps} filterType="makeModel" />);
    expect(screen.getByText('Show 10 results')).toBeInTheDocument();
  });

  it('displays correct button text for other filters', () => {
    render(<FilterModal {...mockProps} filterType="price" />);
    expect(screen.getByText('Search cars')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(FilterModal.displayName).toBe('FilterModal');
  });

  // New comprehensive tests for missing functionality

  describe('Search Functionality', () => {
    it('filters brands when searching', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'Toyota');
      
      expect(screen.getByText('Toyota')).toBeInTheDocument();
      expect(screen.queryByText('Honda')).not.toBeInTheDocument();
    });

    it('shows "Show all brands" link when searching', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'test');
      
      expect(screen.getByText('Show all brands')).toBeInTheDocument();
    });

    it('clears search when "Show all brands" is clicked', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'test');
      
      const showAllButton = screen.getByText('Show all brands');
      fireEvent.click(showAllButton);
      
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Toyota')).toBeInTheDocument();
      expect(screen.getByText('Honda')).toBeInTheDocument();
    });

    it('filters brands when searching in Arabic', async () => {
      const propsWithArabic = {
        ...mockProps,
        currentLanguage: 'ar',
        isRTL: true,
        dirClass: 'rtl'
      };
      
      render(<FilterModal {...propsWithArabic} filterType="makeModel" />);
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'تويوتا');
      
      expect(screen.getByText('تويوتا')).toBeInTheDocument();
      expect(screen.queryByText('هوندا')).not.toBeInTheDocument();
    });

    it('filters models when searching in Arabic', async () => {
      const propsWithArabic = {
        ...mockProps,
        currentLanguage: 'ar',
        isRTL: true,
        dirClass: 'rtl'
      };
      
      render(<FilterModal {...propsWithArabic} filterType="makeModel" />);
      
      // Wait for brands to load
      await waitFor(() => {
        expect(screen.getByText('تويوتا')).toBeInTheDocument();
      });
      
      // Expand Toyota to show models
      const expandButtons = screen.getAllByLabelText('Expand models');
      fireEvent.click(expandButtons[0]);
      
      // Wait for models to appear
      await waitFor(() => {
        expect(screen.getByText('كامري')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'كامري');
      
      expect(screen.getByText('كامري')).toBeInTheDocument();
      expect(screen.queryByText('كورولا')).not.toBeInTheDocument();
    });

    it('filters brands when searching in English while in Arabic mode', async () => {
      const propsWithArabic = {
        ...mockProps,
        currentLanguage: 'ar',
        isRTL: true,
        dirClass: 'rtl'
      };
      
      render(<FilterModal {...propsWithArabic} filterType="makeModel" />);
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'Toyota');
      
      expect(screen.getByText('تويوتا')).toBeInTheDocument();
      expect(screen.queryByText('هوندا')).not.toBeInTheDocument();
    });

    it('filters models when searching in English while in Arabic mode', async () => {
      const propsWithArabic = {
        ...mockProps,
        currentLanguage: 'ar',
        isRTL: true,
        dirClass: 'rtl'
      };
      
      render(<FilterModal {...propsWithArabic} filterType="makeModel" />);
      
      // Wait for brands to load
      await waitFor(() => {
        expect(screen.getByText('تويوتا')).toBeInTheDocument();
      });
      
      // Expand Toyota to show models
      const expandButtons = screen.getAllByLabelText('Expand models');
      fireEvent.click(expandButtons[0]);
      
      // Wait for models to appear
      await waitFor(() => {
        expect(screen.getByText('كامري')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'Camry');
      
      expect(screen.getByText('كامري')).toBeInTheDocument();
      expect(screen.queryByText('كورولا')).not.toBeInTheDocument();
    });
  });

  describe('Chip Management', () => {
    it('displays brand chips when brands are selected', () => {
      const propsWithBrands = {
        ...mockProps,
        filters: { ...mockProps.filters, brands: ['toyota'] }
      };
      
      render(<FilterModal {...propsWithBrands} filterType="makeModel" />);
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });

    it('displays model chips when models are selected', () => {
      const propsWithModels = {
        ...mockProps,
        filters: { ...mockProps.filters, models: ['camry'] }
      };
      
      render(<FilterModal {...propsWithModels} filterType="makeModel" />);
      expect(screen.getByText('Camry')).toBeInTheDocument();
    });

    it('removes brand chip when remove button is clicked', () => {
      const propsWithBrands = {
        ...mockProps,
        filters: { ...mockProps.filters, brands: ['toyota'] }
      };
      
      render(<FilterModal {...propsWithBrands} filterType="makeModel" />);
      
      const removeButton = screen.getByLabelText('Remove');
      fireEvent.click(removeButton);
      
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        brands: undefined
      });
    });

    it('removes model chip when remove button is clicked', () => {
      const propsWithModels = {
        ...mockProps,
        filters: { ...mockProps.filters, models: ['camry'] }
      };
      
      render(<FilterModal {...propsWithModels} filterType="makeModel" />);
      
      const removeButton = screen.getByLabelText('Remove');
      fireEvent.click(removeButton);
      
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        models: undefined
      });
    });

    it('removes brand chip and all associated model chips when brand chip is removed', () => {
      const propsWithBrandAndModels = {
        ...mockProps,
        filters: { 
          ...mockProps.filters, 
          brands: ['toyota'], 
          models: ['camry', 'corolla', 'civic'] // camry and corolla belong to Toyota, civic to Honda
        }
      };
      
      render(<FilterModal {...propsWithBrandAndModels} filterType="makeModel" />);
      
      // Find and click the remove button for the Toyota brand chip
      const removeButtons = screen.getAllByLabelText('Remove');
      fireEvent.click(removeButtons[0]); // First remove button should be for Toyota
      
      // Should remove Toyota brand and its associated models (camry, corolla)
      // but keep civic since it belongs to Honda
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        brands: undefined,
        models: ['civic'] // Only civic should remain
      });
    });

    it('removes brand chip and all associated model chips when brand checkbox is unchecked', async () => {
      const propsWithBrandAndModels = {
        ...mockProps,
        filters: { 
          ...mockProps.filters, 
          brands: ['toyota'], 
          models: ['camry', 'corolla', 'civic'] // camry and corolla belong to Toyota, civic to Honda
        }
      };
      
      render(<FilterModal {...propsWithBrandAndModels} filterType="makeModel" />);
      
      // Wait for brands to load
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });
      
      // Find and click the Toyota checkbox to uncheck it
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // First checkbox should be Toyota
      
      // Should remove Toyota brand and its associated models (camry, corolla)
      // but keep civic since it belongs to Honda
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        brands: undefined,
        models: ['civic'] // Only civic should remain
      });
    });
  });

  describe('Brand and Model Selection', () => {
    it('selects brand when checkbox is clicked', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      // Wait for brands to load
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });
      
      // Use getAllByRole to get all checkboxes and click the first one (Toyota)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        brands: ['toyota']
      });
    });

    it('selects model and automatically adds brand', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      // Wait for brands to load
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });
      
      // Expand Toyota to show models
      const expandButtons = screen.getAllByLabelText('Expand models');
      fireEvent.click(expandButtons[0]);
      
      // Wait for models to appear
      await waitFor(() => {
        expect(screen.getByText('Camry')).toBeInTheDocument();
      });
      
      // Get all checkboxes and click the Camry checkbox (should be the second one)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Camry checkbox
      
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        models: ['camry'],
        brands: ['toyota']
      });
    });
  });

  describe('Collapsible Sections', () => {
    it('expands brand to show models when expand button is clicked', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });
      
      const expandButtons = screen.getAllByLabelText('Expand models');
      fireEvent.click(expandButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Camry')).toBeInTheDocument();
        expect(screen.getByText('Corolla')).toBeInTheDocument();
      });
    });

    it('collapses brand to hide models when collapse button is clicked', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });
      
      // First expand
      const expandButtons = screen.getAllByLabelText('Expand models');
      fireEvent.click(expandButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Camry')).toBeInTheDocument();
      });
      
      // Then collapse
      const collapseButtons = screen.getAllByLabelText('Collapse models');
      fireEvent.click(collapseButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('Camry')).not.toBeInTheDocument();
        expect(screen.queryByText('Corolla')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when brands are loading', () => {
      const propsWithLoading = {
        ...mockProps,
        isLoadingBrands: true
      };
      
      render(<FilterModal {...propsWithLoading} filterType="makeModel" />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows loading spinner when models are loading', () => {
      const propsWithLoading = {
        ...mockProps,
        isLoadingModels: true
      };
      
      render(<FilterModal {...propsWithLoading} filterType="makeModel" />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows loading spinner when all models are loading', () => {
      const propsWithLoading = {
        ...mockProps,
        isLoadingAllModels: true
      };
      
      render(<FilterModal {...propsWithLoading} filterType="makeModel" />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows loading spinner when no brands exist initially', () => {
      const propsWithNoBrands = {
        ...mockProps,
        carMakes: []
      };
      
      render(<FilterModal {...propsWithNoBrands} filterType="makeModel" />);
      // Initially shows loading spinner while fetching counts
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows "No brands or models found" when search has no results', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search for make or model');
      await userEvent.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No brands or models found')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('renders correctly in Arabic language', () => {
      const propsWithArabic = {
        ...mockProps,
        currentLanguage: 'ar',
        isRTL: true,
        dirClass: 'rtl'
      };
      
      render(<FilterModal {...propsWithArabic} filterType="makeModel" />);
      
      expect(screen.getByText('Make & Model')).toBeInTheDocument();
      expect(screen.getByText('إلغاء')).toBeInTheDocument();
    });

    it('displays Arabic brand names correctly after loading', async () => {
      const propsWithArabic = {
        ...mockProps,
        currentLanguage: 'ar',
        isRTL: true,
        dirClass: 'rtl'
      };
      
      render(<FilterModal {...propsWithArabic} filterType="makeModel" />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('تويوتا')).toBeInTheDocument();
      expect(screen.getByText('هوندا')).toBeInTheDocument();
    });
  });

  describe('Filter Actions', () => {
    it('calls handleApplyFilters when apply button is clicked', () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      const applyButton = screen.getByText('Show 10 results');
      fireEvent.click(applyButton);
      
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith({
        brands: undefined,
        models: undefined
      });
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('calls handleClearFilters when clear button is clicked', () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      expect(mockProps.setFilters).toHaveBeenCalledWith({});
      expect(mockProps.updateFiltersAndState).toHaveBeenCalledWith(
        { brands: [], models: [] },
        { selectedMake: null, selectedModel: null }
      );
    });

    it('calls clearSpecificFilter for non-makeModel filters', () => {
      render(<FilterModal {...mockProps} filterType="price" />);
      
      const clearButton = screen.getByText('Clear all');
      fireEvent.click(clearButton);
      
      expect(mockProps.clearSpecificFilter).toHaveBeenCalledWith('price');
    });
  });

  describe('Other Filter Types', () => {
    it('renders transmission filter correctly', () => {
      render(<FilterModal {...mockProps} filterType="transmission" />);
      expect(screen.getByText('Transmission')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders fuel type filter correctly', () => {
      render(<FilterModal {...mockProps} filterType="fuelType" />);
      expect(screen.getByText('Fuel Type')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders body style filter correctly', () => {
      render(<FilterModal {...mockProps} filterType="bodyStyle" />);
      expect(screen.getByText('Body Style')).toBeInTheDocument();
      expect(screen.getByTestId('car-icon')).toBeInTheDocument();
    });

    it('renders seller type filter correctly', () => {
      render(<FilterModal {...mockProps} filterType="sellerType" />);
      expect(screen.getByText('Seller Type')).toBeInTheDocument();
    });

    it('renders all filters modal correctly', () => {
      render(<FilterModal {...mockProps} filterType="allFilters" />);
      expect(screen.getByText('Filter and sort')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      expect(screen.getByLabelText('Close filter modal')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'filter-modal-title');
    });

    it('supports keyboard navigation', () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Count Display', () => {
    it('displays brand counts correctly', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      await waitFor(() => {
        expect(screen.getByText('(150)')).toBeInTheDocument(); // Toyota count
        expect(screen.getByText('(120)')).toBeInTheDocument(); // Honda count
      });
    });

    it('displays model counts correctly', async () => {
      render(<FilterModal {...mockProps} filterType="makeModel" />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });
      
      const expandButtons = screen.getAllByLabelText('Expand models');
      fireEvent.click(expandButtons[0]); // Click first expand button (Toyota)
      
      await waitFor(() => {
        expect(screen.getByText('(50)')).toBeInTheDocument(); // Camry count
        expect(screen.getByText('(45)')).toBeInTheDocument(); // Corolla count
      });
    });
  });
});
