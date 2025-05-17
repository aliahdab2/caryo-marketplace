"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useApiErrorHandler } from '@/utils/apiErrorHandler';
import SimpleVerification from '@/components/auth/SimpleVerification';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const SignInPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { getErrorMessage } = useApiErrorHandler();
  const [username, setUsername] = useState(""); // Changed from email to username
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // Track redirect state
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [isVerified, setIsVerified] = useState(false); // Track verification status
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: session } = useSession(); // Added back session

  // Extract callback URL from search params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the URL search params
      const searchParams = new URLSearchParams(window.location.search);
      const callback = searchParams.get('callbackUrl');
      
      if (callback) {
        try {
          // Handle both absolute and relative URLs properly
          if (callback.startsWith('/')) {
            // It's a relative URL path, use as is
            setCallbackUrl(callback);
          } else {
            // It might be an encoded absolute URL
            const url = new URL(decodeURIComponent(callback));
            // Only use the pathname + search if it's from the same origin
            // Otherwise use the default dashboard path
            if (url.origin === window.location.origin) {
              setCallbackUrl(url.pathname + url.search);
            }
          }
        } catch (e) {
          // Silently fail and keep the default dashboard URL
          // No need to log during tests
          if (process.env.NODE_ENV !== 'test') {
            console.warn('Error parsing callback URL:', e);
          }
        }
      }
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setShowSuccess(false);

    if (!username || !password) {
      setError(t('auth.usernamePasswordRequired', 'Username and password are required.'));
      setLoading(false);
      return;
    }

    if (!isVerified) {
      setError(t('auth.verificationRequired', "Verification required before login"));
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username, // Changed from email to username
        password,
      });

      if (result?.error) {
        // Check specifically for authentication errors
        if (result.error.toLowerCase().includes('invalid') || 
            result.error.toLowerCase().includes('credentials') ||
            result.error.toLowerCase().includes('password') ||
            result.error.toLowerCase().includes('user')) {
          // Use our specific translation for credential errors
          setError(t('errors:errors.invalidCredentials', 'Invalid username or password. Please try again.'));
        } else {
          // For other errors, use our general error handler
          setError(getErrorMessage({ message: result.error }));
        }
        setLoading(false);
      } else if (result?.ok) {
        setShowSuccess(true); // Ensure success message is shown
        setRedirecting(true);
        setError(""); // Clear any previous errors
        
        // Force NextAuth to sync the session before redirecting
        const syncSession = async () => {
          try {
            // Wait a moment for NextAuth to complete its internal processes
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Try router first, fallback to direct navigation
            if (process.env.NODE_ENV !== "test") {
              try {
                router?.push?.(callbackUrl);
              } catch (err) {
                // Fallback to direct navigation
                window.location.href = callbackUrl;
              }
            }
          } catch (err) {
            // Silently handle errors in test environment
            if (process.env.NODE_ENV !== "test") {
              // Use safer fallback navigation without logging errors
              window.location.href = callbackUrl;
            }
          }
        };
        
        // Start the session sync process right away
        syncSession();
      } else {
        setError("An unknown error occurred.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      // Log errors only in non-test environments
      if (process.env.NODE_ENV !== "test") {
        console.error("Sign-in error", err);
      }
    } finally {
      // Only reset loading if we're not redirecting
      if (!redirecting) {
        setLoading(false);
      }
    }
  };

  // Safe redirect when user already has an active session
  useEffect(() => {
    if (session && !redirecting) {
      // Use a safer redirection approach that won't fail if router isn't ready
      try {
        router?.push?.(callbackUrl);
      } catch (err) {
        // Fallback to direct navigation if router push fails
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
          window.location.href = callbackUrl;
        }
      }
    }
  }, [session, callbackUrl, redirecting, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">{t('auth.signin')}</h2>
        
        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-700 dark:text-red-100 dark:border-red-900">
            {error}
          </div>
        )}
        {showSuccess && (
          <div role="alert" className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md dark:bg-green-700 dark:text-green-100 dark:border-green-900">
            {t('auth.loginSuccess', 'Login successful!')} {t('auth.redirecting', 'Redirecting...')}
          </div>
        )}

        <form onSubmit={handleSubmit} className={redirecting ? 'opacity-70 transition-opacity' : ''}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="mb-6">
            <SimpleVerification 
              onVerified={(verified: boolean) => {
                // Only update if different to prevent potential infinite loops if component re-renders often
                if (verified !== isVerified) { 
                  setIsVerified(verified);
                  if (verified) {
                    // Clear verification-specific error if it was set
                    if (error === t('auth.verificationRequired')) {
                      setError(''); 
                    }
                  }
                }
              }}
              autoStart={true} 
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isVerified}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                loading || !isVerified ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? t('common.loading') : t('auth.signin')}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {t('auth.orContinueWith', 'Or continue with')}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleSignInButton callbackUrl={callbackUrl} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.dontHaveAccount')}{" "}
          <a
            href="/auth/signup"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('auth.signup')}
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignInPage;
