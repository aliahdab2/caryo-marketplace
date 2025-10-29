"use client";

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdSearch,
  MdFilterList,
  MdViewList,
  MdViewModule,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdDirectionsCar,
  MdSpeed,
  MdLocationOn,
  MdRemoveRedEye,
  MdRefresh,
  MdBarChart,
  MdPendingActions,
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';
import Image from 'next/image';
import { formatNumber } from '@/utils/localization';
import { transformMinioUrl } from '@/utils/mediaUtils';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

// Common listing interface
export interface CommonListing {
  id: string | number;
  title: string;
  description?: string;
  make: string | { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; isActive: boolean } | null;
  model: string | { id: number; name: string; slug: string; displayNameEn: string; displayNameAr: string; isActive: boolean; brandId: number } | null;
  year: number;
  price: number;
  mileage: number;
  createdAt: string;
  imageUrls?: string[];
  media?: {
    url: string;
    isPrimary?: boolean;
    contentType?: string;
  }[];
  views?: number;
  favoriteCount?: number;
  status?: 'pending' | 'active' | 'expired' | 'approved' | 'rejected';
  approved?: boolean; // For admin panel
  userId?: number;
  username?: string;
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
}

// Action configuration for different contexts
export interface ListingAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  onClick: (listing: CommonListing) => void;
  disabled?: (listing: CommonListing) => boolean;
  visible?: (listing: CommonListing) => boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  onClick: (selectedIds: (string | number)[]) => void;
  disabled?: (selectedIds: (string | number)[]) => boolean;
}

export interface ListingManagementProps {
  // Data
  listings: CommonListing[];
  loading: boolean;
  error: string | null;

  // Actions
  actions?: ListingAction[];
  bulkActions?: BulkAction[];

  // Configuration
  title: string;
  subtitle?: string;
  showStats?: boolean;
  allowSelection?: boolean;
  allowBulkActions?: boolean;
  defaultViewMode?: 'grid' | 'list';

  // Callbacks
  onRefresh?: () => void;
  onSearch?: (term: string) => void;
  onFilter?: (filter: { status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void;

  // Processing state
  processing?: (string | number)[] | number | null;

  // Custom renderers
  renderStats?: () => React.ReactNode;
  renderCustomActions?: (listing: CommonListing) => React.ReactNode;
}

export default function ListingManagement({
  listings,
  loading,
  error,
  actions = [],
  bulkActions = [],
  title,
  subtitle,
  showStats = true,
  allowSelection = false,
  allowBulkActions = false,
  defaultViewMode = 'list',
  onRefresh,
  onSearch,
  onFilter,
  processing,
  renderStats,
  renderCustomActions
}: ListingManagementProps) {
  const { t } = useTranslation('dashboard');

  // Local state
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [_sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkAction | null>(null);

  // Computed values
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const matchesSearch = !searchTerm ||
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof listing.make === 'string' ? listing.make : listing.make?.displayNameEn || '')
          .toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof listing.model === 'string' ? listing.model : listing.model?.displayNameEn || '')
          .toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'pending' && (!listing.approved && listing.status !== 'approved')) ||
        (statusFilter === 'approved' && (listing.approved || listing.status === 'approved')) ||
        (statusFilter === 'active' && listing.status === 'active') ||
        (statusFilter === 'expired' && listing.status === 'expired');

      return matchesSearch && matchesStatus;
    });
  }, [listings, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = listings.length;
    const pending = listings.filter(l => !l.approved && l.status !== 'approved').length;
    const approved = listings.filter(l => l.approved || l.status === 'approved').length;
    const active = listings.filter(l => l.status === 'active').length;

    return { total, pending, approved, active };
  }, [listings]);

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  }, [onSearch]);

  const handleFilter = useCallback((filter: { status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    if (filter.status !== undefined) setStatusFilter(filter.status);
    if (filter.sortBy !== undefined) setSortBy(filter.sortBy);
    if (filter.sortOrder !== undefined) setSortOrder(filter.sortOrder);
    onFilter?.(filter);
  }, [onFilter]);

  const handleBulkAction = useCallback((action: BulkAction) => {
    setCurrentBulkAction(action);
    setShowBulkConfirmModal(true);
  }, []);

  const confirmBulkAction = useCallback(() => {
    if (currentBulkAction) {
      currentBulkAction.onClick(selectedItems);
      setShowBulkConfirmModal(false);
      setCurrentBulkAction(null);
      setSelectedItems([]);
    }
  }, [currentBulkAction, selectedItems]);

  const cancelBulkAction = useCallback(() => {
    setShowBulkConfirmModal(false);
    setCurrentBulkAction(null);
  }, []);

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    const selectableListings = filteredListings.filter(listing =>
      !actions.some(action => action.disabled?.(listing))
    );

    const allSelected = selectableListings.every(listing =>
      selectedItems.includes(listing.id)
    );

    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectableListings.map(listing => listing.id));
    }
  }, [filteredListings, selectedItems, actions]);

  // Utility functions
  const getImageUrl = useCallback((listing: CommonListing) => {
    if (listing.media && listing.media.length > 0) {
      const primaryImage = listing.media.find(m => m.isPrimary) || listing.media[0];
      return transformMinioUrl(primaryImage.url);
    }
    if (listing.imageUrls && listing.imageUrls.length > 0) {
      return transformMinioUrl(listing.imageUrls[0]);
    }
    return null;
  }, []);

  const formatMileage = useCallback((mileage: number) => {
    return formatNumber(mileage, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' km';
  }, []);

  const getLocationDisplay = useCallback((listing: CommonListing) => {
    if (listing.locationDetails) {
      return listing.locationDetails.displayNameEn;
    }
    if (listing.location) {
      return listing.location.city || listing.location.country || 'N/A';
    }
    return 'N/A';
  }, []);

  const getStatusBadge = useCallback((listing: CommonListing) => {
    if (listing.approved || listing.status === 'approved') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Approved
        </span>
      );
    }
    if (listing.status === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Active
        </span>
      );
    }
    if (listing.status === 'expired') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        Pending
      </span>
    );
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>

            {showStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl p-4 border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-18 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <MdFilterList className="w-5 h-5" />
                {t('filters')}
              </button>

              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MdViewList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MdViewModule className="w-5 h-5" />
                </button>
              </div>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  <MdRefresh className="w-5 h-5" />
                  {t('refresh')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="px-6 py-6">
            {renderStats ? renderStats() : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center">
                      <MdPendingActions className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.pending}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                      <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.approved}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                      <MdDirectionsCar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.active}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                      <MdBarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="px-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilter({ status: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('allStatus')}</option>
                  <option value="pending">{t('pendingStatus')}</option>
                  <option value="approved">{t('approvedStatus')}</option>
                  <option value="active">{t('activeStatus')}</option>
                  <option value="expired">{t('expiredStatus')}</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => handleFilter({ sortBy: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">{t('dateCreated')}</option>
                  <option value="title">{t('sortByTitle')}</option>
                  <option value="price">{t('sortByPrice')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
            {/* Header with Selection */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('listingsCount', { count: filteredListings.length })}
                </span>

                {allowSelection && filteredListings.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    {selectedItems.length === filteredListings.length ? t('deselectAll') : t('selectAll')}
                  </button>
                )}
              </div>

              {allowBulkActions && selectedItems.length > 0 && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {selectedItems.length} {t('selectedCount')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 dark:text-blue-300">{t('bulkActions')}</span>
                    {bulkActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleBulkAction(action)}
                        disabled={action.disabled?.(selectedItems)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 shadow-sm transition-colors ${
                          action.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                          action.variant === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                          action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                          'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedItems([])}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 font-medium"
                    >
                      {t('clearSelection')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
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

            {/* Listings Display */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MdDirectionsCar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('noListingsFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all'
                    ? t('tryAdjustingSearch')
                    : t('noListingsAvailable')}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4"
                : "space-y-0 mt-4"
              }>
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    viewMode={viewMode}
                    isSelected={selectedItems.includes(listing.id)}
                    onSelect={() => toggleSelection(listing.id)}
                    allowSelection={allowSelection}
                    actions={actions}
                    processing={processing}
                    getImageUrl={getImageUrl}
                    formatMileage={formatMileage}
                    getLocationDisplay={getLocationDisplay}
                    getStatusBadge={getStatusBadge}
                    renderCustomActions={renderCustomActions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showBulkConfirmModal}
          onClose={cancelBulkAction}
          onConfirm={confirmBulkAction}
          title={currentBulkAction?.label || 'Confirm Action'}
          message={`Are you sure you want to ${currentBulkAction?.label.toLowerCase()} ${selectedItems.length} listing${selectedItems.length > 1 ? 's' : ''}?`}
          confirmText={currentBulkAction?.label || 'Confirm'}
          cancelText="Cancel"
          type={currentBulkAction?.variant === 'danger' ? 'danger' : 'warning'}
        />
      </div>
    </div>
  );
}

// Individual listing card component
interface ListingCardProps {
  listing: CommonListing;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  allowSelection: boolean;
  actions: ListingAction[];
  processing?: (string | number)[] | number | null;
  getImageUrl: (listing: CommonListing) => string | null;
  formatMileage: (mileage: number) => string;
  getLocationDisplay: (listing: CommonListing) => string;
  getStatusBadge: (listing: CommonListing) => React.ReactNode;
  renderCustomActions?: (listing: CommonListing) => React.ReactNode;
}

function ListingCard({
  listing,
  viewMode,
  isSelected,
  onSelect,
  allowSelection,
  actions,
  processing,
  getImageUrl,
  formatMileage,
  getLocationDisplay,
  getStatusBadge,
  renderCustomActions
}: ListingCardProps) {
  const imageUrl = getImageUrl(listing);
  const isProcessing = Array.isArray(processing)
    ? processing.includes(listing.id)
    : processing === listing.id;

  const cardContent = (
    <>
      {viewMode === 'grid' ? (
        // Grid view
        <>
          {/* Image */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
            {imageUrl ? (
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
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MdDirectionsCar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Selection checkbox for grid */}
            {allowSelection && (
              <div className="absolute top-2 left-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="p-1 bg-white/80 backdrop-blur-sm rounded-md hover:bg-white transition-colors"
                >
                  {isSelected ? (
                    <MdCheckBox className="w-5 h-5 text-blue-600" />
                  ) : (
                    <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            )}

            {/* Status overlay for grid */}
            {!listing.approved && listing.status !== 'approved' && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg">
                  <MdPendingActions className="w-3 h-3" />
                  <span className="hidden sm:inline">Review</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem] mb-2">
                {listing.title}
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {typeof listing.make === 'string'
                  ? listing.make
                  : listing.make?.displayNameEn || 'N/A'} {' '}
                {typeof listing.model === 'string'
                  ? listing.model
                  : listing.model?.displayNameEn || 'N/A'} {' '}
                {listing.year && `• ${listing.year}`}
              </div>
            </div>

            {/* Info chips for grid */}
            <div className="flex flex-wrap gap-1 mb-3">
              <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                <MdSpeed className="w-3 h-3" />
                {formatMileage(listing.mileage)}
              </div>
              <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                <MdLocationOn className="w-3 h-3" />
                <span className="truncate max-w-16">{getLocationDisplay(listing)}</span>
              </div>
              {listing.views !== undefined && (
                <div className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                  <MdRemoveRedEye className="w-3 h-3" />
                  {listing.views}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${formatNumber(listing.price, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div>
                {getStatusBadge(listing)}
              </div>
            </div>

            {/* Actions for grid - Always show available actions */}
            {(actions.length > 0 || renderCustomActions) && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                  {actions
                    .filter(action => action.visible ? action.visible(listing) : true)
                    .slice(0, 2) // Limit to 2 actions in grid view
                    .map((action) => (
                      <button
                        key={action.id}
                        onClick={() => action.onClick(listing)}
                        disabled={action.disabled?.(listing) || isProcessing}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-md disabled:opacity-50 ${
                          action.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                          action.variant === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                          action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                          'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {isProcessing ? '...' : action.label}
                      </button>
                    ))}
                  {renderCustomActions?.(listing)}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // List view
        <div className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Selection checkbox */}
              {allowSelection && (
                <div className="flex-shrink-0">
                  <button
                    onClick={onSelect}
                    className="p-1 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isSelected ? (
                      <MdCheckBox className="w-5 h-5 text-blue-600" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Car Image */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-18 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm">
                  {imageUrl ? (
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
                  )}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {listing.title}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {typeof listing.make === 'string'
                    ? listing.make
                    : listing.make?.displayNameEn || 'N/A'} {' '}
                  {typeof listing.model === 'string'
                    ? listing.model
                    : listing.model?.displayNameEn || 'N/A'} {' '}
                  {listing.year && `• ${listing.year}`}
                </div>

                {/* Info Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                    <MdSpeed className="w-3 h-3" />
                    {formatMileage(listing.mileage)}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md text-xs font-medium">
                    <MdLocationOn className="w-3 h-3" />
                    <span className="truncate max-w-20">{getLocationDisplay(listing)}</span>
                  </div>
                  {listing.views !== undefined && (
                    <div className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs font-medium">
                      <MdRemoveRedEye className="w-3 h-3" />
                      {listing.views}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Status */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ${formatNumber(listing.price, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="mt-1">
                  {getStatusBadge(listing)}
                </div>
              </div>

              {/* Actions - Always show available actions */}
              {(actions.length > 0 || renderCustomActions) && (
                <div className="flex-shrink-0">
                  <div className="flex gap-2">
                    {actions
                      .filter(action => action.visible ? action.visible(listing) : true)
                      .map((action) => (
                        <button
                          key={action.id}
                          onClick={() => action.onClick(listing)}
                          disabled={action.disabled?.(listing) || isProcessing}
                          className={`px-3 py-1.5 text-sm rounded-md disabled:opacity-50 ${
                            action.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                            action.variant === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                            'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {isProcessing ? '...' : action.label}
                        </button>
                      ))}
                    {renderCustomActions?.(listing)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return viewMode === 'grid' ? (
    <div className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg overflow-hidden relative ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
    }`}>
      {cardContent}
    </div>
  ) : (
    <>{cardContent}</>
  );
}
