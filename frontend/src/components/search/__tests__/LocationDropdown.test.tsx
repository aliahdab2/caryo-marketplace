import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationDropdown from '../LocationDropdown';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { Governorate } from '@/services/api';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdKeyboardArrowDown: () => <div data-testid="arrow-down-icon" />
}));

const mockGovernorates: Governorate[] = [
  {
    id: 1,
    displayNameEn: 'Cairo',
    displayNameAr: 'القاهرة',
    slug: 'cairo'
  },
  {
    id: 2,
    displayNameEn: 'Alexandria',
    displayNameAr: 'الإسكندرية',
    slug: 'alexandria'
  },
  {
    id: 3,
    displayNameEn: 'Giza',
    displayNameAr: 'الجيزة',
    slug: 'giza'
  }
];

const mockProps = {
  filters: {} as AdvancedSearchFilters,
  setFilters: jest.fn(),
  showLocationDropdown: false,
  setShowLocationDropdown: jest.fn(),
  governorates: mockGovernorates,
  currentLanguage: 'en',
  t: jest.fn((key: string, fallback?: string, options?: { count?: number }) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'locationFilterLabel': 'Filter by location',
        'allLocations': 'All Governorates',
        'locationOptions': 'Location options',
        'clear': 'Clear',
        'show': 'Show',
        'locationsSelected': `${options?.count || 0} locations selected`
      },
      ar: {
        'locationFilterLabel': 'تصفية حسب الموقع',
        'allLocations': 'جميع المحافظات',
        'locationOptions': 'خيارات الموقع',
        'clear': 'مسح',
        'show': 'عرض',
        'locationsSelected': `${options?.count || 0} مواقع محددة`
      }
    };
    const currentTranslations = translations['en']; // Default to English for tests
    return currentTranslations[key] || fallback || key;
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

  it('shows Arabic location names when currentLanguage is ar', () => {
    const propsWithArabic = {
      ...mockProps,
      currentLanguage: 'ar',
      showLocationDropdown: true,
      t: jest.fn((key: string, fallback?: string, options?: { count?: number }) => {
        const translations: Record<string, Record<string, string>> = {
          ar: {
            'locationFilterLabel': 'تصفية حسب الموقع',
            'allLocations': 'جميع المحافظات',
            'locationOptions': 'خيارات الموقع',
            'clear': 'مسح',
            'show': 'عرض',
            'locationsSelected': `${options?.count || 0} مواقع محددة`
          }
        };
        const currentTranslations = translations['ar'];
        return currentTranslations[key] || fallback || key;
      })
    };
    render(<LocationDropdown {...propsWithArabic} />);
    
    // Should display Arabic names for all governorates
    expect(screen.getByText('القاهرة')).toBeInTheDocument();
    expect(screen.getByText('الإسكندرية')).toBeInTheDocument();
    expect(screen.getByText('الجيزة')).toBeInTheDocument();
  });

  it('displays selected Arabic location name when language is Arabic', () => {
    const propsWithArabicSelection = {
      ...mockProps,
      currentLanguage: 'ar',
      filters: { locations: ['alexandria'] } as AdvancedSearchFilters,
      t: jest.fn((key: string, fallback?: string, options?: { count?: number }) => {
        const translations: Record<string, Record<string, string>> = {
          ar: {
            'locationFilterLabel': 'تصفية حسب الموقع',
            'allLocations': 'جميع المحافظات',
            'locationsSelected': `${options?.count || 0} مواقع محددة`
          }
        };
        const currentTranslations = translations['ar'];
        return currentTranslations[key] || fallback || key;
      })
    };
    render(<LocationDropdown {...propsWithArabicSelection} />);
    expect(screen.getByText('الإسكندرية')).toBeInTheDocument();
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
    expect(screen.getByText('Alexandria')).toBeInTheDocument();
    expect(screen.getByText('Giza')).toBeInTheDocument();
    
    // Check that all checkboxes are present
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('handles location selection', () => {
    const propsWithDropdownOpen = {
      ...mockProps,
      showLocationDropdown: true
    };
    render(<LocationDropdown {...propsWithDropdownOpen} />);
    
    // Select the Cairo checkbox specifically
    const cairoCheckbox = screen.getByLabelText('Cairo');
    fireEvent.click(cairoCheckbox);
    
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
    
    // Deselect the Cairo checkbox specifically
    const cairoCheckbox = screen.getByRole('checkbox', { name: 'Cairo' });
    fireEvent.click(cairoCheckbox);
    
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

  it('has correct displayName', () => {
    expect(LocationDropdown.displayName).toBe('LocationDropdown');
  });

  it('handles bilingual functionality correctly', () => {
    // Test English display
    const englishProps = { ...mockProps, showLocationDropdown: true };
    const { rerender } = render(<LocationDropdown {...englishProps} />);
    expect(screen.getByText('Cairo')).toBeInTheDocument();

    // Test Arabic display
    const arabicProps = {
      ...mockProps,
      currentLanguage: 'ar',
      showLocationDropdown: true,
      t: jest.fn((key: string, fallback?: string) => {
        const arabicTranslations: Record<string, string> = {
          'allLocations': 'جميع المحافظات',
          'clear': 'مسح',
          'show': 'عرض'
        };
        return arabicTranslations[key] || fallback || key;
      })
    };
    rerender(<LocationDropdown {...arabicProps} />);
    expect(screen.getByText('القاهرة')).toBeInTheDocument();
  });
});
