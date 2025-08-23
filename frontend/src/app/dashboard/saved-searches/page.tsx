'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionContext } from '@/contexts/SessionContext';
import Link from 'next/link';
import { FaSearch, FaTrash } from 'react-icons/fa';
import { getUserSavedSearches, SavedSearchResponse, getCarListingsForSavedSearch, deleteSavedSearch, updateSavedSearch } from '@/services/savedSearches';
import type { CarListingCardData } from '@/components/listings/CarListingCard';
import CarListingListItem from '@/components/search/CarListingListItem';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

export default function DashboardSavedSearchesPage() {
  const { t, i18n } = useTranslation(['search', 'common']);
  const { user, status } = useSessionContext();
  const [mounted, setMounted] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearchResponse | null>(null);
  const [matchingListings, setMatchingListings] = useState<CarListingCardData[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<SavedSearchResponse | null>(null);
  const hasAutoSelectedRef = useRef(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Matching listings are now enhanced directly by the backend with bilingual fields
  const enhancedMatchingListings = matchingListings;

  const loadMatchingListings = useCallback(async (savedSearch: SavedSearchResponse) => {
    try {
      const token = user?.accessToken;
      const listings = await getCarListingsForSavedSearch(savedSearch, token);
      setMatchingListings(listings);
    } catch (error) {
      console.error('Error loading matching listings:', error);
      setMatchingListings([]);
    }
  }, [user]);

  const handleSelectSearch = useCallback((search: SavedSearchResponse) => {
    // Only proceed if switching to a different search or if no search is selected
    if (selectedSearch?.id !== search.id) {
      setSelectedSearch(search);
      loadMatchingListings(search);
    }
  }, [loadMatchingListings, selectedSearch]);

  const handleDeleteAlert = async (alertId: string) => {
    const alertToDeleteObj = savedSearches.find(search => search.id === alertId);
    if (alertToDeleteObj) {
      setAlertToDelete(alertToDeleteObj);
    }
  };

  const confirmDeleteAlert = async () => {
    if (!alertToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = user?.accessToken as string;
      await deleteSavedSearch(alertToDelete.id, token);
      
      // Remove from local state
      setSavedSearches(prev => prev.filter(search => search.id !== alertToDelete.id));
      
      // If this was the selected alert, clear selection and matching listings
      if (selectedSearch?.id === alertToDelete.id) {
        setSelectedSearch(null);
        setMatchingListings([]);
      }
      
      setAlertToDelete(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert(t('search:alertDeleteError', 'Failed to delete alert. Please try again.'));
    } finally {
      setIsDeleting(false);
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
      filters.bodyType.forEach(bodyType => searchParams.append('bodyType', bodyType));
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
      const token = user?.accessToken;
      // Update the name based on current language
      const updatedSearch = await updateSavedSearch(selectedSearch.id, {
        nameEn: isRTL ? selectedSearch.nameEn : editingName.trim(),
        nameAr: isRTL ? editingName.trim() : selectedSearch.nameAr || editingName.trim(),
        filters: selectedSearch.filters,
        notificationPreferences: selectedSearch.notificationPreferences,
        isActive: selectedSearch.isActive
      }, token);
      
      // Update the search in the list
      setSavedSearches(prev => prev.map(search => 
        search.id === selectedSearch.id ? updatedSearch : search
      ));
      
      // Update selected search
      setSelectedSearch(updatedSearch);
      setIsEditingName(false);
      setEditingName('');
      
    } catch (error) {
      console.error('Error updating alert name:', error);
      alert(t('search:alertUpdateError', 'Failed to update alert name. Please try again.'));
    }
  }, [selectedSearch, editingName, user, t, isRTL]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditingName('');
  }, []);

  const loadSavedSearches = useCallback(async () => {
    if (!user?.accessToken) return;
    
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

  // Auto-select first search when searches are loaded and no search is selected
  useEffect(() => {
    if (savedSearches.length > 0 && !selectedSearch && !hasAutoSelectedRef.current) {
      setSelectedSearch(savedSearches[0]);
      hasAutoSelectedRef.current = true;
    }
  }, [savedSearches, selectedSearch]);

  // Load matching listings when selectedSearch changes
  useEffect(() => {
    if (selectedSearch) {
      loadMatchingListings(selectedSearch);
    }
  }, [selectedSearch, loadMatchingListings]);

  useEffect(() => {
    if (status === 'loading') {
      return; // Don't do anything while user is loading
    }
    
    if (user?.accessToken) {
      loadSavedSearches();
    } else {
      // Reset auto-selection flag when user changes
      hasAutoSelectedRef.current = false;
      setSelectedSearch(null);
      setSavedSearches([]);
      setIsLoading(false);
    }
  }, [user, status, loadSavedSearches]);

  if (!mounted || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
              {t('dashboard.dashboard', { ns: 'dashboard' })}
            </Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white">{t('search:savedAlerts', 'Saved Alerts')}</span>
          </li>
        </ol>
      </nav>

      {/* Main Layout - Conditional based on alerts existence */}
      {!isLoading && savedSearches.length === 0 ? (
        /* No alerts - Full width empty state */
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <EmptyState
              type="alerts"
              title={t('search:emptyAlertsTitle', 'No alerts yet!')}
              message={t('search:emptyAlertsMessage', 'Create your first search alert to get notified when new cars matching your criteria are listed.')}
              actionButton={{
                text: t('search:searchForCars', 'Search for cars'),
                href: '/search',
                icon: <FaSearch className="w-4 h-4" />
              }}
            />
          </div>
        </div>
      ) : (
        /* Has alerts - Split layout */
        <div className="grid grid-cols-12 gap-6 transition-all duration-200 ease-in-out">
          {/* Left Sidebar - Alert List */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-fit lg:sticky lg:top-6 transition-transform duration-200 ease-in-out">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('search:alerts', 'Alerts')}
                </h1>
              </div>

              {/* Alert List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className={`p-4 cursor-pointer transition-all duration-200 relative ${
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
                        {search.matchCount || 0} {t('search:newListings', 'listings')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Settings Section - Only show when there are alerts */}
              {savedSearches.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      {t('search:alertSettings', 'Settings for my alerts')}
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
                            {t('search:hideRemoveListings', 'Hide sold and removed listings')}
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
                            {t('search:alertByEmail', 'Alert by email')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('search:emailAlertDescription', 'Get a summary of your alerts via email once a day.')}
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
          <div className="col-span-12 lg:col-span-8">
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
                          {t('search:editName', 'Edit name')}
                        </button>
                        <button 
                          onClick={() => handleDeleteAlert(selectedSearch.id)}
                          disabled={isDeleting}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50 h-10 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FaTrash className="w-4 h-4" />
                          )}
                          {t('search:remove', 'Remove')}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('search:searchingFor', 'Searching for:')}{' '}
                    <a 
                      href={generateSearchUrlWithoutLocation(selectedSearch)}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      title={t('search:viewAllLocations', 'View cars in all governorates with current filters')}
                    >
                      {t('search:carsInSyria', 'Cars for sale in all of Syria')}
                    </a>
                  </p>
                </div>

                {/* Content */}
                <div className="p-6 relative min-h-[600px] transition-all duration-300 ease-in-out">
                  {enhancedMatchingListings.length > 0 ? (
                    <div className="space-y-4 transition-opacity duration-200">
                      {enhancedMatchingListings.map((listing) => (
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
                  ) : (
                    <EmptyState
                      type="search"
                      title={t('search:noResultsFound', 'No cars found')}
                      message={t('search:noMatchingCars', 'No cars found matching this alert criteria. Try adjusting your search filters.')}
                      actionButton={{
                        text: t('search:clearAllFilters', 'Clear all filters'),
                        href: generateSearchUrlWithoutLocation(selectedSearch),
                        icon: <FaSearch className="w-4 h-4" />
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <p className="text-gray-500 text-center">
                  {t('search:selectAlert', 'Select an alert from the left to view details')}
                </p>
              </div>
            )}
          </div> {/* Close the min-h-[600px] wrapper div */}
        </div> {/* Close the right content area */}
      </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!alertToDelete}
        onClose={cancelDeleteAlert}
        onConfirm={confirmDeleteAlert}
        title={t('search:confirmDeleteTitle', 'Delete Alert?')}
        message={t('search:confirmDeleteMessage', 'Are you sure you want to delete the alert')}
        itemName={(isRTL ? alertToDelete?.nameAr || alertToDelete?.nameEn : alertToDelete?.nameEn) || t('search:untitledAlert', 'Untitled Alert')}
        isLoading={isDeleting}
        loadingText={t('common:deleting', 'Deleting...')}
        confirmText={t('common:delete', 'Delete')}
        cancelText={t('common:cancel', 'Cancel')}
        type="danger"
      />
    </div>
  );
}
