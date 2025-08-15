"use client";

import React from "react";
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator';

export interface StepNavigationItem {
  step: number;
  title: React.ReactNode;
  icon: React.ReactNode;
  isComplete: boolean;
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
      <div className="flex justify-between items-center mb-4">
        {items.map(({ step, title, icon, isComplete }) => (
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
            <span className={`text-sm mt-3 text-center max-w-24 font-medium transition-colors duration-300 ${
              currentStep >= step ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {title}
            </span>
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


