import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';

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
  const { direction, getArrowDirection } = useRTL();

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
    <div className={`flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${direction.className}`} dir={direction.dir}>
      {/* Compact Previous button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || loading}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          !isFirstStep && !loading
            ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            : 'text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
        }`}
      >
        <svg className={`w-4 h-4 ${direction.marginEnd('1')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getArrowDirection('left')}></path>
        </svg>
        <span>{t('previous', 'Previous')}</span>
      </button>

      {/* Compact Next/Submit button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={getNextButtonDisabled()}
        className={`flex items-center px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          !getNextButtonDisabled()
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{t('loading', 'Loading...')}</span>
          </>
        ) : (
          <>
            <span>{getNextButtonText()}</span>
            <svg className={`w-4 h-4 ${direction.marginStart('1')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getArrowDirection('right')}></path>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
