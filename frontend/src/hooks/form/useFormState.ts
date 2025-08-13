import { useState, useCallback, useMemo } from 'react';
import { ListingFormData } from '@/types/listings';
import { processFormFieldValue } from '@/utils/formUtils';
import { createLogger } from '@/utils/logger';

interface UseFormStateProps {
  initialData: Partial<ListingFormData>;
  defaultCurrency?: string;
  debugEnabled?: boolean;
  onFormChange?: (formData: ListingFormData) => void;
}

interface UseFormStateReturn {
  formData: ListingFormData;
  setFormData: (data: ListingFormData | ((prev: ListingFormData) => ListingFormData)) => void;
  updateField: (field: keyof ListingFormData, value: any) => void;
  updateFields: (fields: Partial<ListingFormData>) => void;
  resetForm: () => void;
  resetField: (field: keyof ListingFormData) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, fieldName?: string) => void;
  getFieldValue: <K extends keyof ListingFormData>(field: K) => ListingFormData[K];
  hasChanges: () => boolean;
}

const DEFAULT_CURRENCY = 'SYP';

// Logger (gated by env and prop)
const createFormStateLogger = (enabled: boolean) => createLogger({
  enabled: enabled && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_FORM_STATE === 'true'),
  level: 'debug',
  prefix: 'FORM_STATE'
});

/**
 * Custom hook for managing form state with enhanced functionality
 * 
 * Features:
 * - Type-safe form state management
 * - Field-level updates with processing
 * - Change tracking
 * - Reset functionality
 * - Optimized change handlers
 * 
 * @param initialData - Initial form data
 * @param defaultCurrency - Default currency (default: 'SYP')
 * @param debugEnabled - Enable debug logging (default: false)
 * @param onFormChange - Callback when form data changes
 */
export const useFormState = ({
  initialData,
  defaultCurrency = DEFAULT_CURRENCY,
  debugEnabled = false,
  onFormChange
}: UseFormStateProps): UseFormStateReturn => {
  const logger = useMemo(() => createFormStateLogger(debugEnabled), [debugEnabled]);

  // Create initial form data with defaults
  const createInitialFormData = useCallback((): ListingFormData => ({
    id: initialData.id || "",
    title: initialData.title || "",
    description: initialData.description || "",
    make: initialData.make || "",
    model: initialData.model || "",
    year: initialData.year || "",
    price: initialData.price || "",
    currency: initialData.currency || defaultCurrency,
    condition: initialData.condition || "used",
    mileage: initialData.mileage || "",
    engine: initialData.engine || "",
    color: initialData.color || "",
    exteriorColor: initialData.exteriorColor || "",
    interiorColor: initialData.interiorColor || "",
    transmission: initialData.transmission || "",
    fuelType: initialData.fuelType || "",
    features: initialData.features || [],
    categoryId: initialData.categoryId || "",
    location: initialData.location || "",
    governorateSlug: initialData.governorateSlug || "",
    locationSlug: initialData.locationSlug || "",
    governorateId: initialData.governorateId,
    locationId: initialData.locationId,
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
    contactName: initialData.contactName || "",
    contactPhone: initialData.contactPhone || "",
    contactEmail: initialData.contactEmail || "",
    contactPreference: initialData.contactPreference || "phone",
    images: initialData.images || [],
    videos: initialData.videos || [],
    videoUrls: initialData.videoUrls || [],
    existingImageUrls: initialData.existingImageUrls || [],
    existingVideoUrls: initialData.existingVideoUrls || [],
    status: initialData.status || 'active'
  }), [initialData, defaultCurrency]);

  // Store initial data for change comparison
  const initialFormData = useMemo(() => createInitialFormData(), [createInitialFormData]);
  
  // Form data state
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);

  // Update a single field
  const updateField = useCallback((field: keyof ListingFormData, value: any) => {
    logger.debug(`Updating field ${String(field)}:`, value);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      onFormChange?.(newData);
      return newData;
    });
  }, [logger, onFormChange]);

  // Update multiple fields at once
  const updateFields = useCallback((fields: Partial<ListingFormData>) => {
    logger.debug('Updating multiple fields:', fields);
    
    setFormData(prev => {
      const newData = { ...prev, ...fields };
      onFormChange?.(newData);
      return newData;
    });
  }, [logger, onFormChange]);

  // Reset entire form to initial values
  const resetForm = useCallback(() => {
    logger.debug('Resetting form to initial values');
    const resetData = createInitialFormData();
    setFormData(resetData);
    onFormChange?.(resetData);
  }, [logger, createInitialFormData, onFormChange]);

  // Reset a specific field to its initial value
  const resetField = useCallback((field: keyof ListingFormData) => {
    logger.debug(`Resetting field ${String(field)} to initial value`);
    const initialValue = initialFormData[field];
    updateField(field, initialValue);
  }, [logger, initialFormData, updateField]);

  // Enhanced change handler that supports both events and direct values
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
    fieldName?: string
  ) => {
    if (typeof e === 'string' && fieldName) {
      // Direct value update
      logger.debug(`Direct value update for ${fieldName}:`, e);
      const processedValue = processFormFieldValue(fieldName, e);
      updateField(fieldName as keyof ListingFormData, processedValue);
    } else if (typeof e === 'object' && 'target' in e) {
      // Event-based update
      const { name, value, type, checked } = e.target;
      logger.debug(`Event-based update for ${name}:`, { value, type, checked });
      
      let processedValue: any = value;
      
      // Handle different input types
      if (type === 'checkbox') {
        processedValue = checked;
      } else if (type === 'number') {
        processedValue = value === '' ? '' : value;
      } else {
        processedValue = processFormFieldValue(name, value);
      }
      
      updateField(name as keyof ListingFormData, processedValue);
    } else {
      logger.error('Invalid handleChange parameters:', { e, fieldName });
    }
  }, [logger, updateField]);

  // Get the value of a specific field
  const getFieldValue = useCallback(<K extends keyof ListingFormData>(field: K): ListingFormData[K] => {
    return formData[field];
  }, [formData]);

  // Check if form has any changes from initial state
  const hasChanges = useCallback((): boolean => {
    // Deep comparison of form data vs initial data
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    logger.debug(`Form has changes: ${hasChanged}`);
    return hasChanged;
  }, [formData, initialFormData, logger]);

  return {
    formData,
    setFormData: useCallback((data: ListingFormData | ((prev: ListingFormData) => ListingFormData)) => {
      if (typeof data === 'function') {
        setFormData(prev => {
          const newData = data(prev);
          onFormChange?.(newData);
          return newData;
        });
      } else {
        setFormData(data);
        onFormChange?.(data);
      }
    }, [onFormChange]),
    updateField,
    updateFields,
    resetForm,
    resetField,
    handleChange,
    getFieldValue,
    hasChanges
  };
};

export default useFormState;
