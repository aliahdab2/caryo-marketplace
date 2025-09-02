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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top spacing to account for navbar */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        <div className="bg-white dark:bg-gray-800 py-6 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700">
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('auth:checkYourEmail')}
            </h1>
            
            <div className="text-gray-600 dark:text-gray-400">
              {email ? (
                <div className="space-y-2">
                  <p className="text-sm">{t('auth:verificationEmailSent')}</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border">
                    <span className="font-mono text-xs text-gray-900 dark:text-white break-all">
                      {email}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{t('auth:verificationEmailSentGeneric')}</p>
              )}
            </div>
          </div>

          {/* Compact Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                  {t('auth:nextSteps')}
                </h3>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <div>1. {t('auth:checkEmailInbox')}</div>
                  <div>2. {t('auth:clickVerificationLink')}</div>
                  <div>3. {t('auth:returnToSignIn')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Resend Email */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {t('auth:didntReceiveEmail')}
            </p>
            
            {resent ? (
              <div className="inline-flex items-center px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  {t('auth:emailResent')}
                </span>
              </div>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={resending || !email}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 mr-2 ${resending ? 'animate-spin' : ''}`} />
                {resending ? t('auth:resending') : t('auth:resendEmail')}
              </button>
            )}
          </div>

          {/* Primary Action */}
          <div className="mb-6">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              {t('auth:goToSignIn')}
            </Link>
          </div>

          {/* Help & Security Notice Combined */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('auth:emailVerificationHelp')} {' '}
              <Link 
                href="/contact" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {t('auth:contactSupport')}
              </Link>
            </p>
            
            <div className="inline-flex items-center px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
              <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400 mr-1" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                Links expire in 24h
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
