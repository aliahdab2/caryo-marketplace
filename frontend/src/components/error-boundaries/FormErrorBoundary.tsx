"use client";

import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

interface FormErrorBoundaryProps {
  children: ReactNode;
  formName?: string;
  onFormError?: (error: Error, errorId: string) => void;
  enableAutoSave?: boolean;
  onDataLoss?: () => void;
}

/**
 * Specialized Error Boundary for Form Components
 * 
 * Features:
 * - Form-specific error handling and recovery
 * - Data loss prevention warnings
 * - Auto-save integration
 * - Form reset capabilities
 * - User-friendly form error messages
 * - Integration with form analytics
 * 
 * Usage:
 * ```tsx
 * <FormErrorBoundary
 *   formName="Vehicle Listing Form"
 *   enableAutoSave={true}
 *   onFormError={(error, errorId) => {
 *     analytics.track('form_error', { formName: 'Vehicle Listing', errorId });
 *   }}
 *   onDataLoss={() => {
 *     toast.warning('Your form data may be lost. Please save your progress.');
 *   }}
 * >
 *   <ListingWizard />
 * </FormErrorBoundary>
 * ```
 */
export const FormErrorBoundary: React.FC<FormErrorBoundaryProps> = ({
  children,
  formName = 'Form',
  onFormError,
  enableAutoSave = false,
  onDataLoss
}) => {
  const { t } = useLazyTranslation(['common', 'forms']);

  const handleFormError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Log form-specific error details
    console.error(`Form Error in ${formName}:`, {
      error: error.message,
      errorId,
      formName,
      enableAutoSave,
      timestamp: new Date().toISOString()
    });

    // Check for potential data loss
    if (!enableAutoSave && onDataLoss) {
      onDataLoss();
    }

    // Call custom form error handler
    onFormError?.(error, errorId);

    // Track form errors for analytics
    interface GtagWindow extends Window {
      gtag?: (command: string, action: string, parameters: Record<string, unknown>) => void;
    }
    
    if (typeof window !== 'undefined' && (window as GtagWindow).gtag) {
      (window as GtagWindow).gtag!('event', 'form_error', {
        form_name: formName,
        error_id: errorId,
        error_message: error.message,
        has_auto_save: enableAutoSave
      });
    }
  };

  const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
    <FormErrorFallback
      error={error}
      formName={formName}
      enableAutoSave={enableAutoSave}
      onRetry={retry}
      t={t}
    />
  );

  return (
    <ErrorBoundary
      componentName={`${formName} Form`}
      level="section"
      enableRetry={true}
      maxRetries={2}
      resetOnPropsChange={true}
      onError={handleFormError}
      fallback={customFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

// Custom form error fallback component
interface FormErrorFallbackProps {
  error: Error;
  formName: string;
  enableAutoSave: boolean;
  onRetry: () => void;
  t: (key: string, options?: Record<string, unknown>) => string; // Translation function
}

const FormErrorFallback: React.FC<FormErrorFallbackProps> = ({
  error,
  formName,
  enableAutoSave,
  onRetry,
  t
}) => {
  const refreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Form Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('forms:errorBoundaryTitle', 'Form Error Occurred')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('forms:errorBoundaryMessage', 'The {{formName}} encountered an unexpected error.', { formName })}
          </p>
        </div>

        {/* Data Loss Warning */}
        {!enableAutoSave && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {t('forms:dataLossWarningTitle', 'Potential Data Loss')}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {t('forms:dataLossWarningMessage', 'Your form data may not have been saved. Please ensure you have a backup of your information before proceeding.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-save Status */}
        {enableAutoSave && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  {t('forms:autoSaveActiveTitle', 'Auto-save Enabled')}
                </p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  {t('forms:autoSaveActiveMessage', 'Your form data has been automatically saved and should be recoverable.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
          >
            {t('forms:retryForm', 'Retry Form')}
          </button>
          
          <button
            onClick={refreshPage}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
          >
            {t('forms:refreshPage', 'Refresh Page')}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p>
            {t('forms:errorHelpText', 'If this problem persists, please contact support with the error details.')}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-left">
              <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                {t('forms:showTechnicalDetails', 'Show Technical Details')}
              </summary>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all">
                <strong>Error:</strong> {error.message}
                <br />
                <strong>Form:</strong> {formName}
                <br />
                <strong>Auto-save:</strong> {enableAutoSave ? 'Enabled' : 'Disabled'}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormErrorBoundary;
