import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NextImage from 'next/image';
import { isValidEmail } from '@/utils/emailValidation';
import SyrianPhoneInput from '@/components/ui/SyrianPhoneInput';
import { useRTL } from '@/hooks/useRTL';
import ApiErrorModal from '@/components/ui/ApiErrorModal';
import { api } from '@/services/api';

interface Step4DealerContactInfoProps {
  businessEmail: string;
  setBusinessEmail: (value: string) => void;
  businessPhone: string;
  setBusinessPhone: (value: string) => void;
  logoUrl: string;
  setLogoUrl: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  businessEmailError: string;
  setBusinessEmailError: (value: string) => void;
  businessPhoneError: string;
  setBusinessPhoneError: (value: string) => void;
  passwordError: string;
  setPasswordError: (value: string) => void;
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
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  businessEmailError,
  setBusinessEmailError,
  businessPhoneError,
  setBusinessPhoneError,
  passwordError,
  setPasswordError,
  loading,
  hasAttemptedValidation
}: Step4DealerContactInfoProps) {
  const { t } = useTranslation('auth');
  const { direction } = useRTL();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Clear any existing logo URL on mount (data URLs are too long for backend)
  useEffect(() => {
    if (logoUrl && logoUrl.startsWith('data:')) {
      setLogoUrl('');
      setLogoPreview('');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showError = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const closeErrorModal = () => {
    setErrorModal({ ...errorModal, isOpen: false });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError(
        t('invalidFileType', 'Invalid File Type'),
        t('invalidFileTypeMessage', 'Please select a valid image file (PNG, JPG, JPEG, GIF, WebP)'),
        'warning'
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError(
        t('fileTooLarge', 'File Too Large'),
        t('fileTooLargeMessage', 'File size must be less than 5MB. Please choose a smaller file.'),
        'warning'
      );
      return;
    }

    try {
      setUploadingLogo(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend (no Content-Type needed - browser sets it with boundary)
      const response = await api.post<{ downloadUri: string }>(
        '/api/images/upload', 
        formData
      );

      // Set the logo URL (this will be a proper URI from MinIO/S3)
      setLogoUrl(response.downloadUri);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Success - no modal needed, just show the preview
    } catch (error) {
      console.error('Logo upload error:', error);
      
      // Extract detailed error message
      let errorMessage = t('uploadFailedMessage', 'Failed to upload logo. Please try again or choose a different file.');
      
      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.message) {
          errorMessage = `${errorMessage}\n\nDetails: ${err.message}`;
        }
        if (err.response?.data?.message) {
          errorMessage = `${errorMessage}\n\nServer: ${err.response.data.message}`;
        }
      }
      
      showError(
        t('uploadFailed', 'Upload Failed'),
        errorMessage,
        'error'
      );
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className={`space-y-4 animate-fade-in ${direction.className}`} dir={direction.dir}>
      {/* Business Email */}
      <div className="mb-4">
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
        className="mb-4"
      />

      {/* Password */}
      <div className="mb-4">
        <label htmlFor="password" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ${direction.textAlign}`}>
          {t('password', 'Password')} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            disabled={loading}
            className={`block w-full ltr:pl-10 rtl:pr-10 ltr:pr-12 rtl:pl-12 px-4 py-2.5 sm:py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
              passwordError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder={t('passwordPlaceholder', 'Enter a secure password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? (
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
        {passwordError && (
          <p className={`mt-2 text-sm text-red-600 dark:text-red-400 flex items-center ${direction.flexDirection} ${direction.textAlign}`}>
            <svg className={`w-4 h-4 ${direction.marginEnd('1')} flex-shrink-0`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {passwordError}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <label htmlFor="confirmPassword" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ${direction.textAlign}`}>
          {t('confirmPassword', 'Confirm Password')} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            disabled={loading}
            className={`block w-full ltr:pl-10 rtl:pr-10 ltr:pr-12 rtl:pl-12 px-4 py-2.5 sm:py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
              passwordError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder={t('confirmPasswordPlaceholder', 'Re-enter your password')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Business Logo - Compact */}
      <div className="mb-0">
        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ${direction.textAlign}`}>
          {t('businessLogo', 'Business Logo')}
          <span className="text-gray-400 text-xs ml-1 rtl:mr-1">({t('optional', 'Optional')})</span>
        </label>

        <div
          onClick={openFileDialog}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            uploadingLogo 
              ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10 cursor-wait' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer'
          }`}
        >
          {uploadingLogo ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('uploadingLogo', 'Uploading logo...')}</span>
            </div>
          ) : logoPreview || logoUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <NextImage
                  src={logoPreview || logoUrl}
                  alt={t('businessLogoPreview', 'Business logo preview')}
                  width={64}
                  height={64}
                  className="rounded-lg object-contain"
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
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div className={`${direction.textAlign} flex-1`}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('uploadBusinessLogo', 'Upload business logo')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
          disabled={uploadingLogo}
        />
      </div>

      {/* Error Modal */}
      <ApiErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </div>
  );
}
