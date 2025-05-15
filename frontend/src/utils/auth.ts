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
 * @returns A Promise that resolves to an object with the Authorization header or an empty object if not authenticated
 */
export async function getAuthHeaders() {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
