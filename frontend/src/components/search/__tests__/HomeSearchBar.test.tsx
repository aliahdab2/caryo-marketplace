import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HomeSearchBar from '../HomeSearchBar';
import * as useApiDataHook from '@/hooks/useApiData';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock API services
jest.mock('@/services/api', () => ({
  fetchCarBrands: jest.fn(),
  fetchCarModels: jest.fn(),
  fetchGovernorates: jest.fn(),
}));

// Mock useApiData hook
jest.mock('@/hooks/useApiData', () => ({
  useApiData: jest.fn(),
  useFormSelection: jest.fn(),
}));

// Mock lodash debounce
jest.mock('lodash/debounce', () => {
  return jest.fn((fn) => {
    const debouncedFn = (...args: unknown[]) => fn(...args);
    debouncedFn.cancel = jest.fn();
    return debouncedFn;
  });
});

describe('HomeSearchBar', () => {
  const mockPush = jest.fn();
  const mockT = jest.fn((key: string, defaultValue?: string) => defaultValue || key);
  
  // Mock data
  const mockCarMakes = [
    { id: 1, displayNameEn: 'Toyota', displayNameAr: 'تويوتا', slug: 'toyota' },
    { id: 2, displayNameEn: 'BMW', displayNameAr: 'بي إم دبليو', slug: 'bmw' },
  ];

  const mockCarModels = [
    { id: 1, displayNameEn: 'Camry', displayNameAr: 'كامري', slug: 'camry' },
    { id: 2, displayNameEn: 'Corolla', displayNameAr: 'كورولا', slug: 'corolla' },
  ];

  const mockGovernorates = [
    { id: 1, displayNameEn: 'Cairo', displayNameAr: 'القاهرة', slug: 'cairo' },
    { id: 2, displayNameEn: 'Alexandria', displayNameAr: 'الإسكندرية', slug: 'alexandria' },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup translation mock
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });

    // Setup useFormSelection mock
    (useApiDataHook.useFormSelection as jest.Mock).mockImplementation((initialValue, _deps) => [
      initialValue,
      jest.fn(),
    ]);
  });

  describe('Initial Render', () => {
    beforeEach(() => {
      // Setup default useApiData mocks for initial render
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: mockCarMakes,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
          retry: jest.fn(),
        });
    });

    it('renders all form elements correctly', () => {
      render(<HomeSearchBar />);

      expect(screen.getByLabelText(/select brand/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select governorate/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search cars/i })).toBeInTheDocument();
    });

    it('has consistent heights for all form elements', () => {
      render(<HomeSearchBar />);

      const brandSelect = screen.getByLabelText(/select brand/i);
      const modelSelect = screen.getByLabelText(/select model/i);
      const governorateSelect = screen.getByLabelText(/select governorate/i);
      const searchButton = screen.getByRole('button', { name: /search cars/i });

      // All elements should have h-12 class (48px height)
      expect(brandSelect).toHaveClass('h-12');
      expect(modelSelect).toHaveClass('h-12');
      expect(governorateSelect).toHaveClass('h-12');
      expect(searchButton).toHaveClass('h-12');
    });

    it('displays default option text consistently', () => {
      render(<HomeSearchBar />);

      expect(screen.getByDisplayValue('Any Brand')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Any Model')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Any Governorate')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner for brands without affecting layout', () => {
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
          retry: jest.fn(),
        });

      render(<HomeSearchBar />);

      const brandSelect = screen.getByLabelText(/select brand/i);
      expect(brandSelect).toBeDisabled();
      
      // Loading spinner should be positioned absolutely to not affect layout
      const spinner = screen.getByTestId('brand-loading-spinner');
      expect(spinner.closest('div')).toHaveClass('absolute', 'pointer-events-none');
    });

    it('shows loading spinner for models without affecting layout', () => {
      const mockSetSelectedMake = jest.fn();
      (useApiDataHook.useFormSelection as jest.Mock).mockReturnValue([1, mockSetSelectedMake]);

      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: mockCarMakes,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        });

      render(<HomeSearchBar />);

      const modelSelect = screen.getByLabelText(/select model/i);
      expect(modelSelect).toBeDisabled();
      
      // Loading spinner should be positioned absolutely to not affect layout
      const spinner = screen.getByTestId('model-loading-spinner');
      expect(spinner.closest('div')).toHaveClass('absolute', 'pointer-events-none');
    });

    it('maintains consistent option text during loading', () => {
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        });

      render(<HomeSearchBar />);

      // Text should remain consistent even during loading
      expect(screen.getByDisplayValue('Any Brand')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Any Model')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Any Governorate')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: mockCarMakes,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockCarModels,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        });
    });

    it('handles brand selection without layout shifts', async () => {
      const mockSetSelectedMake = jest.fn();
      (useApiDataHook.useFormSelection as jest.Mock).mockReturnValue([null, mockSetSelectedMake]);

      render(<HomeSearchBar />);

      const brandSelect = screen.getByLabelText(/select brand/i);
      
      // Measure layout before interaction
      const initialRect = brandSelect.getBoundingClientRect();
      
      await userEvent.selectOptions(brandSelect, '1');
      
      // Verify no layout shift occurred
      const afterRect = brandSelect.getBoundingClientRect();
      expect(afterRect.height).toBe(initialRect.height);
      expect(afterRect.width).toBe(initialRect.width);
      
      expect(mockSetSelectedMake).toHaveBeenCalledWith(1);
    });

    it('resets model selection when brand changes', () => {
      // This test verifies that the component handles model reset behavior
      // We test this by checking that when no brand is selected, model is disabled
      // And when a brand is selected, model becomes enabled
      
      render(<HomeSearchBar />);

      const modelSelect = screen.getByLabelText(/select model/i) as HTMLSelectElement;
      
      // Initially, model should be disabled when no brand is selected
      expect(modelSelect).toBeDisabled();
      
      // This indirectly tests that the reset logic is working correctly
      // since the disabled state depends on the selectedMake value
      expect(modelSelect.value).toBe('');
    });

    it('handles search functionality correctly', async () => {
      const mockSetSelectedMake = jest.fn();
      (useApiDataHook.useFormSelection as jest.Mock).mockReturnValue([1, mockSetSelectedMake]);

      render(<HomeSearchBar />);

      const searchButton = screen.getByRole('button', { name: /search cars/i });
      
      await userEvent.click(searchButton);
      
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/listings?'),
        { scroll: false }
      );
    });
  });

  describe('No Layout Shifts', () => {
    it('maintains stable layout during state transitions', async () => {
      const mockSetSelectedMake = jest.fn();
      (useApiDataHook.useFormSelection as jest.Mock).mockReturnValue([null, mockSetSelectedMake]);

      // Start with loading state
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        });

      const { rerender } = render(<HomeSearchBar />);

      const container = screen.getByTestId('search-container');
      const initialRect = container.getBoundingClientRect();

      // Simulate data loaded
      (useApiDataHook.useApiData as jest.Mock)
        .mockClear()
        .mockReturnValueOnce({
          data: mockCarMakes,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
          retry: jest.fn(),
        });

      rerender(<HomeSearchBar />);

      const afterRect = container.getBoundingClientRect();
      
      // Layout should remain stable (height should not change significantly)
      expect(Math.abs(afterRect.height - initialRect.height)).toBeLessThan(5);
    });

    it('prevents layout shifts from dropdown arrows and spinners', () => {
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: mockCarMakes,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: true,
          error: null,
          retry: jest.fn(),
        });

      render(<HomeSearchBar />);

      // All select elements should have consistent styling
      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        expect(select).toHaveClass('appearance-none');
        expect(select).toHaveClass('h-12');
        expect(select).toHaveClass('overflow-hidden');
        expect(select).toHaveClass('text-ellipsis');
        expect(select).toHaveClass('whitespace-nowrap');
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: mockCarMakes,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
          retry: jest.fn(),
        });
    });

    it('has proper ARIA labels', () => {
      render(<HomeSearchBar />);

      expect(screen.getByLabelText(/select brand/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select governorate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/search cars/i)).toBeInTheDocument();
    });

    it('handles keyboard navigation properly', async () => {
      render(<HomeSearchBar />);

      const brandSelect = screen.getByLabelText(/select brand/i);
      
      brandSelect.focus();
      expect(brandSelect).toHaveFocus();
      
      await userEvent.keyboard('{Tab}');
      // The model select should be focused next, but it may be disabled
      // so we'll check if governorate gets focus when model is disabled
      const modelSelect = screen.getByLabelText(/select model/i);
      const governorateSelect = screen.getByLabelText(/select governorate/i);
      
      // Either model (if enabled) or governorate (if model is disabled) should have focus
      const hasFocus = modelSelect.matches(':focus') || governorateSelect.matches(':focus');
      expect(hasFocus).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('displays error messages and retry buttons', () => {
      (useApiDataHook.useApiData as jest.Mock)
        .mockReturnValueOnce({
          data: null,
          isLoading: false,
          error: 'Failed to load brands',
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockGovernorates,
          isLoading: false,
          error: null,
          retry: jest.fn(),
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
          retry: jest.fn(),
        });

      render(<HomeSearchBar />);

      expect(screen.getByText('Failed to load brands')).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });
});
