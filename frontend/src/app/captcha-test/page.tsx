"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function CaptchaTestPage() {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        CAPTCHA Functionality Removed
      </h1>
      
      <div className="mb-6 text-gray-700 dark:text-gray-300">
        <p className="mb-4">
          The CAPTCHA verification functionality has been removed from this application
          as part of a system-wide simplification process.
        </p>
        
        <p className="mb-4">
          User verification is now handled through other security measures that
          provide a better user experience.
        </p>
        
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
