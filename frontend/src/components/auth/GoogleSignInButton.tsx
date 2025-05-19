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
  const [isLoading, setIsLoading] = useState(false); // Renamed for clarity from 'loading'
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("google", {
        callbackUrl,
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

  return (
    <>
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        type="button"
        aria-busy={isLoading}
        aria-label={
          isLoading
            ? t("auth.signingIn", "Signing in...")
            : t("auth.continueWithGoogle", "Continue with Google")
        }
        className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap ${
          isLoading ? "opacity-70 cursor-not-allowed" : ""
        } ${className}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <svg 
              className="animate-spin h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              data-testid="loading-spinner"
              aria-hidden="true"
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
            <span className="ml-2 rtl:ml-0 rtl:mr-2">{t("auth.signingIn", "Signing in...")}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <FcGoogle className="mr-2 h-5 w-5 rtl:mr-0 rtl:ml-2" aria-hidden="true" />
            <span>{t("auth.continueWithGoogle", "Continue with Google")}</span>
          </div>
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
