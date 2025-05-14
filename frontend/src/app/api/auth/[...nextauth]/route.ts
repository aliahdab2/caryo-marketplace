import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
  }
}

// Extend the JWT interface
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    accessToken: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
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
            throw new Error("Authentication failed");
          }
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error(
            error instanceof Error ? error.message : "Authentication failed"
          );
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        // Add user info to the token
        token.id = user.id;
        token.roles = user.roles;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add user info to the session
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "AdJ8m5EpqN6qPwEtH7XsKfRzV2yG9LcZ", // Use env var or fallback to hardcoded secret
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
