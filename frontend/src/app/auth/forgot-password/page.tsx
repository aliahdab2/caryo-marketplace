"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'errors']);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          t('auth:resetEmailSent', 
            'If the email exists, a password reset link has been sent. Please check your email.')
        );
      } else {
        setError(data.message || t('errors:general', 'An error occurred. Please try again.'));
      }
    } catch (_e) {
      setError(t('errors:networkError', 'Network error. Please check your connection and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('auth:forgotPassword', 'Forgot password')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('auth:forgotPasswordDescription', 'Enter your email and we\'ll send you a password reset link.')}</p>

        {message && (
          <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded-md dark:bg-green-900/30 dark:text-green-200 dark:border-green-700 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-md dark:bg-red-900/30 dark:text-red-200 dark:border-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth:email', 'Email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={t('auth:emailPlaceholder', 'you@example.com')}
              aria-describedby="email-help"
            />
            <p id="email-help" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('auth:forgotPasswordHelp', 'We\'ll send an email if the address is registered.')}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !email}
            className={`w-full py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${submitting ? 'opacity-70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800`}
          >
            {submitting ? t('auth:sending', 'Sending...') : t('auth:sendResetLink', 'Send reset link')}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/auth/signin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            {t('auth:backToSignIn', 'Back to sign in')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;


