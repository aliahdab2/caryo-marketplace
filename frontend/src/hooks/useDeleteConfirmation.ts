import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import type { 
  DeleteConfirmationState, 
  UseDeleteConfirmationOptions, 
  DeleteConfirmationModalProps 
} from '@/types/ui';

// Re-export types for backward compatibility
export type { 
  DeleteConfirmationState, 
  UseDeleteConfirmationOptions, 
  DeleteConfirmationModalProps 
};

export function useDeleteConfirmation({
  namespace = 'listings',
  onDelete,
  onBulkDelete,
  onSuccess,
  onError
}: UseDeleteConfirmationOptions = {}) {
  const { t } = useTranslation([namespace, 'common']);
  const { showSuccess, showError } = useToastHelpers();
  
  const [state, setState] = useState<DeleteConfirmationState>({
    isOpen: false,
    isLoading: false,
    type: 'single'
  });

  const openSingleDelete = useCallback((itemId: string, itemName?: string) => {
    setState({
      isOpen: true,
      isLoading: false,
      type: 'single',
      itemId,
      itemName
    });
  }, []);

  const openBulkDelete = useCallback((itemIds: string[], itemCount?: number) => {
    setState({
      isOpen: true,
      isLoading: false,
      type: 'bulk',
      itemIds,
      itemCount: itemCount || itemIds.length
    });
  }, []);

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!state.itemId && !state.itemIds) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (state.type === 'single' && state.itemId && onDelete) {
        await onDelete(state.itemId);
      } else if (state.type === 'bulk' && state.itemIds && onBulkDelete) {
        await onBulkDelete(state.itemIds);
      }

      setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
      
      // Show success toast
      const successMessage = state.type === 'single'
        ? t(`${namespace}:deleteSuccess`, 'Listing deleted successfully')
        : t(`${namespace}:bulkDeleteSuccess`, 'Listings deleted successfully');
      showSuccess(successMessage);
      
      onSuccess?.();
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Show error toast
      const errorMessage = t(`${namespace}:deleteError`, 'Failed to delete listing. Please try again.');
      showError(errorMessage);
      
      onError?.(error as Error);
    }
  }, [state, onDelete, onBulkDelete, onSuccess, onError, t, namespace, showSuccess, showError]);

  // Generate modal props
  const modalProps: DeleteConfirmationModalProps = {
    isOpen: state.isOpen,
    onClose: closeModal,
    onConfirm: confirmDelete,
    title: state.type === 'single' 
      ? t(`${namespace}:confirmDelete`, 'Delete Item?')
      : t(`${namespace}:confirmBulkDelete`, 'Delete Items?'),
    message: state.type === 'single'
      ? t(`${namespace}:confirmDeleteMessage`, 'This action cannot be undone.')
      : t(`${namespace}:confirmBulkDeleteMessage`, 'This action cannot be undone.'),
    itemName: state.type === 'single' 
      ? state.itemName
      : `${state.itemCount} ${state.itemCount === 1 ? t(`${namespace}:listing`, 'item') : t(`${namespace}:listings`, 'items')}`,
    isLoading: state.isLoading,
    loadingText: t('common:deleting', 'Deleting...'),
    confirmText: t('common:delete', 'Delete'),
    cancelText: t('common:cancel', 'Cancel'),
    type: 'danger'
  };

  return {
    openSingleDelete,
    openBulkDelete,
    closeModal,
    modalProps,
    isDeleting: state.isLoading
  };
}
