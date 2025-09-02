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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mail className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('auth:checkYourEmail')}
            </h1>
            
            <div className="text-gray-600 dark:text-gray-400">
              {email ? (
                <div className="space-y-2">
                  <p className="text-sm">{t('auth:verificationEmailSent')}</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 border">
                    <span className="font-mono text-sm text-gray-900 dark:text-white break-all">
                      {email}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{t('auth:verificationEmailSentGeneric')}</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  {t('auth:nextSteps')}
                </h3>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">1</span>
                    {t('auth:checkEmailInbox')}
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">2</span>
                    {t('auth:clickVerificationLink')}
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">3</span>
                    {t('auth:returnToSignIn')}
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Resend Email */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('auth:didntReceiveEmail')}
            </p>
            
            {resent ? (
              <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('auth:emailResent')}
                </span>
              </div>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={resending || !email}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                {resending ? t('auth:resending') : t('auth:resendEmail')}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              {t('auth:goToSignIn')}
            </Link>
            
            <Link
              href="/"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common:backToHome')}
            </Link>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('auth:emailVerificationHelp')} {' '}
              <Link 
                href="/contact" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {t('auth:contactSupport')}
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              Verification links expire in 24 hours for security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
