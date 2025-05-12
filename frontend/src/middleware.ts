import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // console.log('token: ', req.nextauth.token)

    if (req.nextUrl.pathname.startsWith("/dashboard") && !req.nextauth.token) {
      return NextResponse.redirect(
        new URL("/auth/signin?message=YouAreNotAuthorized", req.url),
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin", // The page to redirect to if authentication is required
      // error: '/auth/error', // Optional: page to redirect to for errors
    },
  },
);

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/dashboard/:path*", // Protect all routes under /dashboard
    // Add other paths you want to protect here
    // Example: '/admin/:path*'
  ],
};
