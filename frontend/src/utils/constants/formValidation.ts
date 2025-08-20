import { ListingFormData } from '@/types/listings';

/**
 * Centralized form validation constants
 * Shared between formUtils.ts and stepCompletionUtils.ts
 */

// Required fields configuration for each step
export const REQUIRED_FIELDS_BY_STEP: Record<number, Array<keyof ListingFormData>> = {
  1: ['make', 'model', 'year'],
  2: ['mileage'],
  3: ['title', 'description', 'images'], // Images are required by backend
  4: ['price', 'contactName', 'contactPhone', 'governorateSlug', 'locationSlug']
};

// Fields that block navigation to the next step
export const BLOCKING_REQUIRED_FIELDS_BY_STEP: Record<number, Array<keyof ListingFormData>> = {
  1: ['make', 'model', 'year'], // Must have vehicle identity to proceed
  2: [], // Mileage not required for navigation, only for final submission
  3: ['title', 'description', 'images'], // Content fields required for navigation
  4: ['price', 'contactName', 'contactPhone', 'governorateSlug', 'locationSlug'] // Final step requirements
};

// Translation metadata for required fields
export const REQUIRED_FIELD_I18N: Record<string, { key: string; fallback: string }> = {
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
