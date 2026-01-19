/**
 * React Query hooks for user blocking operations
 * 
 * These hooks provide caching, automatic refetching, and loading/error states
 * for user blocking functionality.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserBlockService } from '@/services/userBlock';

// Query key factory
export const userBlockKeys = {
  all: ['blockedUsers'] as const,
  lists: () => [...userBlockKeys.all, 'list'] as const,
  status: (userId: number) => [...userBlockKeys.all, 'status', userId] as const,
};

/**
 * Hook to fetch the list of users blocked by the current user
 * 
 * @example
 * const { data: blockedUsers, isLoading } = useBlockedUsers();
 */
export function useBlockedUsers() {
  return useQuery({
    queryKey: userBlockKeys.lists(),
    queryFn: () => UserBlockService.getBlockedUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if a specific user is blocked
 * 
 * @param userId - ID of the user to check
 * @param options - Additional React Query options
 */
export function useIsBlocked(userId: number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userBlockKeys.status(userId!),
    queryFn: () => UserBlockService.isBlocked(userId!),
    enabled: !!userId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hook to block a user
 * 
 * @example
 * const blockMutation = useBlockUser();
 * await blockMutation.mutateAsync(123);
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => UserBlockService.blockUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate blocked users list
      queryClient.invalidateQueries({ queryKey: userBlockKeys.lists() });
      // Invalidate specific user block status
      queryClient.invalidateQueries({ queryKey: userBlockKeys.status(userId) });
    },
  });
}

/**
 * Mutation hook to unblock a user
 * 
 * @example
 * const unblockMutation = useUnblockUser();
 * await unblockMutation.mutateAsync(123);
 */
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => UserBlockService.unblockUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate blocked users list
      queryClient.invalidateQueries({ queryKey: userBlockKeys.lists() });
      // Invalidate specific user block status
      queryClient.invalidateQueries({ queryKey: userBlockKeys.status(userId) });
    },
  });
}
