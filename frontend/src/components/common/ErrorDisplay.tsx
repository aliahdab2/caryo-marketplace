'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdError, MdRefresh, MdWifiOff } from 'react-icons/md';

interface ErrorDisplayProps {
  /** The error object or message */
  error: Error | string | null | unknown;
  /** Retry function to call when retry button is clicked */
  retry?: () => void;
  /** Custom title for the error */
  title?: string;
  /** Custom className for styling */
  className?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show a full-page error */
  fullPage?: boolean;
}

/**
 * Error display component for consistent error UI
 * 
 * @example
 * <ErrorDisplay error={error} retry={refetch} />
 */
export function ErrorDisplay({
  error,
  retry,
  title,
  className = '',
  size = 'medium',
  fullPage = false,
}: ErrorDisplayProps) {
  const { t } = useTranslation('common');

  // Extract error message
  const errorMessage = React.useMemo(() => {
    if (!error) return t('error.unknown', 'An unexpected error occurred');
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return t('error.unknown', 'An unexpected error occurred');
  }, [error, t]);

  // Check if it's a network error
  const isNetworkError = React.useMemo(() => {
    const msg = errorMessage.toLowerCase();
    return msg.includes('network') || msg.includes('fetch') || msg.includes('connection');
  }, [errorMessage]);

  const sizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-6 text-base',
    large: 'p-10 text-lg',
  };

  const iconSizes = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const content = (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${sizeClasses[size]}
        ${className}
      `}
      role="alert"
    >
      {isNetworkError ? (
        <MdWifiOff
          className="text-red-500 mb-3"
          size={iconSizes[size]}
          aria-hidden="true"
        />
      ) : (
        <MdError
          className="text-red-500 mb-3"
          size={iconSizes[size]}
          aria-hidden="true"
        />
      )}

      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title || (isNetworkError
          ? t('error.networkTitle', 'Connection Error')
          : t('error.title', 'Something went wrong'))}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        {errorMessage}
      </p>

      {retry && (
        <button
          onClick={retry}
          className="
            inline-flex items-center gap-2 px-4 py-2
            bg-blue-600 hover:bg-blue-700 text-white
            rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <MdRefresh size={18} />
          {t('error.retry', 'Try Again')}
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export default ErrorDisplay;
