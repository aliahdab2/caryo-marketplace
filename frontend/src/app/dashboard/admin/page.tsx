"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCheckCircle, MdCancel, MdPendingActions, MdRefresh } from 'react-icons/md';
import { getAuthHeaders, isAdmin } from '@/utils/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/components/ui/ToastProvider';

interface Listing {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  approved: boolean;
  userId: number;
  username?: string;
  createdAt: string;
  imageUrls?: string[];
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

  const fetchPendingListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
      setListings(Array.isArray(data.content) ? data.content : []);
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

  const approveListing = useCallback(async (listingId: number) => {
    try {
      setProcessing(listingId);
      setError(null);

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
      setListings(
        listings.map(listing => 
          listing.id === listingId 
            ? { ...listing, approved: true }
            : listing
        )
      );

      // Show success toast
      showSuccess(t('admin.listingApproved', 'Listing approved successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve listing';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error approving listing:', err);
    } finally {
      setProcessing(null);
    }
  }, [setProcessing, setError, setListings, listings, showSuccess, showError, t]);

  const rejectListing = useCallback(async (listingId: number) => {
    try {
      setProcessing(listingId);
      setError(null);

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      // Call the backend reject endpoint
      const response = await fetch(`http://localhost:8080/api/listings/admin/${listingId}/reject`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Rejected by admin'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to reject listing: ${response.statusText}`);
      }

      // Remove the listing from the local state since it's been deleted
      setListings(listings.filter(listing => listing.id !== listingId));
      
      // Show success toast
      showSuccess(t('admin.listingRejected', 'Listing rejected successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject listing';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error rejecting listing:', err);
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
        />
        <StatCard
          icon={<MdCheckCircle className="text-2xl text-green-600" />}
          title={t('admin.approvedListings', 'Approved Listings')}
          value={approvedListings.length}
          color="green"
        />
        <StatCard
          icon={<MdPendingActions className="text-2xl text-blue-600" />}
          title={t('admin.totalListings', 'Total Listings')}
          value={listings.length}
          color="blue"
        />
      </div>

      {/* Error Display */}
      {error && (
        <ErrorAlert message={error} />
      )}

      {/* Pending Listings Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MdPendingActions className="text-yellow-600" />
          {t('admin.pendingApproval', 'Pending Approval')} ({pendingListings.length})
        </h2>
        
        {loading ? (
          <LoadingSpinner message={t('admin.loading', 'Loading...')} />
        ) : pendingListings.length === 0 ? (
          <EmptyState 
            icon={<MdCheckCircle className="text-4xl text-gray-400 mx-auto mb-2" />}
            message={t('admin.noPendingListings', 'No pending listings to review')}
          />
        ) : (
          <div className="space-y-4">
            {pendingListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onApprove={() => approveListing(listing.id)}
                onReject={() => rejectListing(listing.id)}
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
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-600 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-600 text-blue-800'
  };

  return (
    <div className={`${colorClasses[color].split(' ').slice(0, 2).join(' ')} p-4 rounded-lg border`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className={`text-sm font-medium ${colorClasses[color].split(' ')[2]}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[3]}`}>{value}</p>
        </div>
      </div>
    </div>
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
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}

function ListingCard({ listing, onApprove, onReject, processing, t }: ListingCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {listing.title}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">{t('admin.makeModel', 'Make/Model')}:</span><br />
              {listing.make} {listing.model}
            </div>
            <div>
              <span className="font-medium">{t('admin.year', 'Year')}:</span><br />
              {listing.year}
            </div>
            <div>
              <span className="font-medium">{t('admin.price', 'Price')}:</span><br />
              ${listing.price?.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">{t('admin.mileage', 'Mileage')}:</span><br />
              {listing.mileage?.toLocaleString()} km
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mb-4">
            <span className="font-medium">{t('admin.listingId', 'Listing ID')}:</span> {listing.id} | 
            <span className="font-medium ml-2">{t('admin.userId', 'User ID')}:</span> {listing.userId} |
            <span className="font-medium ml-2">{t('admin.createdAt', 'Created')}:</span> {new Date(listing.createdAt).toLocaleDateString()}
          </div>
          
          {listing.imageUrls && listing.imageUrls.length > 0 && (
            <ImagePreview images={listing.imageUrls} title={listing.title} />
          )}
        </div>
        
        <ActionButtons
          onApprove={onApprove}
          onReject={onReject}
          processing={processing}
          t={t}
        />
      </div>
    </div>
  );
}

interface ImagePreviewProps {
  images: string[];
  title: string;
}

function ImagePreview({ images, title }: ImagePreviewProps) {
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

interface ActionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}

function ActionButtons({ onApprove, onReject, processing, t }: ActionButtonsProps) {
  return (
    <div className="flex gap-2 ml-4">
      <button
        onClick={onApprove}
        disabled={processing}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label={processing ? t('admin.approving', 'Approving...') : t('admin.approve', 'Approve')}
      >
        <MdCheckCircle className="text-lg" />
        {processing ? t('admin.approving', 'Approving...') : t('admin.approve', 'Approve')}
      </button>
      <button
        onClick={onReject}
        disabled={processing}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label={t('admin.reject', 'Reject')}
      >
        <MdCancel className="text-lg" />
        {t('admin.reject', 'Reject')}
      </button>
    </div>
  );
}
