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

const authOptions: NextAuthOptions = {
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
            } as unknown as NextAuthUser;
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
        const typedUser = user as unknown as AugmentedUser;

        resultToken.id = typedUser.id;
        resultToken.roles = typedUser.roles ?? [];
        resultToken.name = typedUser.name ?? null;
        resultToken.email = typedUser.email ?? null;
        resultToken.picture = typedUser.image ?? resultToken.picture ?? null;
        resultToken.provider = account?.provider;

        if (account?.provider === "google") {
          // For Google OAuth, we need to exchange the token for our backend JWT
          try {
            const { serverAuth } = await import('@/services/server-auth');
            const socialLoginData = {
              provider: "google",
              email: typedUser.email || "",
              name: typedUser.name || "",
              providerAccountId: (account.providerAccountId || account.id || "").toString(),
              image: profile && typeof profile === "object" && "picture" in profile 
                ? (profile as { picture: string }).picture 
                : typedUser.image || ""
            };
            
            const authResult = await serverAuth.socialLogin(socialLoginData);
            resultToken.accessToken = authResult.accessToken || authResult.token || "";
            
            if (!resultToken.accessToken) {
              resultToken.error = "BackendTokenExchangeError";
            }
          } catch (error) {
            console.error("Failed to exchange Google token for backend JWT:", error);
            resultToken.error = "BackendTokenExchangeError";
          }

          if (
            profile &&
            typeof profile === "object" &&
            "picture" in profile &&
            typeof (profile as { picture: unknown }).picture === "string"
          ) {
            resultToken.picture = (profile as { picture: string }).picture;
          }
        } else {
          resultToken.accessToken =
            typedUser.token ?? resultToken.accessToken ?? "";
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
        provider: extendedToken.provider,
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
