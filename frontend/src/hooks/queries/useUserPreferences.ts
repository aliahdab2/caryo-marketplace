/**
 * React Query hooks for the current user's notification/privacy preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserPreferences,
  updateUserPreferences,
  UserPreferences,
} from '@/services/userPreferences';

// Query key factory for consistent cache key management
export const userPreferencesKeys = {
  all: ['userPreferences'] as const,
  me: () => [...userPreferencesKeys.all, 'me'] as const,
};

/**
 * Hook to fetch the current user's preferences
 *
 * @example
 * const { data: preferences, isLoading } = useUserPreferences();
 */
export function useUserPreferences(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userPreferencesKeys.me(),
    queryFn: () => getUserPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    ...options,
  });
}

/**
 * Hook to update the current user's preferences
 *
 * @example
 * const { mutate: savePreferences, isPending } = useUpdateUserPreferences();
 * savePreferences(preferences);
 */
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: UserPreferences) => updateUserPreferences(preferences),
    onSuccess: (updated) => {
      queryClient.setQueryData(userPreferencesKeys.me(), updated);
    },
  });
}
