import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Debugging to see token content (uncomment if needed)
    // console.log('token: ', req.nextauth.token)

    if (req.nextUrl.pathname.startsWith("/dashboard") && !req.nextauth.token) {
      // Include the original destination as a properly encoded callbackUrl
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url),
      );
    }

    // Allow the request to proceed if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true if user is authenticated
      authorized: ({ token }) => {
        return !!token;
      },
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
