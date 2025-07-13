import type {
  NextAuthOptions,
  User as NextAuthUser,
  Account as NextAuthAccount,
  Profile as NextAuthProfile,
  Session as NextAuthSession,
} from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { serverAuth } from "@/services/server-auth";

// Augmented interfaces
interface AugmentedUser {
  id: string;
  roles: string[];
  provider?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  token?: string;
}

interface AugmentedJWT extends NextAuthJWT {
  id: string;
  roles: string[];
  accessToken: string;
  provider?: string;
  error?: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

interface AugmentedSession extends NextAuthSession {
  user: AugmentedUser;
  accessToken: string;
  error?: string;
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
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await serverAuth.login({
            username: credentials.username,
            password: credentials.password
          });
          
          if (response && response.token && response.user) {
            return {
              id: response.user.id.toString(),
              name: response.user.username,
              email: response.user.email,
              roles: response.user.roles || [],
              provider: "credentials",
              token: response.token,
            } as AugmentedUser;
          }
          
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 2 * 60 * 60, // Update session every 2 hours instead of on every request
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }: { 
      user: NextAuthUser; 
      account: NextAuthAccount | null; 
      profile?: NextAuthProfile 
    }): Promise<boolean> {
      try {
        if (account?.provider === "google" && profile?.email) {
          // Handle Google OAuth sign-in by calling our backend
          const response = await serverAuth.socialLogin({
            provider: "google",
            email: profile.email,
            name: profile.name || "",
            providerAccountId: account.providerAccountId,
            image: (profile as { picture?: string }).picture || "",
          });

          if (response && response.token) {
            // Store the roles and token in the user object for later use
            (user as AugmentedUser).roles = response.user?.roles || [];
            (user as AugmentedUser).token = response.token;
            (user as AugmentedUser).provider = "google";
            return true;
          }
          return false;
        }
        
        // For credentials provider, user is already populated from authorize
        return true;
      } catch (error) {
        console.error("Sign-in error:", error);
        return false;
      }
    },
    
    async jwt({ token, user, account: _account }: { 
      token: NextAuthJWT; 
      user?: NextAuthUser; 
      account?: NextAuthAccount | null 
    }): Promise<NextAuthJWT> {
      const extendedToken = token as AugmentedJWT;
      
      if (user) {
        const augmentedUser = user as AugmentedUser;
        extendedToken.id = augmentedUser.id;
        extendedToken.roles = augmentedUser.roles || [];
        extendedToken.accessToken = augmentedUser.token || "";
        extendedToken.provider = augmentedUser.provider;
        extendedToken.name = augmentedUser.name;
        extendedToken.email = augmentedUser.email;
        extendedToken.picture = augmentedUser.image;
      }

      return extendedToken;
    },
    
    async session({ session, token }: { 
      session: NextAuthSession; 
      token: NextAuthJWT 
    }): Promise<NextAuthSession> {
      const extendedSession = session as AugmentedSession;
      const extendedToken = token as AugmentedJWT;
      
      if (extendedToken) {
        extendedSession.user = {
          id: extendedToken.id,
          name: extendedToken.name,
          email: extendedToken.email,
          image: extendedToken.picture,
          roles: extendedToken.roles || [],
          provider: extendedToken.provider,
        } as AugmentedUser;
        
        extendedSession.accessToken = extendedToken.accessToken;
      }

      if (extendedToken.error) {
        extendedSession.error = extendedToken.error;
      }

      return extendedSession;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: false, // Disable debug in all environments to reduce console noise
};
