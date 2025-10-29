import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SellerTypeFilter from '../SellerTypeFilter';

// Mock the translation function
const mockT = (key: string, fallback?: string) => fallback || key;

const mockReferenceData = {
  sellerTypes: [
    { id: 1, name: 'private', displayNameEn: 'Private Seller', displayNameAr: 'بائع خاص' },
    { id: 2, name: 'dealer', displayNameEn: 'Dealer', displayNameAr: 'معرض سيارات' }
  ],
  bodyStyles: [], // Added to satisfy CarReferenceData type
  carConditions: [],
  driveTypes: [],
  fuelTypes: [],
  transmissions: []
};

const mockSellerTypeCounts = {
  private: 500,
  dealer: 300
};

describe('SellerTypeFilter', () => {
  const defaultProps = {
    referenceData: mockReferenceData,
    currentLanguage: 'en',
    selectedSellerTypeIds: [],
    onSellerTypeChange: jest.fn(),
    sellerTypeCounts: mockSellerTypeCounts,
    t: mockT
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown variant correctly', () => {
    render(<SellerTypeFilter {...defaultProps} variant="dropdown" />);

    expect(screen.getByText('Select seller type')).toBeInTheDocument();
    expect(screen.getByText('Private Seller (500)')).toBeInTheDocument();
    expect(screen.getByText('Dealer (300)')).toBeInTheDocument();
  });

  it('renders cards variant correctly', () => {
    render(<SellerTypeFilter {...defaultProps} variant="cards" />);

    expect(screen.getByText('Private Seller')).toBeInTheDocument();
    expect(screen.getByText('Dealer')).toBeInTheDocument();
    expect(screen.getAllByText('(500)')).toHaveLength(1);
    expect(screen.getAllByText('(300)')).toHaveLength(1);
  });

  it('calls onSellerTypeChange when seller type is selected in dropdown', () => {
    render(<SellerTypeFilter {...defaultProps} variant="dropdown" />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(defaultProps.onSellerTypeChange).toHaveBeenCalledWith([1]);
  });

  it('calls onSellerTypeChange when seller type is selected in cards', () => {
    render(<SellerTypeFilter {...defaultProps} variant="cards" />);

    const privateButton = screen.getByText('Private Seller').closest('div');
    fireEvent.click(privateButton!);

    expect(defaultProps.onSellerTypeChange).toHaveBeenCalledWith([1]);
  });

  it('shows selected seller type in dropdown', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        variant="dropdown"
        selectedSellerTypeIds={[1]}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('shows selected seller type in cards', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        variant="cards"
        selectedSellerTypeIds={[1]}
      />
    );

    // Find the parent div that contains the Private Seller text and has the correct classes
    const privateContainer = screen.getByText('Private Seller').closest('div[class*="border-blue-500"]');
    expect(privateContainer).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('handles Arabic language correctly', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        currentLanguage="ar"
        variant="cards"
      />
    );

    expect(screen.getByText('بائع خاص')).toBeInTheDocument();
    expect(screen.getByText('معرض سيارات')).toBeInTheDocument();
  });

  it('handles null reference data gracefully', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        referenceData={null}
        variant="cards"
      />
    );

    expect(screen.getByText('No seller types available')).toBeInTheDocument();
  });

  it('handles empty seller types array', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        referenceData={{ ...mockReferenceData, sellerTypes: [] }}
        variant="cards"
      />
    );

    expect(screen.getByText('No seller types available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<SellerTypeFilter {...defaultProps} isLoading={true} variant="cards" />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles multiple selections in cards variant', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        variant="cards"
        selectedSellerTypeIds={[1, 2]}
      />
    );

    // Find the parent divs that contain the text and have the correct classes
    const privateContainer = screen.getByText('Private Seller').closest('div[class*="border-blue-500"]');
    const dealerContainer = screen.getByText('Dealer').closest('div[class*="border-blue-500"]');

    expect(privateContainer).toHaveClass('border-blue-500');
    expect(dealerContainer).toHaveClass('border-blue-500');
  });

  it('removes seller type when deselected', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        variant="cards"
        selectedSellerTypeIds={[1, 2]}
      />
    );

    const privateButton = screen.getByText('Private Seller').closest('div');
    fireEvent.click(privateButton!);

    expect(defaultProps.onSellerTypeChange).toHaveBeenCalledWith([2]);
  });

  it('clears all selections when last item is deselected', () => {
    render(
      <SellerTypeFilter
        {...defaultProps}
        variant="cards"
        selectedSellerTypeIds={[1]}
      />
    );

    const privateButton = screen.getByText('Private Seller').closest('div');
    fireEvent.click(privateButton!);

    expect(defaultProps.onSellerTypeChange).toHaveBeenCalledWith(undefined);
  });

  it('handles disableScroll prop correctly', () => {
    const { container } = render(
      <SellerTypeFilter
        {...defaultProps}
        variant="cards"
        disableScroll={true}
      />
    );

    const scrollContainer = container.querySelector('.grid');
    expect(scrollContainer).not.toHaveClass('max-h-96', 'overflow-y-auto');
  });

  it('handles seller type counts correctly', () => {
    render(<SellerTypeFilter {...defaultProps} variant="cards" />);

    expect(screen.getByText('(500)')).toBeInTheDocument();
    expect(screen.getByText('(300)')).toBeInTheDocument();
  });

  it('handles zero counts correctly', () => {
    const zeroCounts = { private: 0, dealer: 0 };
    render(
      <SellerTypeFilter
        {...defaultProps}
        sellerTypeCounts={zeroCounts}
        variant="cards"
      />
    );

    expect(screen.getAllByText('(0)')).toHaveLength(2);
  });
});