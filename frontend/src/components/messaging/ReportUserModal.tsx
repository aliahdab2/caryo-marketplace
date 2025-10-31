'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { getReportTypesArray } from '@/constants/reportTypes';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reportType: string, reason: string) => Promise<void>;
  userName?: string;
  isLoading?: boolean;
}

export default function ReportUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading = false
}: ReportUserModalProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language || 'en';
  const isRTL = currentLocale.startsWith('ar');
  
  const [reportType, setReportType] = useState('SPAM');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const reportTypes = getReportTypesArray(currentLocale);
  const MIN_REASON_LENGTH = 10;
  const MAX_REASON_LENGTH = 1000;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReportType('SPAM');
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!reason.trim()) {
      setError(t('reportReasonRequired', 'Please provide a reason for this report'));
      return;
    }

    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(t('reportReasonTooShort', `Reason must be at least ${MIN_REASON_LENGTH} characters`));
      return;
    }

    if (reason.trim().length > MAX_REASON_LENGTH) {
      setError(t('reportReasonTooLong', `Reason must not exceed ${MAX_REASON_LENGTH} characters`));
      return;
    }

    setError('');
    await onConfirm(reportType, reason.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const reasonLength = reason.trim().length;
  const isReasonValid = reasonLength >= MIN_REASON_LENGTH && reasonLength <= MAX_REASON_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('reportUser', 'Report User')}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label={t('close', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {userName && (
            <p className="text-sm text-gray-600">
              {t('reportingUser', 'You are reporting')}: <span className="font-semibold">{userName}</span>
            </p>
          )}

          {/* Report Type Dropdown */}
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
              {t('reportType', 'Type of Violation')} <span className="text-red-500">*</span>
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {/* Description of selected type */}
            <p className="mt-1 text-xs text-gray-500">
              {reportTypes.find((t) => t.value === reportType)?.description}
            </p>
          </div>

          {/* Reason Text Area */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              {t('reportReason', 'Detailed Reason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={5}
              maxLength={MAX_REASON_LENGTH}
              placeholder={t('reportReasonPlaceholder', 'Please provide specific details about why you are reporting this user...')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${
                !isReasonValid && reasonLength > 0
                  ? 'text-red-500'
                  : reasonLength >= MIN_REASON_LENGTH
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}>
                {reasonLength} / {MAX_REASON_LENGTH} {t('characters', 'characters')}
                {reasonLength > 0 && reasonLength < MIN_REASON_LENGTH && (
                  <span> ({MIN_REASON_LENGTH - reasonLength} {t('more', 'more needed')})</span>
                )}
              </span>
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              {t('reportDisclaimer', 'Our team will review this report within 24-48 hours. False reports may result in action against your account.')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !isReasonValid}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('submitting', 'Submitting...') : t('submitReport', 'Submit Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

