import React from 'react';
import { render, screen } from '@testing-library/react';
import BreadcrumbNavigation from '../BreadcrumbNavigation';
import { CarListing } from '@/services/publicApi';

// Mock the translation hook
const mockT = jest.fn();
const mockI18n = {
  language: 'en',
  changeLanguage: jest.fn(),
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  })
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('BreadcrumbNavigation', () => {
  const baseListing: CarListing = {
    id: 1,
    title: 'Test Car',
    description: 'Test Description',
    price: 25000,
    modelYear: 2020,
    mileage: 50000,
    brandNameEn: 'Toyota',
    brandNameAr: 'تويوتا',
    modelNameEn: 'Camry',
    modelNameAr: 'كامري',
    governorateNameEn: 'Dubai',
    governorateNameAr: 'دبي',
    locationDetails: {
      id: 1,
      displayNameEn: 'Dubai',
      displayNameAr: 'دبي',
      slug: 'dubai',
      countryCode: 'AE',
      governorateId: 1,
      governorateNameEn: 'Dubai',
      governorateNameAr: 'دبي',
      region: 'Middle East',
      active: true,
    },
    governorateDetails: {
      id: 1,
      displayNameEn: 'Dubai',
      displayNameAr: 'دبي',
      countryId: 1,
      countryCode: 'AE',
      countryNameEn: 'United Arab Emirates',
      countryNameAr: 'الإمارات العربية المتحدة',
      slug: 'dubai',
    },
    transmission: 'Automatic',
    fuelType: 'Petrol',
    media: [],
    approved: true,
    sellerId: 1,
    sellerUsername: 'testuser',
    createdAt: '2024-01-01',
    isSold: false,
    isArchived: false,
    isUserActive: true,
    isExpired: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the default English mock
    mockI18n.language = 'en';
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'allCars': 'All Cars',
        'breadcrumbNavigation': 'Breadcrumb navigation',
        'currentPage': 'Current page: {{label}}',
        'navigateTo': 'Navigate to {{label}}'
      };
      return translations[key] || key;
    });
  });

  it('should render "All Cars" breadcrumb', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    // Find by text content instead of aria-label since the aria-label uses translation placeholders
    const allCarsLink = screen.getByText('All Cars');
    expect(allCarsLink).toBeInTheDocument();
    expect(allCarsLink).toHaveAttribute('href', '/search');
  });

  it('should render brand breadcrumb with correct slug', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const brandLink = screen.getByText('Toyota');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/search?brand=toyota');
  });

  it('should render model breadcrumb with compound slug', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const modelLink = screen.getByText('Camry');
    expect(modelLink).toBeInTheDocument();
    expect(modelLink).toHaveAttribute('href', '/search?brand=toyota&model=toyota-camry');
  });

  it('should handle brands with spaces', () => {
    const listingWithSpaces = {
      ...baseListing,
      brandNameEn: 'Land Rover',
      modelNameEn: 'Range Rover'
    };

    render(<BreadcrumbNavigation listing={listingWithSpaces} />);
    
    const brandLink = screen.getByText('Land Rover');
    expect(brandLink).toHaveAttribute('href', '/search?brand=land-rover');
    
    const modelLink = screen.getByText('Range Rover');
    expect(modelLink).toHaveAttribute('href', '/search?brand=land-rover&model=land-rover-range-rover');
  });

  it('should handle missing model gracefully', () => {
    const listingWithoutModel = {
      ...baseListing,
      modelNameEn: '',
      modelNameAr: ''
    };

    render(<BreadcrumbNavigation listing={listingWithoutModel} />);
    
    expect(screen.getByText('All Cars')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.queryByText('Camry')).not.toBeInTheDocument();
  });

  it('should handle missing brand gracefully', () => {
    const listingWithoutBrand = {
      ...baseListing,
      brandNameEn: '',
      brandNameAr: ''
    };

    render(<BreadcrumbNavigation listing={listingWithoutBrand} />);
    
    expect(screen.getByText('All Cars')).toBeInTheDocument();
    expect(screen.queryByText('Toyota')).not.toBeInTheDocument();
    expect(screen.queryByText('Camry')).not.toBeInTheDocument();
  });

  it('should handle special characters in brand/model names', () => {
    const listingWithSpecialChars = {
      ...baseListing,
      brandNameEn: 'McLaren',
      modelNameEn: 'P1™'
    };

    render(<BreadcrumbNavigation listing={listingWithSpecialChars} />);
    
    const brandLink = screen.getByText('McLaren');
    expect(brandLink).toHaveAttribute('href', '/search?brand=mclaren');
    
    const modelLink = screen.getByText('P1™');
    expect(modelLink).toHaveAttribute('href', '/search?brand=mclaren&model=mclaren-p1');
  });

  it('should use Arabic names when language is Arabic', () => {
    // Set up Arabic language mock
    mockI18n.language = 'ar';
    mockT.mockImplementation((key: string) => key);

    render(<BreadcrumbNavigation listing={baseListing} />);
    
    expect(screen.getByText('تويوتا')).toBeInTheDocument();
    expect(screen.getByText('كامري')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');
    
    // Check that separators are hidden from screen readers
    const separators = nav.querySelectorAll('svg[aria-hidden="true"]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('should render correct number of breadcrumbs', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3); // All Cars + Brand + Model
  });

  it('should URL encode special characters properly', () => {
    const listingWithSpecialChars = {
      ...baseListing,
      brandNameEn: 'Rolls-Royce',
      modelNameEn: 'Phantom VII'
    };

    render(<BreadcrumbNavigation listing={listingWithSpecialChars} />);
    
    const brandLink = screen.getByText('Rolls-Royce');
    expect(brandLink).toHaveAttribute('href', '/search?brand=rolls-royce');
    
    const modelLink = screen.getByText('Phantom VII');
    expect(modelLink).toHaveAttribute('href', '/search?brand=rolls-royce&model=rolls-royce-phantom-vii');
  });
});
