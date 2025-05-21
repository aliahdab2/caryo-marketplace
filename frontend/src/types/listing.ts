// Listing type definitions
export interface Listing {
  id: string;
  title: string;
  price: number;
  year: number; // Added year back
  mileage: number;
  location?: { // Changed to object
    city?: string;
    country?: string;
    address?: string; // Optional address line
  };
  image?: string; // Kept for simplicity, though page.tsx uses media
  media?: { url: string; type?: string; }[]; // Added media for richer content
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
