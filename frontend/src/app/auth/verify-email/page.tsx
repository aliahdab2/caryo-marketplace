"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('invalid');
      setMessage('Verification token is missing.');
      return;
    }

    // Prevent multiple attempts
    if (hasAttempted) {
      return;
    }
    setHasAttempted(true);

    // Call the backend verification endpoint
    const verifyEmail = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Perfect! Your email has been verified successfully. You can now sign in to your account.');
          
          // Redirect to sign-in page after 4 seconds (give users time to read)
          setTimeout(() => {
            router.push('/auth/signin?verified=true');
          }, 4000);
        } else {
          setStatus('error');
          
          // Handle different error scenarios with appropriate messaging
          if (data.message && data.message.includes('expired')) {
            setMessage('Your verification link has expired. Please request a new verification email from the sign-in page.');
          } else if (data.message && data.message.includes('Invalid')) {
            setMessage('This verification link is not valid. Please check your email for the correct link or request a new one.');
          } else {
            setMessage(data.message || 'Unable to verify your email. Please try again or request a new verification email.');
          }
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router, hasAttempted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <div className="rounded-full bg-green-100 p-2">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            {(status === 'error' || status === 'invalid') && (
              <div className="rounded-full bg-red-100 p-2">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {(status === 'error' || status === 'invalid') && 'Verification Failed'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {status === 'success' && (
            <div className="text-center">
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 font-medium">
                  🎉 Welcome to Caryo Marketplace!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You can now create listings, save favorites, and contact sellers.
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Redirecting to sign in page in a few seconds...
              </p>
              <Link
                href="/auth/signin?verified=true"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign In Now
              </Link>
            </div>
          )}
          
          {(status === 'error' || status === 'invalid') && (
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Up Again
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
