import { ListingFormData } from '@/types/listings';

// Required fields configuration for each step
const REQUIRED_FIELDS_BY_STEP: Record<number, Array<keyof ListingFormData>> = {
  1: ['make', 'model', 'year'],
  2: ['mileage'],
  3: ['title', 'description', 'images'], // Images are required by backend
  4: ['price', 'contactName', 'contactPhone', 'governorateSlug', 'locationSlug']
};

// Translation metadata for required fields
const REQUIRED_FIELD_I18N: Record<string, { key: string; fallback: string }> = {
  make: { key: 'listings:newListingValidationMakeRequired', fallback: 'Make is required' },
  model: { key: 'listings:newListingValidationModelRequired', fallback: 'Model is required' },
  year: { key: 'listings:newListingValidationYearRequired', fallback: 'Year is required' },
  mileage: { key: 'listings:newListingValidationMileageRequired', fallback: 'Mileage is required' },
  images: { key: 'listings:newListingValidationImagesRequired', fallback: 'At least one image is required' },
  title: { key: 'listings:newListingValidationTitleRequired', fallback: 'Title is required' },
  description: { key: 'listings:newListingValidationDescriptionRequired', fallback: 'Description is required' },
  price: { key: 'listings:newListingValidationPriceRequired', fallback: 'Price is required' },
  contactName: { key: 'listings:newListingValidationContactNameRequired', fallback: 'Contact name is required' },
  contactPhone: { key: 'listings:newListingValidationContactPhoneRequired', fallback: 'Contact phone is required' },
  governorateSlug: { key: 'listings:newListingValidationGovernorateRequired', fallback: 'Governorate is required' },
  locationSlug: { key: 'listings:newListingValidationLocationRequired', fallback: 'Location is required' },
};

/**
 * Calculate step completion status and statistics
 */
export function calculateStepCompletion(
  step: number, 
  formData: ListingFormData,
  t: (key: string, fallback: string) => string
): {
  completionStatus: 'complete' | 'incomplete' | 'not-started';
  missingFieldsCount: number;
  completedFieldsCount: number;
  totalFieldsCount: number;
  missingFieldNames: string[];
} {
  const requiredFields = REQUIRED_FIELDS_BY_STEP[step] || [];
  
  // Use all required fields for completion status
  const fieldsToCheck = requiredFields;
  
  let completedFields = 0;
  const missingFields: string[] = [];
  
  fieldsToCheck.forEach(field => {
    const value = formData[field];
    let hasValue = false;
    
    // Special handling for different field types
    if (field === 'images') {
      // Images field should be an array with at least one item
      hasValue = Array.isArray(value) && value.length > 0;
    } else if (typeof value === 'string') {
      // String fields - check if not empty after trimming
      hasValue = value.trim().length > 0;
    } else {
      // Other fields - check if truthy
      hasValue = Boolean(value);
    }
    
    if (hasValue) {
      completedFields++;
    } else {
      const fieldMeta = REQUIRED_FIELD_I18N[field as string];
      const fieldName = fieldMeta ? t(fieldMeta.key, fieldMeta.fallback) : String(field);
      missingFields.push(fieldName);
    }
  });
  
  const totalFields = fieldsToCheck.length;
  const missingFieldsCount = missingFields.length;
  
  let completionStatus: 'complete' | 'incomplete' | 'not-started';
  
  if (completedFields === 0) {
    completionStatus = 'not-started';
  } else if (missingFieldsCount === 0) {
    completionStatus = 'complete';
  } else {
    completionStatus = 'incomplete';
  }
  
  return {
    completionStatus,
    missingFieldsCount,
    completedFieldsCount: completedFields,
    totalFieldsCount: totalFields,
    missingFieldNames: missingFields
  };
}
