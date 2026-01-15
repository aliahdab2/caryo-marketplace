/**
 * React Query hooks for listing operations
 * 
 * These hooks provide caching, automatic refetching, and loading/error states
 * for all listing-related data fetching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListings,
  getListingById,
  getMyListings,
  createListing,
  updateListing,
  deleteListingById,
  deleteMultipleListings,
  getFeaturedListings,
} from '@/services/listings';
import { ListingFilters, Listing, ListingFormData, UpdateListingData } from '@/types/listings';

// Query key factory for consistent cache key management
export const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (filters: ListingFilters) => [...listingKeys.lists(), filters] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...listingKeys.details(), id] as const,
  myListings: () => [...listingKeys.all, 'my'] as const,
  featured: () => [...listingKeys.all, 'featured'] as const,
};

/**
 * Hook to fetch paginated listings with filters
 * 
 * @param filters - Optional filters for the listings query
 * @param options - Additional React Query options
 * 
 * @example
 * const { data, isLoading, error } = useListings({ minPrice: '10000', maxPrice: '50000' });
 */
export function useListings(filters: ListingFilters = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () => getListings(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    ...options,
  });
}

/**
 * Hook to fetch a single listing by ID
 * 
 * @param id - The listing ID
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: listing, isLoading } = useListing('123');
 */
export function useListing(id: string | number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: listingKeys.detail(id!),
    queryFn: () => getListingById(id!),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  });
}

/**
 * Hook to fetch the current user's listings
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: myListings, isLoading } = useMyListings();
 */
export function useMyListings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: listingKeys.myListings(),
    queryFn: () => getMyListings(),
    staleTime: 2 * 60 * 1000, // 2 minutes - my listings change more frequently
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch featured listings (for homepage)
 * 
 * @example
 * const { data: featured, isLoading } = useFeaturedListings();
 */
export function useFeaturedListings() {
  return useQuery({
    queryKey: listingKeys.featured(),
    queryFn: getFeaturedListings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * Mutation hook to create a new listing
 * 
 * Automatically invalidates relevant caches on success.
 * 
 * @example
 * const createMutation = useCreateListing();
 * await createMutation.mutateAsync(formData);
 */
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: ListingFormData) => createListing(formData),
    onSuccess: () => {
      // Invalidate listings caches to reflect new listing
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

/**
 * Mutation hook to update an existing listing
 * 
 * @example
 * const updateMutation = useUpdateListing();
 * await updateMutation.mutateAsync({ id: '123', data: { price: 25000 } });
 */
export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateListingData }) =>
      updateListing(id, data),
    onSuccess: (updatedListing: Listing) => {
      // Update the specific listing in cache
      queryClient.setQueryData(listingKeys.detail(updatedListing.id), updatedListing);
      // Invalidate list queries to reflect changes
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: listingKeys.myListings() });
    },
  });
}

/**
 * Mutation hook to delete a listing
 * 
 * @example
 * const deleteMutation = useDeleteListing();
 * await deleteMutation.mutateAsync('123');
 */
export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteListingById(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: listingKeys.detail(id) });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: listingKeys.myListings() });
    },
  });
}

/**
 * Mutation hook to delete multiple listings at once
 * 
 * @example
 * const bulkDeleteMutation = useDeleteMultipleListings();
 * await bulkDeleteMutation.mutateAsync(['123', '456', '789']);
 */
export function useDeleteMultipleListings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteMultipleListings(ids),
    onSuccess: (_data, ids) => {
      // Remove each listing from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: listingKeys.detail(id) });
      });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: listingKeys.myListings() });
    },
  });
}
