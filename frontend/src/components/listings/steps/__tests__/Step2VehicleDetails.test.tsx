import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Step2VehicleDetails, { Step2VehicleDetailsProps } from '../Step2VehicleDetails';

const baseProps = (): Step2VehicleDetailsProps => ({
  formData: {
    id: '', title: '', description: '', make: '', model: '', year: '', price: '', currency: 'USD',
    condition: 'used', mileage: '', engine: '', color: '', exteriorColor: '', interiorColor: '',
    transmission: '', fuelType: '', features: [], categoryId: '', location: '', governorateSlug: '',
    locationSlug: '', state: '', zipCode: '', contactName: '', contactPhone: '', contactEmail: '',
    contactPreference: 'phone', images: [], videos: [], videoUrls: [], existingImageUrls: [], existingVideoUrls: [],
    status: 'active'
  } as unknown as Step2VehicleDetailsProps['formData'],
  formErrors: {},
  transmissions: [
    { id: 1, slug: 'auto', displayNameAr: 'أوتوماتيك', displayNameEn: 'Automatic' },
    { id: 2, slug: 'manual', displayNameAr: 'عادي', displayNameEn: 'Manual' },
  ],
  fuelTypes: [
    { id: 1, slug: 'petrol', displayNameAr: 'بنزين', displayNameEn: 'Petrol' },
    { id: 2, slug: 'diesel', displayNameAr: 'ديزل', displayNameEn: 'Diesel' },
  ],
  isLoadingReferenceData: false,
  onMileageChange: jest.fn(),
  onEngineChange: jest.fn(),
  onTransmissionChange: jest.fn(),
  onColorChange: jest.fn(),
  onFuelTypeChange: jest.fn(),
});

describe('Step2VehicleDetails', () => {
  it('renders key controls', () => {
    render(<Step2VehicleDetails {...baseProps()} />);
    expect(screen.getByTestId('mileage')).toBeInTheDocument();
    expect(screen.getByTestId('engine')).toBeInTheDocument();
    expect(screen.getByTestId('transmission')).toBeInTheDocument();
    expect(screen.getByTestId('color')).toBeInTheDocument();
    expect(screen.getByTestId('fuelType')).toBeInTheDocument();
  });

  it('calls input/select handlers on change', () => {
    const props = baseProps();
    render(<Step2VehicleDetails {...props} />);

    fireEvent.change(screen.getByTestId('mileage'), { target: { value: '12345' } });
    expect(props.onMileageChange).toHaveBeenCalledWith('12345');

    fireEvent.change(screen.getByTestId('engine'), { target: { value: '2.0L' } });
    expect(props.onEngineChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('transmission'), { target: { value: 'auto' } });
    expect(props.onTransmissionChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('color'), { target: { value: 'White' } });
    expect(props.onColorChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('fuelType'), { target: { value: 'petrol' } });
    expect(props.onFuelTypeChange).toHaveBeenCalled();
  });

  it('disables selects when loading', () => {
    const props = baseProps();
    props.isLoadingReferenceData = true;
    render(<Step2VehicleDetails {...props} />);
    expect((screen.getByTestId('transmission') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByTestId('fuelType') as HTMLSelectElement).disabled).toBe(true);
  });
});


