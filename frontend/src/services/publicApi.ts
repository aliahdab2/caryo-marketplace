// Server-side API functions for public endpoints
// These functions can be called from Server Components for better SEO

import type { CarMake } from '@/types/car';

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
    const url = `${API_BASE_URL}/api/v1/listings/filter?${queryParams.toString()}`;
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
    const url = `${API_BASE_URL}/api/v1/listings/${id}`;
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
    
    const url = `${API_BASE_URL}/api/v1/listings?${queryParams.toString()}`;
    
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
    return result.content || [];

  } catch (error) {
    console.error('Error fetching latest listings (server-side):', error);
    return []; // Return empty array on error
  }
}

// Paged latest listings for homepage
export interface PagedListingsResult {
  items: CarListing[];
  totalItems: number;
  totalPages: number;
  page: number; // zero-based from backend
}

export async function fetchLatestListingsPage(params: { page?: number; size?: number } = {}): Promise<PagedListingsResult> {
  const { page = 0, size = 12 } = params;
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('size', String(size));
    queryParams.append('sort', 'createdAt,desc');

    const url = `${API_BASE_URL}/api/v1/listings?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest listings (paged): ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const items: CarListing[] = result.content || [];
    const totalItems: number = typeof result.totalElements === 'number' ? result.totalElements : items.length;
    const totalPages: number = typeof result.totalPages === 'number' ? result.totalPages : 1;
    const currentPage: number = typeof result.number === 'number' ? result.number : page;

    return { items, totalItems, totalPages, page: currentPage };
  } catch (error) {
    console.error('Error fetching latest listings (paged):', error);
    return { items: [], totalItems: 0, totalPages: 1, page: 0 };
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

    // Use the filtered count endpoint which honors query params
    const url = `${API_BASE_URL}/api/v1/listings/count/filter?${queryParams.toString()}`;
    
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
 * Get body style counts (public endpoint, no authentication required)
 * Returns a map of body style slugs to counts
 * @param filters Optional filters to apply (brands, models, price range, etc.)
 * @returns Promise resolving to an object with body style slugs as keys and counts as values
 */
export async function getBodyStyleCounts(filters?: CarListingFilterParams): Promise<Record<string, number>> {
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

    if (filters?.minYear) {
      queryParams.append('minYear', filters.minYear.toString());
    }

    if (filters?.maxYear) {
      queryParams.append('maxYear', filters.maxYear.toString());
    }

    if (filters?.locations && filters.locations.length > 0) {
      filters.locations.forEach(loc => {
        queryParams.append('location', loc);
      });
    }

    if (filters?.minPrice) {
      queryParams.append('minPrice', filters.minPrice.toString());
    }

    if (filters?.maxPrice) {
      queryParams.append('maxPrice', filters.maxPrice.toString());
    }

    if (filters?.minMileage) {
      queryParams.append('minMileage', filters.minMileage.toString());
    }

    if (filters?.maxMileage) {
      queryParams.append('maxMileage', filters.maxMileage.toString());
    }

    if (filters?.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0) {
      filters.fuelTypeSlugs.forEach(fuel => {
        queryParams.append('fuelTypeSlugs', fuel);
      });
    }

    if (filters?.transmissionId) {
      queryParams.append('transmissionIds', filters.transmissionId.toString());
    }

    const url = `${API_BASE_URL}/api/v1/listings/counts/body-styles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch body style counts: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // The backend returns { count: { "sedan": 1500, "suv": 800, ... } }
    return result.count || {};

  } catch (error) {
    console.error('Error fetching body style counts:', error);
    return {}; // Return empty object on error
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
    const url = `${API_BASE_URL}/api/v1/public/newsletter/subscribe`;
    
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
    return result;

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return {
      success: false,
      message: 'Failed to subscribe to newsletter. Please try again later.'
    };
  }
}

// ============================================================================
// Server-side Reference Data Functions (for Server Components / SSR)
// ============================================================================

// Re-export Governorate type for convenience
export interface Governorate {
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

// Internal type for API response (may differ from CarMake)
interface BrandApiResponse {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  active?: boolean;
  isActive?: boolean;
}

/**
 * Fetches all car brands (server-side)
 * Can be called from Server Components
 */
export async function fetchCarBrandsPublic(): Promise<CarMake[]> {
  try {
    const url = `${API_BASE_URL}/api/v1/reference-data/brands`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Failed to fetch brands: ${response.status}`);
      return [];
    }

    const data: BrandApiResponse[] = await response.json();

    // Transform to match CarMake type
    return data.map(brand => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      displayNameEn: brand.displayNameEn,
      displayNameAr: brand.displayNameAr,
      isActive: brand.isActive ?? brand.active ?? true,
    }));
  } catch (error) {
    console.error('Error fetching car brands:', error);
    return [];
  }
}

/**
 * Fetches all governorates (server-side)
 * Can be called from Server Components
 */
export async function fetchGovernoratesPublic(): Promise<Governorate[]> {
  try {
    const url = `${API_BASE_URL}/api/v1/reference-data/governorates`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Failed to fetch governorates: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching governorates:', error);
    return [];
  }
}
