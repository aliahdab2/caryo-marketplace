import { ListingFormData } from '@/types/listings';
import { REQUIRED_FIELDS_BY_STEP, REQUIRED_FIELD_I18N } from '@/utils/constants/formValidation';

/**
 * Calculate step completion status and statistics
 * Memoized for performance optimization
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
  const requiredFields = REQUIRED_FIELDS_BY_STEP[step];
  
  // Validate step number
  if (!requiredFields) {
    console.warn(`Invalid step number: ${step}. Returning default completion status.`);
    return {
      completionStatus: 'not-started',
      missingFieldsCount: 0,
      completedFieldsCount: 0,
      totalFieldsCount: 0,
      missingFieldNames: []
    };
  }
  
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
