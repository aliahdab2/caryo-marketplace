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
  refreshToken?: string;
}

interface AugmentedJWT extends NextAuthJWT {
  id: string;
  roles: string[];
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms when the backend access token expires */
  accessTokenExpires?: number;
  provider?: string;
  error?: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

// Refresh the backend access token this long before it actually expires
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;
// Fallback when the access token's exp claim can't be read (backend default is 30 min)
const DEFAULT_ACCESS_TOKEN_TTL_MS = 25 * 60 * 1000;

/** Read the exp claim (as epoch ms) from a backend JWT without verifying it */
function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Exchange the stored refresh token for a new backend access/refresh token pair.
 * On failure the token is marked with error: "RefreshAccessTokenError" so the
 * client can force a re-login.
 */
async function refreshAccessToken(token: AugmentedJWT): Promise<AugmentedJWT> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Refresh failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      ...token,
      accessToken: data.token,
      refreshToken: data.refreshToken ?? token.refreshToken,
      accessTokenExpires: getJwtExpiryMs(data.token) ?? Date.now() + DEFAULT_ACCESS_TOKEN_TTL_MS,
      error: undefined,
    };
  } catch (error) {
    console.error(
      'Failed to refresh access token:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

interface AugmentedSession extends NextAuthSession {
  user: AugmentedUser;
  accessToken: string;
  error?: string;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Include Google provider with validation to prevent malformed requests
    ...(process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') &&
        process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here.apps.googleusercontent.com' &&
        process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here' &&
        process.env.GOOGLE_CLIENT_SECRET.length > 20 ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      })
    ] : []),
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
          // Use fetch directly for client-side authentication
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const response = await fetch(`${API_URL}/api/v1/auth/signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password
            }),
          });

          if (!response.ok) {
            console.error('Authentication failed:', response.status, response.statusText);
            return null;
          }

          const data = await response.json();
          const tokenOrAccessToken = (data && (data.token || data.accessToken)) as string | undefined;

          if (data && tokenOrAccessToken && data.username) {
            return {
              id: data.id?.toString() || data.username,
              name: data.username,
              email: data.email || `${data.username}@caryo.sy`,
              roles: data.roles || [],
              provider: "credentials",
              token: tokenOrAccessToken,
              refreshToken: data.refreshToken,
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

          const respToken = (response as unknown as { token?: string; accessToken?: string }).token
            || (response as unknown as { token?: string; accessToken?: string }).accessToken;
          if (response && respToken) {
            // Store the roles and token in the user object for later use
            // Backend returns roles directly, not nested under user
            (user as AugmentedUser).roles = (response as unknown as { roles?: string[] }).roles || [];
            (user as AugmentedUser).token = respToken;
            (user as AugmentedUser).refreshToken =
              (response as unknown as { refreshToken?: string }).refreshToken;
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
        extendedToken.refreshToken = augmentedUser.refreshToken;
        extendedToken.accessTokenExpires = augmentedUser.token
          ? getJwtExpiryMs(augmentedUser.token) ?? Date.now() + DEFAULT_ACCESS_TOKEN_TTL_MS
          : undefined;
        extendedToken.provider = augmentedUser.provider;
        extendedToken.name = augmentedUser.name;
        extendedToken.email = augmentedUser.email;
        extendedToken.picture = augmentedUser.image;
        return extendedToken;
      }

      // No refresh token (pre-refresh sessions) or still-valid access token: leave unchanged
      if (
        !extendedToken.refreshToken ||
        !extendedToken.accessTokenExpires ||
        Date.now() < extendedToken.accessTokenExpires - TOKEN_REFRESH_BUFFER_MS
      ) {
        return extendedToken;
      }

      return refreshAccessToken(extendedToken);
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
  debug: process.env.NEXTAUTH_DEBUG === 'true', // Only enable if explicitly requested
  logger: {
    error(code, metadata) {
      // Suppress CLIENT_FETCH_ERROR during auto-login process
      if (code === 'CLIENT_FETCH_ERROR' && typeof window !== 'undefined') {
        const isAutoLogin = window.location.search.includes('auto-login=true');
        if (isAutoLogin) {
          console.log('NextAuth fetch error during auto-login (expected):', code);
          return;
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        // In development, show full error details for debugging
        console.error('NextAuth Error:', code, metadata);
      } else {
        // In production, only log the error code for security
        console.error('NextAuth Error:', code);
      }
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      // Only show debug logs in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', code, metadata);
      }
      // Production: no debug logs at all
    }
  }
};
