import { render, screen } from '@testing-library/react';
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
    bodyStyleId: undefined,
    sellerTypeIds: undefined,
    location: undefined
  },
  setFilters: jest.fn(),
  selectedMake: null,
  selectedModel: null,
  carMakes: [
    { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota', name: 'Toyota', isActive: true }
  ],
  availableModels: [
    { id: 1, displayNameEn: 'Camry', displayNameAr: 'كامري', slug: 'camry', name: 'Camry', isActive: true }
  ],
  isLoadingBrands: false,
  isLoadingModels: false,
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
    expect(screen.getByText('Make')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('renders price filter correctly', () => {
    render(<FilterModal {...mockProps} filterType="price" />);
    expect(screen.getByTestId('filter-modal-container')).toBeInTheDocument();
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

  it('displays correct button text with listing count', () => {
    render(<FilterModal {...mockProps} />);
    expect(screen.getByText('Show {{count}} results')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(FilterModal.displayName).toBe('FilterModal');
  });
});
