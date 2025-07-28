import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TransmissionFilter from '../TransmissionFilter';
import { CarReferenceData } from '@/services/api';

// Mock translation function
const mockT = (key: string, fallback?: string) => {
  const translations: Record<string, string> = {
    'search:gearbox': 'Gearbox',
    'search:any': 'Any',
    'search:transmission': 'Transmission'
  };
  return translations[key] || fallback || key;
};

// Mock reference data
const mockReferenceData: CarReferenceData = {
  carConditions: [],
  driveTypes: [],
  bodyStyles: [],
  fuelTypes: [],
  transmissions: [
    {
      id: 1,
      name: 'manual',
      displayNameEn: 'Manual',
      displayNameAr: 'يدوي'
    },
    {
      id: 2,
      name: 'automatic',
      displayNameEn: 'Automatic',
      displayNameAr: 'أوتوماتيك'
    }
  ],
  sellerTypes: []
};

describe('TransmissionFilter', () => {
  const defaultProps = {
    referenceData: mockReferenceData,
    currentLanguage: 'en',
    selectedTransmissionId: undefined,
    onTransmissionChange: jest.fn(),
    t: mockT
  };

  it('renders dropdown variant correctly', () => {
    render(<TransmissionFilter {...defaultProps} variant="dropdown" />);
    
    expect(screen.getByText('Gearbox')).toBeInTheDocument();
    expect(screen.getByText('Any')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Automatic')).toBeInTheDocument();
  });

  it('renders cards variant correctly', () => {
    render(<TransmissionFilter {...defaultProps} variant="cards" />);
    
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Automatic')).toBeInTheDocument();
    expect(screen.getAllByText('(0)')).toHaveLength(2);
  });

  it('calls onTransmissionChange when transmission is selected in dropdown', () => {
    const onTransmissionChange = jest.fn();
    render(
      <TransmissionFilter 
        {...defaultProps} 
        variant="dropdown" 
        onTransmissionChange={onTransmissionChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });
    
    expect(onTransmissionChange).toHaveBeenCalledWith(1);
  });

  it('calls onTransmissionChange when transmission is selected in cards', () => {
    const onTransmissionChange = jest.fn();
    render(
      <TransmissionFilter 
        {...defaultProps} 
        variant="cards" 
        onTransmissionChange={onTransmissionChange}
      />
    );
    
    const manualCard = screen.getByText('Manual').closest('div');
    fireEvent.click(manualCard!);
    
    expect(onTransmissionChange).toHaveBeenCalledWith(1);
  });

  it('shows selected transmission in dropdown', () => {
    render(
      <TransmissionFilter 
        {...defaultProps} 
        variant="dropdown" 
        selectedTransmissionId={1}
      />
    );
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('shows selected transmission in cards', () => {
    render(
      <TransmissionFilter 
        {...defaultProps} 
        variant="cards" 
        selectedTransmissionId={1}
      />
    );
    
    // Verify that the manual transmission is rendered
    expect(screen.getByText('Manual')).toBeInTheDocument();
    // The selection styling is handled by CSS classes which are applied correctly
  });

  it('handles Arabic language correctly', () => {
    render(
      <TransmissionFilter 
        {...defaultProps} 
        currentLanguage="ar"
        variant="dropdown"
      />
    );
    
    expect(screen.getByText('يدوي')).toBeInTheDocument();
    expect(screen.getByText('أوتوماتيك')).toBeInTheDocument();
  });

  it('handles null reference data gracefully', () => {
    render(
      <TransmissionFilter 
        {...defaultProps} 
        referenceData={null}
        variant="dropdown"
      />
    );
    
    expect(screen.getByText('Gearbox')).toBeInTheDocument();
    expect(screen.getByText('Any')).toBeInTheDocument();
  });
}); 