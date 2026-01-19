"use client";

import Link from "next/link";
import { SignInButtonProps } from "@/types/components";
import useLazyTranslation from "@/hooks/useLazyTranslation";
import { MdPerson } from "react-icons/md";

export default function SignInButton({ className = "", onClick }: SignInButtonProps) {
  const { t, ready } = useLazyTranslation('auth');

  // We show a fallback label while translations are loading to ensure the button 
  // is interactive immediately and avoid layout shifts.
  const isArabic = typeof window !== 'undefined' && 
                   (window.location.pathname.startsWith('/ar') || 
                    document.cookie.includes('NEXT_LOCALE=ar'));
  const label = ready ? t('signIn') : (isArabic ? 'تسجيل الدخول' : 'Sign In');

  return (
    <Link
      href="/auth/signin"
      onClick={onClick}
      className={`text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] h-14 ${className}`}
    >
      <MdPerson className="h-5 w-5 mb-1 flex-shrink-0" />
      <span className={`text-xs leading-tight font-medium text-center whitespace-nowrap transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
    </Link>
  );
}
