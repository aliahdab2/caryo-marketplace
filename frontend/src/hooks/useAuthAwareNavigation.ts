"use client";

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

/**
 * Custom hook for authentication-aware navigation
 * Handles navigation conflicts with session validation
 */
export function useAuthAwareNavigation() {
  const router = useRouter();
  const { status } = useSession();

  /**
   * Navigate with session state awareness
   * @param href - Target URL
   * @param forceReload - Force full page reload
   */
  const navigate = useCallback((href: string, forceReload = false) => {
    // Always force full reload for dashboard (protected) routes to avoid SPA race conditions
    const isDashboardRoute = href.includes('/dashboard');
    if (isDashboardRoute) {
      window.location.href = href;
      return;
    }

    // If session is still loading, use full reload to avoid conflicts
    if (status === 'loading' || forceReload) {
      window.location.href = href;
      return;
    }

    // For non-protected routes, prefer SPA navigation
    try {
      router.push(href);
    } catch (error) {
      // Fallback to full reload on any SPA failure
      window.location.href = href;
    }
  }, [router, status]);

  return { navigate, sessionStatus: status };
}
