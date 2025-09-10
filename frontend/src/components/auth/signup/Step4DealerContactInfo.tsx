import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import NextImage from 'next/image';
import { isValidEmail } from '@/utils/emailValidation';
import GoogleSignInButton from '../GoogleSignInButton';

interface Step4DealerContactInfoProps {
  businessEmail: string;
  setBusinessEmail: (value: string) => void;
  businessPhone: string;
  setBusinessPhone: (value: string) => void;
  logoUrl: string;
  setLogoUrl: (value: string) => void;
  businessEmailError: string;
  setBusinessEmailError: (value: string) => void;
  businessPhoneError: string;
  setBusinessPhoneError: (value: string) => void;
  loading: boolean;
  hasAttemptedValidation: boolean;
}

export default function Step4DealerContactInfo({
  businessEmail,
  setBusinessEmail,
  businessPhone,
  setBusinessPhone,
  logoUrl,
  setLogoUrl,
  businessEmailError,
  setBusinessEmailError,
  businessPhoneError,
  setBusinessPhoneError,
  loading,
  hasAttemptedValidation
}: Step4DealerContactInfoProps) {
  const { t } = useTranslation('auth');
  const [_showLogoModal, _setShowLogoModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(t('invalidFileType', 'Please select a valid image file'));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('fileTooLarge', 'File size must be less than 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setLogoUrl(result);
        _setShowLogoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl('');
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Google Sign-in Option */}
      <div className="space-y-4 mb-6">
        <GoogleSignInButton
          callbackUrl="/dashboard"
          className="w-full py-2.5 sm:py-3 text-sm sm:text-base"
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {t('orCompleteWithEmail', 'Or complete with email')}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information Form */}
      <div className="space-y-5">
        {/* Business Email */}
      <div className="mb-5">
        <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('businessEmail', 'Business Email')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <input
            id="businessEmail"
            type="email"
            value={businessEmail}
            onChange={(e) => {
              const newEmail = e.target.value;
              setBusinessEmail(newEmail);
              if (businessEmailError) {
                setBusinessEmailError("");
              }
            }}
            onBlur={(e) => {
              // Only validate on blur if user has attempted validation (clicked Next/Submit)
              if (!hasAttemptedValidation) return;

              const emailValue = e.target.value.trim();
              if (emailValue && !isValidEmail(emailValue)) {
                setBusinessEmailError(t('validation.invalidEmailFormat'));
              }
            }}
            disabled={loading}
            className={`block w-full ltr:pl-10 rtl:pr-10 px-4 py-2.5 sm:py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
              businessEmailError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder={t('businessEmailPlaceholder', 'business@company.com')}
          />
        </div>
        {businessEmailError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {businessEmailError}
          </p>
        )}
      </div>

      {/* Business Phone */}
      <div className="mb-5">
        <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('businessPhone', 'Business Phone')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <input
            id="businessPhone"
            type="tel"
            value={businessPhone}
            onChange={(e) => {
              const newPhone = e.target.value;
              setBusinessPhone(newPhone);
              if (businessPhoneError) {
                setBusinessPhoneError("");
              }
            }}
            onBlur={(e) => {
              // Only validate on blur if user has attempted validation (clicked Next/Submit)
              if (!hasAttemptedValidation) return;

              const phoneValue = e.target.value.trim();
              if (phoneValue && !isValidPhoneNumber(phoneValue)) {
                setBusinessPhoneError(t('invalidPhoneFormat', 'Invalid phone number format'));
              }
            }}
            disabled={loading}
            className={`block w-full ltr:pl-10 rtl:pr-10 px-4 py-2.5 sm:py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
              businessPhoneError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder={t('businessPhonePlaceholder', '+963 XXX XXX XXX')}
          />
        </div>
        {businessPhoneError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {businessPhoneError}
          </p>
        )}
      </div>

      {/* Business Logo */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('businessLogo', 'Business Logo')}
          <span className="ml-1 text-gray-400 cursor-help" title={t('logoRequirements', 'Upload a high-quality logo (PNG, JPG, max 5MB)')}>
            <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        </label>

        <div className="space-y-3">
          {/* Logo Preview/Upload Area */}
          <div
            onClick={openFileDialog}
            className="relative cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            {logoPreview || logoUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <NextImage
                    src={logoPreview || logoUrl}
                    alt={t('businessLogoPreview', 'Business logo preview')}
                    width={80}
                    height={80}
                    className="rounded-lg object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('clickToChangeLogo', 'Click to change logo')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('uploadBusinessLogo', 'Upload business logo')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('logoRequirements', 'PNG, JPG up to 5MB')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>
      </div>
    </>
  );
}
