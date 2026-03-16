'use client';

// Disable static generation for this page since it uses session data
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Flag, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface UserReportResponse {
  id: number;
  reporterId: number;
  reporterUsername: string;
  reportedUserId: number;
  reportedUserUsername: string;
  conversationId?: number;
  listingId?: number;
  listingTitle?: string;
  reportType: string;
  reportTypeDisplay?: string;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedByUsername?: string;
}

interface PaginatedReportsResponse {
  content: UserReportResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export default function AdminReportsPage() {
  const { t } = useTranslation(['common', 'admin-reports']);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<UserReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('PENDING');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Selected report for actions
  const [selectedReport, setSelectedReport] = useState<UserReportResponse | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'review' | 'resolve' | 'dismiss' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRoles = (session.user as { roles?: string[] }).roles || [];
      if (!userRoles.includes('ROLE_ADMIN')) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
        sortBy: 'createdAt',
        sortDir: 'desc'
      });

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/admin/reports?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data: PaginatedReportsResponse = await response.json();
      setReports(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
      showToast(t('admin-reports:loadError', 'Failed to load reports. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, session, showToast, t]);

  useEffect(() => {
    if (mounted && session) {
      loadReports();
    }
  }, [mounted, session, loadReports]);

  const handleAction = async (report: UserReportResponse, action: 'review' | 'resolve' | 'dismiss') => {
    setSelectedReport(report);
    setActionType(action);
    setActionNotes('');
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (!selectedReport || !actionType) return;

    try {
      setIsSubmitting(true);

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/admin/reports/${selectedReport.id}/${actionType}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes: actionNotes }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} report`);
      }

      const successKey = actionType === 'resolve' ? 'resolveSuccess' : actionType === 'dismiss' ? 'dismissSuccess' : 'reviewSuccess';
      showToast(t(`admin-reports:${successKey}`, `Report ${actionType}d successfully`), 'success');
      setShowActionModal(false);
      setSelectedReport(null);
      setActionType(null);
      setActionNotes('');
      
      // Reload reports
      await loadReports();
    } catch (err) {
      console.error(`Error ${actionType}ing report:`, err);
      showToast(t('admin-reports:actionError', 'Failed to update report. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to translate status text
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: t('admin-reports:statusPending', 'Pending'),
      REVIEWED: t('admin-reports:statusReviewed', 'Reviewed'),
      RESOLVED: t('admin-reports:statusResolved', 'Resolved'),
      DISMISSED: t('admin-reports:statusDismissed', 'Dismissed'),
      ALL: t('admin-reports:filterAll', 'All Reports')
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
      PENDING: {
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        label: getStatusText('PENDING')
      },
      REVIEWED: {
        icon: <Eye className="w-4 h-4" />,
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        label: getStatusText('REVIEWED')
      },
      RESOLVED: {
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        label: getStatusText('RESOLVED')
      },
      DISMISSED: {
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-gray-100 dark:bg-gray-700/30',
        text: 'text-gray-800 dark:text-gray-200',
        label: getStatusText('DISMISSED')
      }
    };

    const config = configs[status] || configs.PENDING;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'SPAM':
        return '🗑️';
      case 'HARASSMENT':
        return '⚠️';
      case 'SCAM':
        return '🚨';
      case 'INAPPROPRIATE_CONTENT':
        return '🔞';
      case 'FAKE_LISTING':
        return '🎭';
      default:
        return '🚩';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: t('dashboard:dashboard', 'Dashboard'), href: '/dashboard' },
            { label: t('admin-reports:title', 'Reports Management'), href: '/dashboard/admin/reports' }
          ]}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Flag className="w-8 h-8 text-red-600 dark:text-red-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin-reports:title', 'Reports Management')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {t('admin-reports:description', 'Review user reports and take appropriate actions. You can resolve, dismiss, or review reports submitted by users.')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">{t('admin-reports:filterPending', 'Pending')}</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                {reports.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('admin-reports:filterReviewed', 'Reviewed')}</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {reports.filter(r => r.status === 'REVIEWED').length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">{t('admin-reports:filterResolved', 'Resolved')}</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {reports.filter(r => r.status === 'RESOLVED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{t('admin-reports:totalLabel', 'Total')}</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                {totalElements}
              </p>
            </div>
            <Flag className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {getStatusText(status)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('common:loading', 'Loading...')}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Reports List */}
      {!isLoading && !error && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-3xl">{getReportTypeIcon(report.reportType)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('admin-reports:reportLabel', 'Report #')}{report.id}
                      </h3>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('admin-reports:reporter', 'Reporter')}:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {report.reporterUsername}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('admin-reports:reportedUserLabel', 'Reported User')}:</span>
                        <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                          {report.reportedUserUsername}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('admin-reports:typeLabel', 'Type')}:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {report.reportTypeDisplay || report.reportType}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('admin-reports:dateLabel', 'Date')}:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{t('admin-reports:reasonLabel', 'Reason')}:</strong> {report.reason}
                      </p>
                    </div>

                    {report.listingTitle && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{t('admin-reports:relatedListing', 'Related Listing')}:</span>
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          {report.listingTitle}
                        </span>
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>{t('admin-reports:adminNotes', 'Admin Notes')}:</strong> {report.adminNotes}
                        </p>
                      </div>
                    )}

                    {report.resolvedAt && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('admin-reports:resolvedBy', 'Resolved by')} {report.resolvedByUsername} {t('common:on', 'on')} {new Date(report.resolvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {report.status === 'PENDING' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleAction(report, 'review')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('admin-reports:markReviewed', 'Mark as Reviewed')}
                  </button>
                  <button
                    onClick={() => handleAction(report, 'resolve')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('admin-reports:resolve', 'Resolve')}
                  </button>
                  <button
                    onClick={() => handleAction(report, 'dismiss')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('admin-reports:dismiss', 'Dismiss')}
                  </button>
                </div>
              )}

              {report.status === 'REVIEWED' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleAction(report, 'resolve')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('admin-reports:resolve', 'Resolve')}
                  </button>
                  <button
                    onClick={() => handleAction(report, 'dismiss')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('admin-reports:dismiss', 'Dismiss')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && reports.length === 0 && (
        <EmptyState
          type="general"
          title={t('admin-reports:noReports', 'No reports found')}
          message={
            statusFilter === 'ALL'
              ? t('admin-reports:noReportsYet', 'No reports have been submitted yet.')
              : t('admin-reports:noReportsWithStatus', 'No reports with status: {{status}}', { status: getStatusText(statusFilter) })
          }
        />
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('admin-reports:previous', 'Previous')}
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            {t('admin-reports:pageOf', 'Page {{current}} of {{total}}', { current: page + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('admin-reports:next', 'Next')}
          </button>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedReport && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {actionType === 'review' && t('admin-reports:markReviewed', 'Mark as Reviewed')}
              {actionType === 'resolve' && t('admin-reports:resolve', 'Resolve') + ' ' + t('admin-reports:reportLabel', 'Report #').replace('#', '')}
              {actionType === 'dismiss' && t('admin-reports:dismiss', 'Dismiss') + ' ' + t('admin-reports:reportLabel', 'Report #').replace('#', '')}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('admin-reports:reportLabel', 'Report #')}{selectedReport.id} - {selectedReport.reportedUserUsername}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin-reports:adminNotesOptional', 'Admin Notes (Optional)')}
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder={t('admin-reports:addNotesPlaceholder', 'Add notes about your decision...')}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={submitAction}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('admin-reports:processing', 'Processing...') : t('admin-reports:confirm', 'Confirm')}
              </button>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedReport(null);
                  setActionType(null);
                  setActionNotes('');
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                {t('admin-reports:cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}


