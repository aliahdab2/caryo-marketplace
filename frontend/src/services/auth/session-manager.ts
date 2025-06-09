import { Session } from 'next-auth';
import { getSession, signIn, signOut } from 'next-auth/react';

/**
 * Token expiration threshold in seconds
 * Tokens that expire within this threshold will be considered expired
 * to prevent API calls with tokens that might expire during the request
 */
const TOKEN_EXPIRATION_THRESHOLD_SECONDS = 30;

/**
 * Interface for session validation result
 */
export interface SessionValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  isExpired: boolean;
  redirectToLogin: boolean;
  error?: string;
}

/**
 * Validates the current session
 * @returns SessionValidationResult with validation status
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const session = await getSession();
    
    if (!session) {
      return {
        isValid: false,
        needsRefresh: false,
        isExpired: false,
        redirectToLogin: true,
        error: 'No session found'
      };
    }

    if (!session.accessToken) {
      return {
        isValid: false,
        needsRefresh: false,
        isExpired: false,
        redirectToLogin: true,
        error: 'No access token found in session'
      };
    }

    // Check if the token is close to expiration or already expired
    const tokenExpiration = getTokenExpiration(session);
    const now = Math.floor(Date.now() / 1000);
    
    // If expiration time is available, check if token is expired or close to expiration
    if (tokenExpiration) {
      const timeUntilExpiration = tokenExpiration - now;
      
      if (timeUntilExpiration <= 0) {
        return {
          isValid: false,
          needsRefresh: true,
          isExpired: true,
          redirectToLogin: false,
          error: 'Token expired'
        };
      }
      
      if (timeUntilExpiration < TOKEN_EXPIRATION_THRESHOLD_SECONDS) {
        return {
          isValid: true,
          needsRefresh: true,
          isExpired: false,
          redirectToLogin: false,
          error: 'Token expiring soon'
        };
      }
    }

    // All checks passed, session is valid
    return {
      isValid: true,
      needsRefresh: false,
      isExpired: false,
      redirectToLogin: false
    };
  } catch (error) {
    console.error('[AUTH] Error validating session:', error);
    return {
      isValid: false,
      needsRefresh: false,
      isExpired: false,
      redirectToLogin: true,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get the token expiration timestamp from the session
 * @param session The user session
 * @returns Expiration timestamp in seconds, or null if not available
 */
function getTokenExpiration(session: Session): number | null {
  // Check for explicit expiration
  if (session.expires) {
    return Math.floor(new Date(session.expires).getTime() / 1000);
  }

  // Check JWT token for expiration claim
  if (session.accessToken && typeof session.accessToken === 'string') {
    try {
      // Attempt to parse JWT token parts
      const tokenParts = session.accessToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.exp) {
          return payload.exp;
        }
      }
    } catch (error) {
      console.warn('[AUTH] Unable to parse JWT token:', error);
    }
  }

  return null;
}

/**
 * Refreshes the session if needed
 * @returns True if the session was refreshed successfully, false otherwise
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  const validation = await validateSession();
  
  if (validation.needsRefresh) {
    try {
      // Trigger a token refresh through NextAuth's signIn method
      // This assumes your NextAuth configuration handles token refresh
      await signIn('refresh');
      return true;
    } catch (error) {
      console.error('[AUTH] Error refreshing session:', error);
      return false;
    }
  }
  
  return !validation.needsRefresh;
}

/**
 * Ensures a valid session exists, refreshes if needed, or redirects to login
 * @param redirectUrl URL to redirect to after login
 * @returns The current session if valid, null otherwise (and triggers a redirect)
 */
export async function ensureValidSession(redirectUrl?: string): Promise<Session | null> {
  const validation = await validateSession();
  
  if (!validation.isValid && validation.redirectToLogin) {
    // If session is invalid and we should redirect to login
    const returnUrl = redirectUrl || window.location.pathname;
    window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
    return null;
  }
  
  if (validation.needsRefresh) {
    const refreshed = await refreshSessionIfNeeded();
    if (!refreshed) {
      // If refresh failed, redirect to login
      const returnUrl = redirectUrl || window.location.pathname;
      window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
      return null;
    }
    
    // Get the refreshed session
    return await getSession();
  }
  
  // Session is valid and doesn't need refresh
  return await getSession();
}

/**
 * Handle authentication errors by verifying the session and redirecting if needed
 * @param error The error that occurred
 * @param redirectUrl URL to redirect to after login
 * @returns True if the error was handled, false otherwise
 */
export async function handleAuthError(error: unknown, redirectUrl?: string): Promise<boolean> {
  // Check if error is an authentication error
  const isAuthError = 
    (error instanceof Error && 
      (error.message.toLowerCase().includes('unauthorized') ||
       error.message.toLowerCase().includes('authentication') ||
       error.message.toLowerCase().includes('401'))) ||
    (typeof error === 'string' && 
      (error.toLowerCase().includes('unauthorized') ||
       error.toLowerCase().includes('authentication') ||
       error.toLowerCase().includes('401')));
  
  if (isAuthError) {
    console.warn('[AUTH] Authentication error detected, checking session');
    const validation = await validateSession();
    
    if (!validation.isValid || validation.isExpired) {
      // Clear the session and redirect to login
      await signOut({ redirect: false });
      
      const returnUrl = redirectUrl || window.location.pathname;
      window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
      return true;
    }
    
    // Try to refresh the session
    if (validation.needsRefresh) {
      const refreshed = await refreshSessionIfNeeded();
      return refreshed;
    }
  }
  
  return false;
}

/**
 * Make an API request with automatic session validation
 * This will ensure the session is valid before making the request
 * and handle authentication errors automatically
 * 
 * @param url The URL to make the request to
 * @param options Fetch options
 * @returns The fetch response
 * @throws Error if session is invalid or request fails
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Validate the session before making the request
  const validation = await validateSession();
  
  if (!validation.isValid) {
    // Try to refresh if needed
    if (validation.needsRefresh) {
      const refreshed = await refreshSessionIfNeeded();
      if (!refreshed) {
        // Redirect to login if refresh failed
        const returnUrl = window.location.pathname;
        window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
        throw new Error('Session invalid and refresh failed');
      }
    } else {
      // Redirect to login if session is invalid and not refreshable
      const returnUrl = window.location.pathname;
      window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
      throw new Error('No valid session');
    }
  }
  
  // Get the current session
  const session = await getSession();
  if (!session?.accessToken) {
    // Redirect to login
    const returnUrl = window.location.pathname;
    window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
    throw new Error('No access token in session');
  }
  
  // Set default headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add the authorization header
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  
  // Make the request
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    
    // Handle 401 Unauthorized error
    if (response.status === 401) {
      console.warn(`[AUTH] Authentication failed for request to ${url}`);
      
      // Try to get the error response
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        // No need to access the error
        errorText = 'Unknown error';
      }
      
      // Try to clear the session and redirect
      try {
        await signOut({ redirect: false });
        
        // Redirect to login
        const returnUrl = window.location.pathname;
        window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
      } catch (signOutError) {
        console.error('[AUTH] Error signing out:', signOutError);
        
        // Fallback to direct redirect
        const returnUrl = window.location.pathname;
        window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
      }
      
      throw new Error(`Authentication failed: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    if ((error instanceof Error) && error.message.includes('Authentication failed')) {
      throw error; // Re-throw auth errors that we've already processed
    }
    
    // For other errors, try to check if it's an auth issue
    if (error instanceof Error && 
        (error.message.toLowerCase().includes('unauthorized') || 
         error.message.toLowerCase().includes('authentication') ||
         error.message.toLowerCase().includes('401'))) {
      
      // Redirect to login
      const returnUrl = window.location.pathname;
      window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    
    // Re-throw the error
    throw error;
  }
}
