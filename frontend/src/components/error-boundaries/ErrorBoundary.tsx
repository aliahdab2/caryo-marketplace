"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '@/utils/logger';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolateError?: boolean;
  componentName?: string;
  level?: 'page' | 'section' | 'component';
  enableLogging?: boolean;
}

// Create logger
const errorLogger = createLogger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_ERRORS === 'true',
  level: 'error',
  prefix: 'ERROR_BOUNDARY'
});

/**
 * Enhanced Error Boundary Component
 * 
 * Features:
 * - Comprehensive error catching and logging
 * - Customizable fallback UI with retry functionality
 * - Error isolation to prevent cascade failures
 * - Automatic retry with configurable limits
 * - Reset on props change detection
 * - Error reporting and analytics integration
 * - Development vs production error handling
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary
 *   componentName="UserProfile"
 *   level="section"
 *   enableRetry={true}
 *   maxRetries={3}
 *   onError={(error, errorInfo, errorId) => {
 *     analytics.track('component_error', { errorId, component: 'UserProfile' });
 *   }}
 * >
 *   <UserProfileComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName, level, enableLogging = true } = this.props;
    const { errorId } = this.state;

    // Log error details
    if (enableLogging) {
      errorLogger.error('Error Boundary caught an error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        componentName,
        level,
        errorId,
        retryCount: this.state.retryCount
      });

      // In development, also log to console for immediate visibility
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Boundary: ${componentName || 'Unknown Component'}`);
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error ID:', errorId);
        console.groupEnd();
      }
    }

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler
    if (onError && errorId) {
      try {
        onError(error, errorInfo, errorId);
      } catch (handlerError) {
        errorLogger.error('Error in onError handler:', handlerError);
      }
    }

    // Report to external error tracking (Sentry, LogRocket, etc.)
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
        scope.setTag('errorBoundary', componentName || 'Unknown');
        scope.setTag('level', level || 'component');
        scope.setContext('errorInfo', errorInfo);
        scope.setContext('retryCount', this.state.retryCount);
        (window as SentryWindow).Sentry!.captureException(error);
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if props changed and resetOnPropsChange is enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset error state if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const keysChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys![index]);
      if (keysChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    const { componentName } = this.props;
    
    errorLogger.debug(`Resetting error boundary: ${componentName || 'Unknown'}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });
  };

  handleRetry = () => {
    const { maxRetries = 3, componentName } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      errorLogger.debug(`Retrying component: ${componentName || 'Unknown'} (attempt ${retryCount + 1}/${maxRetries})`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      errorLogger.warn(`Max retries reached for component: ${componentName || 'Unknown'}`);
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, enableRetry = true, maxRetries = 3, componentName, level } = this.props;

    if (hasError && error) {
      // Custom fallback component
      if (typeof fallback === 'function') {
        try {
          return fallback(error, errorInfo!, this.handleRetry);
        } catch (fallbackError) {
          errorLogger.error('Error in custom fallback component:', fallbackError);
          // Fall through to default fallback
        }
      }

      // Custom fallback element
      if (fallback && typeof fallback !== 'function') {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          componentName={componentName}
          level={level}
          retryCount={retryCount}
          maxRetries={maxRetries}
          enableRetry={enableRetry}
          onRetry={this.handleRetry}
          onReset={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

// Default fallback component
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  componentName?: string;
  level?: 'page' | 'section' | 'component';
  retryCount: number;
  maxRetries: number;
  enableRetry: boolean;
  onRetry: () => void;
  onReset: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  componentName = 'Component',
  level = 'component',
  retryCount,
  maxRetries,
  enableRetry,
  onRetry,
  onReset
}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const canRetry = enableRetry && retryCount < maxRetries;
  
  // Different styling based on error level
  const getLevelStyling = () => {
    switch (level) {
      case 'page':
        return {
          container: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4',
          card: 'max-w-lg w-full',
          icon: 'w-16 h-16',
          title: 'text-2xl'
        };
      case 'section':
        return {
          container: 'min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-6',
          card: 'max-w-md w-full',
          icon: 'w-12 h-12',
          title: 'text-xl'
        };
      default:
        return {
          container: 'min-h-[200px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4',
          card: 'max-w-sm w-full',
          icon: 'w-10 h-10',
          title: 'text-lg'
        };
    }
  };

  const styling = getLevelStyling();

  return (
    <div className={styling.container} role="alert">
      <div className={`${styling.card} bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center`}>
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${styling.icon} bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center`}>
            <svg 
              className="w-8 h-8 text-red-600 dark:text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h2 className={`${styling.title} font-bold text-gray-900 dark:text-gray-100 mb-2`}>
          Something went wrong
        </h2>

        {/* Error Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isProduction 
            ? `The ${componentName.toLowerCase()} encountered an unexpected error. Please try again.`
            : `Error in ${componentName}: ${error.message}`
          }
        </p>

        {/* Retry Information */}
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Retry attempt: {retryCount}/{maxRetries}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={onReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Reset
          </button>
        </div>

        {/* Development Error Details */}
        {!isProduction && errorInfo && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
              Show Error Details
            </summary>
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded border text-xs font-mono overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap break-words">{error.stack}</pre>
              </div>
              <div>
                <strong>Component Stack:</strong>
                <pre className="whitespace-pre-wrap break-words">{errorInfo.componentStack}</pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;
