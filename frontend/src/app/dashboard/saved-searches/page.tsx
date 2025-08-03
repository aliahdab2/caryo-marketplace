'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SavedSearchesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new URL structure
    router.replace('/saved/alerts');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
