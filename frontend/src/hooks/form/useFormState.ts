import { useState, useCallback } from 'react';
import { ListingFormData } from '@/types/listings';
import { processFormFieldValue } from '@/utils/formUtils';

// Phone number formatting utility
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Support for Jordan (+962) and Syria (+963) phone number patterns
  // Jordan Mobile: +962 7X XXX XXXX or 07X XXX XXXX
  // Jordan Landline: +962 X XXX XXXX or 0X XXX XXXX
  // Syria Mobile: +963 9X XXX XXXX or 09X XXX XXXX
  // Syria Landline: +963 XX XXX XXXX or 0XX XXX XXXX
  
  if (digitsOnly.length === 0) return '';
  
  // Handle international format starting with 962 (Jordan)
  if (digitsOnly.startsWith('962')) {
    const localNumber = digitsOnly.substring(3);
    if (localNumber.length === 0) return '+962 ';
    if (localNumber.length <= 1) return `+962 ${localNumber}`;
    if (localNumber.length <= 4) return `+962 ${localNumber.substring(0, 1)} ${localNumber.substring(1)}`;
    if (localNumber.length <= 7) return `+962 ${localNumber.substring(0, 1)} ${localNumber.substring(1, 4)} ${localNumber.substring(4)}`;
    return `+962 ${localNumber.substring(0, 1)} ${localNumber.substring(1, 4)} ${localNumber.substring(4, 8)}`;
  }
  
  // Handle international format starting with 963 (Syria)
  if (digitsOnly.startsWith('963')) {
    const localNumber = digitsOnly.substring(3);
    if (localNumber.length === 0) return '+963 ';
    if (localNumber.length <= 1) return `+963 ${localNumber}`;
    if (localNumber.length <= 2) return `+963 ${localNumber}`;
    if (localNumber.length <= 5) return `+963 ${localNumber.substring(0, 2)} ${localNumber.substring(2)}`;
    if (localNumber.length <= 8) return `+963 ${localNumber.substring(0, 2)} ${localNumber.substring(2, 5)} ${localNumber.substring(5)}`;
    return `+963 ${localNumber.substring(0, 2)} ${localNumber.substring(2, 5)} ${localNumber.substring(5, 9)}`;
  }
  
  // Handle local format starting with 0
  if (digitsOnly.startsWith('0')) {
    if (digitsOnly.length === 1) return '0';
    if (digitsOnly.length <= 2) return digitsOnly;
    if (digitsOnly.length <= 5) return `${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2)}`;
    if (digitsOnly.length <= 8) return `${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 5)} ${digitsOnly.substring(5)}`;
    return `${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 5)} ${digitsOnly.substring(5, 9)}`;
  }
  
  // Handle numbers without country code or leading zero (assume local mobile)
  if (digitsOnly.length <= 1) return digitsOnly;
  if (digitsOnly.length <= 4) return `${digitsOnly.substring(0, 1)} ${digitsOnly.substring(1)}`;
  if (digitsOnly.length <= 7) return `${digitsOnly.substring(0, 1)} ${digitsOnly.substring(1, 4)} ${digitsOnly.substring(4)}`;
  return `${digitsOnly.substring(0, 1)} ${digitsOnly.substring(1, 4)} ${digitsOnly.substring(4, 8)}`;
};

// Phone number validation utility
const validatePhoneNumber = (phone: string): string | null => {
  if (!phone.trim()) return null; // Allow empty (will be caught by required field validation)
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Jordan phone number validation (+962)
  // Mobile: +962 7X XXX XXXX (8 digits after 962)
  // Landline: +962 X XXX XXXX (8 digits after 962)
  if (digitsOnly.startsWith('962')) {
    const localNumber = digitsOnly.substring(3);
    if (localNumber.length !== 8) {
      return 'Invalid Jordan phone number format. Expected: +962 X XXX XXXX (8 digits after country code)';
    }
    // Check if mobile number starts with 7
    if (localNumber.startsWith('7') && localNumber.length === 8) {
      return null; // Valid Jordan mobile
    }
    // Check if landline (other digits)
    if (!localNumber.startsWith('7') && localNumber.length === 8) {
      return null; // Valid Jordan landline
    }
    return 'Invalid Jordan phone number. Mobile numbers should start with 7.';
  }
  
  // Syria phone number validation (+963)
  // Mobile: +963 9X XXX XXXX (9 digits after 963)
  // Landline: +963 XX XXX XXXX (9 digits after 963)
  if (digitsOnly.startsWith('963')) {
    const localNumber = digitsOnly.substring(3);
    if (localNumber.length !== 9) {
      return 'Invalid Syria phone number format. Expected: +963 XX XXX XXXX (9 digits after country code)';
    }
    // Check if mobile number starts with 9
    if (localNumber.startsWith('9')) {
      return null; // Valid Syria mobile
    }
    // Check if landline (starts with area code like 11, 21, 31, etc.)
    const areaCode = localNumber.substring(0, 2);
    const validAreaCodes = ['11', '21', '31', '41', '51', '52', '53', '71', '81', '91'];
    if (validAreaCodes.includes(areaCode)) {
      return null; // Valid Syria landline
    }
    return 'Invalid Syria phone number. Mobile should start with 9, landline should start with valid area code.';
  }
  
  // Local format starting with 0 (could be Jordan or Syria)
  if (digitsOnly.startsWith('0')) {
    // Jordan local: 07X XXX XXXX (9 digits) or 0X XXX XXXX (8-9 digits)
    // Syria local: 09X XXX XXXX (10 digits) or 0XX XXX XXXX (10 digits)
    if (digitsOnly.length >= 8 && digitsOnly.length <= 10) {
      return null; // Accept local format, could be either country
    }
    return 'Invalid local phone number format. Expected 8-10 digits starting with 0.';
  }
  
  // If no country code or leading zero, should be 8-9 digits
  if (digitsOnly.length >= 8 && digitsOnly.length <= 9) {
    return null; // Accept as local number
  }
  
  return 'Phone number should be 8-9 digits or include country code (+962 for Jordan, +963 for Syria)';
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
      
      let processedValue: any = value;
      
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

// Export validation utility for use in other components/hooks
export { validatePhoneNumber };

export default useFormState;
