'use client';

// Disable static generation for this page since it uses session data
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserReportService, UserReportResponse } from '@/services/userReport';
import EmptyState from '@/components/ui/EmptyState';
import Toast from '@/components/ui/Toast';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function MyReportsPage() {
  const { t } = useTranslation(['common', 'dashboard']);
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<UserReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await UserReportService.getMyReports(page, 20);
      setReports(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(t('dashboard:myReports.loadError', 'Failed to load reports. Please try again.'));
      showToast(t('dashboard:myReports.loadError', 'Failed to load reports. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, t, showToast]);

  useEffect(() => {
    if (mounted) {
      loadReports();
    }
  }, [mounted, page, loadReports]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        label: t('dashboard:myReports.status.pending', 'Pending')
      },
      REVIEWED: {
        icon: <Eye className="w-4 h-4" />,
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        label: t('dashboard:myReports.status.reviewed', 'Reviewed')
      },
      RESOLVED: {
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        label: t('dashboard:myReports.status.resolved', 'Resolved')
      },
      DISMISSED: {
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-200',
        label: t('dashboard:myReports.status.dismissed', 'Dismissed')
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      SPAM: t('dashboard:myReports.type.spam', 'Spam'),
      HARASSMENT: t('dashboard:myReports.type.harassment', 'Harassment'),
      SCAM: t('dashboard:myReports.type.scam', 'Scam'),
      FRAUD: t('dashboard:myReports.type.fraud', 'Fraud'),
      INAPPROPRIATE_CONTENT: t('dashboard:myReports.type.inappropriate', 'Inappropriate Content'),
      OTHER: t('dashboard:myReports.type.other', 'Other')
    };
    return types[type] || type;
  };

  const filteredReports = statusFilter === 'ALL' 
    ? reports 
    : reports.filter(r => r.status === statusFilter);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              {
                label: 'Dashboard',
                href: '/dashboard',
                translationKey: 'dashboard',
                translationNamespace: 'dashboard'
              },
              {
                label: 'My Reports',
                translationKey: 'myReports.title',
                translationNamespace: 'dashboard'
              }
            ]}
          />
        </div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {t('dashboard:myReports.title', 'My Reports')}
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('dashboard:myReports.description', 'Track the status of reports you have submitted.')}
        </p>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['ALL', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'ALL' 
                ? t('dashboard:myReports.filter.all', 'All')
                : getStatusBadge(status).props.children[1]}
              {status !== 'ALL' && (
                <span className="ml-2 text-xs opacity-75">
                  ({reports.filter(r => r.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        {!isLoading && totalElements > 0 && (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard:myReports.total', `Total: ${totalElements} report${totalElements !== 1 ? 's' : ''}`, { count: totalElements })}
          </div>
        )}

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
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Reports List */}
        {!isLoading && !error && filteredReports.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {t('dashboard:myReports.reportedUser', `Reported: ${report.reportedUserUsername}`, { username: report.reportedUserUsername })}
                        </h3>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">{t('dashboard:myReports.type.label', 'Type')}:</span>{' '}
                          {getReportTypeLabel(report.reportType)}
                        </p>
                        <p>
                          <span className="font-medium">{t('dashboard:myReports.reason', 'Reason')}:</span>{' '}
                          {report.reason}
                        </p>
                        <p>
                          <span className="font-medium">{t('dashboard:myReports.submitted', 'Submitted')}:</span>{' '}
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                        {report.resolvedAt && (
                          <p>
                            <span className="font-medium">{t('dashboard:myReports.resolved', 'Resolved')}:</span>{' '}
                            {new Date(report.resolvedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredReports.length === 0 && (
          <EmptyState
            title={
              statusFilter === 'ALL'
                ? t('dashboard:myReports.empty.title', 'No Reports')
                : t('dashboard:myReports.empty.filtered.title', 'No Reports with This Status')
            }
            message={
              statusFilter === 'ALL'
                ? t('dashboard:myReports.empty.description', 'You have not submitted any reports yet.')
                : t('dashboard:myReports.empty.filtered.description', 'You have no reports with this status.')
            }
          />
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common:previous', 'Previous')}
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              {t('common:page', `Page ${page + 1} of ${totalPages}`, { page: page + 1, total: totalPages })}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common:next', 'Next')}
            </button>
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
    </div>
  );
}

