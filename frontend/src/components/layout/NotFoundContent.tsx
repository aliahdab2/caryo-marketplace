"use client";

import React from 'react';
import Link from 'next/link';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

interface NotFoundContentProps {
  /**
   * Strings to render before the i18n runtime has loaded, or when this renders
   * above the i18n provider (the root not-found boundary). Keeps the page from
   * flashing raw translation keys, and keeps it readable if the `common`
   * namespace fails to load at all.
   */
  fallback: {
    heading: string;
    message: string;
    goHome: string;
    searchListings: string;
  };
}

/**
 * Shared body of the 404 pages.
 *
 * Rendered by both the in-locale boundary (where i18n is available and wins)
 * and the root boundary (which sits above the provider and relies on the
 * server-resolved fallback).
 */
export default function NotFoundContent({ fallback }: NotFoundContentProps) {
  const { t, ready } = useLazyTranslation('common');
  const text = (key: string, fallbackText: string) => (ready ? t(key, fallbackText) : fallbackText);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {text('notFoundHeading', fallback.heading)}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {text('notFoundMessage', fallback.message)}
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {text('notFoundGoHome', fallback.goHome)}
          </Link>
          <Link
            href="/search"
            className="inline-block w-full px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {text('notFoundSearchListings', fallback.searchListings)}
          </Link>
        </div>
      </div>
    </div>
  );
}
