import React from 'react';
import { useTranslation } from 'react-i18next';
import PasswordInput from '@/components/ui/PasswordInput';
import PasswordRequirementText from '@/components/auth/PasswordValidation';
import { isValidEmail } from '@/utils/emailValidation';
import DateOfBirthInput from './DateOfBirthInput';
import SyrianPhoneInput from '@/components/ui/SyrianPhoneInput';
import SyrianCitySelect from '@/components/ui/SyrianCitySelect';
import { useRTL } from '@/hooks/useRTL';

interface Step2PrivateSellerFormProps {
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  emailError: string;
  setEmailError: (value: string) => void;
  phoneError: string;
  setPhoneError: (value: string) => void;
  dateOfBirthError: string;
  setDateOfBirthError: (value: string) => void;
  loading: boolean;
  passwordError: string;
  hasAttemptedValidation: boolean;
}

export default function Step2PrivateSellerForm({
  username,
  setUsername,
  email,
  setEmail,
  phone,
  setPhone,
  city,
  setCity,
  dateOfBirth,
  setDateOfBirth,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  emailError,
  setEmailError,
  phoneError,
  setPhoneError,
  dateOfBirthError,
  setDateOfBirthError,
  loading,
  passwordError: _passwordError,
  hasAttemptedValidation
}: Step2PrivateSellerFormProps) {
  const { t } = useTranslation('auth');
  const { direction } = useRTL();

  // Phone validation is now handled by SyrianPhoneInput component

  return (
    <div className={`space-y-6 animate-fade-in ${direction.className}`} dir={direction.dir}>
      {/* Full Name */}
      <div className="group">
        <label htmlFor="username" className={`block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 ${direction.textAlign}`}>
          {t('fullName', 'Full Name')} <span className={`text-red-500 ${direction.marginStart('1')}`}>*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-4 rtl:pr-4 pointer-events-none">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800 transition-all duration-200 group-focus-within:border-blue-300 dark:group-focus-within:border-blue-600 group-focus-within:shadow-md">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors group-focus-within:scale-110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required={false} // Disable HTML5 validation, use custom validation
            disabled={loading}
            className="block w-full ltr:pl-16 rtl:pr-16 px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder={t('fullNamePlaceholder', 'Enter your full name')}
          />
          {username && (
            <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center">
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="group">
        <label htmlFor="email" className={`block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 ${direction.textAlign}`}>
          {t('email')} <span className={`text-red-500 ${direction.marginStart('1')}`}>*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-4 rtl:pr-4 pointer-events-none">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
              emailError
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800 group-focus-within:border-emerald-300 dark:group-focus-within:border-emerald-600 group-focus-within:shadow-md'
            }`}>
              <svg className={`w-5 h-5 transition-all duration-200 group-focus-within:scale-110 ${
                emailError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              const newEmail = e.target.value;
              setEmail(newEmail);
              if (emailError) {
                setEmailError("");
              }
            }}
            onBlur={(e) => {
              // Only validate on blur if user has attempted validation (clicked Next/Submit)
              if (!hasAttemptedValidation) return;

              const emailValue = e.target.value.trim();
              if (emailValue && !isValidEmail(emailValue)) {
                setEmailError(t('validationInvalidEmailFormat'));
              }
            }}
            required={false} // Disable HTML5 validation, use custom validation
            disabled={loading}
            className={`block w-full ltr:pl-16 rtl:pr-16 px-4 py-3.5 border-2 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${
              emailError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            placeholder={t('emailPlaceholder')}
          />
          {email && !emailError && (
            <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center">
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
        {emailError && (
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
                {emailError}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Phone */}
      <SyrianPhoneInput
        id="phone"
        value={phone}
        onChange={setPhone}
        error={phoneError}
        onErrorChange={setPhoneError}
        disabled={loading}
        hasAttemptedValidation={hasAttemptedValidation}
        required={true}
        showOperatorInfo={true}
        label={t('phone', 'Phone Number')}
        placeholder={t('phonePlaceholder', '9XX XXX XXX')}
      />

      {/* City */}
      <SyrianCitySelect
        id="city"
        value={city}
        onChange={setCity}
        disabled={loading}
        required={true}
        label={t('city', 'City')}
        placeholder={t('cityPlaceholder', 'Select your city')}
      />

      {/* Date of Birth */}
      <DateOfBirthInput
        value={dateOfBirth}
        onChange={setDateOfBirth}
        error={dateOfBirthError}
        setError={setDateOfBirthError}
        disabled={loading}
        required={false} // Disable HTML5 validation, use custom validation
        showAgeRestriction={true}
        hasAttemptedValidation={hasAttemptedValidation}
      />

      {/* Password */}
      <div className="group">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
          {t('password')} <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-4 rtl:pr-4 pointer-events-none">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-100 dark:border-rose-800 rounded-lg transition-all duration-200 group-focus-within:border-rose-300 dark:group-focus-within:border-rose-600 group-focus-within:shadow-md">
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 transition-all duration-200 group-focus-within:scale-110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="m9 11 3-3 3 3"></path>
              </svg>
            </div>
          </div>
          <PasswordInput
            id="password"
            data-testid="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={false} // Disable HTML5 validation, use custom validation
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
            className="block w-full ltr:pl-16 rtl:pr-16 px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {password && password.length >= 6 && (
            <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center">
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3">
          <PasswordRequirementText password={password} className="text-xs" />
        </div>
      </div>

      {/* Confirm Password */}
      <div className="group">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
          {t('confirmPassword')} <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-4 rtl:pr-4 pointer-events-none">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg transition-all duration-200 group-focus-within:border-indigo-300 dark:group-focus-within:border-indigo-600 group-focus-within:shadow-md">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 transition-all duration-200 group-focus-within:scale-110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"></path>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
          </div>
          <PasswordInput
            id="confirmPassword"
            data-testid="confirm-password-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('confirmPasswordPlaceholder')}
            required={false} // Disable HTML5 validation, use custom validation
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
            className="block w-full ltr:pl-16 rtl:pr-16 px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {confirmPassword && confirmPassword === password && password.length >= 6 && (
            <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center">
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
        {confirmPassword && password && confirmPassword !== password && (
          <div className="mt-3 flex items-start space-x-2 animate-slide-down">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Passwords do not match
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Please make sure both passwords are identical
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
