"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useMemo } from 'react';

// Types for our auth context
interface AuthContextValue {
  // Session data
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  
  // Derived states
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  
  // User data (when authenticated)
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles: string[];
    isAdmin: boolean;
    accessToken?: string;
  } | null;
}

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider component
interface AuthContextProviderProps {
  children: ReactNode;
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  // Single useSession call for the entire app
  const { data: session, status } = useSession();
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo((): AuthContextValue => {
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated' && !!session;
    const isUnauthenticated = status === 'unauthenticated';
    
    // Extract user data
    let user = null;
    if (isAuthenticated && session?.user) {
      const userRoles = (session.user && 'roles' in session.user ? session.user.roles as string[] : []) || [];
      user = {
        ...session.user,
        roles: userRoles,
        isAdmin: userRoles.includes('ROLE_ADMIN'),
        accessToken: session.accessToken,
      };
    }
    
    return {
      session,
      status,
      isLoading,
      isAuthenticated,
      isUnauthenticated,
      user,
    };
  }, [session, status]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}

// Convenience hooks for specific use cases
export function useAuthStatus() {
  const { isLoading, isAuthenticated, isUnauthenticated } = useAuth();
  return { isLoading, isAuthenticated, isUnauthenticated };
}

export function useAuthUser() {
  const { user } = useAuth();
  return user;
}

export function useAuthSession() {
  const { session, status, isLoading, isAuthenticated, user } = useAuth();
  return { session, status, isLoading, isAuthenticated, user };
}
