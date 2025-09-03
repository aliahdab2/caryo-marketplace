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
    
    console.log('🔐 Auto-login API called with:', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      user: user ? { id: user.id, username: user.username, email: user.email } : null 
    });
    
    // Validate required fields using type guard
    if (!token || !isTempAuthUser(user)) {
      console.error('❌ Auto-login validation failed:', { hasToken: !!token, validUser: isTempAuthUser(user) });
      return NextResponse.json(
        { success: false, error: 'Missing required authentication data' },
        { status: 400 }
      );
    }
    
    // Validate token format (basic JWT structure check)
    if (typeof token !== 'string' || !token.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 400 }
      );
    }
    
    // Create NextAuth JWT token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Authentication configuration error' },
        { status: 500 }
      );
    }
    
    // Create session data matching NextAuth's expected JWT structure
    const sessionData = {
      // Standard JWT claims
      sub: user.id.toString(),
      name: user.username,
      email: user.email,
      picture: null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      jti: crypto.randomUUID(),
      
      // Custom claims that match our auth config
      id: user.id.toString(),
      roles: user.roles || ['ROLE_USER'],
      accessToken: token,
      provider: 'credentials'
    };
    
    // Encode the JWT token for NextAuth
    const nextAuthToken = await encode({
      token: sessionData,
      secret: secret,
    });
    
    console.log('✅ NextAuth token created successfully, length:', nextAuthToken.length);
    
    // Create response with session cookie
    const response = NextResponse.json({ success: true });
    
    // Set the NextAuth/Auth.js session cookies (support both names for compatibility)
    const cookieNames = process.env.NODE_ENV === 'production'
      ? ['__Secure-next-auth.session-token']
      : ['next-auth.session-token', 'authjs.session-token'];

    for (const name of cookieNames) {
      console.log('🍪 Setting cookie:', name);
      response.cookies.set(name, nextAuthToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });
    }
    
    console.log('🎉 Auto-login API completed successfully');
    return response;
    
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
