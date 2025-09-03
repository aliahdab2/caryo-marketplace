import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { AutoLoginRequest, AutoLoginResponse, isTempAuthUser } from '@/types/auto-login';

/**
 * Auto-login API endpoint for email verification
 * Creates a NextAuth session directly from JWT token
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoLoginResponse>> {
  try {
    const body: AutoLoginRequest = await request.json();
    const { token, user } = body;
    
    // Validate required fields using type guard
    if (!token || !isTempAuthUser(user)) {
      return NextResponse.json(
        { error: 'Missing required authentication data' },
        { status: 400 }
      );
    }
    
    // Validate token format (basic JWT structure check)
    if (typeof token !== 'string' || !token.includes('.')) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }
    
    // Create NextAuth JWT token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET not configured');
      return NextResponse.json(
        { error: 'Authentication configuration error' },
        { status: 500 }
      );
    }
    
    // Create session data
    const sessionData = {
      sub: user.id.toString(),
      name: user.username,
      email: user.email,
      roles: user.roles || ['ROLE_USER'],
      provider: 'credentials',
      token: token,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };
    
    // Encode the JWT token for NextAuth
    const nextAuthToken = await encode({
      token: sessionData,
      secret: secret,
    });
    
    // Create response with session cookie
    const response = NextResponse.json({ success: true });
    
    // Set the NextAuth session cookie
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
      
    response.cookies.set(cookieName, nextAuthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
