// Type declaration file for next-auth
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      roles?: string[];
    } & DefaultSession["user"]
  }
}
