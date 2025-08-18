"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCheckCircle, MdCancel, MdPendingActions, MdRefresh } from 'react-icons/md';
import { getAuthHeaders, isAdmin } from '@/utils/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import Link from 'next/link';
import { MdMoreVert, MdVisibility, MdVisibilityOff, MdPause, MdPlayArrow, MdSell, MdArchive, MdUnarchive, MdFlag } from 'react-icons/md';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';

// Status utility functions
const getListingStatus = (listing: Listing): string => {
  if (listing.hiddenByAdmin) return 'HIDDEN';
  if (listing.status) return listing.status;
  if (listing.approved) return 'APPROVED';
  return 'PENDING';
};

const getStatusBadge = (status: string, t: ReturnType<typeof useTranslation>['t']) => {
  const badges = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: t('admin:pending', 'Pending') },
    APPROVED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: t('admin:approved', 'Approved') },
    REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: t('admin:rejected', 'Rejected') },
    HIDDEN: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: t('admin:hidden', 'Hidden') },
    PENDING_CHANGES: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: t('admin:pendingChanges', 'Pending Changes') }
  };
  return badges[status as keyof typeof badges] || badges.PENDING;
};

const getAvailableActions = (listing: Listing) => {
  const status = getListingStatus(listing);
  const actions = [];

  switch (status) {
    case 'PENDING':
      actions.push('approve', 'reject', 'hide', 'request_changes');
      break;
    case 'APPROVED':
      actions.push('hide', 'pause', 'mark_sold', 'archive', 'request_changes');
      if (listing.isUserActive === false) actions.push('resume');
      if (listing.isSold) actions.push('unmark_sold');
      if (listing.isArchived) actions.push('unarchive');
      break;
    case 'REJECTED':
      actions.push('approve', 'hide');
      break;
    case 'HIDDEN':
      actions.push('unhide');
      break;
    case 'PENDING_CHANGES':
      actions.push('approve', 'reject', 'hide');
      break;
  }

  return actions;
};

// Action Menu Component
interface ActionMenuProps {
  listing: Listing;
  onAction: (action: string, listing: Listing, reason?: string) => void;
  processing: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}

function ActionMenu({ listing, onAction, processing, t }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: string; listing: Listing } | null>(null);
  const [reason, setReason] = useState('');
  
  const actions = getAvailableActions(listing);
  
  const actionConfig = {
    approve: { icon: MdCheckCircle, label: t('admin:approve', 'Approve'), color: 'text-green-600', requiresReason: false },
    reject: { icon: MdCancel, label: t('admin:reject', 'Reject'), color: 'text-red-600', requiresReason: true },
    hide: { icon: MdVisibilityOff, label: t('admin:hide', 'Hide'), color: 'text-gray-600', requiresReason: false },
    unhide: { icon: MdVisibility, label: t('admin:unhide', 'Unhide'), color: 'text-green-600', requiresReason: false },
    pause: { icon: MdPause, label: t('admin:pause', 'Pause'), color: 'text-orange-600', requiresReason: false },
    resume: { icon: MdPlayArrow, label: t('admin:resume', 'Resume'), color: 'text-green-600', requiresReason: false },
    mark_sold: { icon: MdSell, label: t('admin:markSold', 'Mark as Sold'), color: 'text-blue-600', requiresReason: false },
    unmark_sold: { icon: MdSell, label: t('admin:unmarkSold', 'Unmark as Sold'), color: 'text-blue-600', requiresReason: false },
    archive: { icon: MdArchive, label: t('admin:archive', 'Archive'), color: 'text-gray-600', requiresReason: false },
    unarchive: { icon: MdUnarchive, label: t('admin:unarchive', 'Unarchive'), color: 'text-green-600', requiresReason: false },
    request_changes: { icon: MdFlag, label: t('admin:requestChanges', 'Request Changes'), color: 'text-orange-600', requiresReason: true }
  };

  const handleActionClick = (action: string) => {
    setIsOpen(false);
    const config = actionConfig[action as keyof typeof actionConfig];
    if (config?.requiresReason) {
      setConfirmAction({ action, listing });
      setReason('');
    } else {
      onAction(action, listing);
    }
  };

  const handleConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction.action, confirmAction.listing, reason);
      setConfirmAction(null);
      setReason('');
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={processing}
          className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200 disabled:opacity-50"
          title={t('admin:moreActions', 'More actions')}
        >
          <MdMoreVert size={18} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
            <div className="py-1">
              {actions.map((action) => {
                const config = actionConfig[action as keyof typeof actionConfig];
                if (!config) return null;
                
                const Icon = config.icon;
                return (
                  <button
                    key={action}
                    onClick={() => handleActionClick(action)}
                    disabled={processing}
                    className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 ${config.color}`}
                  >
                    <Icon size={16} className="mr-3" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin:confirmAction', 'Confirm Action')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('admin:confirmActionDesc', 'Please provide a reason for this action:')}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin:reasonPlaceholder', 'Enter reason...')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
              required
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                {t('common:cancel', 'Cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common:confirm', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface BrandLike {
  displayNameEn?: string;
  displayNameAr?: string;
  name?: string;
}

interface ModelLike {
  displayNameEn?: string;
  displayNameAr?: string;
  name?: string;
  id?: number;
}

interface Listing {
  id: number;
  title: string;
  // Backend may return either denormalized strings or nested objects
  make?: string;
  model?: string | ModelLike;
  brand?: BrandLike;
  brandNameEn?: string;
  brandNameAr?: string;
  modelNameEn?: string;
  modelNameAr?: string;
  year: number;
  price: number;
  mileage: number;
  approved: boolean;
  userId: number;
  username?: string;
  createdAt: string;
  imageUrls?: string[];
  media?: Array<{ url?: string; fileKey?: string; isPrimary?: boolean; contentType?: string }>;
  governorateDetails?: { displayNameEn?: string; displayNameAr?: string };
  locationDetails?: { displayNameEn?: string; displayNameAr?: string };
  sellerUsername?: string;
  thumbnailUrl?: string;
  // Extended status fields for comprehensive admin management
  hiddenByAdmin?: boolean;
  isUserActive?: boolean;
  isSold?: boolean;
  isArchived?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_CHANGES' | 'HIDDEN';
  rejectionReason?: string;
  adminNotes?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface AdminPanelState {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  processing: number | null;
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
    processing: null
  });

  // Memoized computed values
  const computedValues = useMemo(() => {
    const safeListings = Array.isArray(state.listings) ? state.listings : [];
    return {
      pendingListings: safeListings.filter(listing => !listing.approved),
      approvedListings: safeListings.filter(listing => listing.approved),
      totalListings: safeListings.length
    };
  }, [state.listings]);

  const updateState = useCallback((updates: Partial<AdminPanelState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setListings = useCallback((listings: Listing[]) => {
    updateState({ listings: Array.isArray(listings) ? listings : [] });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const setProcessing = useCallback((processing: number | null) => {
    updateState({ processing });
  }, [updateState]);

  return {
    state,
    computedValues,
    setListings,
    setLoading,
    setError,
    setProcessing,
    showSuccess,
    showError,
    t,
    router
  };
};

export default function AdminPanel() {
  const {
    state: { listings, loading, error, processing },
    computedValues: { pendingListings, approvedListings },
    setListings,
    setLoading,
    setError,
    setProcessing,
    showSuccess,
    showError,
    t,
    router
  } = useAdminPanel();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusView, setStatusView] = useState<'pending' | 'approved' | 'all'>('pending');

  const filtered = useMemo(() => {
    const safe = Array.isArray(listings) ? listings : [];
    const byStatus = statusView === 'all'
      ? safe
      : statusView === 'pending'
        ? safe.filter(l => !l.approved)
        : safe.filter(l => l.approved);
    if (!searchTerm.trim()) return byStatus;
    const q = searchTerm.trim().toLowerCase();
    return byStatus.filter(l => {
      const title = (l.title || '').toLowerCase();
      const make = (l.brandNameEn || l.make || '').toLowerCase();
      const model = (typeof l.model === 'string' ? l.model : (l.modelNameEn || ''))?.toLowerCase();
      return title.includes(q) || make.includes(q) || model.includes(q);
    });
  }, [listings, searchTerm, statusView]);

  const fetchPendingListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      // Fetch all listings to show admin status
      const response = await fetch('http://localhost:8080/api/admin/listings?page=0&size=100', {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      const raw = Array.isArray(data.content) ? data.content : [];
      const normalized: Listing[] = raw.map((item: Listing) => {
        const media = Array.isArray(item.media) ? item.media : [];
        const primary = media.find(m => m.isPrimary) || media[0];
        const urlCandidate = primary?.url || primary?.fileKey || (item.imageUrls && item.imageUrls[0]) || '';
        const thumbnailUrl = transformMinioUrl(urlCandidate) || getDefaultImageUrl();
        return { ...item, thumbnailUrl } as Listing;
      });
      setListings(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setListings]);

  // Check if user is admin on mount
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
    fetchPendingListings();
  }, [router, fetchPendingListings]);

  const handleAction = useCallback(async (action: string, listing: Listing, reason?: string) => {
    try {
      setProcessing(listing.id);
      setError(null);

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      let endpoint = '';
      const method = 'PUT';
      let body: Record<string, unknown> = {};

      switch (action) {
        case 'approve':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/approve`;
          break;
        case 'reject':
          endpoint = `http://localhost:8080/api/listings/admin/${listing.id}/reject`;
          body = { reason: reason || 'Rejected by admin' };
          break;
        case 'hide':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/hide`;
          body = { reason: reason || 'Hidden by admin' };
          break;
        case 'unhide':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/unhide`;
          break;
        case 'pause':
          endpoint = `http://localhost:8080/api/listings/${listing.id}/pause`;
          break;
        case 'resume':
          endpoint = `http://localhost:8080/api/listings/${listing.id}/resume`;
          break;
        case 'mark_sold':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/mark-sold`;
          break;
        case 'unmark_sold':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/unmark-sold`;
          break;
        case 'archive':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/archive`;
          break;
        case 'unarchive':
          endpoint = `http://localhost:8080/api/admin/listings/${listing.id}/unarchive`;
          break;
        case 'request_changes':
          // Reuse reject endpoint with a different default reason until a dedicated endpoint exists
          endpoint = `http://localhost:8080/api/listings/admin/${listing.id}/reject`;
          body = { reason: reason || 'Changes requested by admin' };
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} listing: ${response.statusText}`);
      }

      // Update local state based on action
      if (action === 'reject') {
        // Remove rejected listings from view
        setListings(listings.filter(l => l.id !== listing.id));
      } else {
        // Update listing properties based on action
        setListings(listings.map(l => {
          if (l.id !== listing.id) return l;
          
          const updated = { ...l };
          switch (action) {
            case 'approve':
              updated.approved = true;
              updated.status = 'APPROVED';
              break;
            case 'hide':
              updated.hiddenByAdmin = true;
              updated.status = 'HIDDEN';
              break;
            case 'unhide':
              updated.hiddenByAdmin = false;
              updated.status = updated.approved ? 'APPROVED' : 'PENDING';
              break;
            case 'pause':
              updated.isUserActive = false;
              break;
            case 'resume':
              updated.isUserActive = true;
              break;
            case 'mark_sold':
              updated.isSold = true;
              break;
            case 'unmark_sold':
              updated.isSold = false;
              break;
            case 'archive':
              updated.isArchived = true;
              break;
            case 'unarchive':
              updated.isArchived = false;
              break;
            case 'request_changes':
              updated.status = 'PENDING_CHANGES';
              updated.approved = false;
              break;
          }
          return updated;
        }));
      }

      // Show success toast
      const actionLabels = {
        approve: t('admin:approved', 'approved'),
        reject: t('admin:rejected', 'rejected'),
        hide: t('admin:hidden', 'hidden'),
        unhide: t('admin:unhidden', 'unhidden'),
        pause: t('admin:paused', 'paused'),
        resume: t('admin:resumed', 'resumed'),
        mark_sold: t('admin:markedSold', 'marked as sold'),
        unmark_sold: t('admin:unmarkedSold', 'unmarked as sold'),
        archive: t('admin:archived', 'archived'),
        unarchive: t('admin:unarchived', 'unarchived'),
        request_changes: t('admin:changesRequested', 'changes requested')
      };
      
      showSuccess(t('admin:actionSuccess', `Listing ${actionLabels[action as keyof typeof actionLabels]} successfully`));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} listing`;
      setError(errorMessage);
      showError(errorMessage);
      console.error(`Error ${action} listing:`, err);
    } finally {
      setProcessing(null);
    }
  }, [setProcessing, setError, setListings, listings, showSuccess, showError, t]);



  if (!isAdmin()) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {t('admin.accessDenied', 'Access Denied')}
        </h1>
        <p className="text-gray-600">
          {t('admin.adminOnly', 'This page is only accessible to administrators.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.title', 'Admin Panel')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('admin.subtitle', 'Manage listings and user content')}
          </p>
        </div>
        <button
          onClick={fetchPendingListings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <MdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          {t('admin.refresh', 'Refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<MdPendingActions className="text-2xl text-yellow-600" />}
          title={t('admin.pendingListings', 'Pending Listings')}
          value={pendingListings.length}
          color="yellow"
          isActive={statusView === 'pending'}
          onClick={() => setStatusView('pending')}
        />
        <StatCard
          icon={<MdCheckCircle className="text-2xl text-green-600" />}
          title={t('admin.approvedListings', 'Approved Listings')}
          value={approvedListings.length}
          color="green"
          isActive={statusView === 'approved'}
          onClick={() => setStatusView('approved')}
        />
        <StatCard
          icon={<MdPendingActions className="text-2xl text-blue-600" />}
          title={t('admin.totalListings', 'Total Listings')}
          value={listings.length}
          color="blue"
          isActive={statusView === 'all'}
          onClick={() => setStatusView('all')}
        />
      </div>

      {/* Search Only */}
      <div className="flex justify-end">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('listings:searchPlaceholder', 'Search listings...')}
            className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorAlert message={error} />
      )}

      {/* Listings Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {statusView==='pending' && `${t('admin.pendingListings','Pending Listings')} (${filtered.length})`}
          {statusView==='approved' && `${t('admin.approvedListings','Approved Listings')} (${filtered.length})`}
          {statusView==='all' && `${t('admin.totalListings','Total Listings')} (${filtered.length})`}
        </h2>

        {loading ? (
          <LoadingSpinner message={t('admin.loading', 'Loading...')} />
        ) : filtered.length === 0 ? (
          <EmptyState 
            icon={<MdCheckCircle className="text-4xl text-gray-400 mx-auto mb-2" />}
            message={statusView==='pending' ? t('admin.noPendingListings', 'No pending listings to review') : t('admin.noApprovedListings','No approved listings yet')}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onAction={handleAction}
                processing={processing === listing.id}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Improved components for better maintainability and reusability

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: 'yellow' | 'green' | 'blue';
  isActive: boolean;
  onClick: () => void;
}

function StatCard({ icon, title, value, color, isActive, onClick }: StatCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 text-yellow-800 hover:bg-yellow-100',
    green: 'bg-green-50 border-green-200 text-green-600 text-green-800 hover:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 text-blue-600 text-blue-800 hover:bg-blue-100'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color].split(' ').slice(0, 2).join(' ')} ${colorClasses[color].split(' ')[4]} p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer w-full ${
        isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="text-left">
          <p className={`text-sm font-medium ${colorClasses[color].split(' ')[2]}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[3]}`}>{value}</p>
        </div>
      </div>
    </button>
  );
}

interface ErrorAlertProps {
  message: string;
}

function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
      <p className="text-red-800">{message}</p>
    </div>
  );
}

interface LoadingSpinnerProps {
  message: string;
}

function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
}

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center">
      {icon}
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

interface ListingCardProps {
  listing: Listing;
  onAction: (action: string, listing: Listing, reason?: string) => void;
  processing: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}

function ListingCard({ listing, onAction, processing, t }: ListingCardProps) {
  const makeText = listing.brand?.displayNameEn || listing.brandNameEn || listing.make || '';
  const modelText = typeof listing.model === 'string'
    ? listing.model
    : (listing.model?.displayNameEn || listing.model?.name || listing.modelNameEn || '');
  const locationText = listing.locationDetails?.displayNameEn || listing.governorateDetails?.displayNameEn || '';
  const status = getListingStatus(listing);
  const statusBadge = getStatusBadge(status, t);
  const previewHref = listing.approved && !listing.hiddenByAdmin ? `/listings/${listing.id}` : `/dashboard/listings/preview/${listing.id}`;

  // Build thumbnail URL from media or imageUrls
  const thumbnailUrl = useMemo(() => {
    if (listing.media?.length) {
      const primaryMedia = listing.media.find(m => m.isPrimary) || listing.media[0];
      if (primaryMedia?.url) return transformMinioUrl(primaryMedia.url);
      if (primaryMedia?.fileKey) return transformMinioUrl(primaryMedia.fileKey);
    }
    if (listing.imageUrls?.length) {
      return transformMinioUrl(listing.imageUrls[0]);
    }
    return getDefaultImageUrl();
  }, [listing.media, listing.imageUrls]);

  // Get primary actions based on status
  const getPrimaryActions = () => {
    switch (status) {
      case 'PENDING':
        return [
          { action: 'approve', icon: MdCheckCircle, color: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20', title: t('admin:approve', 'Approve') },
          { action: 'reject', icon: MdCancel, color: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20', title: t('admin:reject', 'Reject') }
        ];
      case 'APPROVED':
        return listing.isUserActive === false 
          ? [{ action: 'resume', icon: MdPlayArrow, color: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20', title: t('admin:resume', 'Resume') }]
          : [{ action: 'pause', icon: MdPause, color: 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20', title: t('admin:pause', 'Pause') }];
      case 'HIDDEN':
        return [{ action: 'unhide', icon: MdVisibility, color: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20', title: t('admin:unhide', 'Unhide') }];
      case 'REJECTED':
        return [{ action: 'approve', icon: MdCheckCircle, color: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20', title: t('admin:approve', 'Approve') }];
      default:
        return [];
    }
  };

  const primaryActions = getPrimaryActions();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="flex">
        {/* Clickable content area */}
        <Link
          href={previewHref}
          className="flex-1 flex hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
        >
          {/* Thumbnail */}
          <div className="w-32 h-24 flex-shrink-0 relative">
            <Image
              src={thumbnailUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="128px"
            />
            {/* Status overlay */}
            {(listing.hiddenByAdmin || listing.isUserActive === false || listing.isSold) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {listing.hiddenByAdmin ? t('admin:hidden', 'Hidden') : 
                   listing.isUserActive === false ? t('admin:paused', 'Paused') : 
                   listing.isSold ? t('admin:sold', 'Sold') : ''}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {listing.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {makeText} {modelText} {listing.year}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>${listing.price?.toLocaleString()}</span>
                  <span>{listing.mileage?.toLocaleString()} km</span>
                  {locationText && <span>{locationText}</span>}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('admin:by', 'By')} {listing.username || listing.sellerUsername || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {listing.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                    <strong>{t('admin:rejectionReason', 'Rejection reason')}:</strong> {listing.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center space-x-1 p-4 border-l border-gray-200 dark:border-gray-700">
          {primaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => onAction(action.action, listing)}
                disabled={processing}
                className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 ${action.color}`}
                title={action.title}
              >
                <Icon size={18} />
              </button>
            );
          })}
          <ActionMenu
            listing={listing}
            onAction={onAction}
            processing={processing}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

interface ImagePreviewProps {
  images: string[];
  title: string;
}

function _ImagePreview({ images, title }: ImagePreviewProps) {
  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto">
        {images.slice(0, 3).map((url, index) => (
          <Image
            key={index}
            src={url}
            alt={`${title} - ${index + 1}`}
            width={80}
            height={80}
            className="w-20 h-20 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
          />
        ))}
        {images.length > 3 && (
          <div className="w-20 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
            +{images.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}


