"use client";

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo } from 'react';

// Debug flag to control logging verbosity
const DEBUG = (process.env.NEXT_PUBLIC_DEBUG_SESSION || '').toLowerCase() === 'true';

// Module-level log deduplication across all hook instances
const loggedStatusSignatures = new Set<string>();
let lastLoggedNextAuthStatus: string | undefined;

/**
 * Optimized session hook that properly integrates with NextAuth
 * This replaces the previous React Query approach with direct NextAuth integration
 * Used by UI components for reactive session state management
 */
export function useOptimizedSession() {
  const { data: sessionData, status: nextAuthStatus, update } = useSession();

  // Log NextAuth status only when it actually changes (deduped globally)
  useEffect(() => {
    if (!DEBUG) return;
    if (lastLoggedNextAuthStatus !== nextAuthStatus) {
      console.log(`🔄 [OptimizedSession] NextAuth status: ${nextAuthStatus}`);
      lastLoggedNextAuthStatus = nextAuthStatus;
    }
  }, [nextAuthStatus]);

  // Derived state from NextAuth session
  const user = useMemo(() => {
    if (!sessionData?.user) return null;

    const roles = (sessionData.user as { roles?: string[] })?.roles || [];
    return {
      id: sessionData.user.id,
      name: sessionData.user.name,
      email: sessionData.user.email,
      image: sessionData.user.image,
      roles,
      isAdmin: roles.includes('ROLE_ADMIN'),
      accessToken: (sessionData as { accessToken?: string })?.accessToken,
    };
  }, [sessionData]);

  const isAuthenticated = !!user;
  const isLoading = nextAuthStatus === 'loading';
  const status = useMemo(() => (
    nextAuthStatus === 'loading' ? 'loading' : (isAuthenticated ? 'authenticated' : 'unauthenticated')
  ), [nextAuthStatus, isAuthenticated]);

  // Log derived status only when it actually changes (deduped globally)
  useEffect(() => {
    if (!DEBUG) return;
    const sig = `${status}-${user?.id || 'none'}`;
    if (!loggedStatusSignatures.has(sig)) {
      console.log(`📊 [OptimizedSession] Status: ${status}, User: ${user?.id || 'none'}`);
      loggedStatusSignatures.add(sig);
    }
  }, [status, user?.id]);

  const refreshSession = useCallback(async () => {
    if (DEBUG) console.log('🔄 [OptimizedSession] Refreshing session...');
    await update();
  }, [update]);

  return {
    user,
    isAuthenticated,
    isLoading,
    status,
    session: sessionData,
    refreshSession,
  };
}

/**
 * Hook to get just the user data (most common use case)
 */
export function useOptimizedUser() {
  if (DEBUG) {
    const callStack = new Error().stack;
    const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`👤 [OptimizedSession] useOptimizedUser() called from: ${caller}`);
  }
  
  const { user } = useOptimizedSession();
  return user;
}

/**
 * Hook to get authentication status
 */
export function useOptimizedAuthStatus() {
  if (DEBUG) {
    const callStack = new Error().stack;
    const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`🔍 [OptimizedSession] useOptimizedAuthStatus() called from: ${caller}`);
  }
  
  const { isAuthenticated, isLoading, status } = useOptimizedSession();
  return { isAuthenticated, isLoading, status };
}

/**
 * Hook to handle session actions (for login/logout)
 */
export function useSessionActions() {
  const { update } = useSession();

  const invalidateSession = useCallback(() => {
    console.log(`🔄 [OptimizedSession] Invalidating session`);
    update(); // Trigger NextAuth session refresh
  }, [update]);

  const clearSession = useCallback(() => {
    console.log(`🗑️ [OptimizedSession] Clearing session`);
    // NextAuth handles session clearing automatically
    update();
  }, [update]);

  return {
    invalidateSession,
    clearSession,
  };
}
