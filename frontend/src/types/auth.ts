/**
 * Interface for login credentials
 */
export interface LoginCredentials {
  email?: string; // Made email optional
  password: string;
  username?: string; // Optional to support both email and username login
}

/**
 * Interface for signup credentials
 */
export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string[];
}

/**
 * Interface for registration data (server-side)
 */
export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Interface for authentication response
 */
export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  name?: string;
  roles: string[];
  token: string;
}

/**
 * Interface for social login data
 */
export interface SocialLoginData {
  provider: string;
  accessToken?: string;
  idToken?: string;
  email?: string;
  name?: string;
  providerAccountId?: string;
  image?: string;
}

/**
 * Interface for API message responses
 */
export interface MessageResponse {
  message: string;
}
