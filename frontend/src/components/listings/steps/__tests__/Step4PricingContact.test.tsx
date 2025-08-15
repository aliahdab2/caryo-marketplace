import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Step4PricingContact from '../Step4PricingContact';

const baseProps = () => ({
  formData: {
    id: '', title: '', description: '', make: '', model: '', year: '', price: '', currency: 'USD',
    condition: 'used', mileage: '', engine: '', color: '', exteriorColor: '', interiorColor: '',
    transmission: '', fuelType: '', features: [], categoryId: '', location: '', governorateSlug: '',
    locationSlug: '', state: '', zipCode: '', contactName: '', contactPhone: '', contactEmail: '',
    contactPreference: 'phone', images: [], videos: [], videoUrls: [], existingImageUrls: [], existingVideoUrls: [],
    status: 'active'
  } as unknown as Parameters<typeof Step4PricingContact>[0]['formData'],
  formErrors: {},
  governorates: [
    { id: 1, slug: 'damascus', displayNameAr: 'دمشق', displayNameEn: 'Damascus' },
    { id: 2, slug: 'aleppo', displayNameAr: 'حلب', displayNameEn: 'Aleppo' },
  ],
  locations: [
    { id: 10, slug: 'muhajireen', displayNameAr: 'المهاجرين', displayNameEn: 'Muhajireen' },
    { id: 20, slug: 'mazzeh', displayNameAr: 'المزة', displayNameEn: 'Mazzeh' },
  ],
  isLoadingGovernorates: false,
  isLoadingLocations: false,
  isRTL: false,
  onPriceChange: jest.fn(),
  onCurrencyChange: jest.fn(),
  onGovernorateChange: jest.fn(),
  onLocationChange: jest.fn(),
  onContactNameChange: jest.fn(),
  onContactPhoneChange: jest.fn(),
  onContactEmailChange: jest.fn(),
});

describe('Step4PricingContact', () => {
  it('renders key controls', () => {
    render(<Step4PricingContact {...baseProps()} />);
    expect(screen.getByTestId('price')).toBeInTheDocument();
    expect(screen.getByTestId('currency')).toBeInTheDocument();
    expect(screen.getByTestId('governorateSlug')).toBeInTheDocument();
    expect(screen.getByTestId('locationSlug')).toBeInTheDocument();
    expect(screen.getByTestId('contactName')).toBeInTheDocument();
    expect(screen.getByTestId('contactPhone')).toBeInTheDocument();
    expect(screen.getByTestId('contactEmail')).toBeInTheDocument();
  });

  it('calls handlers on change', () => {
    const props = baseProps();
    render(<Step4PricingContact {...props} />);

    fireEvent.change(screen.getByTestId('price'), { target: { value: '12345' } });
    expect(props.onPriceChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('currency'), { target: { value: 'SYP' } });
    expect(props.onCurrencyChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('governorateSlug'), { target: { value: 'damascus' } });
    expect(props.onGovernorateChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('locationSlug'), { target: { value: 'muhajireen' } });
    expect(props.onLocationChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('contactName'), { target: { value: 'Ali' } });
    expect(props.onContactNameChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('contactPhone'), { target: { value: '+123' } });
    expect(props.onContactPhoneChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('contactEmail'), { target: { value: 'a@b.com' } });
    expect(props.onContactEmailChange).toHaveBeenCalled();
  });
});


