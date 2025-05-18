'use client';

// Authentication API service
// Handles authentication-related API calls

import { api } from './api';
import { ApiError } from '@/utils/apiErrorHandler';

// Types
export interface LoginCredentials {
  username: string;  // Changed from email to username to match backend
  password: string;
}

export interface SignupCredentials {
  username: string;  // Changed from name to username to match backend
  email: string;
  password: string;
  role?: string[];  // Optional role specification
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  token: string; 
}

export interface MessageResponse {
  message: string;
}

/**
 * Utility function to log errors conditionally
 * Will not log errors during tests to keep test output clean
 */
const logError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(message, error);
  }
};

// Auth API functions
export const authService = {
  /**
   * Login a user
   * 
   * @param credentials User credentials (username, password)
   * @returns User data and token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Properly cast credentials to satisfy TypeScript
      return await api.post<AuthResponse>('/api/auth/signin', credentials as unknown as Record<string, unknown>);
    } catch (error) {
      logError('Login failed:', error);
      
      // Convert regular errors to ApiErrors if needed
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          error instanceof Error ? error.message : 'Login failed', 
          0
        );
      }
      
      throw error;
    }
  },

  /**
   * Register a new user
   * 
   * @param userData User registration data
   * @returns Success message
   */
  async signup(userData: SignupCredentials): Promise<MessageResponse> {
    try {
      // Properly cast userData to satisfy TypeScript
      return await api.post<MessageResponse>('/api/auth/signup', userData as unknown as Record<string, unknown>);
    } catch (error) {
      logError('Registration failed:', error);
      
      // Convert regular errors to ApiErrors if needed
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          error instanceof Error ? error.message : 'Registration failed', 
          0
        );
      }
      
      throw error;
    }
  },

  /**
   * Get current user profile (to be implemented when backend supports it)
   * 
   * @param token Authentication token
   * @returns User profile data
   */
  async getProfile(token: string): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    try {
      // This endpoint might need to be updated once the backend implements it
      // Currently using a placeholder
      return await api.get<Record<string, unknown>>('/api/users/me', headers);
    } catch (error) {
      logError('Failed to get user profile:', error);
      throw error;
    }
  }
};
