import React from 'react';
import { useTranslation } from 'react-i18next';
import { getPasswordRequirements, validatePassword } from '@/utils/passwordValidation';

interface PasswordValidationProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

/**
 * Centralized password validation component
 * Shows password requirements and validation status
 */
export const PasswordValidation: React.FC<PasswordValidationProps> = ({
  password,
  showRequirements = true,
  className = ''
}) => {
  const { t } = useTranslation();
  
  if (!showRequirements) {
    return null;
  }

  const requirements = getPasswordRequirements(password);
  
  return (
    <div className={`mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
      <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">
        {t('auth:passwordRequirements', 'Password Requirements:')}
      </p>
      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <li className={`flex items-center ${requirements.hasMinLength ? 'text-green-600 dark:text-green-400' : ''}`}>
          <span className="mr-2">{requirements.hasMinLength ? '✓' : '•'}</span>
          {t('auth:requirementLength', 'At least 8 characters')}
        </li>
        <li className={`flex items-center ${requirements.hasEnoughTypes ? 'text-green-600 dark:text-green-400' : ''}`}>
          <span className="mr-2">{requirements.hasEnoughTypes ? '✓' : '•'}</span>
          {t('auth:requirementTwoTypes', 'At least 2 character types: letters, numbers, or symbols')} ({requirements.characterTypeCount}/4)
        </li>
      </ul>
    </div>
  );
};

/**
 * Hook for password validation
 * Returns validation result and error message
 */
export const usePasswordValidation = (password: string) => {
  const result = validatePassword(password);
  
  return {
    isValid: result.isValid,
    errors: result.errors,
    firstError: result.errors.length > 0 ? result.errors[0] : null
  };
};

/**
 * Simple password requirement text component
 */
export const PasswordRequirementText: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {t('auth:passwordRequirement', 'At least 8 characters with 2 different character types (letters, numbers, symbols)')}
    </p>
  );
};

export default PasswordValidation;
