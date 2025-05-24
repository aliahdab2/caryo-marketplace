// Listing type definitions
export interface Listing {
  id: string;
  title: string;
  price: number;
  year: number; // Added year back
  mileage: number;
  brand?: string; // Added brand
  model?: string; // Added model
  location?: { // Changed to object
    city?: string;
    cityAr?: string; // Added Arabic city name
    country?: string;
    countryCode?: string; // Added country code
    address?: string; // Optional address line
  };
  image?: string; // Kept for simplicity, though page.tsx uses media
  media?: { 
    url: string; 
    type?: string; 
    isPrimary?: boolean; 
  }[]; // Added isPrimary flag to media items
  fuelType?: string;
  transmission?: string;
  listingDate?: Date; // Kept for now
  createdAt: string; // Added createdAt
  updatedAt?: string; // Added updatedAt (optional)
  currency?: string; // Added currency
  category?: { // Added category object
    id?: string;
    name: string;
  };
  description?: string;
  seller?: {
    id: string;
    name: string;
    type: 'dealer' | 'private';
  };
  condition?: 'new' | 'used' | 'certified';
  features?: string[];
  views?: number;
  status?: 'active' | 'pending' | 'sold' | 'expired';
  approved?: boolean; //
  expired?: boolean; 
}
