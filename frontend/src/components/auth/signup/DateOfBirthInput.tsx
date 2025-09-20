import React from 'react';
import { useTranslation } from 'react-i18next';
import { validateAge, getMinDateFor18Years } from '@/utils/ageValidation';

interface DateOfBirthInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  setError?: (error: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showAgeRestriction?: boolean;
  hasAttemptedValidation?: boolean;
}

export default function DateOfBirthInput({
  value,
  onChange,
  error,
  setError,
  disabled = false,
  required = false,
  className = '',
  showAgeRestriction = true,
  hasAttemptedValidation = false
}: DateOfBirthInputProps) {
  const { t } = useTranslation(['auth', 'validation']);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear error when user starts typing
    if (setError && error) {
      setError('');
    }
  };

  const handleBlur = () => {
    // Only validate on blur if user has attempted validation (clicked Next/Submit)
    if (!hasAttemptedValidation) return;

    if (!value.trim()) {
      if (required && setError) {
        setError(t('validationDateOfBirthRequired', 'Date of birth is required'));
      }
      return;
    }

    const validation = validateAge(value);
    if (!validation.isValid && setError) {
      setError(validation.error || t('dateOfBirthRequired', 'Invalid date of birth'));
    }
  };

  const _minDate = getMinDateFor18Years();

  return (
    <div className={`group ${className}`}>
      <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
        {t('dateOfBirth', 'Date of Birth')} {required && <span className="text-red-500 ml-1">*</span>}
        {showAgeRestriction && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
(Must be 16+)
          </span>
        )}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-4 rtl:pr-4 pointer-events-none">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
            error
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800 group-focus-within:border-purple-300 dark:group-focus-within:border-purple-600 group-focus-within:shadow-md'
          }`}>
            <svg className={`w-5 h-5 transition-all duration-200 group-focus-within:scale-110 ${
              error ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'
            }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
        <input
          id="dateOfBirth"
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={false} // Disable HTML5 validation, use custom validation only
          disabled={disabled}
          min="1900-01-01"
          max={new Date().toISOString().split('T')[0]}
          className={`block w-full ltr:pl-16 rtl:pr-16 px-4 py-3.5 border-2 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500/20 focus:border-purple-500 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        />
        {value && !error && (
          <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center">
            <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start space-x-2 animate-slide-down">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {!error && value && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Age requirement satisfied
        </div>
      )}
    </div>
  );
}
