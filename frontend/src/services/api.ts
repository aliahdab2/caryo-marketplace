'use client';

import { CarMake, CarModel, CarTrim } from '@/types/car';
import { ApiError } from '@/utils/apiErrorHandler';

// Reference data interfaces to match backend
export interface CarCondition {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface Transmission {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface FuelType {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface BodyStyle {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface DriveType {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface CarReferenceData {
  carConditions: CarCondition[];
  driveTypes: DriveType[];
  bodyStyles: BodyStyle[];
  fuelTypes: FuelType[];
  transmissions: Transmission[];
  sellerTypes: Record<string, unknown>[];
}

export interface Governorate {
  id: number;
  name?: string;
  displayNameEn: string;
  displayNameAr: string;
  slug?: string;
  countryCode?: string;
}

// Car Listing interfaces
export interface ListingMediaResponse {
  id: number;
  url: string;
  fileKey: string;
  fileName: string;
  contentType: string;
  size: number;
  sortOrder: number;
  isPrimary: boolean;
  mediaType: string;
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
  region: string;
  latitude: number;
  longitude: number;
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
  region: string;
  latitude: number;
  longitude: number;
}

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
  last: boolean;
}

export interface CarListingFilterParams {
  // Slug-based filtering (AutoTrader UK pattern)
  brands?: string[]; // Array of brand slugs: ["toyota", "honda", "bmw"]  
  models?: string[]; // Array of model slugs: ["camry", "civic", "x3"]
  
  // Search query parameter
  searchQuery?: string; // Text search in title, description, brand and model names (supports Arabic)
  
  // Filter parameters
  minYear?: number;
  maxYear?: number;
  locations?: string[]; // Multiple location slugs
  locationId?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  
  // Entity filters  
  conditionId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  bodyStyleIds?: number[]; // Changed from bodyStyleId to support multiple selections
  sellerTypeIds?: number[];
  
  // Status filters
  isSold?: boolean;
  isArchived?: boolean;
  
  // Pagination and sorting
  page?: number;
  size?: number;
  sort?: string;
}

// Base URL for the API - will be set from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type RequestOptions = {
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number; // Request timeout in ms
  credentials?: RequestCredentials;
  mode?: RequestMode;
};

// Define a type for request data
type RequestData = Record<string, unknown> | unknown[] | null | undefined;

/**
 * Generic function to make API requests
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string, 
  data?: RequestData, 
  customHeaders?: Record<string, string>,
  timeout: number = 15000 // Default timeout: 15 seconds
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    },
    mode: 'cors',
    credentials: 'include',
    timeout
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    // Create a controller to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    // Parse the response
    let responseData: unknown;
    
    // Try to parse as JSON first
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Check for errors
    if (!response.ok) {
      // Create an ApiError with status code and response data
      let detailedErrorMessage = `Error ${response.status}: Request failed`;
      if (typeof responseData === 'string' && responseData.trim() !== '') {
        detailedErrorMessage = responseData;
      } else if (responseData && typeof responseData === 'object' && (responseData as { message?: string })?.message) {
        detailedErrorMessage = (responseData as { message: string }).message;
      } else if (responseData && typeof responseData === 'object' && Object.keys(responseData).length > 0) {
        // If it's an object but not with a 'message' field, stringify it.
        try {
          detailedErrorMessage = JSON.stringify(responseData);
        } catch (stringifyError) { // Changed variable name to avoid conflict and indicate usage
          console.warn('Failed to stringify error object:', stringifyError);
          detailedErrorMessage = 'Non-JSON error object received.';
        }
      } else if (responseData && typeof responseData === 'object' && Object.keys(responseData).length === 0 && response.statusText) {
        // If it's an empty object, use statusText if available
        detailedErrorMessage = `Error ${response.status}: ${response.statusText || 'Empty error response'}`;
      } else if (response.statusText) {
         detailedErrorMessage = `Error ${response.status}: ${response.statusText}`;
      }
        
      console.error('API error details:', { status: response.status, message: detailedErrorMessage, rawResponse: responseData });
      throw new ApiError(detailedErrorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error) {
    console.error('Request failed:', error);
    
    // Handle timeout/abort errors explicitly
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 0);
    }
    
    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Convert other errors to ApiError
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    );
  }
}

// Export common request methods
export const api = {
  get: <T>(endpoint: string, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'GET', undefined, customHeaders, timeout),
  
  post: <T>(endpoint: string, data: RequestData, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'POST', data, customHeaders, timeout),
  
  put: <T>(endpoint: string, data: RequestData, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'PUT', data, customHeaders, timeout),
  
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'DELETE', undefined, customHeaders),
};

/**
 * Fetches all car brands
 */
export async function fetchCarBrands(): Promise<CarMake[]> {
  return api.get<CarMake[]>('/api/reference-data/brands');
}

/**
 * Fetches models for a specific brand
 */
export async function fetchCarModels(brandId: number): Promise<CarModel[]> {
  return api.get<CarModel[]>(`/api/reference-data/brands/${brandId}/models`);
}





/**
 * Searches for car models within a specific brand (supports both English and Arabic)
 */
export async function searchCarModelsByBrand(brandId: number, query: string): Promise<CarModel[]> {
  if (!query || query.trim().length === 0) {
    return fetchCarModels(brandId); // Return all models for brand if no query
  }
  return api.get<CarModel[]>(`/api/reference-data/brands/${brandId}/models/search?q=${encodeURIComponent(query.trim())}`);
}

/**
 * Fetches trims for a specific model
 */
export async function fetchCarTrims(brandId: number, modelId: number): Promise<CarTrim[]> {
  return api.get<CarTrim[]>(`/api/reference-data/brands/${brandId}/models/${modelId}/trims`);
}

/**
 * Fetches all car reference data (conditions, transmissions, fuel types, etc.)
 */
export async function fetchCarReferenceData(): Promise<CarReferenceData> {
  return api.get<CarReferenceData>('/api/reference-data');
}

/**
 * Fetches car conditions only
 */
export async function fetchCarConditions(): Promise<CarCondition[]> {
  return api.get<CarCondition[]>('/api/car-conditions');
}

/**
 * Fetches transmissions only
 */
export async function fetchTransmissions(): Promise<Transmission[]> {
  return api.get<Transmission[]>('/api/transmissions');
}

/**
 * Fetches fuel types only
 */
export async function fetchFuelTypes(): Promise<FuelType[]> {
  return api.get<FuelType[]>('/api/fuel-types');
}

/**
 * Fetches body styles only
 */
export async function fetchBodyStyles(): Promise<BodyStyle[]> {
  return api.get<BodyStyle[]>('/api/body-styles');
}

/**
 * Fetches drive types only
 */
export async function fetchDriveTypes(): Promise<DriveType[]> {
  return api.get<DriveType[]>('/api/drive-types');
}

/**
 * Fetches all governorates from the API (stub for backward compatibility)
 * @returns Promise with array of governorates
 */
export async function fetchGovernorates(): Promise<Governorate[]> {
  return api.get<Governorate[]>('/api/reference-data/governorates');
}

/**
 * Fetches car listings with optional filters
 * Uses slug-based filtering for brands and models
 */
export async function fetchCarListings(filters?: CarListingFilterParams): Promise<PageResponse<CarListing>> {
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (filters) {
    // Slug-based filtering - backend expects brandSlugs/modelSlugs parameters
    if (filters.brands && filters.brands.length > 0) {
      filters.brands.forEach(brandSlug => {
        if (brandSlug.trim()) { // Validate non-empty slugs
          queryParams.append('brandSlugs', brandSlug);
        }
      });
    }
    
    if (filters.models && filters.models.length > 0) {
      filters.models.forEach(modelSlug => {
        if (modelSlug.trim()) { // Validate non-empty slugs
          queryParams.append('modelSlugs', modelSlug);
        }
      });
    }
    
    // Add numeric filter parameters with validation
    if (filters.minYear && filters.minYear > 1900) queryParams.append('minYear', filters.minYear.toString());
    if (filters.maxYear && filters.maxYear <= new Date().getFullYear() + 1) {
      queryParams.append('maxYear', filters.maxYear.toString());
    }
    if (filters.minPrice && filters.minPrice >= 0) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice && filters.maxPrice >= 0) queryParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.minMileage && filters.minMileage >= 0) queryParams.append('minMileage', filters.minMileage.toString());
    if (filters.maxMileage && filters.maxMileage >= 0) queryParams.append('maxMileage', filters.maxMileage.toString());
    
    // Location filters - support multiple locations
    if (filters.locations && filters.locations.length > 0) {
      filters.locations.forEach(location => {
        if (location.trim()) { // Validate non-empty locations
          queryParams.append('location', location);
        }
      });
    }
    if (filters.locationId && filters.locationId > 0) queryParams.append('locationId', filters.locationId.toString());
    
    // Search query filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      queryParams.append('searchQuery', filters.searchQuery.trim());
    }
    
    // Entity ID filters
    if (filters.conditionId && filters.conditionId > 0) queryParams.append('conditionId', filters.conditionId.toString());
    if (filters.transmissionId && filters.transmissionId > 0) queryParams.append('transmissionIds', filters.transmissionId.toString());
    if (filters.fuelTypeId && filters.fuelTypeId > 0) queryParams.append('fuelTypeIds', filters.fuelTypeId.toString());
    if (filters.bodyStyleIds && filters.bodyStyleIds.length > 0) {
      filters.bodyStyleIds.forEach(id => queryParams.append('bodyStyleIds', id.toString()));
    }
    if (filters.sellerTypeIds && filters.sellerTypeIds.length > 0) {
      filters.sellerTypeIds.forEach(id => queryParams.append('sellerTypeIds', id.toString()));
    }
    
    // Status filters
    if (filters.isSold !== undefined) queryParams.append('isSold', filters.isSold.toString());
    if (filters.isArchived !== undefined) queryParams.append('isArchived', filters.isArchived.toString());
    
    // Pagination with validation
    if (filters.page !== undefined && filters.page >= 0) queryParams.append('page', filters.page.toString());
    if (filters.size !== undefined && filters.size > 0 && filters.size <= 100) {
      queryParams.append('size', filters.size.toString());
    }
    if (filters.sort) queryParams.append('sort', filters.sort);
  }
  
  const endpoint = `/api/listings/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  try {
    const result = await api.get<PageResponse<CarListing>>(endpoint);
    return result;
  } catch (error) {
    console.error('❌ Error fetching car listings:', error);
    throw error;
  }
}

/**
 * Fetches car listing count for a specific body style filter
 * TODO: Implement this endpoint in the backend
 * Expected endpoint: GET /api/listings/count?bodyStyleId={id}
 * Expected response: { count: number }
 */
export async function fetchCarListingCountByBodyStyle(bodyStyleId: number): Promise<number> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('bodyStyleId', bodyStyleId.toString());
    
    const endpoint = `/api/listings/count?${queryParams.toString()}`;
    const response = await api.get<{ count: number }>(endpoint);
    return response.count || 0;
  } catch (error) {
    console.error('❌ Error fetching car count for body style:', error);
    throw error; // Throw the error so the caller can handle it
  }
}

/**
 * Fetches brand counts with optional filters
 * @param filters Optional filters to apply
 * @returns Object with brand slugs as keys and counts as values
 */
export async function fetchBrandCounts(filters?: Partial<CarListingFilterParams>): Promise<Record<string, number>> {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query parameters
    if (filters?.models) {
      filters.models.forEach(model => params.append('modelSlugs', model));
    }
    if (filters?.minYear) params.append('minYear', filters.minYear.toString());
    if (filters?.maxYear) params.append('maxYear', filters.maxYear.toString());
    if (filters?.locations) {
      filters.locations.forEach(location => params.append('location', location));
    }
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    
    const queryString = params.toString();
    const url = `/api/listings/counts/brands${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<Record<string, number>>(url);
    return response || {};
  } catch (error) {
    console.error('Error fetching brand counts:', error);
    return {};
  }
}

/**
 * Fetches model counts with optional filters
 * @param filters Optional filters to apply
 * @returns Object with model slugs as keys and counts as values
 */
export async function fetchModelCounts(filters?: Partial<CarListingFilterParams>): Promise<Record<string, number>> {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query parameters
    if (filters?.brands) {
      filters.brands.forEach(brand => params.append('brandSlugs', brand));
    }
    if (filters?.minYear) params.append('minYear', filters.minYear.toString());
    if (filters?.maxYear) params.append('maxYear', filters.maxYear.toString());
    if (filters?.locations) {
      filters.locations.forEach(location => params.append('location', location));
    }
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    
    const queryString = params.toString();
    const url = `/api/listings/counts/models${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<Record<string, number>>(url);
    return response || {};
  } catch (error) {
    console.error('Error fetching model counts:', error);
    return {};
  }
}

/**
 * Creates cache key for any API request
 * @param endpoint API endpoint
 * @param params Additional parameters for cache key
 * @returns Cache key string
 */
export const createCacheKey = (endpoint: string, params?: Record<string, string | number>): string => {
  // Don't create cache keys for endpoints with "null" or "undefined" in them
  if (endpoint.includes('null') || endpoint.includes('undefined')) {
    return '';
  }
  
  let key = endpoint;
  if (params) {
    // Filter out null and undefined values
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
      
    if (filteredParams.length > 0) {
      key += '-' + filteredParams.map(([k, v]) => `${k}=${v}`).join('-');
    }
  }
  return key;
};

// Helper type for cached API responses
type CachedData<T> = {
  data: T;
  timestamp: number;
};

// In-memory cache for API responses
const apiCache = new Map<string, CachedData<unknown>>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Fetches data from the API with caching support
 * @param endpoint API endpoint
 * @param fetchFn Function to fetch data if not in cache
 * @param params Additional parameters for cache key
 * @param expiration Cache expiration time in ms (default: 5 minutes)
 * @returns Promise with cached or fresh data
 */
export async function fetchWithCache<T>(
  endpoint: string,
  fetchFn: () => Promise<T>,
  params?: Record<string, string | number>,
  expiration: number = CACHE_EXPIRATION_MS
): Promise<T> {
  // Skip caching for invalid endpoints
  if (endpoint.includes('null') || endpoint.includes('undefined')) {
    return fetchFn();
  }
  
  const cacheKey = createCacheKey(endpoint, params);
  
  // If no valid cache key, execute fetch directly
  if (!cacheKey) {
    return fetchFn();
  }
  
  const cachedItem = apiCache.get(cacheKey) as CachedData<T> | undefined;
  
  // Return cached data if still valid
  if (cachedItem && Date.now() - cachedItem.timestamp < expiration) {
    return cachedItem.data;
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the response
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}

/**
 * Clears specific items or the entire API cache
 * @param endpoint Optional endpoint to clear (clears all if not specified)
 */
export function clearApiCache(endpoint?: string): void {
  if (endpoint) {
    // Clear specific endpoint(s)
    const prefix = endpoint;
    [...apiCache.keys()]
      .filter(key => key.startsWith(prefix))
      .forEach(key => apiCache.delete(key));
  } else {
    // Clear entire cache
    apiCache.clear();
  }
}
