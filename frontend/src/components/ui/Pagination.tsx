"use client";

import React, { useMemo, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdFirstPage, MdLastPage } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import type { PaginationProps } from '@/types/ui';

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  showInfo = true,
  isRTL = false,
  className = '',
  resultsText,
  scrollTargetSelector
}) => {
  const { t } = useTranslation(['common', 'search']);

  // Memoize display text to prevent unnecessary re-renders
  const displayText = useMemo(() => resultsText || {
    showing: t('common:showing', 'Showing'),
    of: t('common:of', 'of'),
    items: t('common:results', 'results')
  }, [resultsText, t]);

  // Memoize visible pages calculation to prevent unnecessary re-computations
  const visiblePages = useMemo((): (number | string)[] => {
    const delta = 2; // Number of pages to show on each side of current page
    const rangeWithDots: (number | string)[] = [];

    // Always show first page
    rangeWithDots.push(1);

    // Calculate start and end of middle range
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    // Add dots after first page if needed
    if (start > 2) {
      if (start > 3) {
        rangeWithDots.push('...');
      }
    }

    // Add middle range
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        rangeWithDots.push(i);
      }
    }

    // Add dots before last page if needed
    if (end < totalPages - 1) {
      if (end < totalPages - 2) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Remove duplicates and sort
    return [...new Set(rangeWithDots)].sort((a, b) => {
      if (a === '...' || b === '...') return 0;
      return (a as number) - (b as number);
    });
  }, [currentPage, totalPages]);

  // Memoize page change handlers to prevent unnecessary re-renders
  const scrollIntoView = (behavior: ScrollBehavior = 'smooth') => {
    const doScroll = () => {
      if (scrollTargetSelector) {
        const el = document.querySelector(scrollTargetSelector) as HTMLElement | null;
        if (el) {
          try {
            el.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
            return;
          } catch {}
        }
      }
      try {
        window.scrollTo({ top: 0, behavior });
      } catch {
        window.scrollTo(0, 0);
      }
    };
    // Defer to next frame(s) so new page content can render before scrolling
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(doScroll));
    } else {
      setTimeout(doScroll, 0);
    }
  };

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      scrollIntoView('smooth');
    }
  }, [currentPage, onPageChange, scrollTargetSelector]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      scrollIntoView('smooth');
    }
  }, [currentPage, totalPages, onPageChange, scrollTargetSelector]);

  const handleFirstPage = useCallback(() => {
    if (currentPage !== 1) {
      onPageChange(1);
      scrollIntoView('smooth');
    }
  }, [currentPage, onPageChange, scrollTargetSelector]);

  const handleLastPage = useCallback(() => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
      scrollIntoView('smooth');
    }
  }, [currentPage, totalPages, onPageChange, scrollTargetSelector]);

  const handlePageClick = useCallback((pageNumber: number) => {
    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  }, [currentPage, onPageChange]);

  // Memoize display range calculations
  const { startItem, endItem } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems || 0);
    return { startItem: start, endItem: end };
  }, [currentPage, itemsPerPage, totalItems]);

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  // Validate props
  if (currentPage < 1 || currentPage > totalPages) {
    console.warn(`Pagination: Invalid currentPage ${currentPage} for totalPages ${totalPages}`);
    return null;
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Results info */}
      {showInfo && totalItems && (
        <div className={`text-sm text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL ? (
            // Arabic: "النتائج 1-20 من أصل 35"
            <>
              {displayText.items}{' '}
              <span className="font-medium">
                {startItem.toLocaleString('ar')}–{endItem.toLocaleString('ar')}
              </span>{' '}
              {displayText.of}{' '}
              <span className="font-medium">
                {totalItems.toLocaleString('ar')}
              </span>
            </>
          ) : (
            // English: "Showing 1–20 of 35 results"
            <>
              {displayText.showing}{' '}
              <span className="font-medium">
                {startItem.toLocaleString('en')}–{endItem.toLocaleString('en')}
              </span>{' '}
              {displayText.of}{' '}
              <span className="font-medium">
                {totalItems.toLocaleString('en')}
              </span>{' '}
              {displayText.items}
            </>
          )}
        </div>
      )}

      {/* Pagination controls */}
      <nav 
        className={`flex items-center justify-center ${isRTL ? 'space-x-reverse' : ''}`} 
        aria-label={t('common:pagination', 'Pagination')}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* First page button */}
        <button
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium
            text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
          aria-label={t('common:firstPage', 'First page')}
          title={t('common:firstPage', 'First page')}
        >
          {isRTL ? (
            <MdLastPage className="w-5 h-5" aria-hidden="true" />
          ) : (
            <MdFirstPage className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        {/* Previous button */}
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium
            text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
          aria-label={t('common:previousPage', 'Previous page')}
          title={t('common:previousPage', 'Previous page')}
        >
          {isRTL ? (
            <MdChevronRight className="w-5 h-5" aria-hidden="true" />
          ) : (
            <MdChevronLeft className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        {/* Spacer */}
        <div className={`${isRTL ? 'w-4 ml-4' : 'w-4 mr-4'}`} />

        {/* Page numbers container */}
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1.5' : 'space-x-1.5'}`}>
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`dots-${index}`} className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-gray-400 dark:text-gray-500">
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => handlePageClick(pageNumber)}
                className={`inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isCurrentPage ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-transparent hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                aria-label={t('common:goToPage', 'Go to page {{page}}', { page: pageNumber })}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className={`${isRTL ? 'w-4 mr-4' : 'w-4 ml-4'}`} />

        {/* Next button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
          aria-label={t('common:nextPage', 'Next page')}
          title={t('common:nextPage', 'Next page')}
        >
          {isRTL ? (
            <MdChevronLeft className="w-5 h-5" aria-hidden="true" />
          ) : (
            <MdChevronRight className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        {/* Last page button */}
        <button
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
          aria-label={t('common:lastPage', 'Last page')}
          title={t('common:lastPage', 'Last page')}
        >
          {isRTL ? (
            <MdFirstPage className="w-5 h-5" aria-hidden="true" />
          ) : (
            <MdLastPage className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
