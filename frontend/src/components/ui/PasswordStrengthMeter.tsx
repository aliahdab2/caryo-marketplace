import React from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  suggestions: string[];
}

/**
 * Enhanced password strength meter with detailed feedback
 */
export default function PasswordStrengthMeter({ password, className = '' }: PasswordStrengthMeterProps) {
  const { t } = useTranslation(['auth', 'validation']);

  const calculateStrength = (pwd: string): StrengthResult => {
    if (!pwd) {
      return {
        score: 0,
        label: t('passwordStrengthWeak', 'Weak'),
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        suggestions: [t('enterPassword', 'Enter a password')]
      };
    }

    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (pwd.length >= 8) score += 25;
    else suggestions.push(t('passwordNeed8Chars', 'Use at least 8 characters'));

    // Lowercase check
    if (/[a-z]/.test(pwd)) score += 15;
    else suggestions.push(t('passwordNeedLowercase', 'Add lowercase letters'));

    // Uppercase check
    if (/[A-Z]/.test(pwd)) score += 15;
    else suggestions.push(t('passwordNeedUppercase', 'Add uppercase letters'));

    // Number check
    if (/\d/.test(pwd)) score += 15;
    else suggestions.push(t('passwordNeedNumbers', 'Add numbers'));

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 15;
    else suggestions.push(t('passwordNeedSpecial', 'Add special characters'));

    // Length bonus
    if (pwd.length >= 12) score += 10;
    if (pwd.length >= 16) score += 5;

    // Variety bonus
    const uniqueChars = new Set(pwd).size;
    if (uniqueChars >= pwd.length * 0.7) score += 5;

    // Common patterns penalty
    if (/(.)\1{2,}/.test(pwd)) score -= 10; // Repeated characters
    if (/123|abc|qwe|password|admin/i.test(pwd)) score -= 15; // Common patterns

    let label: string;
    let color: string;
    let bgColor: string;

    if (score < 30) {
      label = t('passwordStrengthWeak', 'Weak');
      color = 'text-red-600';
      bgColor = 'bg-red-500';
    } else if (score < 60) {
      label = t('passwordStrengthFair', 'Fair');
      color = 'text-orange-600';
      bgColor = 'bg-orange-500';
    } else if (score < 80) {
      label = t('passwordStrengthGood', 'Good');
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-500';
    } else {
      label = t('passwordStrengthStrong', 'Strong');
      color = 'text-green-600';
      bgColor = 'bg-green-500';
    }

    return { score: Math.min(100, Math.max(0, score)), label, color, bgColor, suggestions };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className={`mt-3 ${className}`}>
      {/* Strength bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('passwordStrength', 'Password Strength')}
        </span>
        <span className={`text-sm font-semibold ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${strength.bgColor}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>

      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {t('passwordSuggestions', 'Suggestions:')}
          </p>
          <ul className="space-y-1">
            {strength.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security tips */}
      {strength.score >= 80 && (
        <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {t('passwordSecure', 'Your password is secure!')}
        </div>
      )}
    </div>
  );
}
