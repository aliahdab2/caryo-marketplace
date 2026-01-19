'use client';

// Disable static generation for this page since it uses session data
export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserBlockResponse } from '@/services/userBlock';
import { useBlockedUsers, useUnblockUser } from '@/hooks/queries/useBlockedUsers';
import { QueryWrapper } from '@/components/common/QueryWrapper';
import EmptyState from '@/components/ui/EmptyState';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import Toast from '@/components/ui/Toast';
import { UserX } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function BlockedUsersPage() {
  const { t } = useTranslation(['common', 'blocked-users']);
  const [userToUnblock, setUserToUnblock] = useState<UserBlockResponse | null>(null);
  
  // React Query hooks
  const blockedUsersQuery = useBlockedUsers();
  const unblockMutation = useUnblockUser();
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const handleUnblock = (user: UserBlockResponse) => {
    setUserToUnblock(user);
  };

  const confirmUnblock = async () => {
    if (!userToUnblock) return;

    try {
      await unblockMutation.mutateAsync(userToUnblock.blocked.id);
      
      setUserToUnblock(null);
      
      showToast(
        t('blocked-users:unblockSuccess', 'User unblocked successfully', { username: userToUnblock.blocked.username }),
        'success'
      );
    } catch (err) {
      const error = err as { message?: string };
      const errorMessage = error?.message || t('blocked-users:unblockError', 'Failed to unblock user. Please try again.');
      console.error('Error unblocking user:', err);
      showToast(errorMessage, 'error');
    }
  };

  const cancelUnblock = () => {
    setUserToUnblock(null);
  };

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
                label: 'Blocked Users',
                translationKey: 'title',
                translationNamespace: 'blocked-users'
              }
            ]}
          />
        </div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {t('blocked-users:title', 'Blocked Users')}
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('blocked-users:description', 'Manage users you have blocked. Blocked users cannot contact you or see your listings.')}
        </p>

        {/* Blocked Users List */}
        <QueryWrapper
          query={blockedUsersQuery}
          loadingVariant="list"
          emptyComponent={
            <EmptyState
              title={t('blocked-users:emptyTitle', 'No Blocked Users')}
              message={t('blocked-users:emptyDescription', 'You have not blocked any users. Blocked users cannot contact you or see your listings.')}
            />
          }
        >
          {(blockedUsers) => (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {blockedUsers.map((userBlock) => (
                  <div
                    key={userBlock.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <UserX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {userBlock.blocked.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('blocked-users:blockedOn', 'Blocked on')} {new Date(userBlock.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(userBlock)}
                        disabled={unblockMutation.isPending}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {t('blocked-users:unblock', 'Unblock')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </QueryWrapper>

        {/* Unblock Confirmation Modal */}
        {userToUnblock && (
          <DeleteConfirmationModal
            isOpen={!!userToUnblock}
            onClose={cancelUnblock}
            onConfirm={confirmUnblock}
            title={t('blocked-users:unblockConfirmTitle', 'Unblock User')}
            message={t('blocked-users:unblockConfirmMessage', `Are you sure you want to unblock ${userToUnblock.blocked.username}? They will be able to contact you again.`, { username: userToUnblock.blocked.username })}
            confirmText={t('blocked-users:unblock', 'Unblock')}
            cancelText={t('common:cancel', 'Cancel')}
            type="warning"
            isLoading={unblockMutation.isPending}
          />
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

