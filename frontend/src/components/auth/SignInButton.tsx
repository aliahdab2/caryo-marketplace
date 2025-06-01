"use client";

import { signIn } from "next-auth/react";
import { SignInButtonProps } from "@/types/components";
import useLazyTranslation from "@/hooks/useLazyTranslation";

export default function SignInButton({ className = "", onClick }: SignInButtonProps) {
  const { t, ready } = useLazyTranslation('auth');

  if (!ready) {
    return (
      <button
        disabled
        className={`flex items-center gap-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md px-2 xs:px-2.5 py-1 xs:py-1.5 text-xs xs:text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm whitespace-nowrap ${className}`}
      >
        <span className="text-link">Loading...</span>
        <span className="profile-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
      </button>
    );
  }

  const handleClick = () => {
    if (onClick) onClick();
    signIn();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-2 xs:px-2.5 py-1 xs:py-1.5 text-xs xs:text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap ${className}`}
    >
      <span className="text-link">{t('signIn')}</span>
      <span className="profile-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </span>
    </button>
  );
}
