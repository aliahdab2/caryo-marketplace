import { Lang } from './i18n';

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
  model?: string;
  brand?: string;  // Backward compatibility
  image?: string;  // Backward compatibility
  exteriorColor?: string;
  interiorColor?: string;
  
  // Backend fields from CarListingResponse
  modelYear?: number;
  brandNameEn?: string;
  brandNameAr?: string;
  modelNameEn?: string;
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
  media?: { 
    url: string; 
    type?: string; 
    isPrimary?: boolean; 
  }[];
  fuelType?: string;
  transmission?: string;
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
  contactPreference?: string;
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
  exteriorColor: string; // Assuming this is for a generic listing, might need to be part of attributes
  interiorColor: string; // Assuming this is for a generic listing, might need to be part of attributes
  transmission: string; // Assuming this is for a generic listing, might need to be part of attributes
  fuelType: string; // Assuming this is for a generic listing, might need to be part of attributes
  features: string[]; // Assuming this is for a generic listing, might need to be part of attributes
  categoryId?: string; // Added categoryId, make it optional or required based on your logic
  attributes?: Record<string, unknown>; // For dynamic attributes based on category
  location?: string; 
  governorateId: string; 
  city: string; // This was in the original form state, ensure it's needed
  contactName: string; // Added
  contactPhone: string; // Added
  contactEmail?: string; // Added, optional
  contactPreference: string; // This was in the original form state, ensure it's needed
  images: File[];
  status: 'active' | 'expired' | 'pending' | '';
  created?: string;
  expires?: string;
  views?: number;
}

/**
 * Interface for API response when fetching listings
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
  // Allow any string key ending with _en or _ar, covering various potential data types
  [key: `${string}_${Lang}`]: string | number | boolean | string[] | Record<string, unknown> | Date | undefined;
}

/**
 * Defines the fields that can be localized.
 */
export type LocalizedField = 'title' | 'description';
