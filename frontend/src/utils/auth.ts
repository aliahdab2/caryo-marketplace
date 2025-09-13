'use client';

// Define session type for better type safety
interface SessionData {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
    isAdmin?: boolean;
  };
  accessToken?: string;
  expires?: string;
}

// Global session cache to avoid multiple API calls
let sessionCache: SessionData | null = null;
let sessionCacheTime = 0;
let sessionPromise: Promise<SessionData | null> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the current session with caching to avoid multiple API calls
 * Now uses NextAuth's getServerSession via our API route
 * @returns A Promise that resolves to the session or null if not authenticated
 */
export async function getSession() {
  try {
    // Return cached session if it's still valid
    const now = Date.now();
    if (sessionCache && (now - sessionCacheTime) < CACHE_DURATION) {
      return sessionCache;
    }

    // If there's already a request in progress, wait for it
    if (sessionPromise) {
      return await sessionPromise;
    }

    // Create a new promise for this request
    sessionPromise = (async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include cookies
        });
        
        if (response.ok) {
          const session = await response.json();
          sessionCache = session;
          sessionCacheTime = Date.now();
          return session;
        } else if (response.status === 401) {
          sessionCache = null;
          sessionCacheTime = Date.now();
          return null;
        } else {
          sessionCache = null;
          sessionCacheTime = Date.now();
          return null;
        }
      } catch (fetchError) {
        console.error(`❌ [AUTH] Fetch error:`, fetchError);
        sessionCache = null;
        sessionCacheTime = Date.now();
        return null;
      } finally {
        // Clear the promise when done
        sessionPromise = null;
      }
    })();

    return await sessionPromise;
  } catch (error) {
    console.error('Error getting session:', error);
    sessionPromise = null;
    sessionCache = null;
    sessionCacheTime = Date.now();
    return null;
  }
}

/**
 * Clear the session cache (useful for logout)
 */
export function clearSessionCache() {
  sessionCache = null;
  sessionCacheTime = 0;
  sessionPromise = null;
}

/**
 * Get the JWT access token from the session
 * @returns A Promise that resolves to the access token or null if not authenticated
 */
export async function getAccessToken() {
  const session = await getSession();
  return session?.accessToken || null;
}

/**
 * Check if the user is authenticated
 * @returns A Promise that resolves to true if authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get authorization headers for API requests
 * Uses stored credentials or prompts user for login
 * @returns A Promise that resolves to an object with the Authorization header
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session?.accessToken) {
    console.error("Authentication Error: No access token available. Please ensure the user is logged in.");
    return {}; // Return an empty object if no token is available
  }
  return { Authorization: `Bearer ${session.accessToken}` };
}

/**
 * Check if current user has admin role
 * @returns boolean indicating if user has ROLE_ADMIN
 */
export function isAdmin(): boolean {
  try {
    const roles = localStorage.getItem('userRoles');
    if (!roles) return false;
    const roleArray = JSON.parse(roles);
    return Array.isArray(roleArray) && roleArray.includes('ROLE_ADMIN');
  } catch {
    return false;
  }
}

/**
 * Check if user has a specific role
 * @param role The role to check for
 * @returns boolean indicating if user has the specified role
 */
export function hasRole(role: string): boolean {
  try {
    const roles = localStorage.getItem('userRoles');
    if (!roles) return false;
    
    const roleArray = JSON.parse(roles);
    return Array.isArray(roleArray) && roleArray.includes(role);
  } catch {
    return false;
  }
}

/**
 * Get all user roles
 * @returns array of user roles or empty array if none found
 */
export function getUserRoles(): string[] {
  try {
    const roles = localStorage.getItem('userRoles');
    if (!roles) return [];
    
    const roleArray = JSON.parse(roles);
    return Array.isArray(roleArray) ? roleArray : [];
  } catch {
    return [];
  }
}

/**
 * Get current username
 */
export function getCurrentUsername(): string | null {
  return localStorage.getItem('username');
}

/**
 * Logout - clear stored credentials
 */
export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRoles');
  localStorage.removeItem('username');
}

/**
 * Enhanced logout utility that handles errors gracefully and prevents race conditions
 */
export const handleLogout = async (redirectTo: string = '/'): Promise<void> => {
  try {
    console.log('🚪 Starting logout process...');

    // Import signOut dynamically to avoid circular dependencies
    const { signOut } = await import('next-auth/react');

    // Clear local storage and session cache before logout
    if (typeof window !== 'undefined') {
      // Clear custom session data
      sessionStorage.removeItem('user-preferences');
      localStorage.removeItem('auth-redirect');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('username');

      // Clear session cache
      clearSessionCache();
    }

    // Sign out from NextAuth
    await signOut({
      redirect: false, // Don't redirect automatically to prevent race conditions
      callbackUrl: redirectTo
    });

    console.log('✅ NextAuth signout completed');

    // Add a small delay to ensure NextAuth cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Manually redirect after cleanup
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }

  } catch (error) {
    console.error('❌ Logout error:', error);

    // Fallback: force redirect even if logout failed
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }
};
