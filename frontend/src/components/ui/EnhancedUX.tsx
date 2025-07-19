/**
 * 🎯 Priority 3: User Experience Enhancements
 * 
 * Enhanced loading states with better visual feedback and accessibility
 */

"use client";

import React from 'react';
import { MdError, MdRefresh, MdWifi, MdWifiOff, MdClose } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

// 🚀 Enhanced Loading Component with multiple visual styles
export const EnhancedLoadingState = React.memo<LoadingStateProps>(({
  type = 'spinner',
  size = 'md',
  message,
  className = ""
}) => {
  const { t } = useLazyTranslation(['common']);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderLoadingIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <div 
            className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
            role="status"
            aria-label={t('common.loading', 'Loading')}
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1" role="status" aria-label={t('common.loading', 'Loading')}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`bg-blue-600 rounded-full animate-pulse ${size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'}`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div 
            className={`bg-blue-600 rounded-full animate-ping ${sizeClasses[size]}`}
            role="status"
            aria-label={t('common.loading', 'Loading')}
          />
        );
      
      case 'skeleton':
      default:
        return (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      {renderLoadingIndicator()}
      {message && (
        <p className={`mt-3 text-gray-600 text-center ${textSizeClasses[size]}`}>
          {message}
        </p>
      )}
      <span className="sr-only">{t('common.loading', 'Loading content, please wait')}</span>
    </div>
  );
});
EnhancedLoadingState.displayName = 'EnhancedLoadingState';

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: 'error' | 'network' | 'not-found' | 'timeout';
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  showIcon?: boolean;
}

// 🚀 Enhanced Error Component with better UX and retry functionality
export const EnhancedErrorState = React.memo<ErrorStateProps>(({
  title,
  message,
  type = 'error',
  onRetry,
  retryLabel,
  className = "",
  showIcon = true
}) => {
  const { t } = useLazyTranslation(['common', 'errors']);

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <MdWifiOff className="h-12 w-12 text-red-500" aria-hidden="true" />;
      case 'timeout':
        return <MdWifi className="h-12 w-12 text-yellow-500" aria-hidden="true" />;
      case 'not-found':
        return <MdError className="h-12 w-12 text-gray-500" aria-hidden="true" />;
      default:
        return <MdError className="h-12 w-12 text-red-500" aria-hidden="true" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'network':
        return t('errors.networkError', 'Connection Error');
      case 'timeout':
        return t('errors.timeoutError', 'Request Timeout');
      case 'not-found':
        return t('errors.notFound', 'Not Found');
      default:
        return t('errors.generalError', 'Something went wrong');
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'network':
        return t('errors.networkMessage', 'Please check your internet connection and try again.');
      case 'timeout':
        return t('errors.timeoutMessage', 'The request took too long. Please try again.');
      case 'not-found':
        return t('errors.notFoundMessage', 'The requested content could not be found.');
      default:
        return t('errors.generalMessage', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <div className="mb-4">
          {getErrorIcon()}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || getDefaultTitle()}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message || getDefaultMessage()}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-describedby="retry-description"
        >
          <MdRefresh className="mr-2 h-4 w-4" aria-hidden="true" />
          {retryLabel || t('common.tryAgain', 'Try Again')}
        </button>
      )}
      
      <span id="retry-description" className="sr-only">
        {t('common.retryDescription', 'Click to retry the failed operation')}
      </span>
    </div>
  );
});
EnhancedErrorState.displayName = 'EnhancedErrorState';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

// 🚀 Progress Bar for long-running operations
export const ProgressBar = React.memo<ProgressBarProps>(({
  progress,
  label,
  showPercentage = true,
  className = "",
  color = 'blue'
}) => {
  const { t } = useLazyTranslation(['common']);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      
      <div 
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || t('common.progress', 'Progress')}
      >
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

// 🚀 Enhanced Toast Notification for user feedback
export const EnhancedToast = React.memo<ToastProps>(({
  type = 'info',
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const { t } = useLazyTranslation(['common']);

  React.useEffect(() => {
    if (autoClose && isVisible && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, isVisible, onClose, duration]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-4 right-4 max-w-sm w-full border rounded-lg p-4 shadow-lg z-50 transition-all duration-300 ${typeStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-current hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
            aria-label={t('common.close', 'Close notification')}
          >
            <MdClose className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
});
EnhancedToast.displayName = 'EnhancedToast';
