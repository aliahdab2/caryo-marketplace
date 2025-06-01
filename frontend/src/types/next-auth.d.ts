// Type declaration file for next-auth
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    accessToken?: string;
    error?: string; // Added for session-related errors
    user: {
      id?: string;
      roles?: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  // The JWT interface from "next-auth/jwt" is augmented here.
  // No separate import of JWT is typically needed for this augmentation.
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string; // For errors during token refresh
    id?: string; // Example: if you store user ID in JWT
  }
}
