import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  stepTitles = []
}: ProgressIndicatorProps) {
  const { t } = useTranslation('auth');
  const { direction } = useRTL();

  const progress = (currentStep / totalSteps) * 100;

  const getStepTitle = (step: number) => {
    if (stepTitles && stepTitles[step - 1]) {
      return stepTitles[step - 1];
    }
    
    // Default descriptive step titles
    const defaultStepTitles = [
      t('stepChooseAccountType', 'Step 1: Choose Account Type'),
      t('stepPersonalInfo', 'Step 2: Personal Information'),
      t('stepBusinessInfo', 'Step 3: Business Information'),
      t('stepContactInfo', 'Step 4: Contact Information')
    ];
    
    return defaultStepTitles[step - 1] || `${t('step', 'Step')} ${step}`;
  };

  return (
    <div className={`mb-8 ${direction.className}`} dir={direction.dir}>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-gray-800 dark:text-gray-200 transition-colors">
          {getStepTitle(currentStep)}
        </span>
        <div className={`flex items-center ${direction.spaceX('2')}`}>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentStep} {t('of', 'of')} {totalSteps}
          </span>
          <div className={`flex items-center ${direction.spaceX('1')}`}>
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              return (
                <div
                  key={stepNumber}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress bar with enhanced styling */}
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
        </div>
        {/* Glow effect */}
        <div
          className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-50 blur-sm transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Enhanced Step dots */}
      <div className="flex justify-between mt-6">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center space-y-2">
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg'
                    : isActive
                    ? 'border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-md scale-110'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <span className={`text-sm font-bold ${isActive ? 'text-blue-600' : ''}`}>{stepNumber}</span>
                )}

                {/* Active indicator glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
                )}
              </div>

              {/* Step label */}
              <span className={`text-xs font-medium transition-colors ${
                isCompleted || isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {stepTitles && stepTitles[index] ? stepTitles[index].split(' ')[0] : `Step ${stepNumber}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
