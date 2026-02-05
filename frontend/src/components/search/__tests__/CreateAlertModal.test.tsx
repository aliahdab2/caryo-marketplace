import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAlertModal from '../CreateAlertModal';
import { createSavedSearch } from '@/services/savedSearches';
import { fetchCarReferenceData } from '@/services/api';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' }
  })),
}));

jest.mock('@/services/savedSearches', () => ({
  createSavedSearch: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  fetchCarReferenceData: jest.fn(),
}));

jest.mock('@/hooks/useApiData', () => ({
  useApiData: jest.fn(() => ({
    data: { transmissions: [], carConditions: [] },
    loading: false,
    error: null,
  })),
}));

jest.mock('@/components/ui/SuccessAlert', () => {
  return function SuccessAlert({ visible, message }: { visible: boolean; message: string }) {
    return visible ? <div data-testid="success-alert">{message}</div> : null;
  };
});

describe('CreateAlertModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    filters: {},
    searchQuery: '',
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchCarReferenceData as jest.Mock).mockResolvedValue({
      transmissions: [],
      carConditions: [],
    });
  });

  it('should populate both nameEn and nameAr with the alert name on submit', async () => {
    (createSavedSearch as jest.Mock).mockResolvedValue({
      id: '1',
      nameEn: 'My Alert',
      nameAr: 'My Alert',
      wasUpdated: false,
    });

    render(<CreateAlertModal {...defaultProps} />);

    // Change the alert name
    const input = screen.getByPlaceholderText('Enter a name for your alert');
    fireEvent.change(input, { target: { value: 'My Alert' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Create Alert' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createSavedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          nameEn: 'My Alert',
          nameAr: 'My Alert',
        })
      );
    });
  });

  it('should trim whitespace from alert name for both nameEn and nameAr', async () => {
    (createSavedSearch as jest.Mock).mockResolvedValue({
      id: '1',
      nameEn: 'Trimmed Name',
      nameAr: 'Trimmed Name',
      wasUpdated: false,
    });

    render(<CreateAlertModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter a name for your alert');
    fireEvent.change(input, { target: { value: '  Trimmed Name  ' } });

    const submitButton = screen.getByRole('button', { name: 'Create Alert' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createSavedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          nameEn: 'Trimmed Name',
          nameAr: 'Trimmed Name',
        })
      );
    });
  });

  it('should set nameAr with Arabic text when user types in Arabic', async () => {
    (createSavedSearch as jest.Mock).mockResolvedValue({
      id: '1',
      nameEn: 'سيارات في دمشق',
      nameAr: 'سيارات في دمشق',
      wasUpdated: false,
    });

    render(<CreateAlertModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter a name for your alert');
    fireEvent.change(input, { target: { value: 'سيارات في دمشق' } });

    const submitButton = screen.getByRole('button', { name: 'Create Alert' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createSavedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          nameEn: 'سيارات في دمشق',
          nameAr: 'سيارات في دمشق',
        })
      );
    });
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <CreateAlertModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});
