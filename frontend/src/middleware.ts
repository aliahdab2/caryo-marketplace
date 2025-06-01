import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Set minimum token validation for middleware
import { JWT } from 'next-auth/jwt';

const hasValidToken = (token: JWT | null | undefined): boolean => {
  if (!token) return false;
  return true; // More permissive check in middleware
};

export default withAuth(
  function middleware(req) {
    console.log('Middleware running for:', req.nextUrl.pathname);
    
    // Always allow signin page regardless of auth status
    if (req.nextUrl.pathname.startsWith('/auth/signin')) {
      console.log('Allowing access to signin page');
      return NextResponse.next();
    }
    
    // Check token - more permissive in middleware
    const token = req.nextauth.token;
    const hasToken = hasValidToken(token);
    
    console.log('Token check in middleware:', {
      hasToken, 
      path: req.nextUrl.pathname,
      tokenExists: !!token
    });
    
    // If no token and trying to access protected route
    if (!hasToken) {
      // Construct absolute callback URL properly
      const fullUrl = new URL(req.url);
      const callbackUrl = encodeURIComponent(fullUrl.pathname + fullUrl.search);
      
      // Create a proper redirect URL
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('callbackUrl', callbackUrl);
      redirectUrl.searchParams.set('source', 'middleware');
      
      console.log(`Middleware redirecting unauthenticated user from ${req.nextUrl.pathname} to ${redirectUrl.pathname}`);
      
      return NextResponse.redirect(redirectUrl);
    }

    // Allow access if authenticated
    console.log('User authenticated in middleware, allowing access to:', req.nextUrl.pathname);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Always allow signin page regardless of auth status
        if (req.nextUrl.pathname.startsWith('/auth/signin')) {
          return true;
        }
        
        // More permissive token check
        const isAuthorized = hasValidToken(token);
        
        // Log token state
        console.log('Auth check in middleware for:', req.nextUrl.pathname, {
          hasToken: !!token,
          isAuthorized
        });
        
        return isAuthorized;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Protect all routes under /dashboard
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/signin",
  ],
};
