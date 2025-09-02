'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import useLazyTranslation from '@/hooks/useLazyTranslation';
import Image from 'next/image';

export default function CheckEmailPage() {
  const { t } = useLazyTranslation(['auth', 'common']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('signup-email') : null;
    
    const userEmail = emailParam || storedEmail || '';
    setEmail(userEmail);

    // Clean up stored email after use
    if (storedEmail && typeof window !== 'undefined') {
      localStorage.removeItem('signup-email');
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      // Call your resend verification email API
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setResending(false);
    }
  };

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top spacing to account for navbar */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            {/* Simple Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('auth:checkYourEmail')}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {email ? (
                  <>
                    {t('auth:verificationEmailSent')} <br />
                    <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                  </>
                ) : (
                  t('auth:verificationEmailSentGeneric')
                )}
              </p>
            </div>

            {/* Simple Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                {t('auth:nextSteps')}
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div>1. {t('auth:checkEmailInbox')}</div>
                <div>2. {t('auth:clickVerificationLink')}</div>
                <div>3. {t('auth:returnToSignIn')}</div>
              </div>
            </div>

            {/* Simple Resend */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('auth:didntReceiveEmail')}
              </p>
              
              {resent ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  {t('auth:emailResent')}
                </div>
              ) : (
                <button
                  onClick={handleResendEmail}
                  disabled={resending || !email}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? t('auth:resending') : t('auth:resendEmail')}
                </button>
              )}
            </div>

            {/* Simple Sign-in Link */}
            <div className="text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {t('auth:goToSignIn')}
              </Link>
            </div>

            {/* Simple Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t('auth:emailVerificationHelp')} {' '}
                <Link 
                  href="/contact" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('auth:contactSupport')}
                </Link>
              </p>
              
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('auth:linksExpireShort', 'Links expire in 24h')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
