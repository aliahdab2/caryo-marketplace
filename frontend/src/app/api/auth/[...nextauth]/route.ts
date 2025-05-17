import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { serverAuth } from "@/services/server-auth";
import { JWT } from "next-auth/jwt";

// Extend the session interface
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    token: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
    };
    accessToken: string;
    expires: string;
  }
}

// Extend the JWT interface
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    accessToken: string;
    error?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Add additional Google configuration if needed
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "username",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }

        try {
          // Call the backend API to authenticate using server-side auth service
          const response = await serverAuth.login({
            username: credentials.username,
            password: credentials.password,
          });

          // Return user object that will be saved in the JWT token
          if (response && response.token) {
            return {
              id: response.id.toString(),
              name: response.username,
              email: response.email,
              roles: response.roles,
              token: response.token, // Store the token for future API calls
            };
          } else {
            throw new Error("Authentication failed: Invalid response from server");
          }
        } catch (error) {
          // Only log in development
          if (process.env.NODE_ENV === "development") {
            console.error("Authentication error:", error);
          }
          throw new Error(
            error instanceof Error ? error.message : "Authentication failed"
          );
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        if (account?.provider === "credentials") {
          // Credentials login - we already have user data structured as we need
          token.id = user.id;
          token.roles = user.roles;
          token.accessToken = user.token;
        } else if (account?.provider === "google") {
          // Google login
          try {
            // Register or login this Google user with our backend
            const response = await serverAuth.socialLogin({
              email: user.email!,
              name: user.name!,
              provider: "google",
              providerAccountId: account.providerAccountId,
              image: user.image || undefined,
            });

            if (response && response.token) {
              // Store the token and user info from our backend
              token.id = response.id.toString();
              token.roles = response.roles || ["user"];
              token.accessToken = response.token;
            } else {
              throw new Error("Invalid response format from backend");
            }
          } catch (error) {
            // Only log in development
            if (process.env.NODE_ENV === "development") {
              console.error("Error during Google authentication:", error);
            }

            // Add error info to the token
            token.error =
              error instanceof Error
                ? error.message
                : "Unknown error during social login";

            // Still set some basic identity info from Google
            token.id = user.id || user.email!;
            token.roles = ["user"];
            token.accessToken = "";
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // Add user info to the session
        session.user.id = token.id;
        session.user.roles = token.roles || ["user"];
        session.accessToken = token.accessToken;

        // If there was an error during login, forward it to the session
        if (token.error) {
          (session as any).error = token.error;
        }
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
