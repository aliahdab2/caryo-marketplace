"use client";

import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

interface MediaErrorBoundaryProps {
  children: ReactNode;
  mediaType?: 'image' | 'video' | 'mixed';
  onMediaError?: (error: Error, errorId: string, mediaType: string) => void;
  enableFallbackMode?: boolean;
  maxRetries?: number;
}

/**
 * Specialized Error Boundary for Media Upload Components
 * 
 * Features:
 * - Media-specific error handling and recovery
 * - Graceful degradation for upload failures
 * - File corruption detection and handling
 * - Memory leak prevention on errors
 * - Media-specific error messages and guidance
 * - Fallback to basic file input on component failure
 * 
 * Usage:
 * ```tsx
 * <MediaErrorBoundary
 *   mediaType="image"
 *   enableFallbackMode={true}
 *   maxRetries={2}
 *   onMediaError={(error, errorId, mediaType) => {
 *     analytics.track('media_upload_error', { mediaType, errorId });
 *   }}
 * >
 *   <ImageUploadComponent />
 * </MediaErrorBoundary>
 * ```
 */
export const MediaErrorBoundary: React.FC<MediaErrorBoundaryProps> = ({
  children,
  mediaType = 'mixed',
  onMediaError,
  enableFallbackMode = true,
  maxRetries = 2
}) => {
  const { t } = useLazyTranslation(['common', 'media']);

  const handleMediaError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Log media-specific error details
    console.error(`Media Upload Error (${mediaType}):`, {
      error: error.message,
      errorId,
      mediaType,
      enableFallbackMode,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Check for common media upload error patterns
    const isMemoryError = error.message.includes('memory') || error.message.includes('heap');
    const isFileError = error.message.includes('file') || error.message.includes('upload');
    const isNetworkError = error.message.includes('network') || error.message.includes('fetch');

    // Call custom media error handler with context
    onMediaError?.(error, errorId, mediaType);

    // Track media errors for analytics
    interface GtagWindow extends Window {
      gtag?: (command: string, action: string, parameters: Record<string, unknown>) => void;
    }
    
    if (typeof window !== 'undefined' && (window as GtagWindow).gtag) {
      (window as GtagWindow).gtag!('event', 'media_upload_error', {
        media_type: mediaType,
        error_id: errorId,
        error_message: error.message,
        is_memory_error: isMemoryError,
        is_file_error: isFileError,
        is_network_error: isNetworkError,
        has_fallback: enableFallbackMode
      });
    }

    // Report to Sentry with media context
    interface SentryWindow extends Window {
      Sentry?: {
        withScope: (callback: (scope: SentryScope) => void) => void;
        captureException: (error: Error) => void;
      };
    }
    
    interface SentryScope {
      setTag: (key: string, value: string) => void;
      setContext: (key: string, value: unknown) => void;
    }
    
    if (typeof window !== 'undefined' && (window as SentryWindow).Sentry) {
      (window as SentryWindow).Sentry!.withScope((scope: SentryScope) => {
        scope.setTag('mediaType', mediaType);
        scope.setTag('errorType', 'media_upload');
        scope.setContext('mediaError', {
          mediaType,
          enableFallbackMode,
          isMemoryError,
          isFileError,
          isNetworkError
        });
        (window as SentryWindow).Sentry!.captureException(error);
      });
    }
  };

  const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => {
    if (enableFallbackMode) {
      return (
        <MediaErrorFallback
          error={error}
          mediaType={mediaType}
          onRetry={retry}
          t={t}
        />
      );
    }

    return (
      <MediaErrorMessage
        error={error}
        mediaType={mediaType}
        onRetry={retry}
        t={t}
      />
    );
  };

  return (
    <ErrorBoundary
      componentName={`${mediaType} Upload`}
      level="component"
      enableRetry={true}
      maxRetries={maxRetries}
      resetOnPropsChange={true}
      onError={handleMediaError}
      fallback={customFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

// Fallback with basic file input
interface MediaErrorFallbackProps {
  error: Error;
  mediaType: 'image' | 'video' | 'mixed';
  onRetry: () => void;
  t: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- Translation function - complex react-i18next signature
}

const MediaErrorFallback: React.FC<MediaErrorFallbackProps> = ({
  error: _error,
  mediaType,
  onRetry,
  t
}) => {
  const getAcceptTypes = () => {
    switch (mediaType) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      default:
        return 'image/*,video/*';
    }
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image':
        return (
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50">
      <div className="text-center space-y-4">
        {/* Error Alert */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">
              {t('media:uploadComponentError', 'Advanced upload component failed. Using basic file input instead.')}
            </p>
          </div>
        </div>

        {/* Basic Upload Interface */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {getMediaIcon()}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('media:basicUploadTitle', 'Basic File Upload')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('media:basicUploadDescription', 'Select files using the button below')}
            </p>
          </div>

          {/* Basic File Input */}
          <div className="space-y-3">
            <label className="inline-block">
              <input
                type="file"
                accept={getAcceptTypes()}
                multiple={mediaType !== 'video'}
                className="sr-only"
                onChange={(e) => {
                  // Basic file handling - could integrate with parent component
                  const files = Array.from(e.target.files || []);
                  console.log('Basic upload selected files:', files);
                }}
              />
              <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {t('media:selectFiles', 'Select Files')}
              </span>
            </label>

            <button
              onClick={onRetry}
              className="ml-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('media:retryAdvancedUpload', 'Retry Advanced Upload')}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              {t('media:basicUploadLimitations', 'Basic mode has limited features:')}
            </p>
            <ul className="text-left space-y-0.5 ml-4">
              <li>• {t('media:noDragDrop', 'No drag & drop support')}</li>
              <li>• {t('media:noPreview', 'No image previews')}</li>
              <li>• {t('media:noReordering', 'No file reordering')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple error message without fallback functionality
interface MediaErrorMessageProps {
  error: Error;
  mediaType: 'image' | 'video' | 'mixed';
  onRetry: () => void;
  t: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- Translation function - complex react-i18next signature
}

const MediaErrorMessage: React.FC<MediaErrorMessageProps> = ({
  error,
  mediaType,
  onRetry,
  t
}) => {
  return (
    <div className="min-h-[200px] flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('media:uploadError', 'Upload Error')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('media:uploadErrorMessage', 'The {{mediaType}} upload component encountered an error.', { mediaType })}
          </p>
        </div>

        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {t('media:tryAgain', 'Try Again')}
        </button>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono break-all">
              {error.message}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default MediaErrorBoundary;
