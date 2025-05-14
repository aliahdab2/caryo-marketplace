// Server-side authentication service
// This is a simplified version of auth.ts that works in Server Components and API routes

import { cookies } from 'next/headers';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Server-side authentication service
 */
export const serverAuth = {
  /**
   * Authenticate a user with username and password
   * For server-side use in API routes
   */
  async login(credentials: LoginCredentials) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        let errorMessage = 'Authentication failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          errorMessage = `Authentication failed (${response.status}: ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        throw new Error('Invalid response format from authentication server');
      }
    } catch (error) {
      console.error('Server auth login error:', error);
      throw error;
    }
  },
  
  /**
   * Register a new user
   */
  async register(userData: RegistrationData) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Server auth register error:', error);
      throw error;
    }
  }
};
