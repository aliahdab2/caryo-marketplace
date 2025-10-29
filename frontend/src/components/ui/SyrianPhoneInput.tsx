"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  normalizeSyrianNumber,
  validateSyrianPhoneNumber,
  formatPhoneForDisplay,
  PhoneValidationResult
} from '@/utils/phoneValidation';

interface SyrianPhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onErrorChange?: (error: string) => void;
  disabled?: boolean;
  required?: boolean;
  hasAttemptedValidation?: boolean;
  showOperatorInfo?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function SyrianPhoneInput({
  id,
  value,
  onChange,
  error,
  onErrorChange,
  disabled = false,
  required = false,
  hasAttemptedValidation = false,
  showOperatorInfo = true,
  label,
  placeholder = '9XX XXX XXX',
  className = ''
}: SyrianPhoneInputProps) {
  const { t, i18n } = useTranslation(['validation', 'common']);
  const [localValue, setLocalValue] = useState(formatPhoneForDisplay(value));
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);
  const previousValueRef = useRef(value);

  // Sync local value with prop value
  useEffect(() => {
    if (previousValueRef.current !== value) {
      previousValueRef.current = value;
      const displayValue = formatPhoneForDisplay(value);
      if (displayValue !== localValue) {
        setLocalValue(displayValue);
      }
    }
  }, [value, localValue]);

  // Validate on change
  useEffect(() => {
    if (localValue.trim() === '') {
      setValidationResult(null);
      if (onErrorChange) onErrorChange('');
      return;
    }

    const result = validateSyrianPhoneNumber(localValue.startsWith('+963') ? localValue : `+963${localValue}`);
    setValidationResult(result);

    // Only show errors to parent if validation has been attempted or field is valid
    if (onErrorChange) {
      const errorMessage = result.isValid ? '' : (hasAttemptedValidation ? t(result.message, result.message) : '');
      onErrorChange(errorMessage);
    }
  }, [localValue, onErrorChange, t, hasAttemptedValidation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const sanitizedValue = inputValue.replace(/[^\d+\-\s\(\)]/g, '');

    if (sanitizedValue.replace(/[^\d]/g, '').length > 15) {
      return;
    }

    setLocalValue(sanitizedValue);

    const normalized = normalizeSyrianNumber(sanitizedValue);
    if (normalized) {
      onChange(normalized);
    } else {
      onChange(sanitizedValue);
    }
  };

  // Determine visual state
  const hasError = error || (validationResult && !validationResult.isValid && hasAttemptedValidation);
  const isValid = validationResult?.isValid && localValue.trim() !== '';

  // Get operator info with localization
  const getLocalizedOperator = (operatorName: string | undefined): string | undefined => {
    if (!operatorName) return undefined;
    
    const isArabic = i18n.language.startsWith('ar');
    
    if (operatorName === 'MTN Syria') {
      return isArabic ? 'إم تي إن سوريا' : 'MTN Syria';
    }
    
    if (operatorName === 'Syriatel') {
      return isArabic ? 'سيرياتيل' : 'Syriatel';
    }
    
    return operatorName;
  };
  
  const operator = getLocalizedOperator(validationResult?.operator);

  return (
    <div className={`group ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Country code prefix - always on the left for phone numbers */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <div className={`flex items-center justify-center w-12 h-10 rounded-lg border transition-all duration-200 ${
            hasError
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : isValid
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 group-focus-within:border-blue-300 dark:group-focus-within:border-blue-600'
          }`}>
            <span className={`text-sm font-semibold transition-all duration-200 ${
              hasError ? 'text-red-700 dark:text-red-300' :
              isValid ? 'text-green-700 dark:text-green-300' :
              'text-blue-700 dark:text-blue-300'
            }`}>
              +963
            </span>
          </div>
        </div>

        {/* Phone input - always LTR for numbers */}
        <input
          id={id}
          type="tel"
          value={localValue}
          onChange={handleInputChange}
          disabled={disabled}
          required={required}
          dir="ltr"
          className={`block w-full pl-20 pr-4 py-3.5 border-2 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${
            hasError
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
              : isValid
                ? 'border-green-300 dark:border-green-600 focus:ring-green-500/20 focus:border-green-500'
                : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          placeholder={placeholder}
        />

        {/* Validation indicator - always on the right */}
        {localValue && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            {hasError ? (
              <div className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            ) : isValid ? (
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Help text */}
      {!hasError && !isValid && localValue && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('phoneHelp', 'Enter your Syrian mobile number (9 digits starting with 9, without the country code)')}
        </p>
      )}

      {/* Success message */}
      {isValid && showOperatorInfo && operator && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          ✓ {t('common:validPhoneWithOperator', 'Valid {{operator}} number', { operator: operator })}
        </p>
      )}
    </div>
  );
}