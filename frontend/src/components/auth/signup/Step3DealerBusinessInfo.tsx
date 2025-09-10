import React from 'react';
import { useTranslation } from 'react-i18next';

interface Step3DealerBusinessInfoProps {
  businessName: string;
  setBusinessName: (value: string) => void;
  vatNumber: string;
  setVatNumber: (value: string) => void;
  tradingAddress: string;
  setTradingAddress: (value: string) => void;
  businessNameError: string;
  setBusinessNameError: (value: string) => void;
  vatError: string;
  setVatError: (value: string) => void;
  addressError: string;
  setAddressError: (value: string) => void;
  loading: boolean;
  hasAttemptedValidation: boolean;
}

export default function Step3DealerBusinessInfo({
  businessName,
  setBusinessName,
  vatNumber,
  setVatNumber,
  tradingAddress,
  setTradingAddress,
  businessNameError,
  setBusinessNameError,
  vatError,
  setVatError,
  addressError,
  setAddressError,
  loading,
  hasAttemptedValidation
}: Step3DealerBusinessInfoProps) {
  const { t } = useTranslation('auth');

  const validateVatNumber = (vat: string) => {
    // Basic VAT validation - can be enhanced based on country requirements
    const vatRegex = /^[A-Z]{2}\d{8,12}$/;
    return vatRegex.test(vat.toUpperCase());
  };

  const handleVatChange = (value: string) => {
    setVatNumber(value.toUpperCase());
    if (vatError) {
      setVatError("");
    }
  };

  const handleVatBlur = () => {
    // Only validate on blur if user has attempted validation (clicked Next/Submit)
    if (!hasAttemptedValidation) return;

    if (vatNumber && !validateVatNumber(vatNumber)) {
      setVatError(t('invalidVatFormat', 'Invalid VAT number format (e.g., GB123456789)'));
    }
  };

  return (
    <>
      {/* Business Name */}
      <div className="mb-5">
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('businessName', 'Business Name')} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"></path>
            </svg>
          </div>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (businessNameError) {
                setBusinessNameError("");
              }
            }}
            onBlur={(_e) => {
              // Only validate on blur if user has attempted validation (clicked Next/Submit)
              if (hasAttemptedValidation && !businessName.trim()) {
                setBusinessNameError(t('validationBusinessNameRequired', 'Business name is required'));
              }
            }}
            required={false} // Disable HTML5 validation, use custom validation
            disabled={loading}
            className={`block w-full ltr:pl-10 rtl:pr-10 px-4 py-2.5 sm:py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
              businessNameError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder={t('businessNamePlaceholder', 'Enter your business name')}
          />
        </div>
        {businessNameError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {businessNameError}
          </p>
        )}
      </div>

      {/* VAT Number */}
      <div className="mb-5">
        <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('vatNumber', 'VAT Number')}
          <span className="ml-1 text-gray-400 cursor-help" title={t('vatTooltip', 'Value Added Tax identification number for your business')}>
            <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"></path>
            </svg>
          </div>
          <input
            id="vatNumber"
            type="text"
            value={vatNumber}
            onChange={(e) => handleVatChange(e.target.value)}
            onBlur={handleVatBlur}
            disabled={loading}
            className={`block w-full ltr:pl-10 rtl:pr-10 px-4 py-2.5 sm:py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
              vatError
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
            placeholder={t('vatPlaceholder', 'e.g., GB123456789')}
          />
        </div>
        {vatError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {vatError}
          </p>
        )}
      </div>

      {/* Trading Address */}
      <div className="mb-5">
        <label htmlFor="tradingAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('tradingAddress', 'Trading Address')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"></path>
              <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
            </svg>
          </div>
          <textarea
            id="tradingAddress"
            value={tradingAddress}
            onChange={(e) => {
              setTradingAddress(e.target.value);
              if (addressError) {
                setAddressError("");
              }
            }}
            rows={3}
            disabled={loading}
            className="block w-full ltr:pl-10 rtl:pr-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 resize-vertical"
            placeholder={t('tradingAddressPlaceholder', 'Enter your business trading address')}
          />
        </div>
        {addressError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {addressError}
          </p>
        )}
      </div>
    </>
  );
}
