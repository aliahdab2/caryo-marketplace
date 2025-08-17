import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import BrandSelect from '../BrandSelect';
import { CarMake } from '@/types/car';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;

const mockBrands: CarMake[] = [
  { id: 1, slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا' },
  { id: 2, slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا' },
];

describe('BrandSelect', () => {
  const mockOnChange = jest.fn();
  const mockT = jest.fn((key: string, fallback?: string) => fallback || key);

  beforeEach(() => {
    jest.clearAllMocks();
    const mocked = {
      t: mockT as (key: string, fallback?: string) => string,
      i18n: { language: 'en' },
    } as unknown as ReturnType<typeof useTranslation>;
    mockUseTranslation.mockReturnValue(mocked);
  });

  it('renders with correct options', () => {
    render(
      <BrandSelect
        value={null}
        onChange={mockOnChange}
        options={mockBrands}
        isLoading={false}
        currentLanguage="en"
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Any Brand')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
  });

  it('shows Arabic names when currentLanguage is ar', () => {
    render(
      <BrandSelect
        value={null}
        onChange={mockOnChange}
        options={mockBrands}
        isLoading={false}
        currentLanguage="ar"
      />
    );

    expect(screen.getByText('تويوتا')).toBeInTheDocument();
    expect(screen.getByText('هوندا')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    render(
      <BrandSelect
        value={null}
        onChange={mockOnChange}
        options={mockBrands}
        isLoading={false}
        currentLanguage="en"
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  it('shows loading spinner when isLoading is true', () => {
    render(
      <BrandSelect
        value={null}
        onChange={mockOnChange}
        options={mockBrands}
        isLoading={true}
        currentLanguage="en"
      />
    );

    expect(screen.getByTestId('brand-loading-spinner')).toBeInTheDocument();
  });

  it('disables select when isLoading is true', () => {
    render(
      <BrandSelect
        value={null}
        onChange={mockOnChange}
        options={mockBrands}
        isLoading={true}
        currentLanguage="en"
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
