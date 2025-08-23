"use client";

import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { useEffect, useCallback, useRef } from 'react';

/**
 * Component that handles storing auth data in localStorage when session changes
 * This ensures roles and other auth data are available to isAdmin() and other functions
 * Optimized to reduce unnecessary API calls
 */
export default function AuthDataHandler() {
  const { user, status } = useOptimizedSession();
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
          name: user?.name || "",
          providerAccountId: "auth-handler-request",
          image: user?.image || ""
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
  }, [user]);

  useEffect(() => {
    const handleSessionUpdate = async () => {
      if (status === 'loading') return; // Wait for session to be resolved

      // Create a session signature to detect changes
      const sessionSignature = JSON.stringify({
        email: user?.email,
        name: user?.name,
        accessToken: user?.accessToken,
        roles: user?.roles,
        authenticated: !!user
      });

      // Only update if session actually changed
      if (lastUpdateRef.current === sessionSignature) return;
      lastUpdateRef.current = sessionSignature;

      if (user && user.accessToken) {
        // Store user data in localStorage for use by auth utilities
        try {
          localStorage.setItem('authToken', user.accessToken);
          localStorage.setItem('username', user.name || '');
          
          // Handle roles - prioritize user roles, fallback to backend
          let roles: string[] = [];
          
          if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            roles = user.roles;
          } else if (user.email) {
            // Fetch roles from backend if not in user
            roles = await fetchUserRoles(user.email);
          } else {
            roles = ['ROLE_USER']; // Default fallback
          }
          
          localStorage.setItem('userRoles', JSON.stringify(roles));
        } catch (error) {
          console.error('Error storing auth data in localStorage:', error);
        }
      } else if (status === 'unauthenticated') {
        // Clear localStorage when no user
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRoles');
      }
    };

    handleSessionUpdate();
  }, [user, status, fetchUserRoles]);

  // This component doesn't render anything
  return null;
}
