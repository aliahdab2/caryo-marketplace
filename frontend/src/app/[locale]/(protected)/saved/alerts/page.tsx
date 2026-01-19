'use client';

// Disable static generation for this page since it uses session data
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';

import Breadcrumb, { createSavedAlertsBreadcrumb } from '@/components/ui/Breadcrumb';
import { FaSearch, FaTrash } from 'react-icons/fa';
import { SavedSearchResponse } from '@/services/savedSearches';
import { useSavedSearches, useSavedSearchResults, useUpdateSavedSearch, useDeleteSavedSearch } from '@/hooks/queries/useSavedSearches';
import { QueryWrapper } from '@/components/common/QueryWrapper';
import CarListingListItem from '@/components/search/CarListingListItem';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

export default function SavedAlertsPage() {
  const { t } = useTranslation(['savedAlerts', 'common']);
  const { isRTL } = useLanguageSwitching();
  
  // React Query hooks
  const savedSearchesQuery = useSavedSearches();
  const updateMutation = useUpdateSavedSearch();
  const deleteMutation = useDeleteSavedSearch();
  
  const [selectedSearch, setSelectedSearch] = useState<SavedSearchResponse | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [alertToDelete, setAlertToDelete] = useState<SavedSearchResponse | null>(null);
  const hasAutoSelectedRef = useRef(false);

  // Search results query - depends on selected search
  const resultsQuery = useSavedSearchResults(selectedSearch || undefined);

  // Auto-select first search when searches are loaded and no search is selected
  useEffect(() => {
    if (savedSearchesQuery.data && savedSearchesQuery.data.length > 0 && !selectedSearch && !hasAutoSelectedRef.current) {
      setSelectedSearch(savedSearchesQuery.data[0]);
      hasAutoSelectedRef.current = true;
    }
    
    // Reset selection if the selected search was deleted
    if (selectedSearch && savedSearchesQuery.data && !savedSearchesQuery.data.find(s => s.id === selectedSearch.id)) {
      if (savedSearchesQuery.data.length > 0) {
        setSelectedSearch(savedSearchesQuery.data[0]);
      } else {
        setSelectedSearch(null);
      }
    }
  }, [savedSearchesQuery.data, selectedSearch]);

  const handleSelectSearch = useCallback((search: SavedSearchResponse) => {
    if (selectedSearch?.id !== search.id) {
      setSelectedSearch(search);
      // Query will automatically update due to dependency on selectedSearch
    }
  }, [selectedSearch?.id]);

  const handleDeleteAlert = async (alertId: string) => {
    const alertToDeleteObj = savedSearchesQuery.data?.find(search => search.id === alertId);
    if (alertToDeleteObj) {
      setAlertToDelete(alertToDeleteObj);
    }
  };

  const confirmDeleteAlert = async () => {
    if (!alertToDelete) return;

    try {
      await deleteMutation.mutateAsync(alertToDelete.id);

      // Cache invalidation handles updating the list
      // Selection logic in useEffect handles if we deleted the selected one

      setAlertToDelete(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
      // Ideally show toast here
      alert(t('savedAlerts:alertDeleteError', 'Failed to delete alert. Please try again.'));
    }
  };

  const cancelDeleteAlert = () => {
    setAlertToDelete(null);
  };

  // Generate search URL with current filters but remove location filters
  const generateSearchUrlWithoutLocation = useCallback((savedSearch: SavedSearchResponse) => {
    const filters = savedSearch.filters;
    const searchParams = new URLSearchParams();

    // Add all filters except location using the correct URL parameter names
    if (filters.brands && Array.isArray(filters.brands) && filters.brands.length > 0) {
      filters.brands.forEach(brand => searchParams.append('brand', brand));
    }
    if (filters.models && Array.isArray(filters.models) && filters.models.length > 0) {
      filters.models.forEach(model => searchParams.append('model', model));
    }
    if (filters.minPrice) {
      searchParams.set('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      searchParams.set('maxPrice', filters.maxPrice.toString());
    }
    if (filters.minYear) {
      searchParams.set('minYear', filters.minYear.toString());
    }
    if (filters.maxYear) {
      searchParams.set('maxYear', filters.maxYear.toString());
    }
    if (filters.minMileage) {
      searchParams.set('minMileage', filters.minMileage.toString());
    }
    if (filters.maxMileage) {
      searchParams.set('maxMileage', filters.maxMileage.toString());
    }
    if (filters.transmissionId) {
      searchParams.set('transmission', filters.transmissionId.toString());
    }
    if (filters.fuelTypeSlugs && Array.isArray(filters.fuelTypeSlugs) && filters.fuelTypeSlugs.length > 0) {
      filters.fuelTypeSlugs.forEach(fuelType => searchParams.append('fuelType', fuelType));
    }
    if (filters.bodyType && Array.isArray(filters.bodyType) && filters.bodyType.length > 0) {
      searchParams.set('bodyType', filters.bodyType.join(','));
    }
    if (filters.conditionId) {
      searchParams.set('condition', filters.conditionId.toString());
    }
    if (filters.searchQuery) {
      searchParams.set('q', filters.searchQuery.toString());
    }
    // Explicitly don't include location filters to show all governorates

    return `/search?${searchParams.toString()}`;
  }, []);

  const handleStartEditName = useCallback(() => {
    if (selectedSearch) {
      // Initialize with the name in the current language
      setEditingName(isRTL ? selectedSearch.nameAr || selectedSearch.nameEn : selectedSearch.nameEn);
      setIsEditingName(true);
    }
  }, [selectedSearch, isRTL]);

  const handleSaveEditName = useCallback(async () => {
    if (!selectedSearch || !editingName.trim()) {
      return;
    }

    try {
      const updatedSearch = await updateMutation.mutateAsync({
        id: selectedSearch.id,
        request: {
          nameEn: isRTL ? selectedSearch.nameEn : editingName.trim(),
          nameAr: isRTL ? editingName.trim() : selectedSearch.nameAr || editingName.trim(),
          filters: selectedSearch.filters,
          notificationPreferences: selectedSearch.notificationPreferences,
          isActive: selectedSearch.isActive
        }
      });

      // Update selected search with the returned data
      setSelectedSearch(updatedSearch);
      setIsEditingName(false);
      setEditingName('');

    } catch (error) {
      console.error('Error updating alert name:', error);
      alert(t('savedAlerts:alertUpdateError', 'Failed to update alert name. Please try again.'));
    }
  }, [selectedSearch, editingName, t, isRTL, updateMutation]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditingName('');
  }, []);

  // Use QueryWrapper for the entire page logic
  return (
    <div className={`container mx-auto px-4 py-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <Breadcrumb items={createSavedAlertsBreadcrumb()} />

      <QueryWrapper
        query={savedSearchesQuery}
        loadingVariant="skeleton"
        loadingCount={3}
        emptyComponent={
          /* No alerts - Full width empty state */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <EmptyState
                title={t('savedAlerts:emptyAlertsTitle', 'No alerts yet!')}
                message={t('savedAlerts:emptyAlertsMessage', 'Create your first search alert to get notified when new cars matching your criteria are listed.')}
                actionButton={{
                  text: t('savedAlerts:searchForCars', 'Search for cars'),
                  href: '/search',
                  icon: <FaSearch className="w-4 h-4" />
                }}
              />
            </div>
          </div>
        }
      >
        {(savedSearches) => (
          /* Has alerts - Split layout */
          <div className="grid grid-cols-12 gap-6 transition-all duration-200 ease-in-out">
            {/* Left Sidebar - Alert List */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-fit lg:sticky lg:top-6 transition-transform duration-200 ease-in-out">
                {/* Header */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('savedAlerts:alerts', 'Alerts')}
                  </h1>
                </div>

                {/* Alert List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className={`p-3 cursor-pointer transition-all duration-200 relative ${
                        selectedSearch?.id === search.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${isRTL ? 'text-right' : 'text-left'}`}
                      onClick={() => handleSelectSearch(search)}
                    >
                      {/* Active indicator line */}
                      {selectedSearch?.id === search.id && (
                        <div className={`absolute top-0 bottom-0 w-1 bg-blue-500 ${isRTL ? 'right-0' : 'left-0'}`}></div>
                      )}
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {isRTL ? search.nameAr || search.nameEn : search.nameEn}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {search.matchCount || 0} {t('savedAlerts:newListings', 'listings')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Settings Section - Only show when there are alerts */}
                {savedSearches.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        {t('savedAlerts:alertSettings', 'Settings for my alerts')}
                      </h3>

                      <div className="space-y-3">
                        <label className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            defaultChecked
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {t('savedAlerts:hideRemoveListings', 'Hide sold and removed listings')}
                            </div>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {t('savedAlerts:alertByEmail', 'Alert by email')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('savedAlerts:emailAlertDescription', 'Get a summary of your alerts via email once a day.')}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="col-span-12 lg:col-span-9">
              <div className="min-h-[600px]"> {/* Minimum height to prevent layout shifts */}
                {selectedSearch ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between min-h-[2.5rem]">
                        <div className="flex-1">
                          {isEditingName ? (
                            <div className="flex items-center gap-2 h-10">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className={`text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 min-w-0 flex-1 h-8 ${isRTL ? 'text-right' : 'text-left'}`}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEditName();
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditName();
                                  }
                                }}
                              />
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={handleSaveEditName}
                                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm border border-blue-600 bg-blue-600 text-white rounded hover:bg-blue-700 hover:border-blue-700 transition-colors h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
                                >
                                  {t('common:save', 'Save')}
                                </button>
                                <button
                                  onClick={handleCancelEditName}
                                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
                                >
                                  {t('common:cancel', 'Cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <h2 className={`text-xl font-semibold text-gray-900 dark:text-white h-10 flex items-center ${isRTL ? 'text-right' : 'text-left'}`}>
                              {isRTL ? selectedSearch.nameAr || selectedSearch.nameEn : selectedSearch.nameEn}
                            </h2>
                          )}
                        </div>
                        {!isEditingName && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={handleStartEditName}
                              className={`inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                              <FaSearch className="w-4 h-4" />
                              {t('savedAlerts:editName', 'Edit name')}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(selectedSearch.id)}
                              disabled={deleteMutation.isPending}
                              className={`inline-flex items-center gap-2 px-4 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50 h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                              {deleteMutation.isPending && alertToDelete?.id === selectedSearch.id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FaTrash className="w-4 h-4" />
                              )}
                              {t('savedAlerts:remove', 'Remove')}
                            </button>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('savedAlerts:searchingFor', 'Searching for:')}{' '}
                        <a
                          href={generateSearchUrlWithoutLocation(selectedSearch)}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          title={t('savedAlerts:viewAllLocations', 'View cars in all governorates with current filters')}
                        >
                          {t('savedAlerts:carsInSyria', 'Cars for sale in all of Syria')}
                        </a>
                      </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 relative min-h-[600px] transition-all duration-300 ease-in-out">
                      <QueryWrapper
                        query={resultsQuery}
                        loadingVariant="list"
                        loadingCount={5}
                        emptyComponent={
                          <EmptyState
                            title={t('search:noResultsFound', 'No cars found')}
                            message={t('savedAlerts:noMatchingCars', 'No cars found matching this alert criteria. Try adjusting your search filters.')}
                            actionButton={{
                              text: t('search:clearAllFilters', 'Clear all filters'),
                              href: generateSearchUrlWithoutLocation(selectedSearch),
                              icon: <FaSearch className="w-4 h-4" />
                            }}
                          />
                        }
                      >
                        {(listings) => (
                          <div className="space-y-4 transition-opacity duration-200">
                            {listings.map((listing) => (
                              <CarListingListItem
                                key={listing.id}
                                listing={listing}
                                onFavoriteToggle={(isFavorite) => {
                                  // Handle favorite toggle if needed
                                  console.log('Favorite toggled:', isFavorite);
                                }}
                                t={(key: string, fallback?: string) => fallback ? t(key, fallback) : t(key)}
                                isRTL={isRTL}
                              />
                            ))}
                          </div>
                        )}
                      </QueryWrapper>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <p className="text-gray-500 text-center">
                      {t('savedAlerts:selectAlert', 'Select an alert from the left to view details')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </QueryWrapper>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!alertToDelete}
        onClose={cancelDeleteAlert}
        onConfirm={confirmDeleteAlert}
        title={t('savedAlerts:confirmDeleteTitle', 'Delete Alert?')}
        message={t('savedAlerts:confirmDeleteMessage', 'Are you sure you want to delete the alert')}
        itemName={(isRTL ? alertToDelete?.nameAr || alertToDelete?.nameEn : alertToDelete?.nameEn) || t('savedAlerts:untitledAlert', 'Untitled Alert')}
        isLoading={deleteMutation.isPending}
        loadingText={t('common:deleting', 'Deleting...')}
        confirmText={t('common:delete', 'Delete')}
        cancelText={t('common:cancel', 'Cancel')}
        type="danger"
      />
    </div>
  );
}
