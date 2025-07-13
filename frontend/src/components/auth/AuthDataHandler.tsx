"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useCallback, useRef } from 'react';

/**
 * Component that handles storing auth data in localStorage when session changes
 * This ensures roles and other auth data are available to isAdmin() and other functions
 * Optimized to reduce unnecessary API calls
 */
export default function AuthDataHandler() {
  const { data: session, status } = useSession();
  const lastUpdateRef = useRef<string | null>(null);

  // Function to fetch roles from backend when not available in session
  const fetchUserRoles = useCallback(async (email: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: "google",
          email,
          name: session?.user?.name || "",
          providerAccountId: "auth-handler-request",
          image: session?.user?.image || ""
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.roles || ['ROLE_USER'];
      }
    } catch (error) {
      console.warn('Failed to fetch user roles from backend:', error);
    }
    return ['ROLE_USER']; // Default fallback
  }, [session]);

  useEffect(() => {
    const handleSessionUpdate = async () => {
      if (status === 'loading') return; // Wait for session to be resolved

      // Create a session signature to detect changes
      const sessionSignature = JSON.stringify({
        email: session?.user?.email,
        name: session?.user?.name,
        accessToken: session?.accessToken,
        roles: session?.user && 'roles' in session.user ? session.user.roles : null,
        authenticated: !!session
      });

      // Only update if session actually changed
      if (lastUpdateRef.current === sessionSignature) return;
      lastUpdateRef.current = sessionSignature;

      if (session?.user && session.accessToken) {
        // Store user data in localStorage for use by auth utilities
        try {
          localStorage.setItem('authToken', session.accessToken);
          localStorage.setItem('username', session.user.name || '');
          
          // Handle roles - prioritize session roles, fallback to backend
          let roles: string[] = [];
          
          if (session.user && 'roles' in session.user && Array.isArray(session.user.roles) && session.user.roles.length > 0) {
            roles = session.user.roles;
          } else if (session.user.email) {
            // Fetch roles from backend if not in session
            roles = await fetchUserRoles(session.user.email);
          } else {
            roles = ['ROLE_USER']; // Default fallback
          }
          
          localStorage.setItem('userRoles', JSON.stringify(roles));
        } catch (error) {
          console.error('Error storing auth data in localStorage:', error);
        }
      } else if (status === 'unauthenticated') {
        // Clear localStorage when no session
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRoles');
      }
    };

    handleSessionUpdate();
  }, [session, status, fetchUserRoles]);

  // This component doesn't render anything
  return null;
}
