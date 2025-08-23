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
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          sessionCache = session;
          sessionCacheTime = Date.now();
          return session;
        }
        
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
  try {
    // Check if we have stored credentials
    let token = localStorage.getItem('authToken');
    
    if (!token) {
      // Prompt user for credentials (temporary solution)
      const username = prompt('Username:') || 'admin';
      const password = prompt('Password:') || 'Admin123!';
      
      const authResponse = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!authResponse.ok) {
        throw new Error('Failed to authenticate');
      }
      
      const authData = await authResponse.json();
      token = authData.token;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store token for future use
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRoles', JSON.stringify(authData.roles));
      localStorage.setItem('username', authData.username);
    }
    
    return { 'Authorization': `Bearer ${token}` };
  } catch (error) {
    console.error('Authentication failed:', error);
    // Clear stored credentials on failure
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('username');
    throw error;
  }
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
