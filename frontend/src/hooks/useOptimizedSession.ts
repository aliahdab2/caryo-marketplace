"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getSession } from '@/utils/auth';
import { useCallback } from 'react';

// Session query key factory
export const sessionKeys = {
  all: ['session'] as const,
  user: () => [...sessionKeys.all, 'user'] as const,
  status: () => [...sessionKeys.all, 'status'] as const,
};

/**
 * Optimized session hook that uses React Query for caching and deduplication
 * This replaces our custom session management with industry-standard patterns
 */
export function useOptimizedSession() {
  const { data: nextAuthSession, status: nextAuthStatus, update } = useSession();
  
  console.log(`🔄 [OptimizedSession] NextAuth status: ${nextAuthStatus}`);
  
  // Use React Query to cache and deduplicate session data
  const sessionQuery = useQuery({
    queryKey: sessionKeys.user(),
    queryFn: async () => {
      console.log(`🌐 [OptimizedSession] Query function executed`);
      // Use our custom getSession for additional caching and logging
      const session = await getSession();
      console.log('📊 [OptimizedSession] Session data from getSession:', {
        hasUser: !!session?.user,
        userId: session?.user?.id,
        hasToken: !!session?.accessToken,
        expires: session?.expires
      });
      return session;
    },
    enabled: nextAuthStatus !== 'loading', // Only run when NextAuth has loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Derived state
  const user = sessionQuery.data?.user ? {
    id: sessionQuery.data.user.id,
    name: sessionQuery.data.user.name,
    email: sessionQuery.data.user.email,
    image: sessionQuery.data.user.image,
    roles: (sessionQuery.data.user as any)?.roles || [],
    isAdmin: ((sessionQuery.data.user as any)?.roles || []).includes('ROLE_ADMIN'),
    accessToken: (sessionQuery.data as any)?.accessToken,
  } : null;

  const isAuthenticated = !!user;
  const isLoading = nextAuthStatus === 'loading' || sessionQuery.isLoading;
  const status = nextAuthStatus === 'loading' ? 'loading' : 
                 isAuthenticated ? 'authenticated' : 'unauthenticated';

  console.log(`📊 [OptimizedSession] Status: ${status}, User: ${user?.id || 'none'}`);

  const refreshSession = async () => {
    console.log('🔄 [OptimizedSession] Refreshing session...');
    await sessionQuery.refetch();
    await update();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    status,
    session: sessionQuery.data,
    refreshSession,
    // Expose query state for debugging
    isStale: sessionQuery.isStale,
    isFetching: sessionQuery.isFetching,
    dataUpdatedAt: sessionQuery.dataUpdatedAt,
  };
}

/**
 * Hook to get just the user data (most common use case)
 */
export function useOptimizedUser() {
  const callStack = new Error().stack;
  const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
  console.log(`👤 [OptimizedSession] useOptimizedUser() called from: ${caller}`);
  
  const { user } = useOptimizedSession();
  return user;
}

/**
 * Hook to get authentication status
 */
export function useOptimizedAuthStatus() {
  const callStack = new Error().stack;
  const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
  console.log(`🔍 [OptimizedSession] useOptimizedAuthStatus() called from: ${caller}`);
  
  const { isAuthenticated, isLoading, status } = useOptimizedSession();
  return { isAuthenticated, isLoading, status };
}

/**
 * Hook to invalidate session cache (for login/logout)
 */
export function useSessionActions() {
  const queryClient = useQueryClient();
  
  const invalidateSession = useCallback(() => {
    console.log(`🔄 [OptimizedSession] Invalidating session cache`);
    queryClient.invalidateQueries({ queryKey: sessionKeys.all });
  }, [queryClient]);

  const clearSession = useCallback(() => {
    console.log(`🗑️ [OptimizedSession] Clearing session cache`);
    queryClient.removeQueries({ queryKey: sessionKeys.all });
  }, [queryClient]);

  return {
    invalidateSession,
    clearSession,
  };
}
