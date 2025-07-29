"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the saved locale from cookie or localStorage
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue || null;
      }
      return null;
    };

    const savedLocale = getCookie('NEXT_LOCALE') || 
      (typeof localStorage !== 'undefined' ? localStorage.getItem('NEXT_LOCALE') : null) ||
      (typeof navigator !== 'undefined' && navigator.language.startsWith('ar') ? 'ar' : 'en');

    // Redirect to the appropriate locale
    const targetLocale = savedLocale === 'ar' || savedLocale === 'en' ? savedLocale : 'ar';
    router.replace(`/${targetLocale}`);
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
