"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function DevTestingPage() {
  const { t } = useTranslation(['common']);

  const testPages = [
    {
      name: 'Captcha Test',
      path: '/captcha-test',
      description: 'Test page for the SimpleVerification component.'
    },
    {
      name: 'Success Alert Test',
      path: '/simple-success-alert-test',
      description: 'Test page for the SuccessAlert component.'
    },
    {
      name: 'Gallery Test',
      path: '/test-gallery',
      description: 'Test page for the image gallery components.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Development & Testing Components
      </h1>
      
      <p className="mb-8 text-gray-700 dark:text-gray-300 text-center">
        A central hub for accessing all test and development pages.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testPages.map((page) => (
          <Link 
            href={page.path} 
            key={page.path}
            className="block p-6 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {page.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {page.description}
            </p>
            <div className="mt-4 text-blue-600 dark:text-blue-400">
              Visit →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Add New Test Pages
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          To add a new test page to this list:
        </p>
        <ol className="mt-2 ml-5 list-decimal text-gray-700 dark:text-gray-300">
          <li>Create your new test page in the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/src/app</code> directory</li>
          <li>Update this page to include a link to your new test component</li>
        </ol>
      </div>

      <div className="mt-8 text-center">
        <Link 
          href="/"
          className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
