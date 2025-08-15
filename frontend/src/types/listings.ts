import { Lang } from './i18n';

/**
 * Interface for API filtering and querying
 */
export interface ListingFilters {
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  location?: string;
  brand?: string;
  model?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sellerTypeId?: number;
}

/**
 * Interface for location details from the backend
 */
export interface LocationDetails {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  region: string;
  countryCode: string;
}

/**
 * Interface for governorate details from the backend
 */
export interface GovernorateDetails {
  id: number;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

/**
 * Interface for listing media from the backend
 */
export interface ListingMedia {
  id: number;
  url: string;
  contentType: string;
  isPrimary: boolean;
}

/**
 * Interface for API listing item response structure 
 */
export interface ApiListingItem {
  id: number;
  title: string;
  
  // Enhanced V2 fields - Complete objects with IDs, slugs, and localized names
  brand?: { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; };
  model?: { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; };
  // V2: Backend always provides complete objects (no more string fallbacks)
  transmission?: { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; };
  fuelType?: { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; };
  
  // Deprecated string fields (maintained for backward compatibility)
  brandNameEn?: string;
  brandNameAr?: string;
  modelNameEn?: string;
  modelNameAr?: string;
  
  modelYear: number;
  mileage: number;
  price: number;
  currency?: string; // Currency code for the listing price
  locationDetails: LocationDetails | null;
  governorateDetails?: GovernorateDetails;
  governorateNameEn?: string;
  governorateNameAr?: string;
  description: string;
  media: ListingMedia[];
  approved: boolean;
  sellerId: number;
  sellerUsername: string;
  createdAt: string;
  isSold: boolean;
  isArchived: boolean;
  isUserActive: boolean;
  isExpired: boolean;
  // Bilingual names for transmission and fuel type (from backend)
  transmissionNameEn?: string;
  transmissionNameAr?: string;
  fuelTypeNameEn?: string;
  fuelTypeNameAr?: string;
  // V3: Contact fields from backend enhancement
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPreference?: string;
}

/**
 * Interface for API response when fetching multiple listings
 */
export interface BackendListingApiResponse {
  content: ApiListingItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Interface for update listing request
 */
export interface UpdateListingData {
  title?: string;
  modelId?: number;
  modelYear?: number;
  mileage?: number;
  price?: number;
  currency?: string; // Add currency support to update interface
  locationId?: number;
  description?: string;
  transmissionId?: number;
  fuelTypeId?: number;
  isSold?: boolean;
  isArchived?: boolean;
  // V3: Contact fields from backend enhancement
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPreference?: string;
}

/**
 * Interface for a car listing
 */
export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  year: number;
  mileage: number;
  make?: string;
  
  // V2: Enhanced complete objects with IDs, slugs, and localized names
  brand?: {
    id: number;
    name: string;
    slug: string;
    displayNameEn: string;
    displayNameAr: string;
  };
  model?: {
    id: number;
    name: string;
    slug: string;
    displayNameEn: string;
    displayNameAr: string;
    brandId?: number;
  };
  image?: string;  // Backward compatibility
  exteriorColor?: string;
  interiorColor?: string;
  
  // Backend fields from CarListingResponse
  modelYear?: number;
  
  // Deprecated fields (maintained for backward compatibility)
  /** @deprecated Use brand.displayNameEn instead */
  brandNameEn?: string;
  /** @deprecated Use brand.displayNameAr instead */
  brandNameAr?: string;
  /** @deprecated Use model.displayNameEn instead */
  modelNameEn?: string;
  /** @deprecated Use model.displayNameAr instead */
  modelNameAr?: string;
  governorateNameEn?: string;
  governorateNameAr?: string;
  location?: {
    city?: string;
    cityAr?: string;
    country?: string;
    countryCode?: string;
    address?: string;
  };
  governorate?: {
    nameEn: string;
    nameAr: string;
  };
  // Add details objects for ID access (from API response)
  locationDetails?: {
    id: number;
    displayNameEn: string;
    displayNameAr: string;
    slug: string;
    countryCode: string;
  };
  governorateDetails?: {
    id: number;
    displayNameEn: string;
    displayNameAr: string;
    slug: string;
  };
  media?: { 
    url: string; 
    type?: string; 
    isPrimary?: boolean; 
  }[];
  // Enhanced V2 objects for transmission and fuel type
  transmission?: {
    id: number;
    name: string;
    slug: string;
    displayNameEn: string;
    displayNameAr: string;
  };
  fuelType?: {
    id: number;
    name: string;
    slug: string;
    displayNameEn: string;
    displayNameAr: string;
  };
  
  // Deprecated transmission/fuel type fields (maintained for backward compatibility)
  /** @deprecated Use transmission.displayNameEn instead */
  transmissionNameEn?: string;
  /** @deprecated Use transmission.displayNameAr instead */
  transmissionNameAr?: string;
  /** @deprecated Use fuelType.displayNameEn instead */
  fuelTypeNameEn?: string;
  /** @deprecated Use fuelType.displayNameAr instead */
  fuelTypeNameAr?: string;
  listingDate?: Date;
  createdAt: string;
  updatedAt?: string;
  category?: {
    id?: string;
    name: string;
  };
  seller?: {
    id: string;
    name: string;
    type: 'dealer' | 'private';
    phone?: string;
    email?: string;
  };
  condition?: 'new' | 'used' | 'certified';
  features?: string[];
  views?: number;
  status?: 'active' | 'pending' | 'sold' | 'expired';
  approved?: boolean;
  expired?: boolean;
  expires?: string;
  // V3: Contact fields from backend enhancement
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPreference?: string;
}

/**
 * Interface for video URL input with validation state
 */
export interface VideoUrlInput {
  url: string;
  isValidated: boolean;
}

/**
 * Interface for car listing form data
 */
export interface ListingFormData {
  id?: string;
  title: string;
  description: string;
  make: string; // Assuming this is for a generic listing, might need to be part of attributes
  model: string; // Assuming this is for a generic listing, might need to be part of attributes
  year: string; // Assuming this is for a generic listing, might need to be part of attributes
  price: string; // Price is a string as per existing definition
  currency: string; // Assuming this is for a generic listing, might need to be part of attributes
  condition: string; // Assuming this is for a generic listing, might need to be part of attributes
  mileage: string; // Assuming this is for a generic listing, might need to be part of attributes
  engine: string; // Engine specifications
  color: string; // Exterior color
  exteriorColor: string; // Assuming this is for a generic listing, might need to be part of attributes
  interiorColor: string; // Assuming this is for a generic listing, might need to be part of attributes
  transmission: string; // Assuming this is for a generic listing, might need to be part of attributes
  fuelType: string; // Assuming this is for a generic listing, might need to be part of attributes
  features: string[]; // Assuming this is for a generic listing, might need to be part of attributes
  categoryId?: string; // Added categoryId, make it optional or required based on your logic
  attributes?: Record<string, unknown>; // For dynamic attributes based on category
  location?: string; 
  governorateSlug: string; // For URL generation and form display
  locationSlug: string; // For URL generation and form display
  // Add direct IDs for efficient API calls (following the location pattern)
  governorateId?: number; // Direct ID for API efficiency
  locationId?: number; // Direct ID for API efficiency
  makeId?: number; // Direct ID for make (will be set when reference data loads)
  modelId?: number; // Direct ID for model (will be set when reference data loads)
  transmissionId?: number; // Direct ID for transmission (will be set when reference data loads)
  fuelTypeId?: number; // Direct ID for fuel type (will be set when reference data loads)
  state: string; // State or province
  zipCode: string; // Postal/ZIP code
  contactName: string; // Added
  contactPhone: string; // Added
  contactEmail?: string; // Added, optional
  contactPreference: string; // This was in the original form state, ensure it's needed
  images: File[];
  videos?: File[]; // Video files for upload
  videoUrls?: VideoUrlInput[]; // External video URLs (YouTube)
  existingImageUrls?: string[]; // URLs of existing images (for edit mode)
  existingVideoUrls?: string[]; // URLs of existing videos (for edit mode)
  status: 'active' | 'expired' | 'pending' | 'sold' | '';
  created?: string;
  expires?: string;
  views?: number;
}

/**
 * Interface for API response when fetching listings (frontend format)
 */
export interface ListingApiResponse {
  data: Listing[];
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Interface for listing expiry status display
 */
export interface ListingExpiryProps {
  expires: string;
  status: string;
}

/**
 * Interface for Governorate
 */
export interface Governorate {
  id: string;
  nameEn: string;
  nameAr: string;
  displayNameEn: string; // Added for direct use in dropdowns
  displayNameAr: string; // Added for direct use in dropdowns
  slug: string; // Added slug field
  countryCode?: string;
}

/**
 * Extends the base Listing type to include language-specific fields 
 * for titles and descriptions, and allows for dynamic language keys.
 */
export interface ListingWithLanguage extends Listing {
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  badge?: string; // Add badge property for special listings
  // Allow any string key ending with _en or _ar, covering various potential data types
  [key: `${string}_${Lang}`]: string | number | boolean | string[] | Record<string, unknown> | Date | undefined;
}

/**
 * Defines the fields that can be localized.
 */
export type LocalizedField = 'title' | 'description';

/**
 * Interface for reference data items (transmissions, fuel types, etc.)
 */
export interface ReferenceDataItem {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

/**
 * Interface for reference data from the API
 */
export interface ReferenceData {
  carConditions: ReferenceDataItem[];
  driveTypes: ReferenceDataItem[];
  bodyStyles: ReferenceDataItem[];
  fuelTypes: ReferenceDataItem[];
  transmissions: ReferenceDataItem[];
  sellerTypes: ReferenceDataItem[];
}
