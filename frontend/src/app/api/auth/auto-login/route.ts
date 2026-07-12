import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { AutoLoginRequest, AutoLoginResponse, isTempAuthUser } from '@/types/auto-login';

/** Read the exp claim (as epoch ms) from the backend JWT so the session can refresh on time */
function getBackendJwtExpiryMs(token: string): number | undefined {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return undefined;
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Auto-login API endpoint for email verification
 * Creates a NextAuth session directly from JWT token
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoLoginResponse>> {
  try {
    const body: AutoLoginRequest = await request.json();
    const { token, refreshToken, user } = body;
    
    // Validate required fields using type guard
    if (!token || !isTempAuthUser(user)) {
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
      refreshToken: refreshToken,
      accessTokenExpires: getBackendJwtExpiryMs(token),
      provider: 'credentials'
    };
    
    // Encode the JWT token for NextAuth
    const nextAuthToken = await encode({
      token: sessionData,
      secret: secret,
    });
    
    // Create response with session cookie
    const response = NextResponse.json({ success: true });
    
    // Set the NextAuth/Auth.js session cookies (support both names for compatibility)
    const cookieNames = process.env.NODE_ENV === 'production'
      ? ['__Secure-next-auth.session-token']
      : ['next-auth.session-token', 'authjs.session-token'];

    for (const name of cookieNames) {
      response.cookies.set(name, nextAuthToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
