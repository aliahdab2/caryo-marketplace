"use client";

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdNotificationsNone, MdEmail, MdSchedule } from 'react-icons/md';
// Removed useLanguage import - using i18n.language directly
import { createSavedSearch, SavedSearchRequest, SavedSearchResponse } from '@/services/savedSearches';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { useApiData } from '@/hooks/useApiData';
import { fetchCarReferenceData, CarReferenceData } from '@/services/api';
import SuccessAlert from '@/components/ui/SuccessAlert';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedSearchFilters;
  searchQuery?: string;
  onSuccess?: () => void;
}

export default function CreateAlertModal({
  isOpen,
  onClose,
  filters,
  searchQuery,
  onSuccess
}: CreateAlertModalProps) {
  const { t, i18n } = useTranslation(['search', 'common']);
  const isRTL = i18n.language === 'ar';

  // Fetch reference data for slug conversion
  const {
    data: referenceData
  } = useApiData<CarReferenceData>(
    fetchCarReferenceData,
    '/api/v1/reference-data',
    [],
    undefined,
    t('errorLoadingData', 'Error loading data. Please try again.')
  );

  // Form state
  const [alertName, setAlertName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastResponse, setLastResponse] = useState<SavedSearchResponse | null>(null);

  // Generate a default alert name based on filters
  const generateDefaultName = useCallback((): string => {
    const parts: string[] = [];

    if (filters.brands && filters.brands.length > 0) {
      parts.push(filters.brands.join(', '));
    }

    if (filters.models && filters.models.length > 0) {
      parts.push(filters.models.join(', '));
    }

    if (filters.locations && filters.locations.length > 0) {
      parts.push(`in ${filters.locations.join(', ')}`);
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceRange = [];
      if (filters.minPrice) priceRange.push(`from $${filters.minPrice}`);
      if (filters.maxPrice) priceRange.push(`up to $${filters.maxPrice}`);
      parts.push(priceRange.join(' '));
    }

    if (parts.length === 0) {
      return searchQuery ? `Cars matching "${searchQuery}"` : 'Car Alert';
    }

    return parts.join(' ');
  }, [filters, searchQuery]);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAlertName(generateDefaultName());
      setEmailNotifications(true);
      setFrequency('daily');
      setIsSubmitting(false);
      setShowSuccess(false);
      setErrorMessage('');
      setLastResponse(null);
    }
  }, [isOpen, generateDefaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alertName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert frontend filters to backend format
      const backendFilters: Record<string, unknown> = {};

      if (filters.brands) backendFilters.brandSlugs = filters.brands;
      if (filters.models) backendFilters.modelSlugs = filters.models;
      if (filters.locations) backendFilters.location = filters.locations;
      if (filters.minPrice) backendFilters.minPrice = filters.minPrice;
      if (filters.maxPrice) backendFilters.maxPrice = filters.maxPrice;
      if (filters.minYear) backendFilters.minYear = filters.minYear;
      if (filters.maxYear) backendFilters.maxYear = filters.maxYear;
      if (filters.minMileage) backendFilters.minMileage = filters.minMileage;
      if (filters.maxMileage) backendFilters.maxMileage = filters.maxMileage;

      // Convert transmissionId to transmissionSlug
      if (filters.transmissionId && referenceData?.transmissions) {
        const transmission = referenceData.transmissions.find(t => t.id === filters.transmissionId);
        if (transmission) {
          backendFilters.transmissionSlug = transmission.slug;
        }
      }

      if (filters.fuelTypeSlugs) backendFilters.fuelTypeSlugs = filters.fuelTypeSlugs;
      if (filters.bodyType) backendFilters.bodyType = filters.bodyType;

      // Convert conditionId to conditionSlug
      if (filters.conditionId && referenceData?.carConditions) {
        const condition = referenceData.carConditions.find(c => c.id === filters.conditionId);
        if (condition) {
          backendFilters.conditionSlug = condition.slug;
        }
      }

      if (filters.sellerTypeIds) backendFilters.sellerTypeIds = filters.sellerTypeIds;
      if (searchQuery) backendFilters.searchQuery = searchQuery;

      const trimmedName = alertName.trim();
      const request: SavedSearchRequest = {
        nameEn: trimmedName,
        nameAr: trimmedName,
        filters: backendFilters,
        notificationPreferences: {
          email: emailNotifications,
          frequency: frequency
        },
        isActive: true
      };

      const response = await createSavedSearch(request);

      // Store response and show success message
      setLastResponse(response);
      setShowSuccess(true);

      // Close modal after success message
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);

    } catch (error: unknown) {
      // Use proper error logging instead of console.error
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating alert:', error);
      }

      // Extract error message from various possible locations
      let errorMsg = 'Failed to create alert. Please try again.';

      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;

        // Check for backend error response
        if (errorObj.response && typeof errorObj.response === 'object') {
          const response = errorObj.response as Record<string, unknown>;
          if (response.data && typeof response.data === 'object') {
            const data = response.data as Record<string, unknown>;
            if (typeof data.message === 'string') {
              errorMsg = data.message;
            } else if (typeof data.error === 'string') {
              errorMsg = data.error;
            }
          } else if (typeof response.statusText === 'string') {
            errorMsg = response.statusText;
          }
        } else if (typeof errorObj.message === 'string') {
          errorMsg = errorObj.message;
        }
      }

      // Handle different types of errors with appropriate UI feedback
      if (errorMsg.includes('maximum limit')) {
        // For user limits, don't auto-suggest - user needs to manage their searches
        setErrorMessage(errorMsg);
      } else if (errorMsg.includes('exceed 100 characters')) {
        // For length validation, truncate the name
        setErrorMessage(errorMsg);
        setAlertName(alertName.substring(0, 100));
      } else {
        // Generic error handling - no name conflicts should occur anymore
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <MdNotificationsNone className="text-blue-600 text-xl" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('search:createAlert', 'Create Alert')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Alert Name */}
            <div>
              <label htmlFor="alertName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('search:alertName', 'Alert Name')}
              </label>
              <input
                type="text"
                id="alertName"
                value={alertName}
                onChange={(e) => {
                  setAlertName(e.target.value);
                  if (errorMessage) setErrorMessage(''); // Clear error when user types
                }}
                className={`w-full px-3 py-2 border rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         ${errorMessage ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder={t('search:alertNamePlaceholder', 'Enter a name for your alert')}
                maxLength={100}
                required
                disabled={isSubmitting}
              />
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  {errorMessage}
                </p>
              )}
              {/* Character counter */}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {alertName.length}/100 characters
              </p>
            </div>

            {/* Current Search Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('search:alertCriteria', 'Alert Criteria')}
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {searchQuery && (
                  <div>
                    <strong>{t('search:searchQuery', 'Search')}:</strong> &quot;{searchQuery}&quot;
                  </div>
                )}
                {filters.brands && filters.brands.length > 0 && (
                  <div>
                    <strong>{t('search:brands', 'Brands')}:</strong> {filters.brands.join(', ')}
                  </div>
                )}
                {filters.models && filters.models.length > 0 && (
                  <div>
                    <strong>{t('search:models', 'Models')}:</strong> {filters.models.join(', ')}
                  </div>
                )}
                {filters.locations && filters.locations.length > 0 && (
                  <div>
                    <strong>{t('search:locations', 'Locations')}:</strong> {filters.locations.join(', ')}
                  </div>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <div>
                    <strong>{t('search:priceRange', 'Price Range')}:</strong>{' '}
                    {filters.minPrice ? `$${filters.minPrice.toLocaleString()}` : 'Any'} - {' '}
                    {filters.maxPrice ? `$${filters.maxPrice.toLocaleString()}` : 'Any'}
                  </div>
                )}
                {(filters.minYear || filters.maxYear) && (
                  <div>
                    <strong>{t('search:yearRange', 'Year Range')}:</strong>{' '}
                    {filters.minYear || 'Any'} - {filters.maxYear || 'Any'}
                  </div>
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('search:notificationSettings', 'Notification Settings')}
              </h3>

              {/* Email Notifications */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="emailNotifications" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <MdEmail className="text-gray-500" />
                  {t('search:emailNotifications', 'Email notifications')}
                </label>
              </div>

              {/* Frequency */}
              {emailNotifications && (
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MdSchedule className="inline mr-2" />
                    {t('search:notificationFrequency', 'Frequency')}
                  </label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 'immediate' | 'daily' | 'weekly')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="immediate">{t('search:immediate', 'Immediate')}</option>
                    <option value="daily">{t('search:daily', 'Daily')}</option>
                    <option value="weekly">{t('search:weekly', 'Weekly')}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-colors"
                disabled={isSubmitting}
              >
                {t('common:cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md
                         hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting || !alertName.trim()}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common:creating', 'Creating...')}
                  </div>
                ) : (
                  t('search:createAlert', 'Create Alert')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Alert */}
      <SuccessAlert
        visible={showSuccess}
        message={
          lastResponse?.wasUpdated
            ? t('search:alertUpdatedSuccess', 'Updated your existing search criteria with name "{name}"! Your notification preferences have been saved.', { name: lastResponse.nameEn })
            : t('search:alertCreatedSuccess', 'Alert created successfully! You will be notified when new cars match your criteria.')
        }
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
}
