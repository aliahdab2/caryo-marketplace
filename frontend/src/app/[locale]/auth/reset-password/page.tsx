'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import Link from 'next/link';
import { PasswordValidation, usePasswordValidation } from '@/components/auth/PasswordValidation';

export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const { isRTL } = useLanguageSwitching();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateToken = useCallback(async (tokenToValidate: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/auth/reset-password/validate?token=${encodeURIComponent(tokenToValidate)}`, {
        method: 'GET',
      });

      if (response.ok) {
        setTokenValid(true);
      } else {
        const data = await response.json();
        setError(data.message || t('auth:invalidResetToken', 'Invalid or expired reset token. Please request a new password reset.'));
      }
    } catch (_e) {
      setError(t('errors:networkError', 'Network error. Please check your connection and try again.'));
    } finally {
      setValidatingToken(false);
    }
  }, [t]);

  // Validate token on component mount
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError(t('auth:invalidResetToken', 'Invalid or expired reset token. Please request a new password reset.'));
      setValidatingToken(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, [searchParams, t, validateToken]);

  // Use centralized password validation
  const { isValid: isPasswordValid, firstError: passwordError } = usePasswordValidation(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError(t('auth:invalidResetToken', 'Invalid or expired reset token. Please request a new password reset.'));
      return;
    }

    // Client-side validation
    if (!isPasswordValid && passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth:passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t('auth:resetPasswordSuccess', 'Password has been reset successfully!'));
        // Redirect to sign-in page after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        // Handle different types of errors more specifically
        if (response.status === 400) {
          // Check if it's a validation error
          if (data.newPassword) {
            // Backend validation error for password field
            setError(data.newPassword);
          } else if (data.message) {
            // General validation error
            setError(data.message);
          } else {
            setError(t('auth:passwordValidationFailed', 'Password does not meet security requirements. Please check the requirements and try again.'));
          }
        } else if (response.status === 401 || response.status === 404) {
          setError(t('auth:invalidResetToken', 'Invalid or expired reset token. Please request a new password reset.'));
        } else if (response.status === 429) {
          setError(t('auth:tooManyAttempts', 'Too many attempts. Please try again later.'));
        } else {
          setError(data.message || t('auth:resetPasswordFailed', 'Failed to reset password. Please try again.'));
        }
      }
    } catch (_e) {
      setError(t('errors:networkError', 'Network error. Please check your connection and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{t('auth:loading', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            {t('auth:resetPassword', 'Reset Password')}
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="text-center">
            <Link 
              href="/auth/forgot-password" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              {t('auth:forgotPassword', 'Request new password reset')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('auth:resetPassword', 'Reset Password')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('auth:enterNewPassword', 'Enter your new password below.')}
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">{message}</p>
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
              {t('auth:redirecting', 'Redirecting to sign-in page...')}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth:newPassword', 'New Password')}
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('auth:passwordPlaceholder', '••••••••')}
              required
              disabled={submitting}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            
            {/* Password Requirements */}
            <PasswordValidation password={newPassword} />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('auth:confirmNewPassword', 'Confirm New Password')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('auth:passwordPlaceholder', '••••••••')}
              required
              disabled={submitting}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !newPassword || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {submitting ? t('auth:loading', 'Loading...') : t('auth:resetPassword', 'Reset Password')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/auth/signin" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            {t('auth:backToSignIn', 'Back to Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
}
