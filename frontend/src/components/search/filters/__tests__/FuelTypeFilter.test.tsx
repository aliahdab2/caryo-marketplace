import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FuelTypeFilter from '../FuelTypeFilter';

// Mock the translation function
const mockT = (key: string, fallback?: string) => fallback || key;

// Mock the fuel type icon function
jest.mock('@/utils/fuelTypeIcons', () => ({
  getFuelTypeIcon: jest.fn(() => <div data-testid="fuel-icon">⛽</div>)
}));

const mockReferenceData = {
  fuelTypes: [
    { id: 1, name: 'gasoline', slug: 'gasoline', displayNameEn: 'Gasoline', displayNameAr: 'بنزين' },
    { id: 2, name: 'diesel', slug: 'diesel', displayNameEn: 'Diesel', displayNameAr: 'ديزل' },
    { id: 3, name: 'electric', slug: 'electric', displayNameEn: 'Electric', displayNameAr: 'كهربائي' }
  ],
  bodyStyles: [], // Added to satisfy CarReferenceData type
  carConditions: [],
  driveTypes: [],
  transmissions: [],
  sellerTypes: []
};

const mockFuelTypeCounts = {
  gasoline: 500,
  diesel: 300,
  electric: 150
};

describe('FuelTypeFilter', () => {
  const defaultProps = {
    referenceData: mockReferenceData,
    currentLanguage: 'en',
    selectedFuelTypeSlugs: [],
    onFuelTypeChange: jest.fn(),
    fuelTypeCounts: mockFuelTypeCounts,
    t: mockT
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown variant correctly', () => {
    render(<FuelTypeFilter {...defaultProps} variant="dropdown" />);
    
    expect(screen.getByText('Select fuel type')).toBeInTheDocument();
    expect(screen.getByText('Gasoline (500)')).toBeInTheDocument();
    expect(screen.getByText('Diesel (300)')).toBeInTheDocument();
    expect(screen.getByText('Electric (150)')).toBeInTheDocument();
  });

  it('renders cards variant correctly', () => {
    render(<FuelTypeFilter {...defaultProps} variant="cards" />);
    
    expect(screen.getByText('Gasoline')).toBeInTheDocument();
    expect(screen.getByText('Diesel')).toBeInTheDocument();
    expect(screen.getByText('Electric')).toBeInTheDocument();
    expect(screen.getAllByText('(500)')).toHaveLength(1);
    expect(screen.getAllByText('(300)')).toHaveLength(1);
    expect(screen.getAllByText('(150)')).toHaveLength(1);
    expect(screen.getAllByTestId('fuel-icon')).toHaveLength(3);
  });

  it('calls onFuelTypeChange when fuel type is selected in dropdown', () => {
    render(<FuelTypeFilter {...defaultProps} variant="dropdown" />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'gasoline' } });
    
    expect(defaultProps.onFuelTypeChange).toHaveBeenCalledWith(['gasoline']);
  });

  it('calls onFuelTypeChange when fuel type is selected in cards', () => {
    render(<FuelTypeFilter {...defaultProps} variant="cards" />);
    
    const gasolineButton = screen.getByText('Gasoline').closest('div');
    fireEvent.click(gasolineButton!);
    
    expect(defaultProps.onFuelTypeChange).toHaveBeenCalledWith(['gasoline']);
  });

  it('shows selected fuel type in dropdown', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        variant="dropdown" 
        selectedFuelTypeSlugs={['gasoline']} 
      />
    );
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('gasoline');
  });

  it('shows selected fuel type in cards', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        variant="cards" 
        selectedFuelTypeSlugs={['gasoline']} 
      />
    );
    
    // Find the parent div that contains the Gasoline text and has the correct classes
    const gasolineContainer = screen.getByText('Gasoline').closest('div[class*="border-blue-500"]');
    expect(gasolineContainer).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('handles Arabic language correctly', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        currentLanguage="ar"
        variant="cards"
      />
    );
    
    expect(screen.getByText('بنزين')).toBeInTheDocument();
    expect(screen.getByText('ديزل')).toBeInTheDocument();
    expect(screen.getByText('كهربائي')).toBeInTheDocument();
  });

  it('handles null reference data gracefully', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        referenceData={null}
        variant="cards"
      />
    );
    
    expect(screen.getByText('No fuel types available')).toBeInTheDocument();
  });

  it('handles empty fuel types array', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        referenceData={{ ...mockReferenceData, fuelTypes: [] }}
        variant="cards"
      />
    );
    
    expect(screen.getByText('No fuel types available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<FuelTypeFilter {...defaultProps} isLoading={true} variant="cards" />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles multiple selections in cards variant', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        variant="cards"
        selectedFuelTypeSlugs={['gasoline', 'diesel']}
      />
    );
    
    // Find the parent divs that contain the text and have the correct classes
    const gasolineContainer = screen.getByText('Gasoline').closest('div[class*="border-blue-500"]');
    const dieselContainer = screen.getByText('Diesel').closest('div[class*="border-blue-500"]');
    
    expect(gasolineContainer).toHaveClass('border-blue-500');
    expect(dieselContainer).toHaveClass('border-blue-500');
  });

  it('removes fuel type when deselected', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        variant="cards"
        selectedFuelTypeSlugs={['gasoline', 'diesel']}
      />
    );
    
    const gasolineButton = screen.getByText('Gasoline').closest('div');
    fireEvent.click(gasolineButton!);
    
    expect(defaultProps.onFuelTypeChange).toHaveBeenCalledWith(['diesel']);
  });

  it('clears all selections when last item is deselected', () => {
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        variant="cards"
        selectedFuelTypeSlugs={['gasoline']}
      />
    );
    
    const gasolineButton = screen.getByText('Gasoline').closest('div');
    fireEvent.click(gasolineButton!);
    
    expect(defaultProps.onFuelTypeChange).toHaveBeenCalledWith(undefined);
  });

  it('handles disableScroll prop correctly', () => {
    const { container } = render(
      <FuelTypeFilter 
        {...defaultProps} 
        variant="cards"
        disableScroll={true}
      />
    );
    
    const scrollContainer = container.querySelector('.grid');
    expect(scrollContainer).not.toHaveClass('max-h-96', 'overflow-y-auto');
  });

  it('handles fuel type counts correctly', () => {
    render(<FuelTypeFilter {...defaultProps} variant="cards" />);
    
    expect(screen.getByText('(500)')).toBeInTheDocument();
    expect(screen.getByText('(300)')).toBeInTheDocument();
    expect(screen.getByText('(150)')).toBeInTheDocument();
  });

  it('handles zero counts correctly', () => {
    const zeroCounts = { gasoline: 0, diesel: 0, electric: 0 };
    render(
      <FuelTypeFilter 
        {...defaultProps} 
        fuelTypeCounts={zeroCounts}
        variant="cards"
      />
    );
    
    expect(screen.getAllByText('(0)')).toHaveLength(3);
  });
}); 