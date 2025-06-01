// Type declaration file for next-auth
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt"; // Import JWT

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

// Add JWT module declaration if it's not already there or needs modification
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string; // For errors during token refresh
    id?: string; // Example: if you store user ID in JWT
    // Add other custom properties from your JWT callback if any
  }
}
