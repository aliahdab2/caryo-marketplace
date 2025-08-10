'use client';

import Link from 'next/link';
import { TestTube } from 'lucide-react';

export default function DevNavLink() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Link
      href="/test"
      className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 group"
      title="Development Test Hub"
    >
      <TestTube className="w-5 h-5" />
      <span className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        Test Hub
      </span>
    </Link>
  );
}
