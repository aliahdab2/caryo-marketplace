"use client";

import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { useEffect, useRef } from 'react';

/**
 * Component that handles storing auth data in localStorage when session changes
 * This ensures roles and other auth data are available to isAdmin() and other functions
 * Optimized to reduce unnecessary API calls
 */
export default function AuthDataHandler() {
  const { user, status } = useOptimizedSession();
  const lastUpdateRef = useRef<string | null>(null);

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
          
          // Use roles from session (server-side auth provides these)
          const roles = user.roles && Array.isArray(user.roles) && user.roles.length > 0 
            ? user.roles 
            : ['ROLE_USER']; // Default fallback
          
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
  }, [user, status]); // Removed fetchUserRoles dependency

  // This component doesn't render anything
  return null;
}
