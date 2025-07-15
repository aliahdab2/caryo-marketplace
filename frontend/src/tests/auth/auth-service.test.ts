import { authService } from '@/services/auth';
import { LoginCredentials, SignupCredentials } from '@/types/auth';
import { api } from '@/services/api';
import { ApiError } from '@/utils/apiErrorHandler';

// Mock the api service
jest.mock('@/services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  }
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockCredentials: LoginCredentials = {
      username: 'testuser',
      password: 'password123'
    };

    const mockResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
      token: 'jwt-token-123'
    };

    test('successfully logs in a user', async () => {
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(api.post).toHaveBeenCalledWith('/api/auth/signin', mockCredentials);
      expect(result).toEqual(mockResponse);
    });

    test('handles login errors', async () => {
      const errorMessage = 'Invalid credentials';
      (api.post as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(authService.login(mockCredentials)).rejects.toThrow();
      expect(api.post).toHaveBeenCalledWith('/api/auth/signin', mockCredentials);
    });

    test('converts regular errors to ApiErrors', async () => {
      const regularError = new Error('Network error');
      (api.post as jest.Mock).mockRejectedValue(regularError);

      try {
        await authService.login(mockCredentials);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Network error');
      }
    });
  });

  describe('signup', () => {
    const mockUserData: SignupCredentials = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'newpassword123',
      confirmPassword: 'newpassword123'
    };

    const mockResponse = {
      message: 'User registered successfully!'
    };

    test('successfully registers a new user', async () => {
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.signup(mockUserData);

      expect(api.post).toHaveBeenCalledWith('/api/auth/signup', mockUserData);
      expect(result).toEqual(mockResponse);
    });

    test('handles registration errors', async () => {
      const errorMessage = 'Username already exists';
      (api.post as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(authService.signup(mockUserData)).rejects.toThrow();
      expect(api.post).toHaveBeenCalledWith('/api/auth/signup', mockUserData);
    });
    
    test('converts regular errors to ApiErrors', async () => {
      const regularError = new Error('Validation failed');
      (api.post as jest.Mock).mockRejectedValue(regularError);

      try {
        await authService.signup(mockUserData);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Validation failed');
      }
    });
  });

  describe('getProfile', () => {
    const mockToken = 'jwt-token-123';
    const mockUserProfile = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
      createdAt: '2025-01-01T00:00:00Z'
    };

    test('successfully retrieves user profile', async () => {
      (api.get as jest.Mock).mockResolvedValue(mockUserProfile);

      const result = await authService.getProfile(mockToken);

      expect(api.get).toHaveBeenCalledWith('/api/users/me', {
        'Authorization': `Bearer ${mockToken}`
      });
      expect(result).toEqual(mockUserProfile);
    });

    test('handles profile retrieval errors', async () => {
      const errorMessage = 'Unauthorized';
      (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(authService.getProfile(mockToken)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledWith('/api/users/me', {
        'Authorization': `Bearer ${mockToken}`
      });
    });
  });
});
