/**
 * React Query hooks for favorites operations
 * 
 * These hooks provide caching, optimistic updates, and loading/error states
 * for all favorites-related operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus,
} from '@/services/favorites';
import { UserFavoritesResponse, FavoriteStatusResponse } from '@/types/favorites';

// Query key factory for consistent cache key management
export const favoriteKeys = {
  all: ['favorites'] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
  status: (listingId: string) => [...favoriteKeys.all, 'status', listingId] as const,
};

/**
 * Hook to fetch user's favorites
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data, isLoading, error } = useFavorites();
 * const favorites = data?.favorites || [];
 */
export function useFavorites(options?: { enabled?: boolean }) {
  return useQuery<UserFavoritesResponse>({
    queryKey: favoriteKeys.list(),
    queryFn: () => getUserFavorites(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    ...options,
  });
}

/**
 * Hook to check if a specific listing is favorited
 * 
 * @param listingId - The listing ID to check
 * @param options - Additional React Query options
 * 
 * @example
 * const { data } = useFavoriteStatus('123');
 * const isFavorited = data?.isFavorite || false;
 */
export function useFavoriteStatus(listingId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: favoriteKeys.status(listingId!),
    queryFn: () => checkFavoriteStatus(listingId!),
    enabled: !!listingId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to add a listing to favorites
 * 
 * Includes optimistic update for instant UI feedback.
 * 
 * @example
 * const addMutation = useAddToFavorites();
 * await addMutation.mutateAsync('123');
 */
export function useAddToFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => addToFavorites(listingId),
    onMutate: async (listingId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoriteKeys.list() });
      await queryClient.cancelQueries({ queryKey: favoriteKeys.status(listingId) });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<UserFavoritesResponse>(favoriteKeys.list());
      const previousStatus = queryClient.getQueryData<FavoriteStatusResponse>(favoriteKeys.status(listingId));

      // Optimistically update status
      queryClient.setQueryData<FavoriteStatusResponse>(favoriteKeys.status(listingId), {
        isFavorite: true,
        listingId,
      });

      return { previousFavorites, previousStatus };
    },
    onError: (_err, listingId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoriteKeys.list(), context.previousFavorites);
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(favoriteKeys.status(listingId), context.previousStatus);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}

/**
 * Mutation hook to remove a listing from favorites
 * 
 * Includes optimistic update for instant UI feedback.
 * 
 * @example
 * const removeMutation = useRemoveFromFavorites();
 * await removeMutation.mutateAsync('123');
 */
export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => removeFromFavorites(listingId),
    onMutate: async (listingId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoriteKeys.list() });
      await queryClient.cancelQueries({ queryKey: favoriteKeys.status(listingId) });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<UserFavoritesResponse>(favoriteKeys.list());
      const previousStatus = queryClient.getQueryData<FavoriteStatusResponse>(favoriteKeys.status(listingId));

      // Optimistically update status
      queryClient.setQueryData<FavoriteStatusResponse>(favoriteKeys.status(listingId), {
        isFavorite: false,
        listingId,
      });

      return { previousFavorites, previousStatus };
    },
    onError: (_err, listingId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoriteKeys.list(), context.previousFavorites);
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(favoriteKeys.status(listingId), context.previousStatus);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}

/**
 * Convenience hook to toggle favorite status
 * 
 * @example
 * const toggleFavorite = useToggleFavorite();
 * await toggleFavorite.mutateAsync({ listingId: '123', isFavorited: true });
 */
export function useToggleFavorite() {
  const addMutation = useAddToFavorites();
  const removeMutation = useRemoveFromFavorites();

  return {
    mutateAsync: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        await removeMutation.mutateAsync(listingId);
      } else {
        await addMutation.mutateAsync(listingId);
      }
    },
    isPending: addMutation.isPending || removeMutation.isPending,
    error: addMutation.error || removeMutation.error,
  };
}
