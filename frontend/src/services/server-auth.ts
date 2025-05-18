// Server-side authentication service
// This is a simplified version of auth.ts that works in Server Components and API routes

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

export interface SocialLoginData {
  email: string;
  name: string;
  provider: string;
  providerAccountId: string;
  image?: string;
}

/**
 * Helper function to handle API responses consistently
 */
async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `Request failed (${response.status}: ${response.statusText})`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the status text (already set above)
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    return await response.json();
  } catch {
    throw new Error('Invalid response format from server');
  }
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
      
      return await handleApiResponse(response);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Authentication error:', error);
      }
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
      
      return await handleApiResponse(response);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', error);
      }
      throw error;
    }
  },
  
  /**
   * Authenticate or register a user via social login
   */
  async socialLogin(socialData: SocialLoginData) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${API_URL}/api/auth/social-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialData),
        cache: 'no-store'
      });
      
      const data = await handleApiResponse(response);
      
      if (process.env.NODE_ENV === 'development' && data) {
        // Only log minimal info in development
        console.log('Social login successful:', data.username || data.email);
      }
      
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Social login error:', error);
        
        // Enhanced error reporting only in development
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error(`Network error. Check if backend is running at ${API_URL}`);
        }
      }
      
      throw error;
    }
  }
};
