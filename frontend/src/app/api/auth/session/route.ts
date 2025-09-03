import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-config";

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      // Return 200 with null data instead of 401 to avoid NextAuth treating it as an error
      return NextResponse.json({ user: null, accessToken: null, expires: null });
    }

    // Ensure session has required fields
    if (!session.user) {
      return NextResponse.json({ user: null, accessToken: null, expires: null });
    }

    const sessionData = {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        roles: (session.user as { roles?: string[] }).roles || [],
        isAdmin: ((session.user as { roles?: string[] }).roles || []).includes('ROLE_ADMIN'),
      },
      accessToken: (session as { accessToken?: string }).accessToken,
      expires: session.expires,
    };

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Session API: Error occurred:", error);
    // Return 200 with null data instead of 500 to avoid NextAuth treating it as a fetch error
    return NextResponse.json({ user: null, accessToken: null, expires: null });
  }
}
