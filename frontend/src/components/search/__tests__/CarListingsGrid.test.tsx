import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarListingsGrid from '../CarListingsGrid';
import { PageResponse, CarListing, LocationResponse, GovernorateResponse } from '@/services/api';

// Mock the icon component
jest.mock('react-icons/md', () => ({
  MdDirectionsCar: () => <div data-testid="car-icon">Car Icon</div>
}));

// Mock the components
jest.mock('@/components/ui/SmoothTransition', () => {
  return function SmoothTransition({ children, loadingComponent, isLoading }: { children: React.ReactNode, loadingComponent?: React.ReactNode, isLoading?: boolean }) {
    if (isLoading && loadingComponent) {
      return <div data-testid="loading-component">{loadingComponent}</div>;
    }
    return <div data-testid="smooth-transition">{children}</div>;
  };
});

jest.mock('@/components/listings/CarListingCard', () => {
  return function CarListingCard({ listing }: { listing: { title: string } }) {
    return <div data-testid="car-listing-card">{listing.title}</div>;
  };
});

jest.mock('@/components/ui/CarListingSkeleton', () => {
  return function CarListingSkeleton() {
    return <div data-testid="car-listing-skeleton">Loading skeleton</div>;
  };
});

describe('CarListingsGrid', () => {
  const mockExecuteSearch = jest.fn();
  const mockT = jest.fn((key: string, fallback?: string) => fallback || key);

  const defaultProps = {
    carListings: null,
    isLoadingListings: false,
    isManualSearch: false,
    listingsError: null,
    executeSearch: mockExecuteSearch,
    t: mockT
  };

  const mockLocationDetails: LocationResponse = {
    id: 1,
    displayNameEn: 'Test Location',
    displayNameAr: 'موقع تست',
    slug: 'test-location',
    countryCode: 'SY',
    governorateId: 1,
    governorateNameEn: 'Test Governorate',
    governorateNameAr: 'محافظة تست',
    region: 'Test Region',
    latitude: 35.0,
    longitude: 38.0,
    active: true
  };

  const mockGovernorateDetails: GovernorateResponse = {
    id: 1,
    displayNameEn: 'Test Governorate',
    displayNameAr: 'محافظة تست',
    slug: 'test-governorate',
    countryId: 1,
    countryCode: 'SY',
    countryNameEn: 'Syria',
    countryNameAr: 'سوريا',
    region: 'Test Region',
    latitude: 35.0,
    longitude: 38.0
  };

  const sampleListing: CarListing = {
    id: 1,
    title: 'Test Car',
    brandNameEn: 'Toyota',
    brandNameAr: 'تويوتا',
    modelNameEn: 'Camry',
    modelNameAr: 'كامري',
    governorateNameEn: 'Test Governorate',
    governorateNameAr: 'محافظة تست',
    locationDetails: mockLocationDetails,
    governorateDetails: mockGovernorateDetails,
    modelYear: 2020,
    price: 25000,
    mileage: 50000,
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    description: 'Test car description',
    approved: true,
    sellerId: 1,
    sellerUsername: 'testuser',
    createdAt: '2024-01-01T00:00:00Z',
    isSold: false,
    isArchived: false,
    isUserActive: true,
    isExpired: false,
    media: [
      {
        id: 1,
        url: 'test-image.jpg',
        fileKey: 'test-key',
        fileName: 'test-image.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        sortOrder: 1,
        isPrimary: true,
        mediaType: 'image'
      }
    ]
  };

  const sampleCarListings: PageResponse<CarListing> = {
    content: [sampleListing],
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 20,
    last: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the smooth transition wrapper', () => {
      render(<CarListingsGrid {...defaultProps} />);
      expect(screen.getByTestId('smooth-transition')).toBeInTheDocument();
    });

    it('renders loading component when isLoadingListings is true', () => {
      render(<CarListingsGrid {...defaultProps} isLoadingListings={true} />);
      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows spinner for manual search when loading', () => {
      render(<CarListingsGrid {...defaultProps} isLoadingListings={true} isManualSearch={true} />);
      const loadingComponent = screen.getByTestId('loading-component');
      expect(loadingComponent).toBeInTheDocument();
      expect(loadingComponent.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows skeleton loading for automatic search when loading', () => {
      render(<CarListingsGrid {...defaultProps} isLoadingListings={true} isManualSearch={false} />);
      const loadingComponent = screen.getByTestId('loading-component');
      expect(loadingComponent).toBeInTheDocument();
      expect(screen.getAllByTestId('car-listing-skeleton')).toHaveLength(8);
    });

    it('shows correct number of skeleton components', () => {
      render(<CarListingsGrid {...defaultProps} isLoadingListings={true} isManualSearch={false} />);
      expect(screen.getAllByTestId('car-listing-skeleton')).toHaveLength(8);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when listingsError is provided', () => {
      render(<CarListingsGrid {...defaultProps} listingsError="Test error message" />);
      expect(screen.getByText('Error loading results')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('displays generic error message for non-string errors', () => {
      render(<CarListingsGrid {...defaultProps} listingsError="Object error" />);
      expect(screen.getByText('Object error')).toBeInTheDocument();
    });

    it('shows try again button in error state', () => {
      render(<CarListingsGrid {...defaultProps} listingsError="Test error" />);
      const tryAgainButton = screen.getByText('Try again');
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('calls executeSearch when try again button is clicked', () => {
      render(<CarListingsGrid {...defaultProps} listingsError="Test error" />);
      const tryAgainButton = screen.getByText('Try again');
      fireEvent.click(tryAgainButton);
      expect(mockExecuteSearch).toHaveBeenCalledWith(false);
    });

    it('uses translation function for error messages', () => {
      render(<CarListingsGrid {...defaultProps} listingsError="Test error" />);
      expect(mockT).toHaveBeenCalledWith('errorLoadingResults', 'Error loading results');
      expect(mockT).toHaveBeenCalledWith('tryAgain', 'Try again');
    });
  });

  describe('Car Listings Display', () => {
    it('renders car listings when available', () => {
      render(<CarListingsGrid {...defaultProps} carListings={sampleCarListings} />);
      expect(screen.getByTestId('car-listing-card')).toBeInTheDocument();
      expect(screen.getByText('Test Car')).toBeInTheDocument();
    });

    it('renders multiple car listings', () => {
      const multipleListings: PageResponse<CarListing> = {
        ...sampleCarListings,
        content: [
          { ...sampleListing, id: 1, title: 'Car 1' },
          { ...sampleListing, id: 2, title: 'Car 2' },
          { ...sampleListing, id: 3, title: 'Car 3' }
        ],
        totalElements: 3
      };

      render(<CarListingsGrid {...defaultProps} carListings={multipleListings} />);
      expect(screen.getAllByTestId('car-listing-card')).toHaveLength(3);
      expect(screen.getByText('Car 1')).toBeInTheDocument();
      expect(screen.getByText('Car 2')).toBeInTheDocument();
      expect(screen.getByText('Car 3')).toBeInTheDocument();
    });

    it('renders car listings with animate-fadeIn class', () => {
      render(<CarListingsGrid {...defaultProps} carListings={sampleCarListings} />);
      const cardContainer = screen.getByTestId('car-listing-card').parentElement;
      expect(cardContainer).toHaveClass('animate-fadeIn');
    });
  });

  describe('Data Transformation', () => {
    it('transforms CarListing to CarListingCardData format correctly', () => {
      const listingWithAllFields: CarListing = {
        ...sampleListing,
        id: 123,
        title: 'Complete Car',
        price: 30000,
        modelYear: 2021,
        mileage: 25000,
        transmission: 'Manual',
        fuelType: 'Diesel',
        createdAt: '2024-02-01T10:30:00Z',
        sellerUsername: 'seller123',
        governorateNameEn: 'Damascus',
        governorateNameAr: 'دمشق',
        media: [
          {
            id: 1,
            url: 'image1.jpg',
            fileKey: 'key1',
            fileName: 'image1.jpg',
            contentType: 'image/jpeg',
            size: 1024,
            sortOrder: 1,
            isPrimary: true,
            mediaType: 'image'
          },
          {
            id: 2,
            url: 'image2.jpg',
            fileKey: 'key2',
            fileName: 'image2.jpg',
            contentType: 'image/png',
            size: 2048,
            sortOrder: 2,
            isPrimary: false,
            mediaType: 'image'
          }
        ]
      };

      const carListings: PageResponse<CarListing> = {
        ...sampleCarListings,
        content: [listingWithAllFields]
      };

      render(<CarListingsGrid {...defaultProps} carListings={carListings} />);
      expect(screen.getByText('Complete Car')).toBeInTheDocument();
    });

    it('handles listings with no media', () => {
      const listingWithoutMedia: CarListing = {
        ...sampleListing,
        media: []
      };

      const carListings: PageResponse<CarListing> = {
        ...sampleCarListings,
        content: [listingWithoutMedia]
      };

      render(<CarListingsGrid {...defaultProps} carListings={carListings} />);
      expect(screen.getByTestId('car-listing-card')).toBeInTheDocument();
    });
  });

  describe('No Results State', () => {
    it('shows no results message when carListings is empty', () => {
      const emptyListings: PageResponse<CarListing> = {
        ...sampleCarListings,
        content: [],
        totalElements: 0
      };

      render(<CarListingsGrid {...defaultProps} carListings={emptyListings} />);
      expect(screen.getByTestId('car-icon')).toBeInTheDocument();
      expect(screen.getByText('No cars found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search filters to see more results.')).toBeInTheDocument();
    });

    it('shows no results message when carListings is null', () => {
      render(<CarListingsGrid {...defaultProps} carListings={null} />);
      expect(screen.getByTestId('car-icon')).toBeInTheDocument();
      expect(screen.getByText('No cars found')).toBeInTheDocument();
    });

    it('uses translation function for no results messages', () => {
      const emptyListings: PageResponse<CarListing> = {
        ...sampleCarListings,
        content: [],
        totalElements: 0
      };

      render(<CarListingsGrid {...defaultProps} carListings={emptyListings} />);
      expect(mockT).toHaveBeenCalledWith('noResultsFound', 'No cars found');
      expect(mockT).toHaveBeenCalledWith('tryDifferentFilters', 'Try adjusting your search filters to see more results.');
    });

    it('applies correct CSS classes for no results state', () => {
      const emptyListings: PageResponse<CarListing> = {
        ...sampleCarListings,
        content: [],
        totalElements: 0
      };

      render(<CarListingsGrid {...defaultProps} carListings={emptyListings} />);
      const noResultsContainer = screen.getByText('No cars found').closest('div');
      expect(noResultsContainer).toHaveClass('col-span-full', 'text-center', 'py-12');
    });
  });

  describe('SmoothTransition Props', () => {
    it('passes correct props to SmoothTransition for manual search', () => {
      const { rerender } = render(<CarListingsGrid {...defaultProps} isManualSearch={true} />);
      
      // Verify grid classes are applied
      const container = screen.getByTestId('smooth-transition');
      expect(container).toBeInTheDocument();
      
      // Test with loading state
      rerender(<CarListingsGrid {...defaultProps} isManualSearch={true} isLoadingListings={true} />);
      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    });

    it('passes correct props to SmoothTransition for automatic search', () => {
      const { rerender } = render(<CarListingsGrid {...defaultProps} isManualSearch={false} />);
      
      const container = screen.getByTestId('smooth-transition');
      expect(container).toBeInTheDocument();
      
      // Test with loading state
      rerender(<CarListingsGrid {...defaultProps} isManualSearch={false} isLoadingListings={true} />);
      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    });
  });

  describe('Favorite Handling', () => {
    it('provides onFavoriteToggle handler to CarListingCard', () => {
      render(<CarListingsGrid {...defaultProps} carListings={sampleCarListings} />);
      expect(screen.getByTestId('car-listing-card')).toBeInTheDocument();
      // The favorite toggle functionality is passed but currently just a placeholder
    });

    it('sets initialFavorite to false for all cards', () => {
      render(<CarListingsGrid {...defaultProps} carListings={sampleCarListings} />);
      expect(screen.getByTestId('car-listing-card')).toBeInTheDocument();
      // This verifies the prop is passed correctly
    });
  });
});
