// Listings API service
import { Listing } from '@/types/listings';
import { api } from './api';

export type ListingFilters = {
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
};

interface ListingApiResponse {
  content: Array<{
    id: number;
    title: string;
    brand: string;
    model: string;
    modelYear: number;
    mileage: number;
    price: number;
    locationDetails: {
      id: number;
      name: string;
      displayNameEn: string;
      displayNameAr: string;
      slug: string;
      region: string;
      countryCode: string;
    };
    description: string;
    media: Array<{
      id: number;
      url: string;
      contentType: string;
      isPrimary: boolean;
    }>;
    approved: boolean;
    sellerId: number;
    sellerUsername: string;
    createdAt: string;
    isSold: boolean;
    isArchived: boolean;
    isUserActive: boolean;
    isExpired: boolean;
  }>;
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Helper function to convert API response to our Listing type
function mapApiResponseToListings(apiResponse: ListingApiResponse): { listings: Listing[], total: number } {
  const listings = apiResponse.content.map(item => {
    // Default seller type to 'private' if not available
    const sellerType: 'private' | 'dealer' = 'private';
    
    // Determine the status based on the item properties
    let status: 'active' | 'pending' | 'sold' | 'expired' | undefined;
    if (item.isSold) {
      status = 'sold';
    } else if (item.isExpired) {
      status = 'expired';
    } else if (item.approved) {
      status = 'active';
    } else {
      status = 'pending';
    }
    
    // Get primary image or first image if available
    const primaryMedia = item.media?.find(m => m.isPrimary);
    const firstMedia = item.media && item.media.length > 0 ? item.media[0] : null;
    const mainImageUrl = primaryMedia?.url || firstMedia?.url || '/images/vehicles/car-default.svg';
    
    // Prepare all media URLs
    const mediaItems = item.media?.map(m => ({ 
      url: m.url, 
      type: m.contentType,
      isPrimary: m.isPrimary || false
    })) || [];
    
    return {
      id: item.id.toString(),
      title: `${item.brand} ${item.model} ${item.modelYear}`,
      price: item.price,
      year: item.modelYear,
      mileage: item.mileage,
      brand: item.brand,
      model: item.model,
      location: {
        city: item.locationDetails?.displayNameEn || '',
        cityAr: item.locationDetails?.displayNameAr || '',
        country: 'Syria',
        countryCode: item.locationDetails?.countryCode || 'SY'
      },
      image: mainImageUrl,
      media: mediaItems,
      fuelType: '', // This could be added to the response if available
      transmission: '', // This could be added to the response if available
      createdAt: item.createdAt,
      description: item.description,
      status,
      approved: item.approved,
      expired: item.isExpired,
      seller: {
        id: item.sellerId.toString(),
        name: item.sellerUsername,
        type: sellerType,
      }
    };
  });
  
  return {
    listings,
    total: apiResponse.totalElements
  };
}

export async function getListings(filters: ListingFilters = {}): Promise<{ listings: Listing[], total: number }> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.minYear) params.append('minYear', filters.minYear);
    if (filters.maxYear) params.append('maxYear', filters.maxYear);
    if (filters.location) params.append('location', filters.location);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.model) params.append('model', filters.model);
    if (filters.searchTerm) params.append('search', filters.searchTerm);
    if (filters.page) params.append('page', String(filters.page - 1)); // API uses 0-based indexing
    if (filters.limit) params.append('size', String(filters.limit));
    
    // Call the real API
    const response = await api.get<ListingApiResponse>(`/api/listings/filter?${params.toString()}`);
    return mapApiResponseToListings(response);
  } catch (error) {
    console.error('Error fetching listings:', error);
    // Fallback to empty results
    return { listings: [], total: 0 };
  }
}
