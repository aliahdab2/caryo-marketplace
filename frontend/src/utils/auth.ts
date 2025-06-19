'use client';

import { getSession as nextAuthGetSession } from 'next-auth/react';

/**
 * Get the current Next.js session with proper typing
 * @returns A Promise that resolves to the session or null if not authenticated
 */
export async function getSession() {
  try {
    const session = await nextAuthGetSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
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
 */
export function isAdmin(): boolean {
  const roles = localStorage.getItem('userRoles');
  if (!roles) return false;
  
  try {
    const roleArray = JSON.parse(roles);
    return roleArray.includes('ROLE_ADMIN');
  } catch {
    return false;
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
