"use client";

import React, { createContext, useContext, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { getSession, clearSessionCache } from '@/utils/auth';

interface SessionData {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  } | null;
  accessToken?: string;
}

interface SessionContextValue {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
    isAdmin?: boolean;
    accessToken?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
}

interface CachedSessionValue extends SessionContextValue {
  cacheKey: string;
}

function InnerSessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const cachedValueRef = useRef<CachedSessionValue | null>(null);
  const lastSessionRef = useRef<string | null>(null);
  const sessionFetchedRef = useRef(false);
  
  // Custom session fetcher that only calls API once
  const fetchSession = useCallback(async (force = false) => {
    const callStack = new Error().stack;
    const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`🔄 [SessionContext] fetchSession() called from: ${caller}, force=${force}`);
    
    if (sessionFetchedRef.current && !force) {
      console.log('⏭️ [SessionContext] Session already fetched, skipping');
      return;
    }
    
    try {
      console.log('🚀 [SessionContext] Starting session fetch...');
      sessionFetchedRef.current = true;
      setStatus('loading');
      
      const sessionData = await getSession();
      console.log('📦 [SessionContext] Session data received:', {
        hasUser: !!sessionData?.user,
        userId: sessionData?.user?.id,
        status: sessionData?.user ? 'authenticated' : 'unauthenticated'
      });
      
      setSession(sessionData);
      setStatus(sessionData?.user ? 'authenticated' : 'unauthenticated');
    } catch (error) {
      console.error('❌ [SessionContext] Error fetching session:', error);
      setSession(null);
      setStatus('unauthenticated');
    }
  }, []);
  
  // Refresh session method for login/logout
  const refreshSession = useCallback(async () => {
    clearSessionCache(); // Clear the cache first
    sessionFetchedRef.current = false;
    await fetchSession(true);
  }, [fetchSession]);
  
  // Fetch session only once on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);
  
  // Debug logging to track session calls
  useEffect(() => {
    console.log('[SessionContext] Session changed:', { status, hasSession: !!session, userId: session?.user?.id });
  }, [session, status]);
  
  // Prevent unnecessary re-renders by checking if session actually changed
  const sessionChanged = useMemo(() => {
    const currentSessionKey = `${status}-${session?.user?.id}-${session?.user?.email}`;
    const lastSessionKey = lastSessionRef.current;
    
    if (currentSessionKey !== lastSessionKey) {
      lastSessionRef.current = currentSessionKey;
      return true;
    }
    return false;
  }, [session, status]);

  const value = useMemo(() => {
    // Only recalculate if session actually changed
    if (!sessionChanged && cachedValueRef.current) {
      console.log('[SessionContext] Session unchanged, using cached value');
      const { cacheKey: _, ...sessionValue } = cachedValueRef.current;
      return sessionValue;
    }
    
    console.log('[SessionContext] useMemo recalculating...', { status, hasSession: !!session });
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated' && !!session;
    
    // Create a more stable cache key
    const cacheKey = `${status}-${session?.user?.id || 'no-id'}-${session?.user?.email || 'no-email'}`;
    
    console.log('[SessionContext] Creating new value, cache key:', cacheKey);
    
    let user = null;
    if (isAuthenticated && session?.user) {
      const sessionUser = session.user;
      const userRoles = (sessionUser && 'roles' in sessionUser ? sessionUser.roles as string[] : []) || [];
      
      user = {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
        roles: userRoles,
        isAdmin: userRoles.includes('ROLE_ADMIN'),
        accessToken: session?.accessToken,
      };
    }

    const newValue: CachedSessionValue = {
      user,
      isAuthenticated,
      isLoading,
      status,
      refreshSession,
      cacheKey,
    };

    // Cache the value
    cachedValueRef.current = newValue;
    
    // Return without cacheKey for the context
    const { cacheKey: _, ...sessionValue } = newValue;
    return sessionValue;
  }, [session, status, sessionChanged, refreshSession]);

  // Memoize the provider to prevent unnecessary re-renders of children
  const memoizedProvider = useMemo(() => (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  ), [value, children]);

  return memoizedProvider;
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Remove NextAuth completely and use only our custom implementation
  return (
    <InnerSessionProvider>
      {children}
    </InnerSessionProvider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}

// Convenience hooks
export function useAuthUser() {
  const callStack = new Error().stack;
  const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
  console.log(`👤 [SessionContext] useAuthUser() called from: ${caller}`);
  
  const { user } = useSessionContext();
  return user;
}

export function useAuthStatus() {
  const callStack = new Error().stack;
  const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
  console.log(`🔍 [SessionContext] useAuthStatus() called from: ${caller}`);
  
  const { isAuthenticated, isLoading, status } = useSessionContext();
  return { isAuthenticated, isLoading, status, isUnauthenticated: status === 'unauthenticated' };
}
