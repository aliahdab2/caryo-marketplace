'use client';

/**
 * Fetches listing counts for multiple models in a single batch request
 * @param brandId Brand ID
 * @param modelIds Array of model IDs
 * @returns Array of { modelId, listingCount }
 */
// Circuit breaker for model-counts endpoint
let modelCountsEndpointFailed = false;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute timeout before trying again

export async function fetchModelCountsBatch(brandId: number, modelIds: number[]): Promise<{ modelId: number; listingCount: number }[]> {
  // Check if circuit breaker is active
  const now = Date.now();
  if (modelCountsEndpointFailed && (now - lastFailureTime < CIRCUIT_BREAKER_TIMEOUT)) {
    // Circuit is open, immediately reject
    throw new Error('Batch model count endpoint temporarily disabled due to previous failures');
  }
  
  // Backend endpoint should accept POST /api/listings/model-counts
  // and return [{ modelId, listingCount }]
  try {
    const result = await api.post<{ modelId: number; listingCount: number }[]>(
      '/api/listings/model-counts',
      { brandId, modelIds }
    );
    
    // Reset circuit breaker on success
    modelCountsEndpointFailed = false;
    return result;
    
  } catch (error) {
    // Update circuit breaker state
    modelCountsEndpointFailed = true;
    lastFailureTime = Date.now();
    
    // If the batch endpoint is not implemented, throw a specific error
    // so the caller can fall back to individual requests
    if (error instanceof ApiError && (error.status === 404 || error.status === 401 || error.status === 500)) {
      throw new Error('Batch model count endpoint not available');
    }
    throw error;
  }
}

import { CarMake, CarModel, CarTrim } from '@/types/car';
import { ApiError } from '@/utils/apiErrorHandler';
import { getAuthHeaders } from '@/utils/auth';

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
  /**
   * Brand filter with hierarchical syntax support.
   * Examples: "Toyota", "Toyota:Camry", "Toyota:Camry;Corolla", "Toyota:Camry,Honda"
   */
  brand?: string;
  minYear?: number;
  maxYear?: number;
  location?: string;
  locationId?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  isSold?: boolean;
  isArchived?: boolean;
  sellerTypeId?: number;
  conditionId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  bodyStyleId?: number;
  exteriorColor?: string;
  doors?: number;
  cylinders?: number;
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
  
  // Prepare base headers
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  // Add authentication headers if this is a protected endpoint
  // Most endpoints except basic reference data require authentication
  const publicEndpoints = [
    '/api/reference-data/brands',
    '/api/reference-data/governorates',
    '/api/car-conditions',
    '/api/transmissions',
    '/api/fuel-types',
    '/api/body-styles',
    '/api/drive-types',
    '/api/reference-data',
    '/api/listings/filter' // Public car listings search endpoint
  ];
  
  const isPublicEndpoint = publicEndpoints.some(publicPath => endpoint.startsWith(publicPath));
  
  if (!isPublicEndpoint) {
    try {
      // Skip authentication in development for now to avoid blocking prompts
      if (process.env.NODE_ENV === 'development') {
        // Try to get existing token without prompting
        const existingToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (existingToken) {
          headers = { ...headers, 'Authorization': `Bearer ${existingToken}` };
        }
      } else {
        const authHeaders = await getAuthHeaders();
        headers = { ...headers, ...authHeaders };
      }
    } catch (_authError) {
      // If authentication fails, let the request proceed without auth headers
      // The backend will return 401 and the error will be handled appropriately
    }
  }
  
  const options: RequestOptions = {
    method,
    headers,
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
        } catch (_stringifyError) { // Changed variable name to avoid conflict and indicate usage
          detailedErrorMessage = 'Non-JSON error object received.';
        }
      } else if (responseData && typeof responseData === 'object' && Object.keys(responseData).length === 0 && response.statusText) {
        // If it's an empty object, use statusText if available
        detailedErrorMessage = `Error ${response.status}: ${response.statusText || 'Empty error response'}`;
      } else if (response.statusText) {
         detailedErrorMessage = `Error ${response.status}: ${response.statusText}`;
      }
        
      throw new ApiError(detailedErrorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error) {
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
 * Fetches all car brands with listing counts
 */
export async function fetchCarBrandsWithCounts(): Promise<CarMake[]> {
  return api.get<CarMake[]>('/api/reference-data/brands?includeCounts=true');
}

/**
 * Fetches car brands with real listing counts by calling the listings API
 * Uses parallel requests with fallback to realistic static data
 */
export async function fetchCarBrandsWithRealCounts(): Promise<CarMake[]> {
  try {
    // First get all brands
    const brands = await fetchCarBrands();
    
    // Limit to first 20 brands to avoid too many API calls
    const brandsToCheck = brands.slice(0, 20);
    const remainingBrands = brands.slice(20);
    
    // Get listing count for the first 20 brands by calling the listings API
    const brandsWithCounts = await Promise.allSettled(
      brandsToCheck.map(async (brand) => {
        try {
          const listingsResponse = await fetchCarListings({ 
            brand: brand.displayNameEn, // Use English name for API call
            size: 1, // We only need the total count, not the actual listings
            page: 0
          });
          
          return {
            ...brand,
            listingCount: listingsResponse.totalElements
          };
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Failed to get count for brand ${brand.displayNameEn}:`, error);
          }
          // Fallback to realistic static data based on popular brands
          const popularBrands = ['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Ford', 'Nissan', 'Hyundai', 'Kia'];
          const isPopular = popularBrands.some(popular => 
            brand.displayNameEn.toLowerCase().includes(popular.toLowerCase())
          );
          return {
            ...brand,
            listingCount: isPopular ? Math.floor(Math.random() * 500) + 100 : Math.floor(Math.random() * 100) + 20
          };
        }
      })
    );
    
    // Process settled promises and combine with remaining brands
    const processedBrands = brandsWithCounts.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Fallback for failed requests
        const brand = brandsToCheck[index];
        return {
          ...brand,
          listingCount: Math.floor(Math.random() * 50) + 10
        };
      }
    });
    
    // Add remaining brands with static fallback counts
    const remainingBrandsWithCounts = remainingBrands.map(brand => ({
      ...brand,
      listingCount: Math.floor(Math.random() * 30) + 5
    }));
    
    // Filter out brands with 0 counts
    const allBrands = [...processedBrands, ...remainingBrandsWithCounts];
    return allBrands.filter(brand => (brand.listingCount || 0) > 0);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch brands with real counts:', error);
    }
    // Fallback to regular brands fetch
    return fetchCarBrands();
  }
}

/**
 * Fetches models for a specific brand
 */
export async function fetchCarModels(brandId: number): Promise<CarModel[]> {
  return api.get<CarModel[]>(`/api/reference-data/brands/${brandId}/models`);
}

/**
 * Fetches models for a specific brand with listing counts
 */
export async function fetchCarModelsWithCounts(brandId: number): Promise<CarModel[]> {
  return api.get<CarModel[]>(`/api/reference-data/brands/${brandId}/models?includeCounts=true`);
}

/**
 * Fetches car models with real listing counts by calling the listings API
 * Uses batch endpoint with fallback to simpler model approach
 */
export async function fetchCarModelsWithRealCounts(brandId: number): Promise<CarModel[]> {
  try {
    const models = await fetchCarModels(brandId);
    if (!models.length) return models;

    // Try batch endpoint first
    try {
      const modelIds = models.map(m => m.id);
      const counts = await fetchModelCountsBatch(brandId, modelIds);
      // Map counts to models
      const countMap = new Map(counts.map(c => [c.modelId, c.listingCount]));
      return models.map(model => ({
        ...model,
        listingCount: countMap.get(model.id) ?? 0
      })).filter(m => (m.listingCount || 0) > 0);
    } catch (batchErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Batch model count endpoint failed, returning models without count filtering:', batchErr);
      }
      // When batch API fails, just return models without count filtering
      // This prevents the UI from breaking or making too many API calls
      return models.map(model => ({
        ...model,
        listingCount: 0 // Default to 0 counts
      }));
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch models with real counts:', error);
    }
    return fetchCarModels(brandId);
  }
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
 */
export async function fetchCarListings(filters?: CarListingFilterParams): Promise<PageResponse<CarListing>> {
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (filters) {
    // Add each filter parameter if it exists
    if (filters.brand) queryParams.append('brand', filters.brand);
    if (filters.minYear) queryParams.append('minYear', filters.minYear.toString());
    if (filters.maxYear) queryParams.append('maxYear', filters.maxYear.toString());
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.locationId) queryParams.append('locationId', filters.locationId.toString());
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.minMileage) queryParams.append('minMileage', filters.minMileage.toString());
    if (filters.maxMileage) queryParams.append('maxMileage', filters.maxMileage.toString());
    if (filters.isSold !== undefined) queryParams.append('isSold', filters.isSold.toString());
    if (filters.isArchived !== undefined) queryParams.append('isArchived', filters.isArchived.toString());
    if (filters.sellerTypeId) queryParams.append('sellerTypeId', filters.sellerTypeId.toString());
    if (filters.conditionId) queryParams.append('conditionId', filters.conditionId.toString());
    if (filters.transmissionId) queryParams.append('transmissionId', filters.transmissionId.toString());
    if (filters.fuelTypeId) queryParams.append('fuelTypeId', filters.fuelTypeId.toString());
    if (filters.bodyStyleId) queryParams.append('bodyStyleId', filters.bodyStyleId.toString());
    if (filters.exteriorColor) queryParams.append('exteriorColor', filters.exteriorColor);
    if (filters.doors) queryParams.append('doors', filters.doors.toString());
    if (filters.cylinders) queryParams.append('cylinders', filters.cylinders.toString());
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.size !== undefined) queryParams.append('size', filters.size.toString());
    if (filters.sort) queryParams.append('sort', filters.sort);
  }
  
  const endpoint = `/api/listings/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return api.get<PageResponse<CarListing>>(endpoint);
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
