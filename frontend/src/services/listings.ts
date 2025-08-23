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
      // V2: Backend provides complete objects - no fallback needed
      brand: item.brand,
      model: item.model,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      // V2: Backend provides complete objects - no fallback needed
      fuelType: item.fuelType,
      transmission: item.transmission,
      // Bilingual names from backend
      transmissionNameEn: item.transmissionNameEn,
      transmissionNameAr: item.transmissionNameAr,
      fuelTypeNameEn: item.fuelTypeNameEn,
      fuelTypeNameAr: item.fuelTypeNameAr,
      createdAt: item.createdAt,
      description: item.description,
      status: determineListingStatus(item),
      approved: item.approved,
      expired: item.isExpired,
      seller: {
        id: item.sellerId.toString(),
        name: item.sellerUsername,
        type: 'private' as const
      },
      // V3: Include contact fields from backend enhancement
      contactName: item.contactName,
      contactEmail: item.contactEmail,
      contactPhone: item.contactPhone,
      contactPreference: item.contactPreference
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
      brand: response.brand || (response.brandNameEn ? { 
        id: 0, 
        name: response.brandNameEn.toLowerCase(), 
        slug: response.brandNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.brandNameEn, 
        displayNameAr: response.brandNameAr || '' 
      } : undefined),
      model: response.model || (response.modelNameEn ? { 
        id: 0, 
        name: response.modelNameEn.toLowerCase(), 
        slug: response.modelNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.modelNameEn, 
        displayNameAr: response.modelNameAr || '',
        brandId: 0
      } : undefined),
      brandNameEn: response.brandNameEn,
      brandNameAr: response.brandNameAr,
      modelNameEn: response.modelNameEn,
      modelNameAr: response.modelNameAr,
      location,
      governorate,
      // Include details objects for ID access
      locationDetails: response.locationDetails ? {
        id: response.locationDetails.id,
        displayNameEn: response.locationDetails.displayNameEn,
        displayNameAr: response.locationDetails.displayNameAr,
        slug: response.locationDetails.slug,
        countryCode: response.locationDetails.countryCode
      } : undefined,
      governorateDetails: response.governorateDetails ? {
        id: response.governorateDetails.id,
        displayNameEn: response.governorateDetails.displayNameEn,
        displayNameAr: response.governorateDetails.displayNameAr,
        slug: response.governorateDetails.slug
      } : undefined,
      image: mainImageUrl,
      media: mediaItems,
      // V2: Backend provides complete objects - no fallback needed
      fuelType: response.fuelType,
      transmission: response.transmission,
      // Bilingual names from backend
      transmissionNameEn: response.transmissionNameEn,
      transmissionNameAr: response.transmissionNameAr,
      fuelTypeNameEn: response.fuelTypeNameEn,
      fuelTypeNameAr: response.fuelTypeNameAr,
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
      currency: 'SAR', // Default currency
      // V3: Include contact fields from backend enhancement
      contactName: response.contactName,
      contactEmail: response.contactEmail,
      contactPhone: response.contactPhone,
      contactPreference: response.contactPreference
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
    // Import getSession from our auth utils instead of NextAuth
    const { getSession } = await import('@/utils/auth');
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
      brand: response.brand || (response.brandNameEn ? { 
        id: 0, 
        name: response.brandNameEn.toLowerCase(), 
        slug: response.brandNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.brandNameEn, 
        displayNameAr: response.brandNameAr || '' 
      } : undefined),
      model: response.model || (response.modelNameEn ? { 
        id: 0, 
        name: response.modelNameEn.toLowerCase(), 
        slug: response.modelNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.modelNameEn, 
        displayNameAr: response.modelNameAr || '',
        brandId: 0
      } : undefined),
      brandNameEn: response.brandNameEn,
      brandNameAr: response.brandNameAr,
      modelNameEn: response.modelNameEn,
      modelNameAr: response.modelNameAr,
      location,
      governorate,
      // CRITICAL FIX: Include details objects for ID access in update response
      locationDetails: response.locationDetails ? {
        id: response.locationDetails.id,
        displayNameEn: response.locationDetails.displayNameEn,
        displayNameAr: response.locationDetails.displayNameAr,
        slug: response.locationDetails.slug,
        countryCode: response.locationDetails.countryCode
      } : undefined,
      governorateDetails: response.governorateDetails ? {
        id: response.governorateDetails.id,
        displayNameEn: response.governorateDetails.displayNameEn,
        displayNameAr: response.governorateDetails.displayNameAr,
        slug: response.governorateDetails.slug
      } : undefined,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: typeof response.fuelType === 'object' ? response.fuelType : (response.fuelTypeNameEn ? { 
        id: 0, 
        name: response.fuelTypeNameEn.toLowerCase(), 
        slug: response.fuelTypeNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.fuelTypeNameEn, 
        displayNameAr: response.fuelTypeNameAr || '' 
      } : undefined),
      transmission: typeof response.transmission === 'object' ? response.transmission : (response.transmissionNameEn ? { 
        id: 0, 
        name: response.transmissionNameEn.toLowerCase(), 
        slug: response.transmissionNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.transmissionNameEn, 
        displayNameAr: response.transmissionNameAr || '' 
      } : undefined), // Use enhanced object or create from deprecated fields
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
      currency: 'SAR', // Default currency
      // V3: Include contact fields from backend enhancement
      contactName: response.contactName,
      contactEmail: response.contactEmail,
      contactPhone: response.contactPhone,
      contactPreference: response.contactPreference
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

// Simple cache for my listings to avoid repeated API calls
let myListingsCache: { data: Listing[]; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Clear my listings cache (call this when listings are modified)
export function clearMyListingsCache(): void {
  myListingsCache = null;
}

// Get current user's listings (for dashboard)
export async function getMyListings(forceRefresh = false): Promise<Listing[]> {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh && myListingsCache) {
      const now = Date.now();
      if (now - myListingsCache.timestamp < CACHE_DURATION) {
        return myListingsCache.data;
      }
    }

    const headers = await getAuthHeaders();
    
    const response = await api.get<ApiListingItem[]>('/api/listings/my-listings', headers);
    
    const mappedListings = response.map(item => {
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
        brand: item.brand || (item.brandNameEn ? { 
          id: 0, 
          name: item.brandNameEn.toLowerCase(), 
          slug: item.brandNameEn.toLowerCase().replace(/\s+/g, '-'), 
          displayNameEn: item.brandNameEn, 
          displayNameAr: item.brandNameAr || '' 
        } : undefined),
        model: item.model || (item.modelNameEn ? { 
          id: 0, 
          name: item.modelNameEn.toLowerCase(), 
          slug: item.modelNameEn.toLowerCase().replace(/\s+/g, '-'), 
          displayNameEn: item.modelNameEn, 
          displayNameAr: item.modelNameAr || '',
          brandId: 0
        } : undefined),
              // V2: These fields are now available in the nested objects
      brandNameEn: item.brand?.displayNameEn,
      brandNameAr: item.brand?.displayNameAr,
      modelNameEn: item.model?.displayNameEn,
      modelNameAr: item.model?.displayNameAr,
        location,
        governorate,
        // CRITICAL FIX: Include details objects for ID access in getMyListings
        locationDetails: item.locationDetails ? {
          id: item.locationDetails.id,
          displayNameEn: item.locationDetails.displayNameEn,
          displayNameAr: item.locationDetails.displayNameAr,
          slug: item.locationDetails.slug,
          countryCode: item.locationDetails.countryCode
        } : undefined,
        governorateDetails: item.governorateDetails ? {
          id: item.governorateDetails.id,
          displayNameEn: item.governorateDetails.displayNameEn,
          displayNameAr: item.governorateDetails.displayNameAr,
          slug: item.governorateDetails.slug
        } : undefined,
        image: mainImageUrl,
        media: mediaItems,
        fuelType: typeof item.fuelType === 'object' ? item.fuelType : (item.fuelTypeNameEn ? { 
          id: 0, 
          name: item.fuelTypeNameEn.toLowerCase(), 
          slug: item.fuelTypeNameEn.toLowerCase().replace(/\s+/g, '-'), 
          displayNameEn: item.fuelTypeNameEn, 
          displayNameAr: item.fuelTypeNameAr || '' 
        } : undefined),
        transmission: typeof item.transmission === 'object' ? item.transmission : (item.transmissionNameEn ? { 
          id: 0, 
          name: item.transmissionNameEn.toLowerCase(), 
          slug: item.transmissionNameEn.toLowerCase().replace(/\s+/g, '-'), 
          displayNameEn: item.transmissionNameEn, 
          displayNameAr: item.transmissionNameAr || '' 
        } : undefined),
        // Bilingual names from backend
        transmissionNameEn: item.transmissionNameEn,
        transmissionNameAr: item.transmissionNameAr,
        fuelTypeNameEn: item.fuelTypeNameEn,
        fuelTypeNameAr: item.fuelTypeNameAr,
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
        currency: item.currency || 'USD', // Use actual currency from API, default to USD
        // V3: Include contact fields from backend enhancement
        contactName: item.contactName,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        contactPreference: item.contactPreference
      };
    });

    // Cache the result
    myListingsCache = {
      data: mappedListings,
      timestamp: Date.now()
    };

    return mappedListings;
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
    
    console.log('[Create Listing] Starting with form data:', {
      title: formData.title,
      imagesCount: formData.images?.length || 0,
      hasImages: formData.images && formData.images.length > 0,
      videosCount: formData.videos?.length || 0,
      hasVideos: formData.videos && formData.videos.length > 0,
      videoUrlsCount: formData.videoUrls?.length || 0,
      hasVideoUrls: formData.videoUrls && formData.videoUrls.length > 0,
      // V3: Contact fields debug
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      contactPreference: formData.contactPreference
    });

    // V2: Location ID should be provided directly from form data
    if (!formData.locationId) {
      throw new ApiError('Location ID is required', 400);
    }
    
    // Convert form data to match the backend CreateListingRequest exactly
    const apiData: {
      title: string;
      description: string;
      modelId: number;
      modelYear: number;
      mileage: number;
      price: number;
      currency: string;
      locationId: number;
      transmissionId?: number;
      fuelTypeId?: number;
      isSold: boolean;
      isArchived: boolean;
      // V3: Contact fields from backend enhancement
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactPreference?: string;
    } = {
      title: formData.title,
      description: formData.description || '',
      modelId: 0, // Will be set below after slug conversion
      modelYear: parseInt(formData.year, 10),
      mileage: parseInt(formData.mileage, 10),
      price: parseFloat(formData.price),
      currency: formData.currency || 'USD', // Include currency in API request
      locationId: formData.locationId, // V2: Use ID directly from form data
      isSold: false, // Optional field - default to false
      isArchived: false // Optional field - default to false
    };

    // V3: Add contact information if provided
    if (formData.contactName && formData.contactName.trim()) {
      apiData.contactName = formData.contactName.trim();
    }
    if (formData.contactEmail && formData.contactEmail.trim()) {
      apiData.contactEmail = formData.contactEmail.trim();
    }
    if (formData.contactPhone && formData.contactPhone.trim()) {
      apiData.contactPhone = formData.contactPhone.trim();
    }
    if (formData.contactPreference && formData.contactPreference.trim()) {
      apiData.contactPreference = formData.contactPreference.trim();
    }

    // V2: Use IDs directly from form data (no conversion needed!)
    // The useListingData hook provides all reference data with IDs
    // and the form handlers set the ID fields directly
    if (formData.modelId) {
      apiData.modelId = formData.modelId;
    }
    
    if (formData.transmissionId) {
      apiData.transmissionId = formData.transmissionId;
    }
    
    if (formData.fuelTypeId) {
      apiData.fuelTypeId = formData.fuelTypeId;
    }

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
    if (!apiData.description || apiData.description.trim() === '') {
      throw new ApiError('Description is required', 400);
    }
    if (!formData.make) {
      throw new ApiError('Car make is required', 400);
    }
    if (!formData.model) {
      throw new ApiError('Car model is required', 400);
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
    
    // V3: Debug log the final API data being sent
    console.log('[Create Listing] Final API data:', {
      ...apiData,
      hasContactInfo: !!(apiData.contactName || apiData.contactEmail || apiData.contactPhone || apiData.contactPreference)
    });

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
    
    // Upload additional images if there are more than one
    if (formData.images && formData.images.length > 1) {
      console.log(`[Create Listing] Uploading ${formData.images.length - 1} additional images`);
      
      // Upload remaining images (skip the first one as it was already uploaded)
      for (let i = 1; i < formData.images.length; i++) {
        try {
          const additionalImage = formData.images[i];
          const uploadFormData = new FormData();
          uploadFormData.append('file', additionalImage, additionalImage.name);
          
          const uploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/${response.id}/upload-image`,
            {
              method: 'POST',
              headers: {
                'Authorization': headers.Authorization
              },
              body: uploadFormData,
              credentials: 'include'
            }
          );
          
          if (!uploadResponse.ok) {
            console.warn(`[Create Listing] Failed to upload additional image ${i + 1}:`, await uploadResponse.text());
          } else {
            console.log(`[Create Listing] Successfully uploaded additional image ${i + 1}`);
          }
        } catch (error) {
          console.warn(`[Create Listing] Error uploading additional image ${i + 1}:`, error);
        }
      }
      
      // Fetch the updated listing to get all media after image uploads
      try {
        const updatedResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/${response.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': headers.Authorization
            },
            credentials: 'include'
          }
        );
        
        if (updatedResponse.ok) {
          const updatedListing = await updatedResponse.json() as ApiListingItem;
          response.media = updatedListing.media; // Use the updated media array
        }
      } catch (error) {
        console.warn('[Create Listing] Failed to fetch updated listing with all media:', error);
      }
    }

    // Upload video files if present
    if (formData.videos && formData.videos.length > 0) {
      console.log(`[Create Listing] Uploading ${formData.videos.length} video files`);
      
      for (let i = 0; i < formData.videos.length; i++) {
        try {
          const videoFile = formData.videos[i];
          const uploadFormData = new FormData();
          uploadFormData.append('file', videoFile, videoFile.name);
          uploadFormData.append('listingId', response.id.toString());
          
          const uploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/files/upload`,
            {
              method: 'POST',
              headers: {
                'Authorization': headers.Authorization
              },
              body: uploadFormData,
              credentials: 'include'
            }
          );
          
          if (!uploadResponse.ok) {
            console.warn(`[Create Listing] Failed to upload video ${i + 1}:`, await uploadResponse.text());
          } else {
            console.log(`[Create Listing] Successfully uploaded video ${i + 1}`);
          }
        } catch (error) {
          console.warn(`[Create Listing] Error uploading video ${i + 1}:`, error);
        }
      }
    }

    // Add external video URLs if present
    if (formData.videoUrls && formData.videoUrls.length > 0) {
      console.log(`[Create Listing] Adding ${formData.videoUrls.length} external video URLs`);
      
      for (let i = 0; i < formData.videoUrls.length; i++) {
        try {
          const videoUrl = formData.videoUrls[i];
          const videoData = {
            url: videoUrl,
            title: `External Video ${i + 1}`,
            durationSeconds: undefined // Let the backend handle duration detection if possible
          };
          
          const videoResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/${response.id}/videos/external`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': headers.Authorization
              },
              body: JSON.stringify(videoData),
              credentials: 'include'
            }
          );
          
          if (!videoResponse.ok) {
            console.warn(`[Create Listing] Failed to add external video URL ${i + 1}:`, await videoResponse.text());
          } else {
            console.log(`[Create Listing] Successfully added external video URL ${i + 1}`);
          }
        } catch (error) {
          console.warn(`[Create Listing] Error adding external video URL ${i + 1}:`, error);
        }
      }
    }

    // Fetch the final updated listing to get all media (images + videos)
    if ((formData.images && formData.images.length > 1) || 
        (formData.videos && formData.videos.length > 0) || 
        (formData.videoUrls && formData.videoUrls.length > 0)) {
      try {
        const finalResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/${response.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': headers.Authorization
            },
            credentials: 'include'
          }
        );
        
        if (finalResponse.ok) {
          const finalListing = await finalResponse.json() as ApiListingItem;
          response.media = finalListing.media; // Use the final media array with all content
        }
      } catch (error) {
        console.warn('[Create Listing] Failed to fetch final updated listing with all media:', error);
      }
    }
    
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
      brand: response.brand || (response.brandNameEn ? { 
        id: 0, 
        name: response.brandNameEn.toLowerCase(), 
        slug: response.brandNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.brandNameEn, 
        displayNameAr: response.brandNameAr || '' 
      } : undefined),
      model: response.model || (response.modelNameEn ? { 
        id: 0, 
        name: response.modelNameEn.toLowerCase(), 
        slug: response.modelNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.modelNameEn, 
        displayNameAr: response.modelNameAr || '',
        brandId: 0
      } : undefined),
      brandNameEn: response.brandNameEn,
      brandNameAr: response.brandNameAr,
      modelNameEn: response.modelNameEn,
      modelNameAr: response.modelNameAr,
      location,
      governorate,
      image: mainImageUrl,
      media: mediaItems,
      fuelType: typeof response.fuelType === 'object' ? response.fuelType : (response.fuelTypeNameEn ? { 
        id: 0, 
        name: response.fuelTypeNameEn.toLowerCase(), 
        slug: response.fuelTypeNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.fuelTypeNameEn, 
        displayNameAr: response.fuelTypeNameAr || '' 
      } : undefined),
      transmission: typeof response.transmission === 'object' ? response.transmission : (response.transmissionNameEn ? { 
        id: 0, 
        name: response.transmissionNameEn.toLowerCase(), 
        slug: response.transmissionNameEn.toLowerCase().replace(/\s+/g, '-'), 
        displayNameEn: response.transmissionNameEn, 
        displayNameAr: response.transmissionNameAr || '' 
      } : undefined),
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
    throw new ApiError('Failed to create listing', 500);
  }
}

/**
 * Get a specific listing owned by the current user (regardless of approval status)
 * @param id Listing ID
 * @returns The listing data
 */
export async function getMyListingById(id: string | number): Promise<Listing> {
  try {
    console.log(`[Get My Listing] Fetching listing with ID: ${id}`);
    
    // First get all user's listings (this uses the authenticated endpoint)
    const myListings = await getMyListings();
    console.log(`[Get My Listing] Found ${myListings.length} total listings for user`);
    
    // Find the specific listing by ID
    const listing = myListings.find(listing => listing.id === id.toString());
    
    if (!listing) {
      console.error(`[Get My Listing] Listing with ID ${id} not found in user's listings`);
      throw new Error('Listing not found or you do not have permission to edit this listing');
    }
    
    console.log(`[Get My Listing] Successfully found listing:`, {
      id: listing.id,
      title: listing.title,
      hasMedia: listing.media && listing.media.length > 0,
      mediaCount: listing.media?.length || 0,
      hasSeller: !!listing.seller,
      hasLocation: !!listing.location,
      hasGovernorate: !!listing.governorate
    });
    
    return listing;
  } catch (error) {
    console.error('[Get My Listing] Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch listing data');
  }
}

// Upload image for an existing listing
export async function uploadListingImage(listingId: string | number, imageFile: File): Promise<{ message: string; imageKey: string }> {
  try {
    // Import getSession from our auth utils instead of NextAuth
    const { getSession } = await import('@/utils/auth');
    const session = await getSession();
    
    if (!session?.accessToken) {
      throw new ApiError('You need to log in to upload images', 401);
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', imageFile, imageFile.name);
    
    // Use fetch directly for file upload
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/${listingId}/upload-image`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
        // Do NOT set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Upload Image] HTTP ${response.status}:`, errorText);
      
      switch (response.status) {
        case 401:
          throw new ApiError('You need to log in to upload images', 401);
        case 403:
          throw new ApiError('You do not have permission to upload images for this listing', 403);
        case 404:
          throw new ApiError('Listing not found', 404);
        case 413:
          throw new ApiError('Image file is too large', 413);
        case 415:
          throw new ApiError('Image format not supported. Please use JPEG, PNG, GIF, or WebP', 415);
        default:
          throw new ApiError(`Failed to upload image: ${errorText}`, response.status);
      }
    }
    
    const result = await response.json();
    console.log('[Upload Image] Success:', result);
    return result;
  } catch (error) {
    console.error('[Upload Image] Error:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to upload image', 500);
  }
}

// Delete a single listing by ID
export async function deleteListingById(id: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await api.delete(`/api/listings/${id}`, headers);
    // Clear cache since listings have changed
    clearMyListingsCache();
  } catch (error) {
    console.error('[Delete Listing] Error:', error);
    throw error;
  }
}

// Delete multiple listings by IDs
export async function deleteMultipleListings(ids: string[]): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    // If the backend supports bulk delete, use it
    // await api.delete('/api/listings/bulk', { ...headers, body: JSON.stringify({ ids }) });
    
    // Otherwise, delete one by one
    await Promise.all(ids.map(id => api.delete(`/api/listings/${id}`, headers)));
    // Clear cache since listings have changed
    clearMyListingsCache();
  } catch (error) {
    console.error('[Delete Multiple Listings] Error:', error);
    throw error;
  }
}
