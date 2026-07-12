'use client';

import { CarMake as CarBrand, CarModel, CarTrim } from '@/types/car';
import { ApiError } from '@/utils/apiErrorHandler';
import { SessionExpiredError } from '@/utils/errors/SessionExpiredError';
import { handleSessionExpired } from '@/services/auth/session-manager';

// Reference data interfaces to match backend
export interface CarCondition {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

export interface Transmission {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

export interface FuelType {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

export interface BodyStyle {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
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
  sellerTypes: import('@/types/sellerTypes').SellerType[];
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
  
  // Enhanced V2 fields - Complete objects with IDs, slugs, and localized names
  brand: CarBrand;
  model: CarModel;
  transmission: Transmission;
  fuelType: FuelType;
  locationDetails: LocationResponse;
  governorateDetails: GovernorateResponse;
  
  modelYear: number;
  price: number;
  currency?: string;
  mileage: number;
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
  
  // Deprecated fields (maintained for backward compatibility)
  // These will be removed in a future version
  /** @deprecated Use brand.displayNameEn instead */
  brandNameEn?: string;
  /** @deprecated Use brand.displayNameAr instead */
  brandNameAr?: string;
  /** @deprecated Use model.displayNameEn instead */
  modelNameEn?: string;
  /** @deprecated Use model.displayNameAr instead */
  modelNameAr?: string;
  /** @deprecated Use governorateDetails.displayNameEn instead */
  governorateNameEn?: string;
  /** @deprecated Use governorateDetails.displayNameAr instead */
  governorateNameAr?: string;
  /** @deprecated Use transmission.displayNameEn instead */
  transmissionNameEn?: string;
  /** @deprecated Use transmission.displayNameAr instead */
  transmissionNameAr?: string;
  /** @deprecated Use fuelType.displayNameEn instead */
  fuelTypeNameEn?: string;
  /** @deprecated Use fuelType.displayNameAr instead */
  fuelTypeNameAr?: string;
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
  // Slug-based filtering (AutoTrader pattern)
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
  fuelTypeSlugs?: string[]; // Multiple fuel type slugs
  bodyStyleIds?: number[]; // Changed from bodyStyleId to support multiple selections
  bodyType?: string[]; // Body type filtering
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
  body?: string | FormData;
  timeout?: number; // Request timeout in ms
  credentials?: RequestCredentials;
  mode?: RequestMode;
};

// Define a type for request data
type RequestData = Record<string, unknown> | unknown[] | FormData | null | undefined;

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
  
  // Get session for authentication
  const authHeaders: Record<string, string> = {};
  
  // Only add auth headers for client-side requests (not SSR)
  if (typeof window !== 'undefined') {
    try {
      // Import getSession dynamically to avoid SSR issues
      const { getSession } = await import('@/utils/auth');
      const session = await getSession();

      if (session?.accessToken) {
        authHeaders.Authorization = `Bearer ${session.accessToken}`;
      }
      // Note: Missing access token is normal for unauthenticated users
    } catch (error) {
      console.warn('Failed to get session for API request:', error);
      // Continue without auth headers if session retrieval fails (e.g., after logout)
    }
  }
  
  const options: RequestOptions = {
    method,
    headers: {
      ...authHeaders,
      ...customHeaders,
    },
    mode: 'cors',
    credentials: 'include',
    timeout
  };

  // Handle FormData vs JSON data
  if (data) {
    if (data instanceof FormData) {
      // For FormData, don't set Content-Type (browser will set it with boundary)
      options.body = data;
      options.headers = {
        'Accept': 'application/json',
        ...authHeaders,
        ...customHeaders,
      };
    } else {
      // For JSON data, set appropriate headers and stringify
      options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders,
        ...customHeaders,
      };
      options.body = JSON.stringify(data);
    }
  } else {
    // No data, just set Accept header
    options.headers = {
      'Accept': 'application/json',
      ...authHeaders,
      ...customHeaders,
    };
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
      const text = await response.text();
      if (!text || text.trim() === '') {
        responseData = {}; // Return empty object for empty JSON responses
      } else {
        try {
          responseData = JSON.parse(text);
        } catch (parseError) {
          console.error('API JSON parse error:', parseError, 'Response text:', text);
          throw new Error('Invalid JSON response from server');
        }
      }
    } else {
      responseData = await response.text();
    }
    
    // Debug logging removed for performance
    // Enable with: NEXT_PUBLIC_API_DEBUG=true

    // Check for errors
    if (!response.ok) {
      // Handle 401 Unauthorized - Session Expired
      if (response.status === 401) {
        // Don't log 401 errors to console - they're expected when sessions expire
        if (typeof window !== 'undefined') {
          await handleSessionExpired();
        }
        throw new SessionExpiredError('Your session has expired');
      }
      
      // Create an ApiError with status code and response data
      let detailedErrorMessage = `Error ${response.status}: Request failed`;
      
      // Try to extract meaningful error message from response
      if (typeof responseData === 'string' && responseData.trim() !== '') {
        detailedErrorMessage = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Check for common error message fields
        const errorObj = responseData as Record<string, unknown>;
        if (errorObj.message && typeof errorObj.message === 'string') {
          detailedErrorMessage = errorObj.message;
        } else if (errorObj.error && typeof errorObj.error === 'string') {
          detailedErrorMessage = errorObj.error;
        } else if (errorObj.details && typeof errorObj.details === 'string') {
          detailedErrorMessage = errorObj.details;
        } else if (Object.keys(errorObj).length > 0) {
          // If it's an object but not with a 'message' field, stringify it.
          try {
            detailedErrorMessage = JSON.stringify(responseData);
          } catch (stringifyError) {
            console.warn('Failed to stringify error object:', stringifyError);
            detailedErrorMessage = 'Non-JSON error object received.';
          }
        } else if (response.statusText) {
          detailedErrorMessage = `Error ${response.status}: ${response.statusText}`;
        }
      } else if (response.statusText) {
         detailedErrorMessage = `Error ${response.status}: ${response.statusText}`;
      }
        
      // Log detailed error information for debugging - using direct values
      console.error('API error details - Status:', response.status);
      console.error('API error details - StatusText:', response.statusText);
      console.error('API error details - URL:', url);
      console.error('API error details - Message:', detailedErrorMessage);
      console.error('API error details - RawResponse:', JSON.stringify(responseData));
      
      // Create error details object with explicit values
      const errorDetails = {
        status: response.status, 
        statusText: response.statusText,
        url: url,
        message: detailedErrorMessage, 
        rawResponse: JSON.stringify(responseData)
      };
      
      console.error('API error details object:', errorDetails);
      
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
  
  patch: <T>(endpoint: string, data?: RequestData, customHeaders?: Record<string, string>, timeout?: number) => 
    apiRequest<T>(endpoint, 'PATCH', data, customHeaders, timeout),
  
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => 
    apiRequest<T>(endpoint, 'DELETE', undefined, customHeaders),
};

/**
 * Fetches all car brands
 */
export async function fetchCarBrands(): Promise<CarBrand[]> {
  return api.get<CarBrand[]>('/api/v1/reference-data/brands');
}

/**
 * Fetches models for a specific brand
 */
export async function fetchCarModels(brandId: number): Promise<CarModel[]> {
  return api.get<CarModel[]>(`/api/v1/reference-data/brands/${brandId}/models`);
}





/**
 * Searches for car models within a specific brand (supports both English and Arabic)
 */
export async function searchCarModelsByBrand(brandId: number, query: string): Promise<CarModel[]> {
  if (!query || query.trim().length === 0) {
    return fetchCarModels(brandId); // Return all models for brand if no query
  }
  return api.get<CarModel[]>(`/api/v1/reference-data/brands/${brandId}/models/search?q=${encodeURIComponent(query.trim())}`);
}

/**
 * Fetches trims for a specific model
 */
export async function fetchCarTrims(brandId: number, modelId: number): Promise<CarTrim[]> {
  return api.get<CarTrim[]>(`/api/v1/reference-data/brands/${brandId}/models/${modelId}/trims`);
}

/**
 * Fetches all car reference data (conditions, transmissions, fuel types, etc.)
 */
export async function fetchCarReferenceData(): Promise<CarReferenceData> {
  return api.get<CarReferenceData>('/api/v1/reference-data');
}

/**
 * Fetches car conditions only
 */
export async function fetchCarConditions(): Promise<CarCondition[]> {
  return api.get<CarCondition[]>('/api/v1/car-conditions');
}

/**
 * Fetches transmissions only
 */
export async function fetchTransmissions(): Promise<Transmission[]> {
  return api.get<Transmission[]>('/api/v1/transmissions');
}

/**
 * Fetches fuel types only
 */
export async function fetchFuelTypes(): Promise<FuelType[]> {
  return api.get<FuelType[]>('/api/v1/fuel-types');
}

/**
 * Fetches body styles only
 */
export async function fetchBodyStyles(): Promise<BodyStyle[]> {
  return api.get<BodyStyle[]>('/api/v1/body-styles');
}

/**
 * Fetches drive types only
 */
export async function fetchDriveTypes(): Promise<DriveType[]> {
  return api.get<DriveType[]>('/api/v1/drive-types');
}

/**
 * Fetches all governorates from the API (stub for backward compatibility)
 * @returns Promise with array of governorates
 */
export async function fetchGovernorates(): Promise<Governorate[]> {
  return api.get<Governorate[]>('/api/v1/reference-data/governorates');
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
    if (filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0) {
      queryParams.append('fuelTypeSlugs', filters.fuelTypeSlugs.join(','));
    }
            if (filters.bodyType && filters.bodyType.length > 0) {
          queryParams.append('bodyType', filters.bodyType.join('-'));
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
  
  const endpoint = `/api/v1/listings/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  try {
    const result = await api.get<PageResponse<CarListing>>(endpoint);
    return result;
  } catch (error) {
    console.error('❌ Error fetching car listings:', error);
    throw error;
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
    const url = `/api/v1/listings/counts/brands${queryString ? `?${queryString}` : ''}`;
    
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
    const url = `/api/v1/listings/counts/models${queryString ? `?${queryString}` : ''}`;
    
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

// In-memory cache for API responses (fastest access)
const apiCache = new Map<string, CachedData<unknown>>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

// Keys that should be persisted to LocalStorage (long-lived reference data)
const PERSISTENT_ENDPOINTS = [
  '/api/v1/reference-data/brands',
  '/api/v1/reference-data/governorates',
  '/api/v1/reference-data',
  '/api/v1/car-conditions',
  '/api/v1/transmissions',
  '/api/v1/fuel-types',
  '/api/v1/body-styles',
  '/api/v1/drive-types'
];

/**
 * Loads data from LocalStorage safely
 */
const loadFromLocalStorage = <T>(key: string): CachedData<T> | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = window.localStorage.getItem(`api_cache_${key}`);
    if (item) {
      return JSON.parse(item) as CachedData<T>;
    }
  } catch (error) {
    console.warn('Failed to load from LocalStorage:', error);
  }
  return null;
};

/**
 * Saves data to LocalStorage safely
 */
const saveToLocalStorage = <T>(key: string, data: CachedData<T>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(`api_cache_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to LocalStorage (possibly full):', error);
  }
};

/**
 * Fetches data from the API with caching support (Memory + LocalStorage)
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
  
  // 1. Check In-Memory Cache (Fastest)
  const cachedItem = apiCache.get(cacheKey) as CachedData<T> | undefined;
  if (cachedItem && Date.now() - cachedItem.timestamp < expiration) {
    return cachedItem.data;
  }
  
  // 2. Check LocalStorage (Persistent) - only for whitelisted endpoints
  const isPersistent = PERSISTENT_ENDPOINTS.some(p => endpoint.startsWith(p));
  if (isPersistent) {
    const localItem = loadFromLocalStorage<T>(cacheKey);
    // Allow persistent data to live longer (e.g., 24 hours) or use same expiration?
    // For now using same expiration but it survives reloads.
    if (localItem && Date.now() - localItem.timestamp < expiration * 12) { // 1 hour for persistent
       // Hydrate memory cache
       apiCache.set(cacheKey, localItem);
       return localItem.data;
    }
  }
  
  // 3. Fetch Fresh Data
  const data = await fetchFn();
  
  // 4. Update Caches
  const cacheEntry = {
    data,
    timestamp: Date.now()
  };
  
  apiCache.set(cacheKey, cacheEntry);
  
  if (isPersistent) {
    saveToLocalStorage(cacheKey, cacheEntry);
  }
  
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
      
    // Also clear from localStorage
    if (typeof window !== 'undefined') {
       // This is a naive clear for localStorage, matching exact keys might be hard without index
       // For now, we rely on expiration
    }
  } else {
    // Clear entire cache
    apiCache.clear();
    // Clear all api_cache_ items from localStorage
     if (typeof window !== 'undefined') {
        Object.keys(window.localStorage)
          .filter(k => k.startsWith('api_cache_'))
          .forEach(k => window.localStorage.removeItem(k));
     }
  }
}

// ================================
// PUBLIC API FUNCTIONS (No Authentication Required)
// ================================

/**
 * Fetch car listings publicly (no authentication required)
 * Uses the public /api/v1/listings/filter endpoint
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

    // Add filters using the correct property names
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

    // Location filters
    if (filters?.locations && filters.locations.length > 0) {
      filters.locations.forEach(loc => {
        queryParams.append('location', loc);
      });
    }

    // Numeric filters
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

    // Entity filters
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

    // Search query
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
        // NO Authorization header - this is a public endpoint
      },
      // No credentials needed for public endpoint
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error fetching public car listings:', error);
    throw error;
  }
}

/**
 * Fetch a single car listing publicly (no authentication required)
 */
export async function fetchCarListingPublic(id: string | number): Promise<CarListing> {
  try {
    const url = `${API_BASE_URL}/api/v1/listings/${id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // NO Authorization header - this is a public endpoint
      },
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
    console.error('Error fetching public car listing:', error);
    throw error;
  }
}

/**
 * Get car listing counts by various filters (public endpoint)
 * Useful for showing "X cars available" without authentication
 */
export async function getCarListingCountsPublic(filters?: CarListingFilterParams): Promise<number> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add the same filters as fetchCarListingsPublic but for counting
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

    const url = `${API_BASE_URL}/api/v1/listings/count?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch listing count: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.count || 0;

  } catch (error) {
    console.error('Error fetching public listing count:', error);
    return 0; // Return 0 on error rather than throwing
  }
}

/**
 * Fetch featured/latest listings for homepage (public endpoint)
 */
export async function fetchFeaturedListingsPublic(limit: number = 12): Promise<CarListing[]> {
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
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch featured listings: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.content || [];

  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return []; // Return empty array on error
  }
}
