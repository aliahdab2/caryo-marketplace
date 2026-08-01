"use client";

import React from 'react';
import Link from 'next/link';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

/**
 * A section of a legal/static page. Both values are keys in the `legal`
 * namespace; the body may contain blank-line-separated paragraphs.
 */
export interface LegalSection {
  headingKey: string;
  bodyKey: string;
}

interface LegalPageLayoutProps {
  /** Key for the page title, in the `legal` namespace */
  titleKey: string;
  /** Key for the lead paragraph shown under the title */
  introKey: string;
  sections: LegalSection[];
  /**
   * Show the "not yet reviewed by a lawyer" banner. On for the policy pages,
   * off for informational pages like About.
   */
  showPendingReviewNotice?: boolean;
}

const NAMESPACES = ['legal', 'common'];

/**
 * Shared shell for the static legal and informational pages.
 *
 * Content lives entirely in the `legal` translation namespace so both locales
 * stay in step. Paragraphs are authored as one string per section with blank
 * lines between them, which keeps translation keys flat (project convention)
 * without forcing one key per paragraph.
 *
 * Layout uses logical properties throughout, so it mirrors correctly in Arabic
 * without any direction-specific branching.
 */
export default function LegalPageLayout({
  titleKey,
  introKey,
  sections,
  showPendingReviewNotice = true,
}: LegalPageLayoutProps) {
  const { t, ready } = useLazyTranslation(NAMESPACES);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        <span className="sr-only">{t('loading', 'Loading')}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t(titleKey)}
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {t('lastUpdatedLabel')}: {t('lastUpdated')}
          </p>
          <p className="mt-6 text-base leading-relaxed text-gray-700 dark:text-gray-300">
            {t(introKey)}
          </p>

          {showPendingReviewNotice && (
            <p
              className="mt-6 border-s-4 border-amber-400 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              role="note"
            >
              {t('pendingReviewNotice')}
            </p>
          )}
        </header>

        <div className="space-y-10">
          {sections.map(({ headingKey, bodyKey }) => (
            <section key={headingKey} aria-labelledby={headingKey}>
              <h2
                id={headingKey}
                className="mb-3 text-xl font-semibold text-gray-900 dark:text-white"
              >
                {t(headingKey)}
              </h2>
              {t(bodyKey)
                .split('\n\n')
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="mb-3 text-base leading-relaxed text-gray-700 last:mb-0 dark:text-gray-300"
                  >
                    {paragraph}
                  </p>
                ))}
            </section>
          ))}
        </div>

        <footer className="mt-14 border-t border-gray-200 pt-8 dark:border-gray-700">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t('backToHome')}
          </Link>
        </footer>
      </div>
    </div>
  );
}
