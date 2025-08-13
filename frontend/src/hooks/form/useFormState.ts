import { useState, useCallback } from 'react';
import { ListingFormData } from '@/types/listings';
import { processFormFieldValue } from '@/utils/formUtils';

interface UseFormStateOptions {
  initialData: Partial<ListingFormData>;
  onFormChange?: (formData: ListingFormData) => void;
}

interface UseFormStateReturn {
  formData: ListingFormData;
  setFormData: (data: ListingFormData | ((prev: ListingFormData) => ListingFormData)) => void;
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  updateFields: (fields: Partial<ListingFormData>) => void;
  resetForm: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, fieldName?: string) => void;
  getFieldValue: <K extends keyof ListingFormData>(field: K) => ListingFormData[K];
  hasFormChanges: () => boolean;
}

// Default form data
const getDefaultFormData = (): ListingFormData => ({
  title: '',
  description: '',
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  price: '',
  currency: 'JOD',
  condition: '',
  mileage: '',
  engine: '',
  color: '',
  exteriorColor: '',
  interiorColor: '',
  transmission: '',
  fuelType: '',
  features: [],
  governorateSlug: '',
  locationSlug: '',
  state: '',
  zipCode: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  contactPreference: '',
  images: [],
  videos: [],
  videoUrls: [],
  status: '' as 'active' | 'expired' | 'pending' | 'sold' | ''
});

/**
 * Custom hook for form state management
 * 
 * Features:
 * - Centralized form data state
 * - Field update utilities
 * - Form change detection
 * - Event handling for form inputs
 * - Reset functionality
 * 
 * @param options Configuration options
 * @returns Form state utilities
 */
export const useFormState = ({
  initialData,
  onFormChange
}: UseFormStateOptions): UseFormStateReturn => {
  // Initialize form data with defaults merged with initial data
  const [formData, setFormData] = useState<ListingFormData>(() => ({
    ...getDefaultFormData(),
    ...initialData
  }));

  // Store initial data for change detection
  const [initialFormData] = useState<ListingFormData>(() => ({
    ...getDefaultFormData(),
    ...initialData
  }));

  // Update individual field
  const updateField = useCallback(<K extends keyof ListingFormData>(
    field: K, 
    value: ListingFormData[K]
  ) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      onFormChange?.(newData);
      return newData;
    });
  }, [onFormChange]);

  // Update multiple fields
  const updateFields = useCallback((fields: Partial<ListingFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...fields };
      onFormChange?.(newData);
      return newData;
    });
  }, [onFormChange]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    const resetData = { ...getDefaultFormData(), ...initialData };
    setFormData(resetData);
    onFormChange?.(resetData);
  }, [initialData, onFormChange]);

  // Handle form input changes
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, 
    fieldName?: string
  ) => {
    if (typeof e === 'string' && fieldName) {
      // Direct value update
      const processedValue = processFormFieldValue(fieldName, e);
      updateField(fieldName as keyof ListingFormData, processedValue);
    } else if (typeof e === 'object' && 'target' in e) {
      // Event-based update
      const target = e.target;
      const { name, value, type } = target;
      
      let processedValue: any = value;
      
      // Handle different input types
      if (type === 'checkbox') {
        processedValue = (target as HTMLInputElement).checked;
      } else if (type === 'number') {
        processedValue = value === '' ? '' : Number(value);
      } else {
        processedValue = processFormFieldValue(name, value);
      }

      updateField(name as keyof ListingFormData, processedValue);
    }
  }, [updateField]);

  // Get field value
  const getFieldValue = useCallback(<K extends keyof ListingFormData>(field: K): ListingFormData[K] => {
    return formData[field];
  }, [formData]);

  // Check if form has changes
  const hasFormChanges = useCallback((): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    handleChange,
    getFieldValue,
    hasFormChanges
  };
};

export default useFormState;
