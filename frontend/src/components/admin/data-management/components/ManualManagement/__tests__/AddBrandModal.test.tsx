import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddBrandModal } from '../AddBrandModal';

// Mock dependencies
const mockShowError = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })),
}));

jest.mock('@/components/ui/ToastProvider', () => ({
  useToastHelpers: () => ({
    showSuccess: jest.fn(),
    showError: mockShowError,
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

describe('AddBrandModal', () => {
  const mockBrands = [
    {
      id: 1,
      name: 'Toyota',
      displayNameEn: 'Toyota',
      displayNameAr: 'تويوتا',
      slug: 'toyota',
      isActive: true,
    },
  ];

  const mockModels = [
    {
      id: 1,
      name: 'Camry',
      displayNameEn: 'Camry',
      displayNameAr: 'كامري',
      slug: 'camry',
      brandId: 1,
      brand: mockBrands[0],
      isActive: true,
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn().mockResolvedValue(true),
    brands: mockBrands,
    models: mockModels,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show toast error when brand name is missing', () => {
    render(<AddBrandModal {...defaultProps} />);

    const saveButton = screen.getByText('datamanagement:save');
    fireEvent.click(saveButton);

    expect(mockShowError).toHaveBeenCalledWith('datamanagement:nameRequired');
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('should show toast error when English name is missing', () => {
    render(<AddBrandModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('datamanagement:namePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'Honda' } });

    const saveButton = screen.getByText('datamanagement:save');
    fireEvent.click(saveButton);

    expect(mockShowError).toHaveBeenCalledWith('datamanagement:englishNameRequired');
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('should show toast error when Arabic name is missing', () => {
    render(<AddBrandModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('datamanagement:namePlaceholder');
    const enInput = screen.getByPlaceholderText('datamanagement:englishNamePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'Honda' } });
    fireEvent.change(enInput, { target: { value: 'Honda' } });

    const saveButton = screen.getByText('datamanagement:save');
    fireEvent.click(saveButton);

    expect(mockShowError).toHaveBeenCalledWith('datamanagement:arabicNameRequired');
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('should show toast error for duplicate brand name', () => {
    render(<AddBrandModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('datamanagement:namePlaceholder');
    const enInput = screen.getByPlaceholderText('datamanagement:englishNamePlaceholder');
    const arInput = screen.getByPlaceholderText('datamanagement:arabicNamePlaceholder');

    fireEvent.change(nameInput, { target: { value: 'Toyota' } });
    fireEvent.change(enInput, { target: { value: 'NewEnName' } });
    fireEvent.change(arInput, { target: { value: 'اسم عربي' } });

    const saveButton = screen.getByText('datamanagement:save');
    fireEvent.click(saveButton);

    // Should show duplicate brand name error
    expect(mockShowError).toHaveBeenCalled();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('should not show toast when form is valid and call onSave', async () => {
    render(<AddBrandModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('datamanagement:namePlaceholder');
    const enInput = screen.getByPlaceholderText('datamanagement:englishNamePlaceholder');
    const arInput = screen.getByPlaceholderText('datamanagement:arabicNamePlaceholder');

    fireEvent.change(nameInput, { target: { value: 'Honda' } });
    fireEvent.change(enInput, { target: { value: 'Honda' } });
    fireEvent.change(arInput, { target: { value: 'هوندا' } });

    const saveButton = screen.getByText('datamanagement:save');
    fireEvent.click(saveButton);

    expect(mockShowError).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AddBrandModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});
