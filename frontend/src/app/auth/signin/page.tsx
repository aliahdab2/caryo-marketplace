"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApiErrorHandler } from '@/utils/apiErrorHandler';
import SimpleVerification from '@/components/auth/SimpleVerification';

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { getErrorMessage } = useApiErrorHandler();
  const [username, setUsername] = useState(""); // Changed from email to username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // Track redirect state
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [isVerified, setIsVerified] = useState(false); // Track verification status
  
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
          // If there's an error parsing the URL, keep the default
          console.warn('Error parsing callback URL:', e);
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    if (!isVerified) {
      setError(t('auth.verificationRequired', "Verification required before login"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username, // Changed from email to username
        password,
      });

      if (result?.error) {
        // Use our error handler to get user-friendly error messages
        setError(getErrorMessage({ message: result.error }));
        setLoading(false);
      } else if (result?.ok) {
        // Set redirecting state to trigger the visual transition
        setRedirecting(true);
        setError(""); // Clear any previous errors
        
        // Force NextAuth to sync the session before redirecting
        const syncSession = async () => {
          try {
            // Wait a moment for NextAuth to complete its internal processes
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Hard redirect to ensure complete page refresh with new session
            window.location.href = callbackUrl;
          } catch (err) {
            console.error("Navigation error:", err);
            // Fallback navigation if something goes wrong
            window.location.href = callbackUrl;
          }
        };
        
        // Start the session sync process right away
        syncSession();
      } else {
        setError("An unknown error occurred.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Sign-in error", err);
    } finally {
      // Only reset loading if we're not redirecting
      if (!redirecting) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
      {/* Show a success banner just within the login component when redirecting */}
      {redirecting && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-green-500 text-white text-center rounded-t-lg transition-all transform animate-pulse">
          <p className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {t('auth.loginSuccess', 'Login successful!')} {t('auth.redirecting', 'Redirecting...')}
          </p>
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        {t('auth.signin')}
      </h1>

      <form onSubmit={handleSubmit} className={redirecting ? 'opacity-70 transition-opacity' : ''}>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('auth.username')}
          </label>
          <input
            type="text"
            id="username"
            className="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading || redirecting}
            placeholder={t('auth.username')}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="password"
            className="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || redirecting}
            placeholder="••••••••"
          />
        </div>

        {/* Security verification component - auto-starts on login page */}
        <div className="mb-6">
          <SimpleVerification 
            autoStart={true}
            onVerified={(verified: boolean) => {
              // Only update state if it's different to avoid unnecessary re-renders
              if (verified !== isVerified) {
                setIsVerified(verified);
                if (verified) {
                  // Clear any previous verification errors
                  if (error && error.includes("verification")) {
                    setError("");
                  }
                }
              }
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md mb-6" role="alert">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isVerified || redirecting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(loading || !isVerified || redirecting) ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {redirecting ? t('auth.redirecting', 'Redirecting...') : t('common.loading')}
            </span>
          ) : (
            t('auth.signin')
          )}
        </button>
      </form>

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
  );
}
