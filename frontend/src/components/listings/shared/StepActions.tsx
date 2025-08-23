"use client";

import React from "react";

interface StepActionsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onPrev: (e?: React.MouseEvent) => void;
  onNext: (e?: React.MouseEvent) => void;
  submitButtonText: React.ReactNode;
  submittingText: React.ReactNode;
  previousText: React.ReactNode;
  nextText: React.ReactNode;
  leftArrowPath: string;
  rightArrowPath: string;
  rtlSpacing: {
    mr: (v: string) => string;
    ml: (v: string) => string;
  };
}

const StepActions: React.FC<StepActionsProps> = ({
  isFirstStep,
  isLastStep,
  isSubmitting,
  onPrev,
  onNext,
  submitButtonText,
  submittingText,
  previousText,
  nextText,
  leftArrowPath,
  rightArrowPath,
  rtlSpacing
}) => {
  return (
    <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-0">
      <div className="order-2 sm:order-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstStep}
          className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          tabIndex={-1}
        >
          <svg className={`w-4 h-4 ${rtlSpacing.mr('2')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={leftArrowPath} />
          </svg>
          {previousText}
        </button>
      </div>

      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-lg hover:shadow-xl order-1 sm:order-2"
        >
          {nextText}
          <svg className={`w-4 h-4 ${rtlSpacing.ml('2')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={rightArrowPath} />
          </svg>
        </button>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {submittingText}
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {submitButtonText}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default StepActions;


