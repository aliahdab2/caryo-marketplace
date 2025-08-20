"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdCheckCircle, 
  MdCancel, 
  MdPendingActions, 
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdViewList,
  MdViewModule,
  MdBarChart,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdDirectionsCar,
  MdSpeed,
  MdLocationOn,
  MdRemoveRedEye
} from 'react-icons/md';
import { getAuthHeaders, isAdmin } from '@/utils/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import { formatDate, formatNumber } from '@/utils/localization';
import { transformMinioUrl } from '@/utils/mediaUtils';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

interface Listing {
  id: number;
  title: string;
  description?: string;
  make: string | { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; isActive: boolean } | null;
  model: string | { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; isActive: boolean; brandId: number } | null;
  year: number;
  price: number;
  mileage: number;
  approved: boolean;
  userId: number;
  username?: string;
  createdAt: string;
  imageUrls?: string[]; // Keep for backward compatibility
  media?: { 
    url: string; 
    isPrimary?: boolean; 
    contentType?: string; 
  }[];
  views?: number;
  favoriteCount?: number;
  status?: 'pending' | 'active' | 'expired';
  condition?: 'new' | 'used' | 'certified';
  transmission?: {
    id: number;
    name: string;
    slug: string;
    displayNameEn: string;
    displayNameAr: string;
  };
  fuelType?: {
    id: number;
    name: string;
    slug: string;
    displayNameEn: string;
    displayNameAr: string;
  };
  transmissionNameEn?: string;
  fuelTypeNameEn?: string;
  location?: {
    city?: string;
    cityAr?: string;
    country?: string;
    countryCode?: string;
    address?: string;
  };
  locationDetails?: {
    id: number;
    displayNameEn: string;
    displayNameAr: string;
    slug: string;
    countryCode: string;
  };
  seller?: {
    id: string;
    name: string;
    type: 'dealer' | 'private';
    phone?: string;
    email?: string;
  };
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface AdminPanelState {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  processing: number | null;
  selectedItems: number[];
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  showBulkConfirmModal: boolean;
  bulkActionType: 'approve' | 'reject' | null;
}

// Custom hook for admin panel logic
const useAdminPanel = () => {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { showSuccess, showError } = useToastHelpers();
  const [state, setState] = useState<AdminPanelState>({
    listings: [],
    loading: true,
    error: null,
    processing: null,
    selectedItems: [],
    searchTerm: '',
    statusFilter: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'list',
    showFilters: false,
    showBulkConfirmModal: false,
    bulkActionType: null
  });

  // Memoized computed values
  const computedValues = useMemo(() => {
    const safeListings = Array.isArray(state.listings) ? state.listings : [];
    
    // Apply filters
    const filteredListings = safeListings.filter(listing => {
      const matchesSearch = !state.searchTerm || 
        listing.title?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (typeof listing.make === 'string' ? listing.make : listing.make?.displayNameEn || '')
          .toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (typeof listing.model === 'string' ? listing.model : listing.model?.displayNameEn || '')
          .toLowerCase().includes(state.searchTerm.toLowerCase());
      
      const matchesStatus = state.statusFilter === 'all' || 
        (state.statusFilter === 'pending' && !listing.approved) ||
        (state.statusFilter === 'approved' && listing.approved);
      
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filteredListings.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (state.sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;

        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      filteredListings,
      pendingListings: safeListings.filter(listing => !listing.approved),
      approvedListings: safeListings.filter(listing => listing.approved),
      totalListings: safeListings.length
    };
  }, [state.listings, state.searchTerm, state.statusFilter, state.sortBy, state.sortOrder]);

  const updateState = useCallback((updates: Partial<AdminPanelState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + A: Select all pending
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        const pendingListings = computedValues.filteredListings.filter(listing => !listing.approved);
        updateState({ selectedItems: pendingListings.map(listing => listing.id) });
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        updateState({ selectedItems: [] });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [computedValues.filteredListings, updateState]);

  return {
    state,
    computedValues,
    updateState,
    showSuccess,
    showError,
    t,
    router
  };
};

export default function AdminPanel() {
  const {
    state,
    computedValues,
    updateState,
    showSuccess,
    showError,
    t,
    router
  } = useAdminPanel();

  const {
    listings,
    loading,
    error,
    processing,
    selectedItems,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    viewMode,
    showFilters,
    showBulkConfirmModal,
    bulkActionType
  } = state;

  const {
    filteredListings,
    pendingListings,
    approvedListings,
    totalListings
  } = computedValues;

  // Bulk action handlers
  const handleBulkAction = useCallback((action: 'approve' | 'reject') => {
    if (selectedItems.length === 0) return;

    // Filter to only pending listings
    const pendingSelectedItems = selectedItems.filter(id => {
      const listing = listings.find(l => l.id === id);
      return listing && !listing.approved;
    });

    if (pendingSelectedItems.length === 0) {
      showError('No pending listings selected');
      return;
    }

    // Show confirmation modal
    updateState({ 
      showBulkConfirmModal: true, 
      bulkActionType: action 
    });
  }, [selectedItems, listings, updateState, showError]);

  const confirmBulkAction = useCallback(async () => {
    if (!bulkActionType) return;

    // Filter to only pending listings
    const pendingSelectedItems = selectedItems.filter(id => {
      const listing = listings.find(l => l.id === id);
      return listing && !listing.approved;
    });

    try {
      updateState({ processing: -1, showBulkConfirmModal: false });
      
      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      const promises = pendingSelectedItems.map(async (id) => {
        const endpoint = bulkActionType === 'approve' ? 'approve' : 'reject';
        const response = await fetch(`http://localhost:8080/api/listings/admin/${id}/${endpoint}`, {
          method: 'PUT',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to ${bulkActionType} listing ${id}: ${response.statusText}`);
        }
        
        return id;
      });
      
      await Promise.all(promises);
      
      // Update state based on action
      if (bulkActionType === 'approve') {
        updateState({
          listings: listings.map(listing => 
            pendingSelectedItems.includes(listing.id) 
              ? { ...listing, approved: true } 
              : listing
          ),
          selectedItems: [], 
          processing: null, 
          bulkActionType: null 
        });
      } else {
        // Remove rejected listings
        updateState({
          listings: listings.filter(listing => !pendingSelectedItems.includes(listing.id)),
          selectedItems: [], 
          processing: null, 
          bulkActionType: null 
        });
      }
      
      showSuccess(t(`admin.bulk${bulkActionType.charAt(0).toUpperCase() + bulkActionType.slice(1)}Success`, 
        `${pendingSelectedItems.length} listings ${bulkActionType}d successfully`));
    } catch (_err) {
      updateState({ processing: null, bulkActionType: null });
      showError(t('admin.bulkActionError', 'Bulk action failed'));
    }
  }, [bulkActionType, selectedItems, listings, updateState, showSuccess, showError, t]);

  const cancelBulkAction = useCallback(() => {
    updateState({ 
      showBulkConfirmModal: false, 
      bulkActionType: null 
    });
  }, [updateState]);

  // Individual listing actions
  const approveListing = useCallback(async (listingId: number) => {
    try {
      updateState({ processing: listingId, error: null });

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8080/api/listings/admin/${listingId}/approve`, {
        method: 'PUT',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to approve listing: ${response.statusText}`);
      }

      // Update the listing in state
      updateState({
        listings: listings.map(listing => 
          listing.id === listingId ? { ...listing, approved: true } : listing
        ),
        processing: null
      });

      showSuccess(t('admin.approveSuccess', 'Listing approved successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve listing';
      updateState({ processing: null });
      showError(errorMessage);
      console.error('Error approving listing:', err);
    }
  }, [updateState, listings, showSuccess, showError, t]);

  const rejectListing = useCallback(async (listingId: number) => {
    try {
      updateState({ processing: listingId, error: null });

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8080/api/listings/admin/${listingId}/reject`, {
        method: 'PUT',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to reject listing: ${response.statusText}`);
      }

      // Remove the listing from state (rejected listings are typically removed)
      updateState({
        listings: listings.filter(listing => listing.id !== listingId),
        processing: null
      });

      showSuccess(t('admin.rejectSuccess', 'Listing rejected successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject listing';
      updateState({ processing: null });
      showError(errorMessage);
      console.error('Error rejecting listing:', err);
    }
  }, [updateState, listings, showSuccess, showError, t]);


  const fetchPendingListings = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      // Fetch all listings to show admin status
      const response = await fetch('http://localhost:8080/api/listings/admin/all', {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      // Extract the content array from the paginated response
      updateState({ 
        listings: Array.isArray(data.content) ? data.content : [],
        loading: false 
      });
    } catch (err) {
      updateState({ 
        error: err instanceof Error ? err.message : 'Failed to fetch listings',
        loading: false 
      });
      console.error('Error fetching listings:', err);
    }
  }, [updateState]);

  // Check if user is admin on mount and set up auto-refresh
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
    fetchPendingListings();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPendingListings();
    }, 30000);

    return () => clearInterval(interval);
  }, [router, fetchPendingListings]);





  const toggleSelection = useCallback((id: number) => {
    // Only allow selection of pending listings
    const listing = listings.find(l => l.id === id);
    if (listing && listing.approved) {
      return; // Don't allow selection of approved listings
    }
    
    updateState({
      selectedItems: selectedItems.includes(id)
        ? selectedItems.filter(item => item !== id)
        : [...selectedItems, id]
    });
  }, [selectedItems, listings, updateState]);

  const toggleSelectAll = useCallback(() => {
    const pendingListings = filteredListings.filter(listing => !listing.approved);
    const allPendingSelected = pendingListings.length > 0 && 
      pendingListings.every(listing => selectedItems.includes(listing.id));
    
    updateState({
      selectedItems: allPendingSelected 
        ? [] 
        : pendingListings.map(listing => listing.id)
    });
  }, [selectedItems, filteredListings, updateState]);

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdCancel className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          {t('admin.accessDenied', 'Access Denied')}
        </h1>
          <p className="text-gray-600 dark:text-gray-400">
          {t('admin.adminOnly', 'This page is only accessible to administrators.')}
        </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Modern Clean Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('admin.title', 'Admin Panel')}
          </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t('admin.subtitle', 'Manage listings and platform content')}
          </p>
        </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateState({ showFilters: !showFilters })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <MdFilterList className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{t('admin.filters', 'Filters')}</span>
              </button>

              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => updateState({ viewMode: 'list' })}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MdViewList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateState({ viewMode: 'grid' })}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MdViewModule className="w-5 h-5" />
                </button>
              </div>

        <button
          onClick={fetchPendingListings}
          disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
                <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t('admin.refresh', 'Refresh')}</span>
        </button>
            </div>
          </div>
      </div>

        {/* Modern Stats Dashboard */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
              icon={<MdPendingActions className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
              title={t('admin.pendingListings', 'Pending')}
          value={pendingListings.length}
          color="yellow"
              onClick={() => updateState({ statusFilter: 'pending', showFilters: false })}
        />
        <StatCard
              icon={<MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
              title={t('admin.approvedListings', 'Approved')}
          value={approvedListings.length}
          color="green"
              onClick={() => updateState({ statusFilter: 'approved', showFilters: false })}
        />
        <StatCard
              icon={<MdBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              title={t('admin.totalListings', 'Total')}
              value={totalListings}
          color="blue"
              onClick={() => updateState({ statusFilter: 'all', showFilters: false })}
            />
          </div>
        </div>

        {/* Clean Search and Filters */}
        <div className="px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Modern Search Bar */}
            <div className="p-6">
              <div className="relative">
                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('admin.searchListings', 'Search listings, makes, models...')}
                  value={searchTerm}
                  onChange={(e) => updateState({ searchTerm: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 dark:text-white transition-all duration-200 text-lg"
        />
      </div>
            </div>

            {/* Modern Collapsible Filters */}
            {showFilters && (
              <div className="px-6 pb-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('admin.status', 'Status')}
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => updateState({ statusFilter: e.target.value })}
                        className="w-full border-0 bg-white dark:bg-gray-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 py-3 px-4 shadow-sm"
                      >
                        <option value="all">{t('admin.allStatuses', 'All Statuses')}</option>
                        <option value="pending">{t('admin.pendingOnly', 'Pending Only')}</option>
                        <option value="approved">{t('admin.approvedOnly', 'Approved Only')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('admin.sortBy', 'Sort By')}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => updateState({ sortBy: e.target.value })}
                        className="w-full border-0 bg-white dark:bg-gray-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 py-3 px-4 shadow-sm"
                      >
                        <option value="createdAt">{t('admin.dateCreated', 'Date Created')}</option>
                        <option value="title">{t('admin.title', 'Title')}</option>
                        <option value="price">{t('admin.price', 'Price')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('admin.order', 'Order')}
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => updateState({ sortOrder: e.target.value as 'asc' | 'desc' })}
                        className="w-full border-0 bg-white dark:bg-gray-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 py-3 px-4 shadow-sm"
                      >
                        <option value="desc">{t('admin.descending', 'Newest First')}</option>
                        <option value="asc">{t('admin.ascending', 'Oldest First')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('admin.actions', 'Actions')}
                      </label>
                      <button
                        onClick={() => updateState({ 
                          searchTerm: '', 
                          statusFilter: 'all', 
                          sortBy: 'createdAt', 
                          sortOrder: 'desc' 
                        })}
                        className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                      >
                        {t('admin.clearFilters', 'Clear Filters')}
                      </button>
                    </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Modern Results Section */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('admin.showingResults', 'Showing {{count}} of {{total}} listings', { 
                    count: filteredListings.length, 
                    total: totalListings 
                  })}
                </p>
                
                {filteredListings.length > 0 && (() => {
                  const pendingListings = filteredListings.filter(listing => !listing.approved);
                  const allPendingSelected = pendingListings.length > 0 && 
                    pendingListings.every(listing => selectedItems.includes(listing.id));
                  
                  return pendingListings.length > 0 ? (
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {allPendingSelected ? (
                        <MdCheckBox className="w-4 h-4" />
                      ) : (
                        <MdCheckBoxOutlineBlank className="w-4 h-4" />
                      )}
                      {allPendingSelected ? 'Deselect All' : `Select All Pending (${pendingListings.length})`}
                    </button>
                  ) : null;
                })()}
              </div>

              {selectedItems.length > 0 && (() => {
                const pendingSelectedCount = selectedItems.filter(id => {
                  const listing = listings.find(l => l.id === id);
                  return listing && !listing.approved;
                }).length;
                
                return (
                  <div className="flex items-center justify-between gap-4 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <MdCheckBox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        {selectedItems.length} {selectedItems.length === 1 ? 'listing' : 'listings'} {t('admin.selected', 'selected')}
                        {pendingSelectedCount < selectedItems.length && (
                          <span className="text-xs text-blue-600 dark:text-blue-300 ml-2">
                            ({pendingSelectedCount} pending)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                                          <button
                      onClick={() => handleBulkAction('approve')}
                      disabled={processing === -1 || pendingSelectedCount === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                      aria-label={`Approve ${pendingSelectedCount} selected listings`}
                      title="Ctrl+Enter to approve selected listings"
                    >
                      <MdCheckCircle className="w-4 h-4" />
                      {processing === -1 ? 'Processing...' : `Approve ${pendingSelectedCount > 0 ? `(${pendingSelectedCount})` : 'All'}`}
                    </button>
                    <button
                      onClick={() => handleBulkAction('reject')}
                      disabled={processing === -1 || pendingSelectedCount === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                      aria-label={`Reject ${pendingSelectedCount} selected listings`}
                    >
                      <MdCancel className="w-4 h-4" />
                      {`Reject ${pendingSelectedCount > 0 ? `(${pendingSelectedCount})` : 'All'}`}
                    </button>
                      <button
                        onClick={() => updateState({ selectedItems: [] })}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modern Error Display */}
      {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6" role="alert">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                    <MdCancel className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-800 dark:text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Modern Listings Display */}
        {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">{t('admin.loading', 'Loading listings...')}</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MdCheckCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('admin.noListingsFound', 'No listings found')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {searchTerm || statusFilter !== 'all' 
                    ? t('admin.noListingsMatchFilter', 'No listings match your current filters')
                    : t('admin.noListingsYet', 'No listings have been submitted yet')
                  }
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3" 
                : "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              }>
                {filteredListings.map((listing) => (
                                    <EnhancedListingCard
                key={listing.id}
                listing={listing}
                    viewMode={viewMode}
                    isSelected={selectedItems.includes(listing.id)}
                    onSelect={() => toggleSelection(listing.id)}
                onApprove={() => approveListing(listing.id)}
                onReject={() => rejectListing(listing.id)}
                processing={processing === listing.id}
                selectedItems={selectedItems}
                t={t}
                  />
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Bulk Action Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showBulkConfirmModal}
        onClose={cancelBulkAction}
        onConfirm={confirmBulkAction}
        title={bulkActionType === 'approve' ? t('admin.confirmBulkApprove', 'Approve Listings?') : t('admin.confirmBulkReject', 'Reject Listings?')}
        message={(() => {
          const pendingSelectedCount = selectedItems.filter(id => {
            const listing = listings.find(l => l.id === id);
            return listing && !listing.approved;
          }).length;
          
          return bulkActionType === 'approve' 
            ? t('admin.confirmBulkApproveMessage', `Are you sure you want to approve ${pendingSelectedCount} listing${pendingSelectedCount > 1 ? 's' : ''}? This will make them visible to all users.`)
            : t('admin.confirmBulkRejectMessage', `Are you sure you want to reject ${pendingSelectedCount} listing${pendingSelectedCount > 1 ? 's' : ''}? This action cannot be undone.`);
        })()}
        isLoading={processing === -1}
        loadingText={bulkActionType === 'approve' ? t('admin.approvingListings', 'Approving...') : t('admin.rejectingListings', 'Rejecting...')}
        confirmText={bulkActionType === 'approve' ? t('admin.approve', 'Approve') : t('admin.reject', 'Reject')}
        cancelText={t('common.cancel', 'Cancel')}
        type={bulkActionType === 'approve' ? 'warning' : 'danger'}
      />
    </div>
  );
}

// Enhanced components

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'indigo' | 'orange';
  onClick?: () => void;
}

function StatCard({ icon, title, value, color, onClick }: StatCardProps) {
  const colorClasses = {
    yellow: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30',
    green: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30',
    blue: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30',
    purple: 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30',
    indigo: 'bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30',
    orange: 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} p-4 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105`}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-xl">
        {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(value, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        </div>
      </div>
    </button>
  );
}

interface EnhancedListingCardProps {
  listing: Listing;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  selectedItems: number[];
  t: ReturnType<typeof useTranslation>['t'];
}

function EnhancedListingCard({ 
  listing, 
  viewMode, 
  isSelected, 
  onSelect, 
  onApprove, 
  onReject, 
  processing, 
  selectedItems,
  t 
}: EnhancedListingCardProps) {
  const getStatusBadge = () => {
    if (listing.approved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-700">
          <MdCheckCircle className="w-3 h-3 mr-1" />
          {t('admin.approved', 'Approved')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700">
        <MdPendingActions className="w-3 h-3 mr-1" />
        {t('admin.pending', 'Pending')}
      </span>
    );
  };



  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'N/A';
    return `${formatNumber(mileage, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${t('admin.km', 'km')}`;
  };

  const getLocationDisplay = () => {
    if (listing.locationDetails) {
      return listing.locationDetails.displayNameEn;
    }
    if (listing.location?.city) {
      return listing.location.city;
    }
    return 'N/A';
  };

  const getImageUrl = () => {
    // First try to get from media array (new format)
    if (listing.media && listing.media.length > 0) {
      const primaryImage = listing.media.find(m => m.isPrimary);
      const imageUrl = primaryImage?.url || listing.media[0]?.url;
      return imageUrl ? transformMinioUrl(imageUrl) : null;
    }
    
    // Fallback to imageUrls array (old format)
    if (listing.imageUrls && listing.imageUrls.length > 0) {
      return transformMinioUrl(listing.imageUrls[0]);
    }
    
    return null;
  };

  const cardContent = (
    <>
      {/* Selection checkbox (grid only) */}
      {viewMode === 'grid' && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={listing.approved ? undefined : onSelect}
            disabled={listing.approved}
            className={`p-1 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-colors ${
              listing.approved 
                ? 'cursor-not-allowed opacity-50' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {listing.approved ? (
              <MdCheckBox className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            ) : isSelected ? (
              <MdCheckBox className="w-5 h-5 text-blue-600" />
            ) : (
              <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      )}

      {/* Status badge (grid only) */}
      {viewMode === 'grid' && (
        <div className="absolute top-3 right-3 z-10">
          {getStatusBadge()}
        </div>
      )}

      {viewMode === 'grid' ? (
        <>
          {/* Car Image Display */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
            {(() => {
              const imageUrl = getImageUrl();
              


              if (imageUrl) {
                return (
                  <Image
                    src={imageUrl}
                    alt={listing.title || 'Car listing'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    unoptimized={true}
                    onError={(_e) => {
                      // Silently handle image load errors - fallback will be shown
                    }}
                  />
                );
              } else {
                return (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdDirectionsCar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">No image available</p>
                      <p className="text-blue-500 dark:text-blue-500 text-xs mt-1">ID: {listing.id}</p>
                    </div>
                  </div>
                );
              }
            })()}
            
            {/* Needs Review Overlay - Bottom Center */}
            {!listing.approved && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg">
                  <MdPendingActions className="w-3 h-3" />
                  <span className="hidden sm:inline">Review</span>
                </div>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-4">
            {/* Title and Price */}
            <div className="mb-3">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2 leading-tight min-h-[2.5rem]">
                {listing.title}
              </h3>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${formatNumber(listing.price, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-4 space-y-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {typeof listing.make === 'string' 
                  ? listing.make 
                  : listing.make?.displayNameEn || 'N/A'} {' '}
                {typeof listing.model === 'string' 
                  ? listing.model 
                  : listing.model?.displayNameEn || 'N/A'} {' '}
                {listing.year && `(${listing.year})`}
              </div>
              
              {/* Key Info */}
              <div className="flex flex-wrap gap-1.5">
                <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-[10px] font-medium">
                  <MdSpeed className="w-3 h-3" />
                  {formatMileage(listing.mileage)}
                </div>
                
                <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md text-[10px] font-medium">
                  <MdLocationOn className="w-3 h-3" />
                  <span className="truncate max-w-20">{getLocationDisplay()}</span>
                </div>
                
                {listing.views !== undefined && (
                  <div className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-[10px] font-medium">
                    <MdRemoveRedEye className="w-3 h-3" />
                    {listing.views}
                  </div>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 mb-3">
              <span>#{listing.id}</span>
              <span>{formatDate(listing.createdAt, 'en', { dateStyle: 'short' })}</span>
            </div>


          </div>
        </>
      ) : (
        // List view - Clean and organized
        <div className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
          <div className="px-6 py-4">
            <div className="flex items-center gap-6">
              {/* Selection checkbox */}
              <div className="flex-shrink-0">
                <button 
                  onClick={listing.approved ? undefined : onSelect} 
                  disabled={listing.approved}
                  className={`p-1 rounded-md transition-colors ${
                    listing.approved 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {listing.approved ? (
                    <MdCheckBox className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  ) : isSelected ? (
                    <MdCheckBox className="w-5 h-5 text-blue-600" />
                  ) : (
                    <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Car Image */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-18 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm">
                  {(() => {
                    const imageUrl = getImageUrl();
                    return imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt={listing.title || 'Car'} 
                        fill 
                        className="object-cover" 
                        sizes="96px" 
                        unoptimized 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                        <MdDirectionsCar className="w-10 h-10 text-gray-400" />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {listing.title}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {typeof listing.make === 'string' 
                      ? listing.make 
                      : listing.make?.displayNameEn || 'N/A'} {' '}
                    {typeof listing.model === 'string' 
                      ? listing.model 
                      : listing.model?.displayNameEn || 'N/A'} {' '}
                    {listing.year && `• ${listing.year}`}
                  </div>
                </div>
                
                {/* Key Info Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <MdSpeed className="w-4 h-4" />
                    {formatMileage(listing.mileage)}
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <MdLocationOn className="w-4 h-4" />
                    <span className="truncate max-w-32">{getLocationDisplay()}</span>
                  </div>
                  
                  {listing.views !== undefined && (
                    <div className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <MdRemoveRedEye className="w-4 h-4" />
                      {listing.views}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Status */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  ${formatNumber(listing.price, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="mb-3">
                  {getStatusBadge()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {listing.id}
                </div>
              </div>

              {/* Quick Actions - Only for single selection */}
              {!listing.approved && isSelected && selectedItems.length === 1 && (
                <div className="flex-shrink-0">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={onApprove}
                      disabled={processing}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors min-w-[100px]"
                    >
                      <MdCheckCircle className="w-4 h-4" />
                      {processing ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={onReject}
                      disabled={processing}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors min-w-[100px]"
                    >
                      <MdCancel className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg overflow-hidden relative ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
    }`}>
      {cardContent}
    </div>
  );
}