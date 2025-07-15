// Listings API service
import { 
  ApiListingItem,
  BackendListingApiResponse as ListingApiResponse,
  GovernorateDetails,
  Listing, 
  ListingFilters,
  ListingFormData,
  ListingMedia,
  LocationDetails,
  UpdateListingData
} from '@/types/listings';
import { api } from './api';
import { ApiError } from '@/utils/apiErrorHandler';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import { getAuthHeaders } from '@/utils/auth';

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
      brand: item.brandNameEn,
      model: item.modelNameEn,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: item.fuelType || '',
      transmission: item.transmission || '',
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
    // Create the params object
    const params = new URLSearchParams();
    
    // Add page and limit first (always required)
    params.set('page', filters.page !== undefined ? String(Number(filters.page) - 1) : '0'); // 0-based for API
    params.set('limit', filters.limit !== undefined ? String(filters.limit) : '12');
    
    // Add other filters
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minYear) params.set('minYear', filters.minYear);
    if (filters.maxYear) params.set('maxYear', filters.maxYear);
    if (filters.location) params.set('location', filters.location);
    if (filters.sellerTypeId) params.set('sellerTypeId', filters.sellerTypeId.toString());
    
    // Ensure brand and model are explicitly added
    if (filters.brand) {
      params.set('brand', filters.brand);
    }
    if (filters.model) {
      params.set('model', filters.model);
    }

    const url = `/api/listings/filter?${params.toString()}`;
    const response = await api.get<ListingApiResponse>(url);
    const result = mapApiResponseToListings(response);
    return result;
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
      brand: response.brandNameEn,
      model: response.modelNameEn,
      brandNameEn: response.brandNameEn,
      brandNameAr: response.brandNameAr,
      modelNameEn: response.modelNameEn,
      modelNameAr: response.modelNameAr,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: response.fuelType || '',
      transmission: response.transmission || '',
      createdAt: response.createdAt,
      description: response.description,
      status: determineListingStatus(response),
      approved: response.approved,
      expired: response.isExpired,
      seller: {
        id: response.sellerId.toString(),
        name: response.sellerUsername,
        type: 'private' as const,
        phone: '+966 50 123 4567' // Placeholder - this should come from API in the future
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

// UpdateListingData interface is now imported from '@/types/listings'

// Update an existing listing
export async function updateListing(id: string | number, data: UpdateListingData): Promise<Listing> {
  try {
    // Import getSession at runtime to avoid SSR issues
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    
    if (!session?.accessToken) {
      throw new ApiError('You need to log in to update listings', 401);
    }
    
    // Include the authentication token from NextAuth
    const headers = {
      'Authorization': `Bearer ${session.accessToken}`
    };
    
    const response = await api.put<ApiListingItem>(
      `/api/listings/${id}`, 
      data as Record<string, unknown>,
      headers
    );
    
    // Transform the API response to our frontend Listing type
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
      brand: response.brandNameEn,
      model: response.modelNameEn,
      brandNameEn: response.brandNameEn,
      brandNameAr: response.brandNameAr,
      modelNameEn: response.modelNameEn,
      modelNameAr: response.modelNameAr,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: '',
      transmission: response.transmission || '', // Use the actual transmission field from backend
      createdAt: response.createdAt,
      description: response.description,
      status: determineListingStatus(response),
      approved: response.approved,
      expired: response.isExpired,
      seller: {
        id: response.sellerId.toString(),
        name: response.sellerUsername,
        type: 'private' as const,
        phone: '+966 50 123 4567' // Placeholder - this should come from API in the future
      },
      currency: 'SAR' // Default currency
    };
  } catch (error) {
    if (error instanceof ApiError) {
      const errorContext = {
        status: error.status,
        message: error.message,
        data: error.data,
        id,
        updateData: data
      };
      
      console.error('[Update Listing] API Error:', errorContext);

      switch (error.status) {
        case 404:
          throw new Error('Listing not found');
        case 401:
        case 403:
          throw new Error('You do not have permission to update this listing');
        case 400:
          throw new Error('Invalid listing data provided');
        default:
          throw new Error('Failed to update listing. Please try again later.');
      }
    }

    console.error('[Update Listing] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('An unexpected error occurred while updating the listing');
  }
}

// Get current user's listings (for dashboard)
export async function getMyListings(): Promise<Listing[]> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await api.get<ApiListingItem[]>('/api/listings/my-listings', headers);
    
    return response.map(item => {
      const { mainImageUrl, mediaItems } = getMediaUrls(item.media || []);
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
        brand: item.brandNameEn,
        model: item.modelNameEn,
        brandNameEn: item.brandNameEn,
        brandNameAr: item.brandNameAr,
        modelNameEn: item.modelNameEn,
        modelNameAr: item.modelNameAr,
        location,
        governorate,
        image: mainImageUrl,
        media: mediaItems,
        fuelType: item.fuelType || '',
        transmission: item.transmission || '',
        createdAt: item.createdAt,
        description: item.description,
        status: determineListingStatus(item),
        approved: item.approved,
        expired: item.isExpired,
        seller: {
          id: item.sellerId.toString(),
          name: item.sellerUsername,
          type: 'private' as const,
          phone: '+966 50 123 4567'
        },
        currency: item.currency || 'USD' // Use actual currency from API, default to USD
      };
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[My Listings] API Error:', error);
      switch (error.status) {
        case 401:
        case 403:
          throw new Error('You need to log in to view your listings');
        default:
          throw new Error('Failed to fetch your listings. Please try again later.');
      }
    }

    console.error('[My Listings] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('An unexpected error occurred while fetching your listings');
  }
}

/**
 * Create a new car listing
 * @param formData Form data for the new listing
 * @returns The created listing data
 */
export async function createListing(formData: ListingFormData): Promise<Listing> {
  try {
    const headers = await getAuthHeaders();
    
    // Convert form data to match the backend CreateListingRequest exactly
    const apiData = {
      title: formData.title,
      description: formData.description || '',
      modelId: parseInt(formData.categoryId || '0', 10), // Backend expects Long modelId
      modelYear: parseInt(formData.year, 10),
      mileage: parseInt(formData.mileage, 10),
      price: parseFloat(formData.price),
      currency: formData.currency || 'USD', // Include currency in API request
      locationId: parseInt(formData.governorateId, 10), // Backend expects Long locationId
      isSold: false, // Optional field - default to false
      isArchived: false // Optional field - default to false
    };

    // Validate the API data before sending
    if (!apiData.modelId || apiData.modelId === 0) {
      throw new ApiError('Model ID is required and must be valid', 400);
    }
    if (!apiData.locationId || apiData.locationId === 0) {
      throw new ApiError('Location ID is required and must be valid', 400);
    }
    if (!apiData.title || apiData.title.trim() === '') {
      throw new ApiError('Title is required', 400);
    }
    if (!apiData.modelYear || apiData.modelYear < 1920 || apiData.modelYear > new Date().getFullYear()) {
      throw new ApiError('Valid model year is required', 400);
    }
    if (apiData.mileage < 0) {
      throw new ApiError('Mileage cannot be negative', 400);
    }
    if (!apiData.price || apiData.price <= 0) {
      throw new ApiError('Valid price is required', 400);
    }
    
    // Using FormData for file uploads
    const formDataObj = new FormData();
    
    // Add the JSON data as a string in a field called 'listing'
    // Create a blob for the JSON data with the correct content type
    const listingBlob = new Blob([JSON.stringify(apiData)], { type: 'application/json' });
    formDataObj.append('listing', listingBlob);
    
    // Add images if available - backend expects 'image' as the field name for the primary image
    const hasImages = formData.images && formData.images.length > 0;
    if (hasImages) {
      // Send first image as the primary image with field name 'image'
      const imageFile = formData.images[0];
      formDataObj.append('image', imageFile, imageFile.name);
    }
    
    // Choose endpoint based on whether we have images
    const endpoint = hasImages ? '/with-image' : '';
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings${endpoint}`;
    
    // Prepare request options
    let requestOptions: RequestInit;
    
    if (hasImages) {
      // For multipart/form-data with images
      // DO NOT set Content-Type - let the browser set it with boundary
      requestOptions = {
        method: 'POST',
        headers: {
          ...headers  // Only Authorization header, no Content-Type
        },
        body: formDataObj,
        credentials: 'include'
      };
    } else {
      // For JSON data without images
      requestOptions = {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData),
        credentials: 'include'
      };
    }
    
    // Using fetch directly since our api utility has type constraints
    const fetchResponse = await fetch(url, requestOptions);
    
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new ApiError(errorText, fetchResponse.status);
    }
    
    const response = await fetchResponse.json() as ApiListingItem;
    
    // Transform the API response to our frontend Listing type
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
      brand: response.brandNameEn,
      model: response.modelNameEn,
      brandNameEn: response.brandNameEn,
      brandNameAr: response.brandNameAr,
      modelNameEn: response.modelNameEn,
      modelNameAr: response.modelNameAr,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: response.fuelType || '',
      transmission: response.transmission || '',
      createdAt: response.createdAt,
      description: response.description,
      status: determineListingStatus(response),
      approved: response.approved,
      expired: response.isExpired,
      seller: {
        id: response.sellerId.toString(),
        name: response.sellerUsername,
        type: 'private',
        phone: '+966 50 123 4567'
      },
      currency: 'SAR'
    };
  } catch (error) {
    console.error('[Create Listing] Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Failed to create listing');
  }
}
