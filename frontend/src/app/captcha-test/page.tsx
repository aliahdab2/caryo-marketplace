"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import SimpleVerification from '@/components/auth/SimpleVerification';

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
          
          <SimpleVerification 
            onVerified={handleVerification}
            autoStart={true}
          />
        </div>
        
        {isVerified && (
          <p className="text-green-600 dark:text-green-400 font-medium mb-4">
            {t('auth.securityCheckCompleted')}
          </p>
        )}
      </div>
      
      <div className="flex justify-between">
        <Link href="/">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            {t('back')}
          </button>
        </Link>
        <Link href={isVerified ? "/dashboard" : "#"}>
          <button 
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
              isVerified ? "hover:bg-blue-700" : "opacity-50 cursor-not-allowed"
            } transition`}
            disabled={!isVerified}
          >
            {t('continue')}
          </button>
        </Link>
      </div>
    </div>
  );
}
