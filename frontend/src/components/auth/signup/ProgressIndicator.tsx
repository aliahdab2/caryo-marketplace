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
    <div className={`mb-4 ${direction.className}`} dir={direction.dir}>
      {/* Compact Step indicator - Inline */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {getStepTitle(currentStep)}
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Compact Progress bar */}
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
        </div>
      </div>
    </div>
  );
}
