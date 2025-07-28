import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BodyStyleFilter from '../BodyStyleFilter';

// Mock the translation function
const mockT = (key: string, fallback?: string) => fallback || key;

// Mock the car icon function
jest.mock('@/utils/carIcons', () => ({
  getCarIcon: jest.fn(() => <div data-testid="car-icon">🚗</div>)
}));

const mockReferenceData = {
  bodyStyles: [
    {
      id: 1,
      name: 'sedan',
      slug: 'sedan',
      displayNameEn: 'Sedan',
      displayNameAr: 'سيدان'
    },
    {
      id: 2,
      name: 'suv',
      slug: 'suv',
      displayNameEn: 'SUV',
      displayNameAr: 'سيارة رياضية'
    },
    {
      id: 3,
      name: 'hatchback',
      slug: 'hatchback',
      displayNameEn: 'Hatchback',
      displayNameAr: 'هاتشباك'
    }
  ],
  carConditions: [],
  driveTypes: [],
  fuelTypes: [],
  transmissions: [],
  sellerTypes: []
};

const mockBodyStyleCounts = {
  sedan: 150,
  suv: 200,
  hatchback: 75
};

describe('BodyStyleFilter', () => {
  const defaultProps = {
    referenceData: mockReferenceData,
    currentLanguage: 'en',
    selectedBodyStyleSlugs: [],
    onBodyStyleChange: jest.fn(),
    bodyStyleCounts: mockBodyStyleCounts,
    t: mockT
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown variant correctly', () => {
    render(<BodyStyleFilter {...defaultProps} variant="dropdown" />);
    
    expect(screen.getByText('Body Style')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('All Body Styles')).toBeInTheDocument();
    expect(screen.getByText('Sedan (150)')).toBeInTheDocument();
    expect(screen.getByText('SUV (200)')).toBeInTheDocument();
    expect(screen.getByText('Hatchback (75)')).toBeInTheDocument();
  });

  it('renders cards variant correctly', () => {
    render(<BodyStyleFilter {...defaultProps} variant="cards" />);
    
    expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(screen.getByText('SUV')).toBeInTheDocument();
    expect(screen.getByText('Hatchback')).toBeInTheDocument();
    expect(screen.getAllByText('(150)')).toHaveLength(1);
    expect(screen.getAllByText('(200)')).toHaveLength(1);
    expect(screen.getAllByText('(75)')).toHaveLength(1);
    expect(screen.getAllByTestId('car-icon')).toHaveLength(3);
  });

  it('calls onBodyStyleChange when body style is selected in dropdown', () => {
    render(<BodyStyleFilter {...defaultProps} variant="dropdown" />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'sedan' } });
    
    expect(defaultProps.onBodyStyleChange).toHaveBeenCalledWith(['sedan']);
  });

  it('calls onBodyStyleChange when body style is selected in cards', () => {
    render(<BodyStyleFilter {...defaultProps} variant="cards" />);
    
    const sedanButton = screen.getByText('Sedan').closest('div');
    fireEvent.click(sedanButton!);
    
    expect(defaultProps.onBodyStyleChange).toHaveBeenCalledWith(['sedan']);
  });

  it('shows selected body style in dropdown', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        variant="dropdown" 
        selectedBodyStyleSlugs={['sedan']} 
      />
    );
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('sedan');
  });

  it('shows selected body style in cards', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        variant="cards" 
        selectedBodyStyleSlugs={['sedan']} 
      />
    );
    
    // Find the parent div that contains the Sedan text and has the correct classes
    const sedanContainer = screen.getByText('Sedan').closest('div[class*="border-blue-500"]');
    expect(sedanContainer).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('handles Arabic language correctly', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        currentLanguage="ar"
        variant="cards"
      />
    );
    
    expect(screen.getByText('سيدان')).toBeInTheDocument();
    expect(screen.getByText('سيارة رياضية')).toBeInTheDocument();
    expect(screen.getByText('هاتشباك')).toBeInTheDocument();
  });

  it('handles null reference data gracefully', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        referenceData={null}
        variant="cards"
      />
    );
    
    expect(screen.getByText('No body styles available')).toBeInTheDocument();
  });

  it('handles empty body styles array', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        referenceData={{ ...mockReferenceData, bodyStyles: [] }}
        variant="cards"
      />
    );
    
    expect(screen.getByText('No body styles available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        isLoading={true}
        variant="cards"
      />
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles multiple selections in cards variant', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        variant="cards"
        selectedBodyStyleSlugs={['sedan', 'suv']}
      />
    );
    
    // Find the parent divs that contain the text and have the correct classes
    const sedanContainer = screen.getByText('Sedan').closest('div[class*="border-blue-500"]');
    const suvContainer = screen.getByText('SUV').closest('div[class*="border-blue-500"]');
    
    expect(sedanContainer).toHaveClass('border-blue-500');
    expect(suvContainer).toHaveClass('border-blue-500');
  });

  it('removes body style when deselected', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        variant="cards"
        selectedBodyStyleSlugs={['sedan', 'suv']}
      />
    );
    
    const sedanButton = screen.getByText('Sedan').closest('div');
    fireEvent.click(sedanButton!);
    
    expect(defaultProps.onBodyStyleChange).toHaveBeenCalledWith(['suv']);
  });

  it('clears all selections when last item is deselected', () => {
    render(
      <BodyStyleFilter 
        {...defaultProps} 
        variant="cards"
        selectedBodyStyleSlugs={['sedan']}
      />
    );
    
    const sedanButton = screen.getByText('Sedan').closest('div');
    fireEvent.click(sedanButton!);
    
    expect(defaultProps.onBodyStyleChange).toHaveBeenCalledWith(undefined);
  });

  it('handles disableScroll prop correctly', () => {
    const { container } = render(
      <BodyStyleFilter 
        {...defaultProps} 
        variant="cards"
        disableScroll={true}
      />
    );
    
    const scrollContainer = container.querySelector('.grid');
    expect(scrollContainer).not.toHaveClass('max-h-96', 'overflow-y-auto');
  });
}); 