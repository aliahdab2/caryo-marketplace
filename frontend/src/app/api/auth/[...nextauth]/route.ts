import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type {
  NextAuthOptions,
  User as NextAuthUser,
  Account as NextAuthAccount,
  Profile as NextAuthProfile,
  Session as NextAuthSession,
} from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";
import { serverAuth } from "@/services/server-auth";

// Augmented interfaces used locally to avoid recursive type errors
interface AugmentedUser {
  id: string;
  roles: string[];
  name?: string | null;
  email?: string | null;
  image?: string | null;
  token?: string;
}

interface AugmentedJWT extends NextAuthJWT {
  id: string;
  roles: string[];
  accessToken: string;
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
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
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

          if (response?.token) {
            return {
              id: response.id.toString(),
              name: response.username,
              email: response.email,
              roles: response.roles,
              token: response.token,
            } as NextAuthUser;
          } else {
            console.warn("Authentication failed: No token in response.");
            return null;
          }
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
      profile,
    }: {
      token: NextAuthJWT;
      user?: NextAuthUser;
      account?: NextAuthAccount | null;
      profile?: NextAuthProfile;
    }): Promise<NextAuthJWT> {
      const resultToken = token as AugmentedJWT;

      if (user) {
        resultToken.id = user.id;
        resultToken.roles = user.roles || [];
        resultToken.name = user.name ?? null;
        resultToken.email = user.email ?? null;
        resultToken.picture = user.image ?? resultToken.picture ?? null;

        if (account?.provider === "google") {
          resultToken.accessToken = account.access_token ?? "";
          if (!account.access_token) {
            resultToken.error = "OAuthTokenError";
          }

          if (profile?.image) {
            resultToken.picture = profile.image;
          } else if ("picture" in profile!) {
            resultToken.picture = (profile as { picture: string }).picture;
          }
        } else if ("token" in user) {
          resultToken.accessToken = user.token ?? "";
        } else {
          resultToken.accessToken = resultToken.accessToken || "";
        }
      }

      return resultToken;
    },

    async session({
      session,
      token,
    }: {
      session: NextAuthSession;
      token: NextAuthJWT;
    }): Promise<NextAuthSession> {
      const extendedSession = session as AugmentedSession;
      const extendedToken = token as AugmentedJWT;

      extendedSession.user = {
        id: extendedToken.id,
        roles: extendedToken.roles,
        name: extendedToken.name ?? null,
        email: extendedToken.email ?? null,
        image: extendedToken.picture ?? null,
      };

      extendedSession.accessToken = extendedToken.accessToken;
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
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
