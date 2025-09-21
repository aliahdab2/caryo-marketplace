import React from 'react';
import { useTranslation } from 'react-i18next';
import { validateAge, getMinDateFor18Years } from '@/utils/ageValidation';
import { useRTL } from '@/hooks/useRTL';

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
  const { direction } = useRTL();

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
    <div className={`group ${className} ${direction.className}`} dir={direction.dir}>
      <label htmlFor="dateOfBirth" className={`block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 ${direction.textAlign}`}>
        {t('dateOfBirth', 'Date of Birth')} {required && <span className={`text-red-500 ${direction.marginStart('1')}`}>*</span>}
        {showAgeRestriction && (
          <span className={`text-xs text-gray-500 dark:text-gray-400 ${direction.marginStart('2')}`}>
            ({t('mustBe16Plus', 'Must be 16+')})
          </span>
        )}
      </label>
      <div className="relative">
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
          className={`block w-full px-4 py-3.5 border-2 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500/20 focus:border-purple-500 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        />
      </div>

      {error && (
        <div className={`mt-3 flex items-start ${direction.spaceX('2')} animate-slide-down`}>
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <div className={`flex-1 ${direction.textAlign}`}>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {!error && value && (
        <div className={`mt-2 text-xs text-green-600 dark:text-green-400 flex items-center ${direction.flexDirection} ${direction.textAlign}`}>
          <svg className={`w-4 h-4 ${direction.marginEnd('1')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {t('ageRequirementSatisfied', 'Age requirement satisfied')}
        </div>
      )}
    </div>
  );
}
