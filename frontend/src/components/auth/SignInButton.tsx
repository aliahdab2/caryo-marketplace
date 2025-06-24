"use client";

import { signIn } from "next-auth/react";
import { SignInButtonProps } from "@/types/components";
import useLazyTranslation from "@/hooks/useLazyTranslation";
import { MdPerson } from "react-icons/md";

export default function SignInButton({ className = "", onClick }: SignInButtonProps) {
  const { t, ready } = useLazyTranslation('auth');

  if (!ready) {
    return (
      <button
        disabled
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 rounded-md px-3 py-2.5 text-sm font-medium min-w-[70px] max-w-[85px] h-14 transition-colors cursor-not-allowed ${className}`}
      >
        <MdPerson className="h-5 w-5 mb-1 flex-shrink-0" />
        <span className="text-xs leading-tight font-medium">Loading...</span>
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
      className={`text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14 ${className}`}
    >
      <MdPerson className="h-5 w-5 mb-1 flex-shrink-0" />
      <span className="text-xs leading-tight font-medium">{t('signIn')}</span>
    </button>
  );
}
