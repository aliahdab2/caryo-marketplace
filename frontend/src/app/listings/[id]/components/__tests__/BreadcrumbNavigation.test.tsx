import React from 'react';
import { render, screen } from '@testing-library/react';
import BreadcrumbNavigation from '../BreadcrumbNavigation';
import { Listing } from '@/types/listings';

// Mock the translation hook
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('BreadcrumbNavigation', () => {
  const baseListing: Listing & {
    brandNameEn?: string;
    brandNameAr?: string;
    modelNameEn?: string;
    modelNameAr?: string;
  } = {
    id: '1',
    title: 'Test Car',
    description: 'Test Description',
    price: 25000,
    year: 2020,
    mileage: 50000,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    brandNameEn: 'Toyota',
    brandNameAr: 'تويوتا',
    modelNameEn: 'Camry',
    modelNameAr: 'كامري'
  } as Listing & {
    brandNameEn?: string;
    brandNameAr?: string;
    modelNameEn?: string;
    modelNameAr?: string;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'allCars': 'All Cars',
          'breadcrumbNavigation': 'Breadcrumb navigation',
          'currentPage': 'Current page: {{label}}',
          'navigateTo': 'Navigate to {{label}}'
        };
        return translations[key] || key;
      },
      i18n: {
        language: 'en'
      }
    });
  });

  it('should render "All Cars" breadcrumb', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const allCarsLink = screen.getByRole('link', { name: /all cars/i });
    expect(allCarsLink).toBeInTheDocument();
    expect(allCarsLink).toHaveAttribute('href', '/search');
  });

  it('should render brand breadcrumb with correct slug', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const brandLink = screen.getByRole('link', { name: /toyota/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/search?brand=toyota');
  });

  it('should render model breadcrumb with compound slug', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const modelLink = screen.getByRole('link', { name: /camry/i });
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
    
    const brandLink = screen.getByRole('link', { name: /land rover/i });
    expect(brandLink).toHaveAttribute('href', '/search?brand=land-rover');
    
    const modelLink = screen.getByRole('link', { name: /range rover/i });
    expect(modelLink).toHaveAttribute('href', '/search?brand=land-rover&model=land-rover-range-rover');
  });

  it('should handle missing model gracefully', () => {
    const listingWithoutModel = {
      ...baseListing,
      modelNameEn: undefined,
      modelNameAr: undefined
    };

    render(<BreadcrumbNavigation listing={listingWithoutModel} />);
    
    expect(screen.getByRole('link', { name: /all cars/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /toyota/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /camry/i })).not.toBeInTheDocument();
  });

  it('should handle missing brand gracefully', () => {
    const listingWithoutBrand = {
      ...baseListing,
      brandNameEn: undefined,
      brandNameAr: undefined
    };

    render(<BreadcrumbNavigation listing={listingWithoutBrand} />);
    
    expect(screen.getByRole('link', { name: /all cars/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /toyota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /camry/i })).not.toBeInTheDocument();
  });

  it('should handle special characters in brand/model names', () => {
    const listingWithSpecialChars = {
      ...baseListing,
      brandNameEn: 'McLaren',
      modelNameEn: 'P1™'
    };

    render(<BreadcrumbNavigation listing={listingWithSpecialChars} />);
    
    const brandLink = screen.getByRole('link', { name: /mclaren/i });
    expect(brandLink).toHaveAttribute('href', '/search?brand=mclaren');
    
    const modelLink = screen.getByRole('link', { name: /p1™/i });
    expect(modelLink).toHaveAttribute('href', '/search?brand=mclaren&model=mclaren-p1');
  });

  it('should use Arabic names when language is Arabic', () => {
    // Mock Arabic language
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'ar'
      }
    });

    render(<BreadcrumbNavigation listing={baseListing} />);
    
    expect(screen.getByRole('link', { name: /تويوتا/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /كامري/i })).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<BreadcrumbNavigation listing={baseListing} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'breadcrumbNavigation');
    
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
    
    const brandLink = screen.getByRole('link', { name: /rolls-royce/i });
    expect(brandLink).toHaveAttribute('href', '/search?brand=rolls-royce');
    
    const modelLink = screen.getByRole('link', { name: /phantom vii/i });
    expect(modelLink).toHaveAttribute('href', '/search?brand=rolls-royce&model=rolls-royce-phantom-vii');
  });
});
