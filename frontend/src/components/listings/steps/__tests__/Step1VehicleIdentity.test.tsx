import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1VehicleIdentity, { Step1VehicleIdentityProps } from '../Step1VehicleIdentity';

const baseProps = (): Step1VehicleIdentityProps => ({
  formData: {
    id: '', title: '', description: '', make: '', model: '', year: '', price: '', currency: 'USD',
    condition: 'used', mileage: '', engine: '', color: '', exteriorColor: '', interiorColor: '',
    transmission: '', fuelType: '', features: [], categoryId: '', location: '', governorateSlug: '',
    locationSlug: '', state: '', zipCode: '', contactName: '', contactPhone: '', contactEmail: '',
    contactPreference: 'phone', images: [], videos: [], videoUrls: [], existingImageUrls: [], existingVideoUrls: [],
    status: 'active'
  } as unknown as Step1VehicleIdentityProps['formData'],
  formErrors: {},
  carMakes: [
    { id: 1, slug: 'toyota', displayNameAr: 'تويوتا', displayNameEn: 'Toyota' },
    { id: 2, slug: 'honda', displayNameAr: 'هوندا', displayNameEn: 'Honda' },
  ],
  carModels: [
    { id: 10, slug: 'corolla', displayNameAr: 'كورولا', displayNameEn: 'Corolla' },
    { id: 20, slug: 'civic', displayNameAr: 'سيفيك', displayNameEn: 'Civic' },
  ],
  isLoadingMakes: false,
  isLoadingModels: false,
  onMakeChange: jest.fn(),
  onModelChange: jest.fn(),
  onYearChange: jest.fn(),
});

describe('Step1VehicleIdentity', () => {
  it('renders labels and selects', () => {
    render(<Step1VehicleIdentity {...baseProps()} />);
    expect(screen.getByLabelText(/Make/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
  });

  it('disables model select until a make is chosen', () => {
    const { rerender } = render(<Step1VehicleIdentity {...baseProps()} />);
    const model = screen.getByLabelText(/Model/i) as HTMLSelectElement;
    expect(model.disabled).toBe(true);

    const p = baseProps();
    p.formData.make = 'toyota';
    rerender(<Step1VehicleIdentity {...p} />);
    expect((screen.getByLabelText(/Model/i) as HTMLSelectElement).disabled).toBe(false);
  });

  it('calls handlers on change', () => {
    const props = baseProps();
    const { rerender } = render(<Step1VehicleIdentity {...props} />);

    fireEvent.change(screen.getByLabelText(/Make/i), { target: { value: 'toyota' } });
    expect(props.onMakeChange).toHaveBeenCalled();

    const updated = { ...props, formData: { ...props.formData, make: 'toyota' } };
    rerender(<Step1VehicleIdentity {...updated} />);

    fireEvent.change(screen.getByLabelText(/Model/i), { target: { value: 'corolla' } });
    expect(props.onModelChange).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Year/i), { target: { value: String(new Date().getFullYear()) } });
    expect(props.onYearChange).toHaveBeenCalled();
  });

  it('shows error messages when provided', () => {
    const props = baseProps();
    props.formErrors = { make: 'Required', model: 'Required', year: 'Required' } as unknown as Step1VehicleIdentityProps['formErrors'];
    render(<Step1VehicleIdentity {...props} />);
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a list of years including current year', () => {
    render(<Step1VehicleIdentity {...baseProps()} />);
    const current = String(new Date().getFullYear());
    expect(screen.getByLabelText(/Year/i)).toHaveTextContent(current);
  });
});


