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
  location?: {
    city?: string;
    cityAr?: string;
    country?: string;
    countryCode?: string;
    address?: string;
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
  make: string;
  model: string;
  year: string;
  price: string;
  currency: string;
  condition: string;
  mileage: string;
  exteriorColor: string;
  interiorColor: string;
  transmission: string;
  fuelType: string;
  features: string[];
  location: string;
  city: string;
  contactPreference: string;
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
  className?: string;
}
