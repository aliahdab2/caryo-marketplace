'use client';

// Authentication API service
// Handles authentication-related API calls

import { api } from './api';
import { ApiError } from '@/utils/apiErrorHandler';
import { 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse,
  MessageResponse // Added MessageResponse back
} from '@/types/auth';

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
      // Use type assertion to handle the API's expected input type
      return await api.post<AuthResponse>(
        '/api/auth/signin', 
        credentials as unknown as Record<string, unknown>
      );
    } catch (error) {
      logError('Login failed:', error);
      
      // Properly transform error to ApiError for consistent error handling
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          error instanceof Error ? error.message : 'Authentication failed', 
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
      // Use type assertion to handle the API's expected input type
      return await api.post<MessageResponse>(
        '/api/auth/signup', 
        userData as unknown as Record<string, unknown>
      );
    } catch (error) {
      logError('Registration failed:', error);
      
      // Properly transform error to ApiError for consistent error handling
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
   * Get current user profile
   * 
   * @param token Authentication token
   * @returns User profile data
   */
  async getProfile(token: string): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    try {
      return await api.get<Record<string, unknown>>('/api/users/me', headers);
    } catch (error) {
      logError('Failed to get user profile:', error);
      
      // Properly transform error to ApiError for consistent error handling
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          error instanceof Error ? error.message : 'Failed to get user profile', 
          0
        );
      }
      
      throw error;
    }
  }
};
