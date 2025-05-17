"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useTranslation } from "react-i18next";

interface GoogleSignInButtonProps {
  callbackUrl?: string;
  className?: string;
}

export default function GoogleSignInButton({
  callbackUrl = "/dashboard",
  className = "",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Using NextAuth's signIn function with Google provider
      const result = await signIn("google", {
        callbackUrl,
        redirect: true,
      });

      // Note: For redirect:true, result will be undefined as the page will reload
      // This code will only execute if redirect is set to false
      if (result?.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error("Google sign in error", error);
      setError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        } ${className}`}
        aria-label={t("auth.continueWithGoogle", "Continue with Google")}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        ) : (
          <>
            <FcGoogle className="h-5 w-5" />
            <span>{t("auth.continueWithGoogle", "Continue with Google")}</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </>
  );
}
