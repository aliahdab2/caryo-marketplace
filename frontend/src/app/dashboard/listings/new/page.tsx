"use client";

import React from 'react';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ListingWizard from '@/components/listings/ListingWizard';
 

/**
 * New Listing Page - Now using unified ListingWizard component
 * This replaces the previous 2,500+ line implementation with a clean, 
 * reusable component approach following React best practices.
 */
export default function NewListingPage() {
  const router = useRouter();
  const { t } = useTranslation(['listings', 'common']);

  const handleSuccess = (_listingId: string) => {
    // Navigate to the newly created listing or back to listings dashboard
    router.push(`/dashboard/listings`);
  };

  const handleCancel = () => {
    setShowConfirm(true);
  };

  const [showConfirm, setShowConfirm] = React.useState(false);
  const confirmDiscard = () => {
    setShowConfirm(false);

    // Prefer going back to where user came from (e.g., main page CTA)
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/listings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        

        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {t('listings:newListingTitle', 'Create New Listing')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              {t('listings:newListingSubtitle', 'Fill in the details below to list your vehicle for sale')}
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

        {/* Unified Listing Wizard with Auto-Save */}
        <ListingWizard 
          mode="create"
          autoSave={true}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
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
    </div>
  );
}
