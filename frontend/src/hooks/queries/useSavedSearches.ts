/**
 * React Query hooks for saved searches operations
 * 
 * These hooks provide caching, automatic refetching, and loading/error states
 * for all saved search-related operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserSavedSearches,
  getSavedSearchById,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getCarListingsForSavedSearch,
  SavedSearchRequest,
  SavedSearchResponse,
} from '@/services/savedSearches';

// Query key factory for consistent cache key management
export const savedSearchKeys = {
  all: ['savedSearches'] as const,
  lists: () => [...savedSearchKeys.all, 'list'] as const,
  list: () => [...savedSearchKeys.lists()] as const,
  details: () => [...savedSearchKeys.all, 'detail'] as const,
  detail: (id: string) => [...savedSearchKeys.details(), id] as const,
  results: (id: string) => [...savedSearchKeys.all, 'results', id] as const,
};

/**
 * Hook to fetch all saved searches for the current user
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: savedSearches, isLoading } = useSavedSearches();
 */
export function useSavedSearches(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: savedSearchKeys.list(),
    queryFn: () => getUserSavedSearches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    ...options,
  });
}

/**
 * Hook to fetch a specific saved search by ID
 * 
 * @param id - The saved search ID
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: savedSearch, isLoading } = useSavedSearch('abc123');
 */
export function useSavedSearch(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: savedSearchKeys.detail(id!),
    queryFn: () => getSavedSearchById(id!),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to fetch listings that match a saved search criteria
 * 
 * @param savedSearch - The saved search to fetch results for
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: results, isLoading } = useSavedSearchResults(savedSearch);
 */
export function useSavedSearchResults(
  savedSearch: SavedSearchResponse | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: savedSearchKeys.results(savedSearch?.id || ''),
    queryFn: () => getCarListingsForSavedSearch(savedSearch!),
    enabled: !!savedSearch && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to create a new saved search
 * 
 * @example
 * const createMutation = useCreateSavedSearch();
 * await createMutation.mutateAsync({ nameEn: 'My Search', filters: {...}, notificationPreferences: {...} });
 */
export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SavedSearchRequest) => createSavedSearch(request),
    onSuccess: () => {
      // Invalidate saved searches list
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

/**
 * Mutation hook to update an existing saved search
 * 
 * @example
 * const updateMutation = useUpdateSavedSearch();
 * await updateMutation.mutateAsync({ id: 'abc123', request: {...} });
 */
export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SavedSearchRequest }) =>
      updateSavedSearch(id, request),
    onSuccess: (updatedSearch) => {
      // Update specific saved search in cache
      queryClient.setQueryData(savedSearchKeys.detail(updatedSearch.id), updatedSearch);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
      // Invalidate results as filters may have changed
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.results(updatedSearch.id) });
    },
  });
}

/**
 * Mutation hook to delete a saved search
 * 
 * @example
 * const deleteMutation = useDeleteSavedSearch();
 * await deleteMutation.mutateAsync('abc123');
 */
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSavedSearch(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: savedSearchKeys.detail(id) });
      queryClient.removeQueries({ queryKey: savedSearchKeys.results(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}
