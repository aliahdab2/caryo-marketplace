"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOptimizedUser } from '@/hooks/useOptimizedSession';
import { MdNotificationsNone, MdEdit, MdDelete, MdEmail, MdMailOutline } from 'react-icons/md';
// Removed useLanguage import - using i18n.language directly
import {
  getUserSavedSearches,
  deleteSavedSearch,
  SavedSearchResponse
} from '@/services/savedSearches';
import SuccessAlert from '@/components/ui/SuccessAlert';
import EmptyState from '@/components/ui/EmptyState';

interface SavedSearchesManagerProps {
  onEditSearch?: (search: SavedSearchResponse) => void;
}

export default function SavedSearchesManager({
  onEditSearch
}: SavedSearchesManagerProps) {
  const { t, i18n } = useTranslation(['search', 'common']);
  const user = useOptimizedUser();
  const isRTL = i18n.language === 'ar';

  const [savedSearches, setSavedSearches] = useState<SavedSearchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadSavedSearches = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = user?.accessToken;
      const searches = await getUserSavedSearches(token);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load saved searches
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  const handleDeleteSearch = async (id: string) => {
    if (!confirm(t('search:confirmDeleteAlert', 'Are you sure you want to delete this alert?'))) {
      return;
    }

    try {
      setDeletingId(id);
      const token = user?.accessToken;
      await deleteSavedSearch(id, token);

      // Remove from local state
      setSavedSearches(prev => prev.filter(search => search.id !== id));

      setSuccessMessage(t('search:alertDeletedSuccess', 'Alert deleted successfully'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error deleting saved search:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFilterSummary = (filters: Record<string, unknown>): string => {
    const parts: string[] = [];

    if (filters.brandSlugs && Array.isArray(filters.brandSlugs)) {
      parts.push(`Brands: ${filters.brandSlugs.join(', ')}`);
    }

    if (filters.modelSlugs && Array.isArray(filters.modelSlugs)) {
      parts.push(`Models: ${filters.modelSlugs.join(', ')}`);
    }

    if (filters.location && Array.isArray(filters.location)) {
      parts.push(`Locations: ${filters.location.join(', ')}`);
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceRange = [];
      if (filters.minPrice) priceRange.push(`from $${Number(filters.minPrice).toLocaleString()}`);
      if (filters.maxPrice) priceRange.push(`up to $${Number(filters.maxPrice).toLocaleString()}`);
      parts.push(`Price: ${priceRange.join(' ')}`);
    }

    if (filters.minYear || filters.maxYear) {
      const yearRange = [];
      if (filters.minYear) yearRange.push(`from ${filters.minYear}`);
      if (filters.maxYear) yearRange.push(`up to ${filters.maxYear}`);
      parts.push(`Year: ${yearRange.join(' ')}`);
    }

    if (filters.searchQuery) {
      parts.push(`Search: "${filters.searchQuery}"`);
    }

    return parts.length > 0 ? parts.join(' • ') : t('search:noFilters', 'No specific filters');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          {t('common:loading', 'Loading...')}
        </div>
      </div>
    );
  }

  if (savedSearches.length === 0) {
    return (
      <EmptyState
        type="alerts"
        title={t('search:emptyStateTitle', 'Here it was empty!')}
        message={t('search:emptyStateMessage', 'No alerts found. Create your first alert to get notified when new cars match your criteria.')}
        actionButton={{
          text: t('search:createFirstAlert', 'Create Your First Alert'),
          href: '/search',
          icon: <MdNotificationsNone className="w-5 h-5" />
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Alert Name and Status */}
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                    {search.nameEn}
                  </h3>
                  {search.isActive && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {t('search:active', 'Active')}
                    </span>
                  )}
                </div>

                {/* Filter Summary */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {formatFilterSummary(search.filters)}
                </p>

                {/* Notification Settings */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    {search.notificationPreferences.email ? (
                      <MdEmail className="text-blue-500" />
                    ) : (
                      <MdMailOutline className="text-gray-400" />
                    )}
                    <span>
                      {search.notificationPreferences.email
                        ? t('search:emailEnabled', 'Email notifications')
                        : t('search:emailDisabled', 'Email disabled')
                      }
                    </span>
                  </div>

                  {search.notificationPreferences.email && (
                    <span>
                      {t(`search:frequency_${search.notificationPreferences.frequency}`,
                         search.notificationPreferences.frequency)}
                    </span>
                  )}

                  <span>
                    {t('search:created', 'Created')} {formatDate(search.createdAt)}
                  </span>
                </div>

                {/* Last Notification */}
                {search.lastNotifiedAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    {t('search:lastNotified', 'Last notified')}: {formatDate(search.lastNotifiedAt)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {onEditSearch && (
                  <button
                    onClick={() => onEditSearch(search)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title={t('search:editAlert', 'Edit alert')}
                  >
                    <MdEdit size={18} />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteSearch(search.id)}
                  disabled={deletingId === search.id}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  title={t('search:deleteAlert', 'Delete alert')}
                >
                  {deletingId === search.id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MdDelete size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Alert */}
      <SuccessAlert
        visible={showSuccess}
        message={successMessage}
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
}
