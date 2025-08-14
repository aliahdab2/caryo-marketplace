import { useState, useCallback } from 'react';
import { ListingFormData } from '@/types/listings';
import { processFormFieldValue } from '@/utils/formUtils';

// Simple phone number formatting utility
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit and non-plus characters, keep + at the beginning
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Ensure + only appears at the beginning
  if (cleaned.includes('+')) {
    const plusIndex = cleaned.indexOf('+');
    if (plusIndex === 0) {
      cleaned = '+' + cleaned.substring(1).replace(/\+/g, '');
    } else {
      cleaned = cleaned.replace(/\+/g, '');
    }
  }
  
  return cleaned;
};

// Simple phone number validation utility
const validatePhoneNumber = (phone: string): string | null => {
  if (!phone.trim()) return null; // Allow empty (will be caught by required field validation)
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Basic validation: phone should have reasonable length
  if (digitsOnly.length < 8) {
    return 'Phone number is too short (minimum 8 digits)';
  }
  
  if (digitsOnly.length > 15) {
    return 'Phone number is too long (maximum 15 digits)';
  }
  
  return null; // Valid phone number
};

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
      let processedValue = processFormFieldValue(fieldName, e);
      
      // Special handling for phone numbers
      if (fieldName === 'contactPhone') {
        processedValue = formatPhoneNumber(e);
      }
      
      updateField(fieldName as keyof ListingFormData, processedValue);
    } else if (typeof e === 'object' && 'target' in e) {
      // Event-based update
      const target = e.target;
      const { name, value, type } = target;
      
      let processedValue: unknown = value;
      
      // Handle different input types
      if (type === 'checkbox') {
        processedValue = (target as HTMLInputElement).checked;
      } else if (type === 'number') {
        processedValue = value === '' ? '' : Number(value);
      } else if (name === 'contactPhone') {
        // Special handling for phone numbers
        processedValue = formatPhoneNumber(value);
      } else {
        processedValue = processFormFieldValue(name, value);
      }

      updateField(name as keyof ListingFormData, processedValue as ListingFormData[keyof ListingFormData]);
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

// Export validation utility for use in other components/hooks
export { validatePhoneNumber };

export default useFormState;
