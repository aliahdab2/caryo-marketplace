'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

/**
 * Dealer Not Found Page
 * 
 * This component follows Next.js App Router best practices for 404 handling.
 * It's automatically rendered when notFound() is called from a Server Component.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function DealerNotFound() {
  const { t } = useTranslation(['dealer', 'common']);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center max-w-2xl mx-auto">
        {/* Icon */}
        <div className="text-6xl mb-4" role="img" aria-label="Store">
          🏪
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('notFound')}
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('notFoundMessage')}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/search"
            className="inline-block px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            {t('browseListings')}
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            {t('common:backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
