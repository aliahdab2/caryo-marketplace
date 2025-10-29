import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
  'data-error'?: string;
  onInvalid?: (e: React.InvalidEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

/**
 * Password input component with visibility toggle
 * Provides a consistent password input experience across the app
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  minLength,
  disabled = false,
  className = "",
  'data-testid': dataTestId,
  'data-error': dataError,
  onInvalid,
  onInput,
  autoComplete = "current-password"
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation('auth');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative group">
      {/* Lock icon - RTL aware positioning */}
      <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>

      {/* Password input - RTL aware padding */}
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
        data-testid={dataTestId}
        data-error={dataError}
        onInvalid={onInvalid}
        onInput={onInput}
        className={`block w-full ltr:pl-10 ltr:pr-12 rtl:pr-10 rtl:pl-12 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${className}`}
      />

      {/* Password visibility toggle button - RTL aware positioning */}
      <button
        type="button"
        onClick={togglePasswordVisibility}
        disabled={disabled}
        tabIndex={-1}
        className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={showPassword ? t('hidePassword', 'Hide password') : t('showPassword', 'Show password')}
        title={showPassword ? t('hidePassword', 'Hide password') : t('showPassword', 'Show password')}
      >
        {showPassword ? (
          // Eye slash icon (hide password)
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          // Eye icon (show password)
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
