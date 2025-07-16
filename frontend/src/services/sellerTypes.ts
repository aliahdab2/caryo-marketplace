// Seller Types API service
import { api } from './api';
import { ApiError } from '@/utils/apiErrorHandler';
import { ListingFilters } from '@/types/listings';
import { SellerTypeCounts, SellerType } from '@/types/sellerTypes';

/**
 * Get seller type counts with optional filters
 * @param filters Optional filters to apply
 * @returns Object with seller type names as keys and counts as values
 */
export async function getSellerTypeCounts(filters: ListingFilters = {}): Promise<SellerTypeCounts> {
  try {
    // Create the params object
    const params = new URLSearchParams();
    
    // Add filters (excluding sellerTypeId and page/limit which don't apply to counts)
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minYear) params.set('minYear', filters.minYear);
    if (filters.maxYear) params.set('maxYear', filters.maxYear);
    if (filters.location) params.set('location', filters.location);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.model) params.set('model', filters.model);
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
    
    // Convert brand/model to brandSlugs/modelSlugs format that the backend expects
    if (filters.brand) {
      params.delete('brand');
      params.set('brandSlugs', filters.brand);
    }
    if (filters.model) {
      params.delete('model');
      params.set('modelSlugs', filters.model);
    }
    
    const queryString = params.toString();
    const url = `/api/listings/counts/seller-types${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<SellerTypeCounts>(url);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[Seller Type Counts] API Error:', {
        status: error.status,
        message: error.message,
        data: error.data,
        filters
      });

      switch (error.status) {
        case 404:
          throw new Error('Seller type count service is currently unavailable');
        case 401:
        case 403:
          throw new Error('You do not have permission to access seller type counts');
        default:
          throw new Error('Failed to fetch seller type counts. Please try again later.');
      }
    }

    console.error('[Seller Type Counts] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('An unexpected error occurred while fetching seller type counts');
  }
}

/**
 * Get all available seller types
 * @returns Array of seller types
 */
export async function getSellerTypes(): Promise<SellerType[]> {
  try {
    const response = await api.get<SellerType[]>('/api/seller-types');
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[Seller Types] API Error:', {
        status: error.status,
        message: error.message,
        data: error.data
      });

      switch (error.status) {
        case 404:
          throw new Error('Seller type service is currently unavailable');
        case 401:
        case 403:
          throw new Error('You do not have permission to access seller types');
        default:
          throw new Error('Failed to fetch seller types. Please try again later.');
      }
    }

    console.error('[Seller Types] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('An unexpected error occurred while fetching seller types');
  }
}
