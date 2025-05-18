import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions, User as NextAuthUser, Account as NextAuthAccount, Profile as NextAuthProfile, Session as NextAuthSession } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import { serverAuth } from "@/services/server-auth";

// Import our application's custom types to use locally in this file
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

// Define the additional properties we expect on our User and JWT
interface AppUserAdditions {
  roles: string[];
  token?: string; // Specific to credentials user from our backend, optional for Google user
}

// Type aliases for this file to avoid type recursion issues
type AppUser = NextAuthUser & AppUserAdditions & {
  id: string; // Ensure id is always a string
  // name, email, image are typically part of NextAuthUser already
};

type AppJWT = NextAuthJWT & AppUserAdditions & {
  id: string; // Ensure id is always a string
  accessToken: string;
  error?: string;
  // name, email, picture may be added by NextAuth for OAuth providers
};

type AppSession = Omit<NextAuthSession, 'user'> & {
  user: AppUser;
  accessToken: string;
  error?: string;
};

// Augment NextAuth types
declare module "next-auth" {
  interface User extends AppUserAdditions {
    id: string; // Ensure id is always a string
    // name, email, image are typically part of NextAuthUser already
  }

  interface Session extends NextAuthSession {
    user: User; // Use our augmented User
    accessToken: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT, AppUserAdditions {
    id: string; // Ensure id is always a string
    accessToken: string;
    error?: string;
    // name, email, picture may be added by NextAuth for OAuth providers
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }
        try {
          const response = await serverAuth.login({
            username: credentials.username,
            password: credentials.password,
          });
          if (response && response.token) {
            // Return an object that conforms to our augmented NextAuth.User
            return {
              id: response.id.toString(),
              name: response.username,
              email: response.email,
              roles: response.roles,
              token: response.token, // This is our custom field
            } as NextAuthUser; // Cast to NextAuthUser, augmentation will apply
          } else {
            console.warn("Authorize: Authentication failed, server response missing token or user data.");
            return null;
          }
        } catch (authError: unknown) {
          const errorMessage = authError instanceof Error ? authError.message : String(authError);
          console.error("Authorize callback error:", errorMessage);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }: { token: NextAuthJWT; user?: NextAuthUser; account?: NextAuthAccount | null; profile?: NextAuthProfile }): Promise<NextAuthJWT> {
      const resultToken = token as JWT; // Use our augmented JWT type

      if (user) { // `user` is present on initial sign-in
        resultToken.id = user.id;
        resultToken.roles = user.roles || []; // Use the roles from our augmented NextAuthUser
        resultToken.name = user.name;
        resultToken.email = user.email;
        resultToken.picture = user.image || resultToken.picture; // NextAuth might map image to picture

        if (account?.provider === "google") {
          if (account.access_token) {
            resultToken.accessToken = account.access_token;
          } else {
            console.error("JWT Callback: Google OAuth access_token is missing.");
            resultToken.error = "OAuthTokenError";
            resultToken.accessToken = ""; // Ensure accessToken is always a string
          }
          // If profile exists (it should for Google sign-in), ensure image is set
          if (profile?.image) {
            resultToken.picture = profile.image;
          } else if (profile && typeof profile === 'object' && 'picture' in profile) { // Some providers might use 'picture'
             resultToken.picture = (profile as { picture: string }).picture;
          }


        } else if (user.token) { // Credentials provider, user.token is from our augmented NextAuthUser
          resultToken.accessToken = user.token;
        } else {
          // console.warn("JWT Callback: User token is missing for non-Google provider or accessToken not set.");
          // Ensure accessToken is at least an empty string if not set
          resultToken.accessToken = resultToken.accessToken || "";
        }
      }
      return resultToken;
    },
    async session({ session, token: jwtToken }: { session: NextAuthSession; token: NextAuthJWT }): Promise<NextAuthSession> {
      const extendedSession = session as Session; // Use our augmented Session type
      const extendedToken = jwtToken as JWT;   // Use our augmented JWT type

      // Transfer properties from token to session.user
      extendedSession.user.id = extendedToken.id;
      extendedSession.user.roles = extendedToken.roles;
      extendedSession.user.name = extendedToken.name || null;
      extendedSession.user.email = extendedToken.email || null;
      extendedSession.user.image = extendedToken.picture || null; // 'picture' is common in JWT for image

      extendedSession.accessToken = extendedToken.accessToken;

      if (extendedToken.error) {
        extendedSession.error = extendedToken.error;
      }

      return extendedSession;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Error code passed in query string as ?error=
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
