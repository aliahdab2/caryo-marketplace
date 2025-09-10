import React from 'react';
import { useTranslation } from 'react-i18next';

interface SignupNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
  nextText?: string;
  submitText?: string;
}

export default function SignupNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  loading = false,
  nextDisabled = false,
  submitDisabled = false,
  nextText,
  submitText
}: SignupNavigationProps) {
  const { t } = useTranslation('auth');

  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else {
      onNext();
    }
  };

  const getNextButtonText = () => {
    if (nextText) return nextText;
    if (isLastStep) return submitText || t('createAccount', 'Create Account');
    return t('next', 'Next');
  };

  const getNextButtonDisabled = () => {
    if (loading) return true;
    if (isLastStep) return submitDisabled;
    return nextDisabled;
  };

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
      {/* Previous button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || loading}
        className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
          !isFirstStep && !loading
            ? 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
            : 'text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
        }`}
      >
        <div className="relative z-10 flex items-center space-x-2">
          <svg className={`w-4 h-4 transition-transform duration-200 ${!isFirstStep && !loading ? 'group-hover:-translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span>{t('previous', 'Previous')}</span>
        </div>
        {!isFirstStep && !loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
      </button>

      {/* Next/Submit button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={getNextButtonDisabled()}
        className={`group relative px-8 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
          !getNextButtonDisabled()
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        <div className="relative z-10 flex items-center space-x-2">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('loading', 'Loading...')}</span>
            </>
          ) : (
            <>
              <span>{getNextButtonText()}</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${!getNextButtonDisabled() ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </>
          )}
        </div>

        {/* Shine effect for primary button */}
        {!getNextButtonDisabled() && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        )}

        {/* Glow effect */}
        {!getNextButtonDisabled() && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300"></div>
        )}
      </button>
    </div>
  );
}
