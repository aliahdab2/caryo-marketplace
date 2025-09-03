import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/utils/constants/api';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      );
    }

    // Call backend API to resend verification email
    const response = await fetch(`${getAuthUrl('RESEND_VERIFICATION')}?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(
        { message: 'Verification email sent successfully! Please check your inbox.' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: data.message || 'Unable to send verification email. Email may already be verified or rate limited.' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error in resend verification email API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
