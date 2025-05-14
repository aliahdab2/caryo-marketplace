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
      return await api.post<AuthResponse>('/api/auth/signin', credentials);
    } catch (error) {
      console.error('Login failed:', error);
      
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
      return await api.post<MessageResponse>('/api/auth/signup', userData);
    } catch (error) {
      console.error('Registration failed:', error);
      
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
  async getProfile(token: string): Promise<any> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    try {
      // This endpoint might need to be updated once the backend implements it
      // Currently using a placeholder
      return await api.get<any>('/api/users/me', headers);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }
};
