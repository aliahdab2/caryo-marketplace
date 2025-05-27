// Listings API service
import { Listing } from '@/types/listings';
import { api } from './api';
import { ApiError } from '@/utils/apiErrorHandler';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';

// API Types
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
}

interface LocationDetails {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  region: string;
  countryCode: string;
}

interface GovernorateDetails {
  displayNameEn: string;
  displayNameAr: string;
}

interface ListingMedia {
  id: number;
  url: string;
  contentType: string;
  isPrimary: boolean;
}

interface ApiListingItem {
  id: number;
  title: string;
  brand: string;
  model: string;
  modelYear: number;
  mileage: number;
  price: number;
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
}

interface ListingApiResponse {
  content: ApiListingItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Utility functions for data transformation
function determineListingStatus(item: ApiListingItem): 'active' | 'pending' | 'sold' | 'expired' {
  if (item.isSold) return 'sold';
  if (item.isExpired) return 'expired';
  return item.approved ? 'active' : 'pending';
}

function getMediaUrls(media: ListingMedia[]): { mainImageUrl: string; mediaItems: { url: string; type: string; isPrimary: boolean }[] } {
  const primaryMedia = media.find(m => m.isPrimary);
  const firstMedia = media.length > 0 ? media[0] : null;
  const mainImageUrl = transformMinioUrl(primaryMedia?.url || firstMedia?.url || '') || getDefaultImageUrl();
  
  const mediaItems = media.map(m => ({
    url: transformMinioUrl(m.url),
    type: m.contentType,
    isPrimary: m.isPrimary
  }));

  return { mainImageUrl, mediaItems };
}

function extractLocationInfo(locationDetails: LocationDetails | null): {
  city: string;
  cityAr: string;
  country: string;
  countryCode: string;
} {
  return {
    city: locationDetails?.displayNameEn || locationDetails?.name || '',
    cityAr: locationDetails?.displayNameAr || locationDetails?.name || '',
    country: 'Syria',
    countryCode: locationDetails?.countryCode || 'SY'
  };
}

function extractGovernorateInfo(
  details: GovernorateDetails | undefined,
  nameEn?: string,
  nameAr?: string
): { nameEn: string; nameAr: string } | undefined {
  if (details && (details.displayNameEn || details.displayNameAr)) {
    return {
      nameEn: details.displayNameEn,
      nameAr: details.displayNameAr
    };
  }
  
  if (nameEn || nameAr) {
    return {
      nameEn: nameEn || '',
      nameAr: nameAr || ''
    };
  }
  
  return undefined;
}

// Map API response to our Listing type
function mapApiResponseToListings(apiResponse: ListingApiResponse): { listings: Listing[]; total: number } {
  const listings = apiResponse.content.map(item => {
    const { mainImageUrl, mediaItems } = getMediaUrls(item.media);
    const location = extractLocationInfo(item.locationDetails);
    const governorate = extractGovernorateInfo(
      item.governorateDetails,
      item.governorateNameEn,
      item.governorateNameAr
    );

    return {
      id: item.id.toString(),
      title: item.title,
      price: item.price,
      year: item.modelYear,
      mileage: item.mileage,
      brand: item.brand,
      model: item.model,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: '',
      transmission: '',
      createdAt: item.createdAt,
      description: item.description,
      status: determineListingStatus(item),
      approved: item.approved,
      expired: item.isExpired,
      seller: {
        id: item.sellerId.toString(),
        name: item.sellerUsername,
        type: 'private' as const
      }
    };
  });

  return {
    listings,
    total: apiResponse.totalElements
  };
}

export async function getListings(filters: ListingFilters = {}): Promise<{ listings: Listing[]; total: number }> {
  try {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [
          key === 'page' ? 'page' : key,
          // Convert page number to 0-based indexing for the API
          key === 'page' ? String(Number(value) - 1) : String(value)
        ])
    );

    const response = await api.get<ListingApiResponse>(`/api/listings/filter?${params.toString()}`);
    return mapApiResponseToListings(response);
  } catch (error) {
    if (error instanceof ApiError) {
      const errorContext = {
        status: error.status,
        message: error.message,
        data: error.data,
        filters
      };
      
      console.error('[Listings] API Error:', errorContext);

      switch (error.status) {
        case 404:
          throw new Error('Listing service is currently unavailable');
        case 401:
        case 403:
          throw new Error('You do not have permission to access listings');
        default:
          throw new Error('Failed to fetch listings. Please try again later.');
      }
    }

    console.error('[Listings] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('An unexpected error occurred while fetching listings');
  }
}

// Get featured listings for homepage (first 3 listings)
export async function getFeaturedListings(): Promise<Listing[]> {
  try {
    // Use the simple listings endpoint directly
    const response = await api.get<ListingApiResponse>(`/api/listings?size=3&page=0`);
    const { listings } = mapApiResponseToListings(response);
    return listings;
  } catch (error) {
    console.error('[Featured Listings] Error fetching featured listings:', error);
    return [];
  }
}

export async function getListingById(id: string | number): Promise<Listing> {
  try {
    const response = await api.get<ApiListingItem>(`/api/listings/${id}`);
    
    // Transform the single API listing item to our frontend Listing type
    const { mainImageUrl, mediaItems } = getMediaUrls(response.media || []);
    const location = extractLocationInfo(response.locationDetails);
    const governorate = extractGovernorateInfo(
      response.governorateDetails,
      response.governorateNameEn,
      response.governorateNameAr
    );

    return {
      id: response.id.toString(),
      title: response.title,
      price: response.price,
      year: response.modelYear,
      mileage: response.mileage,
      brand: response.brand,
      model: response.model,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: '',
      transmission: '',
      createdAt: response.createdAt,
      description: response.description,
      status: determineListingStatus(response),
      approved: response.approved,
      expired: response.isExpired,
      seller: {
        id: response.sellerId.toString(),
        name: response.sellerUsername,
        type: 'private' as const
      },
      currency: 'SAR' // Default currency
    };
  } catch (error) {
    if (error instanceof ApiError) {
      const errorContext = {
        status: error.status,
        message: error.message,
        data: error.data,
        id
      };
      
      console.error('[Listing] API Error:', errorContext);

      switch (error.status) {
        case 404:
          throw new Error('Listing not found');
        case 401:
        case 403:
          throw new Error('You do not have permission to access this listing');
        default:
          throw new Error('Failed to fetch listing. Please try again later.');
      }
    }

    console.error('[Listing] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('An unexpected error occurred while fetching the listing');
  }
}
