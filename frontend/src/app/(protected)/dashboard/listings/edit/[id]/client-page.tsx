"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ListingWizard, { ListingWizardHandle } from '@/components/listings/ListingWizard';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

/**
 * Edit Listing Page - Now using unified ListingWizard component
 * This replaces the previous complex data transformation logic with a clean,
 * service-based approach following React best practices.
 */
export default function EditListingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation(['listings', 'common']);
  const wizardRef = React.useRef<ListingWizardHandle>(null);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleSuccess = (_listingId: string) => {
    // Navigate back to listings dashboard after successful update
    router.push(`/dashboard/listings`);
  };

  const handleCancel = () => {
    const dirty = wizardRef.current?.isDirty() ?? false;
    if (!dirty) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/dashboard/listings');
      }
      return;
    }
    setShowConfirm(true);
  };

  const confirmDiscard = () => {
    setShowConfirm(false);
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/listings');
    }
  };

  return (
    <div className="px-0">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {t('listings:editListingTitle', 'Edit Listing')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('listings:editListingSubtitle', 'Update your vehicle listing details')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
        >
          {t('common:cancel', 'Cancel')}
        </button>
      </div>

      {/* Unified Listing Wizard with Auto-Loading */}
      <ListingWizard 
        mode="edit"
        listingId={id}
        autoLoad={true}
        showHeader={false}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        ref={wizardRef}
      />

      <DeleteConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDiscard}
        title={t('listings:discardChangesTitle', 'Discard changes?')}
        message={t('listings:discardChangesMessage', 'Your changes will not be saved.')}
        confirmText={t('common:discard', 'Discard')}
        cancelText={t('common:cancel', 'Cancel')}
        type="warning"
      />
    </div>
  );
}