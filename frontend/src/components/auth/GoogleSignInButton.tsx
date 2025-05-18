"use client";

import { signIn, SignInResponse } from "next-auth/react";
import { useState, useCallback } from "react";
import { FcGoogle } from "react-icons/fc";
import { useTranslation } from "react-i18next";

/**
 * Props for the GoogleSignInButton component
 */
interface GoogleSignInButtonProps {
  /** URL to redirect to after successful sign in */
  callbackUrl?: string;
  /** Additional CSS classes to apply to the button */
  className?: string;
  /** Whether to redirect after sign in (default: true) */
  redirect?: boolean;
  /** Callback function to run on successful sign in */
  onSuccess?: (response: SignInResponse | undefined) => void;
  /** Callback function to run on sign in error */
  onError?: (error: Error | string) => void;
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleGoogleSignIn = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        // Using NextAuth's signIn function with Google provider
        const result = await signIn("google", {
          callbackUrl,
          redirect,
        });

        // If redirect is false or we have a result, handle success/failure
        if (result) {
          if (result.error) {
            const errorMessage = result.error;
            setError(errorMessage);
            onError?.(errorMessage);
          } else if (onSuccess && !redirect) {
            // Only call onSuccess if redirect is false and we have a callback
            onSuccess(result);
          }
        }
      } catch (error) {
        // Handle unexpected errors
        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed";

        // Don't show the full error to the user in production for security
        if (process.env.NODE_ENV !== "production") {
          console.error("Google sign in error", error);
        }

        setError(errorMessage);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    },
    [callbackUrl, redirect, onSuccess, onError]
  );

  // Translations with fallbacks
  const buttonText = t("auth.continueWithGoogle", "Continue with Google");
  const loadingText = t("auth.signingIn", "Signing in...");

  return (
    <>
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        type="button"
        aria-busy={loading}
        aria-label={loading ? loadingText : buttonText}
        className={`w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-opacity duration-150 ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        } ${className}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              data-testid="loading-spinner"
              aria-hidden="true"
              role="img"
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
            <span className="sr-only">{loadingText}</span>
          </>
        ) : (
          <>
            <FcGoogle className="h-5 w-5" aria-hidden="true" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

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
