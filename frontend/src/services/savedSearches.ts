'use client';

import { api } from './api';
import type { CarListingCardData } from '@/components/listings/CarListingCard';
import type { CarListing } from './publicApi';

// Saved Search types
export interface SavedSearchRequest {
  nameEn: string;
  nameAr?: string;
  filters: Record<string, unknown>;
  notificationPreferences: {
    email: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  isActive?: boolean;
}

export interface SavedSearchResponse {
  id: string;
  nameEn: string;
  nameAr?: string;
  filters: Record<string, unknown>;
  notificationPreferences: {
    email: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  lastNotifiedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  matchCount?: number;
  wasUpdated?: boolean; // Indicates if this was an update vs create operation
}

/**
 * Create a new saved search/alert
 */
export async function createSavedSearch(request: SavedSearchRequest, token?: string): Promise<SavedSearchResponse> {
  try {
    const customHeaders = token ? { 'Authorization': `Bearer ${token}` } : undefined;
    const response = await api.post<SavedSearchResponse>('/api/saved-searches', request as unknown as Record<string, unknown>, customHeaders);
    return response;
  } catch (error: any) {
    console.error('Error creating saved search:', error);
    
    // Enhanced error handling for better debugging
    if (error.response?.data) {
      console.error('Error response data:', error.response.data);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}

/**
 * Get all saved searches for the current user
 */
export async function getUserSavedSearches(token?: string): Promise<SavedSearchResponse[]> {
  try {
    const customHeaders = token ? { 'Authorization': `Bearer ${token}` } : undefined;
    const response = await api.get<SavedSearchResponse[]>('/api/saved-searches', customHeaders);
    return response;
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    throw error;
  }
}



/**
 * Get a specific saved search by ID
 */
export async function getSavedSearchById(id: string): Promise<SavedSearchResponse> {
  try {
    const response = await api.get<SavedSearchResponse>(`/api/saved-searches/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching saved search:', error);
    throw error;
  }
}

/**
 * Update an existing saved search
 */
export async function updateSavedSearch(id: string, request: SavedSearchRequest, token?: string): Promise<SavedSearchResponse> {
  try {
    const customHeaders = token ? { 'Authorization': `Bearer ${token}` } : undefined;
    const response = await api.put<SavedSearchResponse>(`/api/saved-searches/${id}`, request as unknown as Record<string, unknown>, customHeaders);
    return response;
  } catch (error) {
    console.error('Error updating saved search:', error);
    throw error;
  }
}

/**
 * Delete (deactivate) a saved search
 */
export async function deleteSavedSearch(id: string, token?: string): Promise<void> {
  try {
    const customHeaders = token ? { 'Authorization': `Bearer ${token}` } : undefined;
    await api.delete(`/api/saved-searches/${id}`, customHeaders);
  } catch (error) {
    console.error('Error deleting saved search:', error);
    throw error;
  }
}

/**
 * Get count of saved searches for the current user
 */
export async function getSavedSearchCount(): Promise<number> {
  try {
    const searches = await getUserSavedSearches();
    return searches.length;
  } catch (error) {
    console.error('Error fetching saved search count:', error);
    return 0;
  }
}

/**
 * Get car listings that match a saved search criteria
 */
export async function getCarListingsForSavedSearch(
  savedSearch: SavedSearchResponse,
  _token?: string
): Promise<CarListingCardData[]> {
  try {
    // Import the public API function since it doesn't require auth
    const { fetchCarListingsPublic } = await import('./publicApi');
    
    // Convert saved search filters to API filter format
    const filters = savedSearch.filters;
    const searchParams: Record<string, unknown> = {
      page: 0,
      size: 20,
      sort: 'createdAt,desc'
    };

    // Map the saved search filters to API parameters to match fetchCarListingsPublic implementation
    // Note: Saved search stores filters with field names like brandSlugs, modelSlugs, etc.
    // but the backend service expects brands, models, etc.
    if (filters.brandSlugs && Array.isArray(filters.brandSlugs)) {
      searchParams.brands = filters.brandSlugs;
    }
    if (filters.modelSlugs && Array.isArray(filters.modelSlugs)) {
      searchParams.models = filters.modelSlugs;
    }
    if (filters.minPrice) {
      searchParams.minPrice = filters.minPrice;
    }
    if (filters.maxPrice) {
      searchParams.maxPrice = filters.maxPrice;
    }
    if (filters.minYear) {
      searchParams.minYear = filters.minYear;
    }
    if (filters.maxYear) {
      searchParams.maxYear = filters.maxYear;
    }
    if (filters.minMileage) {
      searchParams.minMileage = filters.minMileage;
    }
    if (filters.maxMileage) {
      searchParams.maxMileage = filters.maxMileage;
    }
    if (filters.transmissionId) {
      searchParams.transmissionId = filters.transmissionId;
    }
    if (filters.fuelTypeSlugs && Array.isArray(filters.fuelTypeSlugs)) {
      searchParams.fuelTypeSlugs = filters.fuelTypeSlugs;
    }
    if (filters.bodyType && Array.isArray(filters.bodyType)) {
      searchParams.bodyType = filters.bodyType;
    }
    if (filters.conditionId) {
      searchParams.conditionId = filters.conditionId;
    }
    if (filters.location && Array.isArray(filters.location)) {
      searchParams.locations = filters.location;
    }
    if (filters.searchQuery) {
      searchParams.searchQuery = filters.searchQuery;
    }

    // Fetch car listings using the search parameters
    const response = await fetchCarListingsPublic(searchParams as Parameters<typeof fetchCarListingsPublic>[0]);
    
    // Convert API response to CarListingCardData format
    const listings: CarListingCardData[] = (response.content || []).map((listing: CarListing) => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      year: listing.modelYear,
      mileage: listing.mileage,
      transmission: listing.transmission,
      fuelType: listing.fuelType,
      // Enhanced listings now get bilingual data directly from backend
      transmissionNameEn: listing.transmissionNameEn,
      transmissionNameAr: listing.transmissionNameAr,
      fuelTypeNameEn: listing.fuelTypeNameEn,
      fuelTypeNameAr: listing.fuelTypeNameAr,
      createdAt: listing.createdAt,
      sellerUsername: listing.sellerUsername,
      governorateNameEn: listing.governorateNameEn,
      governorateNameAr: listing.governorateNameAr,
      media: (listing.media || []).map(m => ({
        url: m.url,
        type: m.type,
        isPrimary: undefined,
        contentType: undefined
      }))
    }));
    
    return listings;
    
  } catch (error) {
    console.error('Error fetching car listings for saved search:', error);
    return [];
  }
}
