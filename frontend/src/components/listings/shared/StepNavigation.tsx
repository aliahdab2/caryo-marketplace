"use client";

import React from "react";
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

// Status Badge Component
interface StatusBadgeProps {
  completionStatus: 'complete' | 'incomplete' | 'not-started';
  missingFieldsCount?: number;
  completedFieldsCount?: number;
  totalFieldsCount?: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  completionStatus, 
  missingFieldsCount = 0,
  completedFieldsCount = 0,
  totalFieldsCount = 0
}) => {
  const { t } = useLazyTranslation(['listings', 'common']);
  if (completionStatus === 'complete') {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          role="status"
          aria-label={t('listings:stepStatusComplete', 'Complete')}
        >
          ✓ {t('listings:stepStatusComplete', 'Complete')}
        </span>
      </div>
    );
  }

  if (completionStatus === 'incomplete') {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          role="status"
          aria-label={missingFieldsCount > 0 ? t('listings:stepStatusMissing', '{{count}} missing', { count: missingFieldsCount }) : t('listings:stepStatusInProgress', 'In progress')}
        >
          {missingFieldsCount > 0 ? t('listings:stepStatusMissing', '{{count}} missing', { count: missingFieldsCount }) : t('listings:stepStatusInProgress', 'In progress')}
        </span>
        {totalFieldsCount > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedFieldsCount}/{totalFieldsCount}
          </span>
        )}
      </div>
    );
  }

  if (completionStatus === 'not-started') {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          role="status"
          aria-label={t('listings:stepStatusNotStarted', 'Not started')}
        >
          {t('listings:stepStatusNotStarted', 'Not started')}
        </span>
      </div>
    );
  }

  return null;
};

export interface StepNavigationItem {
  step: number;
  title: React.ReactNode;
  icon: React.ReactNode;
  isComplete: boolean;
  // Enhanced completion tracking
  completionStatus: 'complete' | 'incomplete' | 'not-started';
  missingFieldsCount?: number;
  completedFieldsCount?: number;
  totalFieldsCount?: number;
  missingFieldNames?: string[];
}

interface StepNavigationProps {
  items: StepNavigationItem[];
  currentStep: number;
  onStepChange: (step: number, e?: React.MouseEvent) => void;
  progressPercentage: number;
  showAutoSaveIndicator?: boolean;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  stepCounterText: string;
  percentCompleteText: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  items,
  currentStep,
  onStepChange,
  progressPercentage,
  showAutoSaveIndicator = false,
  autoSaveStatus,
  lastSaved,
  stepCounterText,
  percentCompleteText
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start mb-4">
        {items.map(({ step, title, icon, isComplete, completionStatus, missingFieldsCount, completedFieldsCount, totalFieldsCount }) => (
          <div key={step} className="flex flex-col items-center relative">
            <button
              type="button"
              onClick={(e) => onStepChange(step, e)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-lg relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                currentStep >= step
                  ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 cursor-pointer transform hover:scale-105'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer'
              }`}
            >
              {isComplete ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : currentStep === step ? (
                <span className="text-lg">{icon}</span>
              ) : (
                <span>{step}</span>
              )}
            </button>
            <div className="flex flex-col items-center mt-3 max-w-32">
              <span className={`text-sm text-center font-medium transition-colors duration-300 ${
                currentStep >= step ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {title}
              </span>
              <StatusBadge 
                completionStatus={completionStatus}
                missingFieldsCount={missingFieldsCount}
                completedFieldsCount={completedFieldsCount}
                totalFieldsCount={totalFieldsCount}
              />
            </div>
            {step < items.length && (
              <div
                className={`absolute top-6 start-12 w-20 h-0.5 transition-colors duration-300 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{stepCounterText}</span>
          <div className="flex items-center gap-4">
            {showAutoSaveIndicator && (
              <AutoSaveIndicator status={autoSaveStatus ?? 'idle'} lastSaved={lastSaved ?? null} className="text-xs" />
            )}
            <span>{percentCompleteText}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepNavigation;


