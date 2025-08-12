/**
 * Service-related types and interfaces
 */

export interface ApiListing {
  id: string;
  title: string;
  description?: string;
  price: number;
  year?: number;
  modelYear?: number;
  mileage?: number;
  brand?: string;
  model?: string;
  brandNameEn?: string;
  brandNameAr?: string;
  modelNameEn?: string;
  modelNameAr?: string;
  currency?: string;
  transmission?: string;
  fuelType?: string;
  features?: string[];
  category?: { id?: string; name?: string };
  location?: {
    city?: string;
    cityAr?: string;
    address?: string;
    country?: string;
    countryCode?: string;
  };
  governorate?: {
    nameEn?: string;
    nameAr?: string;
  };
  seller?: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    type?: string;
  };
  media?: Array<{
    url: string;
    type?: string;
    isPrimary?: boolean;
  }>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
