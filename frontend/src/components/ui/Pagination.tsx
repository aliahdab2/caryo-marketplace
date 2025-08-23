"use client";

import React, { useMemo, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
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
  resultsText
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
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      // Force scroll to top immediately
      window.scrollTo(0, 0);
    }
  }, [currentPage, onPageChange, totalPages]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      // Force scroll to top immediately
      window.scrollTo(0, 0);
    }
  }, [currentPage, totalPages, onPageChange]);

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
        {/* Previous button */}
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`
            relative inline-flex items-center justify-center
            w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300
            focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500
            transition-all duration-200 ease-in-out
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:hover:border-gray-500
            shadow-sm hover:shadow-md active:scale-95
          `}
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
        <div className={`${isRTL ? 'w-6 ml-6' : 'w-6 mr-6'}`} />

        {/* Page numbers container */}
        <div className={`flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 dark:text-gray-400"
                >
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
                className={`
                  relative inline-flex items-center justify-center
                  w-10 h-10 text-sm font-medium rounded-md
                  transition-all duration-200 ease-in-out
                  focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    isCurrentPage
                      ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700 shadow-md'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }
                `}
                aria-label={t('common:goToPage', 'Go to page {{page}}', { page: pageNumber })}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className={`${isRTL ? 'w-6 mr-6' : 'w-6 ml-6'}`} />

        {/* Next button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`
            relative inline-flex items-center justify-center
            w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300
            focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500
            transition-all duration-200 ease-in-out
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:hover:border-gray-500
            shadow-sm hover:shadow-md active:scale-95
          `}
          aria-label={t('common:nextPage', 'Next page')}
          title={t('common:nextPage', 'Next page')}
        >
          {isRTL ? (
            <MdChevronLeft className="w-5 h-5" aria-hidden="true" />
          ) : (
            <MdChevronRight className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
