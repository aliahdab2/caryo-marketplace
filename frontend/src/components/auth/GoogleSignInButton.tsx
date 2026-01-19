"use client";

import { signIn, getProviders } from "next-auth/react"; // Removed SignInResponse
import { useState, useCallback, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
// Removed: import { useTranslation } from "react-i18next";
import { GoogleSignInButtonProps } from "@/types/components";
import useLazyTranslation from "@/hooks/useLazyTranslation";

/**
 * Google Sign In Button Component
 *
 * Provides a styled button to authenticate users with Google via NextAuth.js
 */
export default function GoogleSignInButton({
  callbackUrl = "/dashboard",
  className = "",
  redirect = true,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  // Use the improved useLazyTranslation hook that returns t and ready
  const { t, ready } = useLazyTranslation('auth');

  const [isLoading, setIsLoading] = useState(false); // Renamed for clarity from 'loading'
  const [error, setError] = useState<string | null>(null);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  // Check if Google provider is available
  useEffect(() => {
    const checkProviders = async () => {
      try {
        const providers = await getProviders();
        // Just check if providers are loaded, no need to store the result
        console.log('Providers loaded:', !!providers?.google);
      } catch (error) {
        console.warn('Failed to check providers:', error);
      } finally {
        setProvidersLoaded(true);
      }
    };

    checkProviders();
  }, []);

  const handleSignIn = useCallback(async () => {
    // Check if we have valid Google credentials before attempting sign-in
    // Skip this check in test environment
    if (process.env.NODE_ENV !== 'test') {
      try {
        const { getProviders } = await import("next-auth/react");
        const providers = await getProviders();
        const googleProvider = providers?.google;

        if (!googleProvider) {
          setError("Google Sign-In is not properly configured. Please contact the administrator.");
          return;
        }
      } catch (error) {
        console.warn('Could not verify Google provider availability:', error);
        setError("Unable to verify Google Sign-In availability. Please try again later.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get returnUrl from URL if present
      let targetUrl = callbackUrl;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get('returnUrl');
        if (returnUrl) {
          // Validate the returnUrl
          try {
            if (returnUrl.startsWith('/')) {
              targetUrl = returnUrl;
            } else {
              const url = new URL(decodeURIComponent(returnUrl));
              if (url.origin === window.location.origin) {
                // Include the full path and query string
                targetUrl = url.pathname + url.search + url.hash;
              }
            }
          } catch (e) {
            console.warn('Invalid returnUrl:', e);
          }
        }
      }

      const result = await signIn("google", {
        callbackUrl: targetUrl,
        redirect,
      });

      if (result?.error) {
        console.error("Google Sign-In Error:", result.error);
        setError(result.error || "An unknown error occurred during sign-in.");
        if (onError) {
          onError(result.error);
        }
      } else if (result?.ok && !result.error) {
        if (onSuccess) {
          onSuccess(result);
        }
        // Redirect is handled by signIn if redirect: true
      } else if (!redirect && result?.url) {
        // If redirect is false and URL is present, it means successful sign-in without redirect
        // This case might be useful if parent component handles redirect or state update
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (e: unknown) {
      console.error("Google Sign-In Exception:", e);
      let errorMessage = "An unexpected error occurred.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      setError(errorMessage);
      if (onError) {
        // If the onError callback expects a string, we pass errorMessage.
        // If it expects an Error object, we might need to adjust this.
        // For now, let's assume it can handle a string or an Error object if e is an Error.
        if (e instanceof Error) {
          onError(e);
        } else {
          onError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [callbackUrl, redirect, onSuccess, onError]);

  // Always show the Google button - let it handle errors gracefully

  return (
    <>
      {!ready || !providersLoaded ? (
        // Loading state
        <button
          disabled
          type="button"
          className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-400 opacity-70 ${className}`}
        >
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-white mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              data-testid="loading-spinner"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {t('loading')}
          </div>
        </button>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          type="button"
          aria-busy={isLoading}
          aria-label={
            isLoading
              ? t("signingIn")
              : t("continueWithGoogle")
          }
          className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-bold text-gray-700 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap transition-colors duration-200 ${
            isLoading || !ready ? 'opacity-70 cursor-not-allowed' : ''
          } ${className}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <svg
                className="animate-spin h-5 w-5 text-gray-700 dark:text-gray-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                data-testid="loading-spinner"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <>
              <FcGoogle className="h-5 w-5" />
              <span>
                {isLoading
                  ? t("signingIn")
                  : t("continueWithGoogle")}
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <div
          className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </>
  );
}
