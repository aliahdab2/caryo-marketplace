import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import NextImage from 'next/image';
import { isValidEmail } from '@/utils/emailValidation';
import SyrianPhoneInput from '@/components/ui/SyrianPhoneInput';
import { useRTL } from '@/hooks/useRTL';

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
  const { direction } = useRTL();
  const [_showLogoModal, _setShowLogoModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone validation is now handled by SyrianPhoneInput component

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
    <div className={`space-y-6 animate-fade-in ${direction.className}`} dir={direction.dir}>
      {/* Business Email */}
      <div className="mb-5">
        <label htmlFor="businessEmail" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ${direction.textAlign}`}>
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
                setBusinessEmailError(t('validationInvalidEmailFormat'));
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
          <p className={`mt-2 text-sm text-red-600 dark:text-red-400 flex items-center ${direction.flexDirection} ${direction.textAlign}`}>
            <svg className={`w-4 h-4 ${direction.marginEnd('1')} flex-shrink-0`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {businessEmailError}
          </p>
        )}
      </div>

      {/* Business Phone */}
      <SyrianPhoneInput
        id="businessPhone"
        value={businessPhone}
        onChange={setBusinessPhone}
        error={businessPhoneError}
        onErrorChange={setBusinessPhoneError}
        disabled={loading}
        hasAttemptedValidation={hasAttemptedValidation}
        label={t('businessPhone', 'Business Phone')}
        placeholder={t('businessPhonePlaceholder', '9XX XXX XXX')}
        className="mb-5"
      />

      {/* Business Logo */}
      <div className="mb-5">
        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ${direction.textAlign}`}>
          {t('businessLogo', 'Business Logo')}
          <span className={`${direction.marginStart('1')} text-gray-400 cursor-help`} title={t('logoRequirements', 'Upload a high-quality logo (PNG, JPG, max 5MB)')}>
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
  );
}
