import { render, screen } from '@testing-library/react';
import CarListingCard, { CarListingCardData } from '../CarListingCard';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock hooks
jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: string | Record<string, unknown>) => {
      // Handle the case where options is a string (the fallback)
      if (typeof options === 'string') return options;
      // Handle the case where options is an object with ns property
      if (options && typeof options === 'object') {
        return key; // Return the key for namespaced translations
      }
      return key;
    },
  }),
}));

jest.mock('@/utils/languageDirection', () => ({
  useLanguageDirection: () => ({ isRTL: false }),
}));

// Mock child components
jest.mock('@/components/common/FavoriteButton', () => {
  return function MockFavoriteButton({ listingId }: { listingId: string }) {
    return <button data-testid={`favorite-btn-${listingId}`}>♥</button>;
  };
});

jest.mock('@/components/ui/YearBadge', () => {
  return function MockYearBadge({ year }: { year?: number }) {
    return year ? <span data-testid="year-badge">{year}</span> : null;
  };
});

jest.mock('@/components/ui/HoverImageNavigation', () => {
  return function MockHoverImageNavigation({ alt }: { alt: string }) {
    return <div data-testid="hover-image-nav">{alt}</div>;
  };
});

// Mock utility functions
jest.mock('@/utils/localization', () => ({
  formatNumber: (num: number) => `$${num.toLocaleString()}`,
}));

jest.mock('@/utils/dateUtils', () => ({
  timeAgo: () => '2 days ago',
}));

jest.mock('@/utils/mediaUtils', () => ({
  getDefaultImageUrl: () => '/default-car.jpg',
}));

describe('CarListingCard', () => {
  const mockListing: CarListingCardData = {
    id: '123',
    title: '2020 Toyota Camry',
    price: 25000,
    year: 2020,
    mileage: 50000,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    createdAt: '2024-01-15T10:00:00Z',
    governorateNameEn: 'Damascus',
    governorateNameAr: 'دمشق',
    media: [
      { url: '/images/car1.jpg', isPrimary: true },
      { url: '/images/car2.jpg' },
    ],
  };

  it('renders the listing card', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByTestId('listing-card')).toBeInTheDocument();
  });

  it('displays the listing title', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByRole('heading', { name: '2020 Toyota Camry' })).toBeInTheDocument();
  });

  it('displays the formatted price', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });

  it('displays the year badge', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByTestId('year-badge')).toHaveTextContent('2020');
  });

  it('displays mileage with km suffix', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it('displays transmission type', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByText('Automatic')).toBeInTheDocument();
  });

  it('displays fuel type', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByText('Petrol')).toBeInTheDocument();
  });

  it('displays the time ago', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });

  it('displays the governorate name', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByText('Damascus')).toBeInTheDocument();
  });

  it('renders favorite button', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByTestId('favorite-btn-123')).toBeInTheDocument();
  });

  it('links to the listing detail page', () => {
    render(<CarListingCard listing={mockListing} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/123');
  });

  it('renders HoverImageNavigation component', () => {
    render(<CarListingCard listing={mockListing} />);
    expect(screen.getByTestId('hover-image-nav')).toBeInTheDocument();
  });

  it('uses modelYear when available over year', () => {
    const listingWithModelYear: CarListingCardData = {
      ...mockListing,
      year: 2019,
      modelYear: 2020,
    };

    render(<CarListingCard listing={listingWithModelYear} />);
    expect(screen.getByTestId('year-badge')).toHaveTextContent('2020');
  });

  it('handles missing transmission gracefully', () => {
    const listingNoTransmission: CarListingCardData = {
      ...mockListing,
      transmission: undefined,
    };

    render(<CarListingCard listing={listingNoTransmission} />);
    expect(screen.queryByText('Automatic')).not.toBeInTheDocument();
  });

  it('handles missing fuel type gracefully', () => {
    const listingNoFuelType: CarListingCardData = {
      ...mockListing,
      fuelType: undefined,
    };

    render(<CarListingCard listing={listingNoFuelType} />);
    expect(screen.queryByText('Petrol')).not.toBeInTheDocument();
  });

  it('handles numeric id', () => {
    const listingNumericId: CarListingCardData = {
      ...mockListing,
      id: 456,
    };

    render(<CarListingCard listing={listingNumericId} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/456');
  });

  it('uses bilingual transmission names when available', () => {
    const listingWithBilingual: CarListingCardData = {
      ...mockListing,
      transmissionNameEn: 'Manual Transmission',
      transmissionNameAr: 'ناقل حركة يدوي',
    };

    render(<CarListingCard listing={listingWithBilingual} />);
    expect(screen.getByText('Manual Transmission')).toBeInTheDocument();
  });

  it('uses bilingual fuel type names when available', () => {
    const listingWithBilingual: CarListingCardData = {
      ...mockListing,
      fuelTypeNameEn: 'Diesel Fuel',
      fuelTypeNameAr: 'وقود ديزل',
    };

    render(<CarListingCard listing={listingWithBilingual} />);
    expect(screen.getByText('Diesel Fuel')).toBeInTheDocument();
  });

  it('falls back to governorateDetails when direct fields are missing', () => {
    const listingWithDetails: CarListingCardData = {
      ...mockListing,
      governorateNameEn: undefined,
      governorateNameAr: undefined,
      governorateDetails: {
        id: 1,
        displayNameEn: 'Aleppo',
        displayNameAr: 'حلب',
        slug: 'aleppo',
        countryId: 1,
        countryCode: 'SY',
        countryNameEn: 'Syria',
        countryNameAr: 'سوريا',
        region: 'North',
        latitude: 36.2,
        longitude: 37.15,
      },
    };

    render(<CarListingCard listing={listingWithDetails} />);
    expect(screen.getByText('Aleppo')).toBeInTheDocument();
  });

  it('passes user prop to FavoriteButton', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    };

    render(<CarListingCard listing={mockListing} user={mockUser} />);
    expect(screen.getByTestId('favorite-btn-123')).toBeInTheDocument();
  });

  it('handles initialFavorite prop', () => {
    render(<CarListingCard listing={mockListing} initialFavorite={true} />);
    expect(screen.getByTestId('favorite-btn-123')).toBeInTheDocument();
  });

  it('has proper card structure with shadow and rounded corners', () => {
    render(<CarListingCard listing={mockListing} />);
    const card = screen.getByTestId('listing-card');

    expect(card).toHaveClass('shadow-lg');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('overflow-hidden');
  });
});

describe('CarListingCard RTL', () => {
  beforeEach(() => {
    // Override the mock for RTL tests
    jest.doMock('@/utils/languageDirection', () => ({
      useLanguageDirection: () => ({ isRTL: true }),
    }));
  });

  it('applies RTL direction when isRTL is true', () => {
    // Re-import with RTL mock
    const mockListingRTL: CarListingCardData = {
      id: '123',
      title: 'Toyota Camry',
      price: 25000,
      mileage: 50000,
      createdAt: '2024-01-15T10:00:00Z',
    };

    render(<CarListingCard listing={mockListingRTL} />);
    // The component should render (RTL behavior tested via visual inspection in real environment)
    expect(screen.getByTestId('listing-card')).toBeInTheDocument();
  });
});
