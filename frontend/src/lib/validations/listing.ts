import { z } from 'zod';

// ============================================
// Validation message keys (for i18n)
// ============================================

export const ListingValidationMessages = {
  // Vehicle Identity (Step 1)
  makeRequired: 'validationMakeRequired',
  modelRequired: 'validationModelRequired',
  yearRequired: 'validationYearRequired',
  yearInvalid: 'validationYearInvalid',
  
  // Vehicle Details (Step 2)
  transmissionRequired: 'validationTransmissionRequired',
  fuelTypeRequired: 'validationFuelTypeRequired',
  mileageRequired: 'validationMileageRequired',
  mileageInvalid: 'validationMileageInvalid',
  conditionRequired: 'validationConditionRequired',
  
  // Content & Media (Step 3)
  titleRequired: 'validationTitleRequired',
  titleTooShort: 'validationTitleTooShort',
  titleTooLong: 'validationTitleTooLong',
  descriptionRequired: 'validationDescriptionRequired',
  descriptionTooShort: 'validationDescriptionTooShort',
  imagesRequired: 'validationImagesRequired',
  
  // Pricing & Contact (Step 4)
  priceRequired: 'validationPriceRequired',
  priceInvalid: 'validationPriceInvalid',
  priceMin: 'validationPriceMin',
  currencyRequired: 'validationCurrencyRequired',
  governorateRequired: 'validationGovernorateRequired',
  locationRequired: 'validationLocationRequired',
  contactNameRequired: 'validationContactNameRequired',
  contactPhoneRequired: 'validationContactPhoneRequired',
  contactPhoneInvalid: 'validationContactPhoneInvalid',
  contactEmailInvalid: 'validationContactEmailInvalid',
} as const;

// ============================================
// Shared field schemas
// ============================================

// Year validation (current year + 1 for upcoming models)
const currentYear = new Date().getFullYear();
const minYear = 1900;
const maxYear = currentYear + 1;

export const yearSchema = z
  .string()
  .min(1, ListingValidationMessages.yearRequired)
  .refine((val) => {
    const year = parseInt(val, 10);
    return !isNaN(year) && year >= minYear && year <= maxYear;
  }, ListingValidationMessages.yearInvalid);

export const mileageSchema = z
  .string()
  .min(1, ListingValidationMessages.mileageRequired)
  .refine((val) => {
    const mileage = parseInt(val.replace(/,/g, ''), 10);
    return !isNaN(mileage) && mileage >= 0;
  }, ListingValidationMessages.mileageInvalid);

export const priceSchema = z
  .string()
  .min(1, ListingValidationMessages.priceRequired)
  .refine((val) => {
    const price = parseFloat(val.replace(/,/g, ''));
    return !isNaN(price) && price > 0;
  }, ListingValidationMessages.priceInvalid);

export const phoneSchema = z
  .string()
  .min(1, ListingValidationMessages.contactPhoneRequired)
  .regex(/^[\d\s\-+()]+$/, ListingValidationMessages.contactPhoneInvalid);

export const optionalEmailSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val || val.length === 0) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }, ListingValidationMessages.contactEmailInvalid);

// ============================================
// Step 1: Vehicle Identity Schema
// ============================================

export const step1Schema = z.object({
  make: z.string().min(1, ListingValidationMessages.makeRequired),
  model: z.string().min(1, ListingValidationMessages.modelRequired),
  year: yearSchema,
});

export type Step1FormData = z.infer<typeof step1Schema>;

// ============================================
// Step 2: Vehicle Details Schema
// ============================================

export const step2Schema = z.object({
  transmission: z.string().min(1, ListingValidationMessages.transmissionRequired),
  fuelType: z.string().min(1, ListingValidationMessages.fuelTypeRequired),
  mileage: mileageSchema,
  condition: z.string().min(1, ListingValidationMessages.conditionRequired),
  // Optional fields
  engine: z.string().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export type Step2FormData = z.infer<typeof step2Schema>;

// ============================================
// Step 3: Content & Media Schema
// ============================================

export const step3Schema = z.object({
  title: z
    .string()
    .min(1, ListingValidationMessages.titleRequired)
    .min(10, ListingValidationMessages.titleTooShort)
    .max(100, ListingValidationMessages.titleTooLong),
  description: z
    .string()
    .min(1, ListingValidationMessages.descriptionRequired)
    .min(20, ListingValidationMessages.descriptionTooShort),
  // Images validation - at least 1 image required
  images: z.array(z.any()).optional(),
  existingImageUrls: z.array(z.string()).optional(),
}).refine((data) => {
  const hasNewImages = data.images && data.images.length > 0;
  const hasExistingImages = data.existingImageUrls && data.existingImageUrls.length > 0;
  return hasNewImages || hasExistingImages;
}, {
  message: ListingValidationMessages.imagesRequired,
  path: ['images'],
});

export type Step3FormData = z.infer<typeof step3Schema>;

// ============================================
// Step 4: Pricing & Contact Schema
// ============================================

export const step4Schema = z.object({
  price: priceSchema,
  currency: z.string().min(1, ListingValidationMessages.currencyRequired),
  governorateSlug: z.string().min(1, ListingValidationMessages.governorateRequired),
  locationSlug: z.string().min(1, ListingValidationMessages.locationRequired),
  contactName: z.string().min(1, ListingValidationMessages.contactNameRequired),
  contactPhone: phoneSchema,
  contactEmail: optionalEmailSchema,
  contactPreference: z.enum(['phone', 'email', 'both']).optional(),
});

export type Step4FormData = z.infer<typeof step4Schema>;

// ============================================
// Full Listing Schema (all steps combined)
// ============================================

export const listingSchema = z.object({
  // Step 1
  make: z.string().min(1, ListingValidationMessages.makeRequired),
  model: z.string().min(1, ListingValidationMessages.modelRequired),
  year: yearSchema,
  // Step 2
  transmission: z.string().min(1, ListingValidationMessages.transmissionRequired),
  fuelType: z.string().min(1, ListingValidationMessages.fuelTypeRequired),
  mileage: mileageSchema,
  condition: z.string().min(1, ListingValidationMessages.conditionRequired),
  engine: z.string().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  features: z.array(z.string()).optional(),
  // Step 3
  title: z
    .string()
    .min(1, ListingValidationMessages.titleRequired)
    .min(10, ListingValidationMessages.titleTooShort)
    .max(100, ListingValidationMessages.titleTooLong),
  description: z
    .string()
    .min(1, ListingValidationMessages.descriptionRequired)
    .min(20, ListingValidationMessages.descriptionTooShort),
  // Step 4
  price: priceSchema,
  currency: z.string().min(1, ListingValidationMessages.currencyRequired),
  governorateSlug: z.string().min(1, ListingValidationMessages.governorateRequired),
  locationSlug: z.string().min(1, ListingValidationMessages.locationRequired),
  contactName: z.string().min(1, ListingValidationMessages.contactNameRequired),
  contactPhone: phoneSchema,
  contactEmail: optionalEmailSchema,
  contactPreference: z.enum(['phone', 'email', 'both']).optional(),
});

export type ListingSchemaData = z.infer<typeof listingSchema>;

// ============================================
// Step validation helper
// ============================================

export const stepSchemas = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
} as const;

/**
 * Validate a specific step of the listing form
 * @param step - Step number (1-4)
 * @param data - Form data to validate
 * @returns Validation result with success/error
 */
export function validateListingStep(step: 1 | 2 | 3 | 4, data: Record<string, unknown>) {
  const schema = stepSchemas[step];
  return schema.safeParse(data);
}

/**
 * Validate the entire listing form
 * @param data - Complete form data
 * @returns Validation result with success/error
 */
export function validateListing(data: Record<string, unknown>) {
  return listingSchema.safeParse(data);
}

/**
 * Get validation errors as a flat object for form display
 * @param result - Zod parse result
 * @returns Object with field names as keys and error messages as values
 */
export function getValidationErrors(result: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  if (result.success) return {};
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (path && !errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return errors;
}
