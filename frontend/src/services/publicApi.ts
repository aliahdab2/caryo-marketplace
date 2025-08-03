// Server-side API functions for public endpoints
// These functions can be called from Server Components for better SEO

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface CarListing {
  id: number;
  title: string;
  brandNameEn: string;
  brandNameAr: string;
  modelNameEn: string;
  modelNameAr: string;
  governorateNameEn: string;
  governorateNameAr: string;
  locationDetails: LocationResponse;
  governorateDetails: GovernorateResponse;
  modelYear: number;
  price: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  transmissionNameEn: string;
  transmissionNameAr: string;
  fuelTypeNameEn: string;
  fuelTypeNameAr: string;
  description: string;
  media: ListingMediaResponse[];
  approved: boolean;
  sellerId: number;
  sellerUsername: string;
  createdAt: string;
  isSold: boolean;
  isArchived: boolean;
  isUserActive: boolean;
  isExpired: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface LocationResponse {
  id: number;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  countryCode: string;
  governorateId: number;
  governorateNameEn: string;
  governorateNameAr: string;
  latitude?: number;
  longitude?: number;
  region: string;
  active: boolean;
}

export interface GovernorateResponse {
  id: number;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  countryId: number;
  countryCode: string;
  countryNameEn: string;
  countryNameAr: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export interface ListingMediaResponse {
  id: number;
  url: string;
  type: string;
}

export interface CarListingFilterParams {
  brands?: string[];
  models?: string[];
  searchQuery?: string;
  minYear?: number;
  maxYear?: number;
  locations?: string[];
  locationId?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  conditionId?: number;
  transmissionId?: number;
  fuelTypeSlugs?: string[];
  bodyStyleIds?: number[];
  bodyType?: string[];
  sellerTypeIds?: number[];
  isSold?: boolean;
  isArchived?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Fetch car listings publicly (server-side, no authentication required)
 * This function can be called from Server Components for better SEO
 */
export async function fetchCarListingsPublic(filters?: CarListingFilterParams): Promise<PageResponse<CarListing>> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    if (filters?.page !== undefined) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters?.size !== undefined) {
      queryParams.append('size', filters.size.toString());
    }
    if (filters?.sort) {
      queryParams.append('sort', filters.sort);
    }

    // Add filters
    if (filters?.brands && filters.brands.length > 0) {
      filters.brands.forEach(brand => {
        queryParams.append('brandSlugs', brand);
      });
    }

    if (filters?.models && filters.models.length > 0) {
      filters.models.forEach(model => {
        queryParams.append('modelSlugs', model);
      });
    }

    if (filters?.locations && filters.locations.length > 0) {
      filters.locations.forEach(loc => {
        queryParams.append('location', loc);
      });
    }

    if (filters?.minYear && filters.minYear > 1900) {
      queryParams.append('minYear', filters.minYear.toString());
    }
    if (filters?.maxYear && filters.maxYear <= new Date().getFullYear() + 1) {
      queryParams.append('maxYear', filters.maxYear.toString());
    }
    if (filters?.minPrice !== undefined && filters.minPrice >= 0) {
      queryParams.append('minPrice', filters.minPrice.toString());
    }
    if (filters?.maxPrice !== undefined && filters.maxPrice >= 0) {
      queryParams.append('maxPrice', filters.maxPrice.toString());
    }
    if (filters?.minMileage !== undefined && filters.minMileage >= 0) {
      queryParams.append('minMileage', filters.minMileage.toString());
    }
    if (filters?.maxMileage !== undefined && filters.maxMileage >= 0) {
      queryParams.append('maxMileage', filters.maxMileage.toString());
    }

    if (filters?.transmissionId && filters.transmissionId > 0) {
      queryParams.append('transmissionId', filters.transmissionId.toString());
    }
    if (filters?.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0) {
      filters.fuelTypeSlugs.forEach(slug => {
        queryParams.append('fuelTypeSlugs', slug);
      });
    }
    if (filters?.bodyStyleIds && filters.bodyStyleIds.length > 0) {
      filters.bodyStyleIds.forEach(id => {
        queryParams.append('bodyStyleIds', id.toString());
      });
    }
    if (filters?.sellerTypeIds && filters.sellerTypeIds.length > 0) {
      filters.sellerTypeIds.forEach(id => {
        queryParams.append('sellerTypeIds', id.toString());
      });
    }

    if (filters?.searchQuery) {
      queryParams.append('searchQuery', filters.searchQuery);
    }

    // Make PUBLIC API call (no authentication headers)
    const url = `${API_BASE_URL}/api/listings/filter?${queryParams.toString()}`;
    console.log('Server-side public API call:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data for server-side rendering
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Server-side public listings fetched:', result.totalElements, 'total items');
    return result;

  } catch (error) {
    console.error('Error fetching public car listings (server-side):', error);
    throw error;
  }
}

/**
 * Fetch a single car listing publicly (server-side, no authentication required)
 */
export async function fetchCarListingPublic(id: string | number): Promise<CarListing> {
  try {
    const url = `${API_BASE_URL}/api/listings/${id}`;
    console.log('Server-side public listing API call:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Car listing not found');
      }
      throw new Error(`Failed to fetch listing: ${response.status} ${response.statusText}`);
    }

    const listing = await response.json();
    console.log('Server-side public listing fetched:', listing.id);
    return listing;

  } catch (error) {
    console.error('Error fetching public car listing (server-side):', error);
    throw error;
  }
}

/**
 * Fetch latest listings for homepage (server-side, no authentication required)
 * Gets the most recently added cars, sorted by creation date
 */
export async function fetchLatestListingsPublic(limit: number = 12): Promise<CarListing[]> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('size', limit.toString());
    queryParams.append('sort', 'createdAt,desc'); // Latest first
    
    const url = `${API_BASE_URL}/api/listings?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest listings: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Server-side latest listings fetched:', result.content?.length || 0, 'items');
    return result.content || [];

  } catch (error) {
    console.error('Error fetching latest listings (server-side):', error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch featured/latest listings for homepage (server-side, no authentication required)
 * @deprecated Use fetchLatestListingsPublic instead
 */
export async function fetchFeaturedListingsPublic(limit: number = 12): Promise<CarListing[]> {
  return fetchLatestListingsPublic(limit);
}

/**
 * Get car listing counts by various filters (server-side, no authentication required)
 */
export async function getCarListingCountsPublic(filters?: CarListingFilterParams): Promise<number> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters?.brands && filters.brands.length > 0) {
      filters.brands.forEach(brand => {
        queryParams.append('brandSlugs', brand);
      });
    }

    if (filters?.models && filters.models.length > 0) {
      filters.models.forEach(model => {
        queryParams.append('modelSlugs', model);
      });
    }

    if (filters?.locations && filters.locations.length > 0) {
      filters.locations.forEach(loc => {
        queryParams.append('location', loc);
      });
    }

    const url = `${API_BASE_URL}/api/listings/count?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch listing count: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.count || 0;

  } catch (error) {
    console.error('Error fetching public listing count (server-side):', error);
    return 0; // Return 0 on error rather than throwing
  }
}

/**
 * Newsletter subscription interfaces and functions
 */
export interface NewsletterSubscriptionRequest {
  email: string;
  preferredLanguage?: string;
  source?: string;
}

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message: string;
  email?: string;
  alreadySubscribed?: boolean;
  requiresConfirmation?: boolean;
}

/**
 * Subscribe to newsletter (client-side)
 */
export async function subscribeToNewsletter(request: NewsletterSubscriptionRequest): Promise<NewsletterSubscriptionResponse> {
  try {
    const url = `${API_BASE_URL}/api/public/newsletter/subscribe`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: request.email,
        preferredLanguage: request.preferredLanguage || 'en',
        source: request.source || 'homepage'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to subscribe to newsletter: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Newsletter subscription successful:', result.email);
    return result;

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return {
      success: false,
      message: 'Failed to subscribe to newsletter. Please try again later.'
    };
  }
}
