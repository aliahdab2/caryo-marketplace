/**
 * Types for auto-login functionality after email verification
 */

// JWT Response from backend after email verification
export interface EmailVerificationJwtResponse {
  token: string;
  refreshToken?: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// Regular message response for already verified emails
export interface EmailVerificationMessageResponse {
  message: string;
  email?: string;
}

// Union type for email verification responses
export type EmailVerificationResponse = 
  | EmailVerificationJwtResponse 
  | EmailVerificationMessageResponse;

// User data stored temporarily during auto-login process
export interface TempAuthUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// Auto-login API request payload
export interface AutoLoginRequest {
  token: string;
  refreshToken?: string;
  user: TempAuthUser;
}

// Auto-login API response
export interface AutoLoginResponse {
  success: boolean;
  error?: string;
}

// Session storage keys for temporary auth data
export const TEMP_AUTH_KEYS = {
  TOKEN: 'temp-auth-token',
  USER: 'temp-auth-user',
  EXPIRES: 'temp-auth-expires',
} as const;

// Auto-login configuration
export const AUTO_LOGIN_CONFIG = {
  TEMP_TOKEN_EXPIRY_MINUTES: 5,
  REDIRECT_DELAY_MS: 1500, // Reduced from 2000ms to 1500ms for smoother UX
  SESSION_EXPIRY_HOURS: 24,
} as const;

// Type guards for response validation
export function isJwtResponse(response: unknown): response is EmailVerificationJwtResponse {
  return (
    response !== null &&
    typeof response === 'object' &&
    'token' in response &&
    'username' in response &&
    'email' in response &&
    'id' in response &&
    'roles' in response &&
    typeof (response as Record<string, unknown>).token === 'string' &&
    typeof (response as Record<string, unknown>).username === 'string' &&
    typeof (response as Record<string, unknown>).email === 'string' &&
    typeof (response as Record<string, unknown>).id === 'number' &&
    Array.isArray((response as Record<string, unknown>).roles)
  );
}

export function isMessageResponse(response: unknown): response is EmailVerificationMessageResponse {
  return (
    response !== null &&
    typeof response === 'object' &&
    'message' in response &&
    typeof (response as Record<string, unknown>).message === 'string' &&
    !('token' in response)
  );
}

export function isTempAuthUser(user: unknown): user is TempAuthUser {
  return (
    user !== null &&
    typeof user === 'object' &&
    'id' in user &&
    'username' in user &&
    'email' in user &&
    'roles' in user &&
    typeof (user as Record<string, unknown>).id === 'number' &&
    typeof (user as Record<string, unknown>).username === 'string' &&
    typeof (user as Record<string, unknown>).email === 'string' &&
    Array.isArray((user as Record<string, unknown>).roles)
  );
}
