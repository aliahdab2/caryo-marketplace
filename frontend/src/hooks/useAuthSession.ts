"use client";

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

/**
 * Optimized hook for session data that reduces unnecessary re-renders
 * and provides commonly needed derived data
 */
export function useAuthSession() {
  const { data: session, status } = useSession();

  // Memoize derived values to prevent unnecessary re-renders
  const sessionData = useMemo(() => {
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated' && !!session;
    const user = session?.user || null;
    const userRoles = (user && 'roles' in user ? user.roles as string[] : []) || [];
    const isAdmin = userRoles.includes('ROLE_ADMIN');

    return {
      session,
      status,
      isLoading,
      isAuthenticated,
      user,
      userRoles,
      isAdmin,
    };
  }, [session, status]);

  return sessionData;
}

/**
 * Lightweight hook that only returns authentication status
 * Use this when you only need to know if user is logged in
 */
export function useAuthStatus() {
  const { status } = useSession();
  
  return useMemo(() => ({
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
  }), [status]);
}

/**
 * Hook that only returns user data when authenticated
 * Use this when you only need user info and don't care about loading states
 */
export function useAuthUser() {
  const { data: session, status } = useSession();
  
  return useMemo(() => {
    if (status !== 'authenticated' || !session?.user) {
      return null;
    }
    
    const user = session.user;
    const userRoles = (user && 'roles' in user ? user.roles as string[] : []) || [];
    
    return {
      ...user,
      roles: userRoles,
      isAdmin: userRoles.includes('ROLE_ADMIN'),
      accessToken: session.accessToken, // Include access token
    };
  }, [session, status]);
}
