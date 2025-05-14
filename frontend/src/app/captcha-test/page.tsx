"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import SASVerification from '@/components/auth/SASVerification';

export default function VerificationTestPage() {
  const { t } = useTranslation('common');
  const [isVerified, setIsVerified] = useState(false);

  const handleVerification = (verified: boolean) => {
    setIsVerified(verified);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        {t('auth.securityCheck')}
      </h1>
      
      <div className="mb-6 text-gray-700 dark:text-gray-300">
        <p className="mb-4">
          Our modern security system helps protect users and data without adding
          unnecessary friction to the user experience.
        </p>
        
        <div className="my-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
            {t('auth.verifyIdentity')}
          </h2>
          
          <SASVerification 
            onVerified={handleVerification}
            autoVerify={false}
          />
        </div>
        
        {isVerified && (
          <p className="text-green-600 dark:text-green-400 font-medium mb-4">
            {t('auth.securityCheckCompleted')}
          </p>
        )}
        
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
