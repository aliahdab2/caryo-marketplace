"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ListingWizard from '@/components/listings/ListingWizard';

/**
 * Edit Listing Page - Now using unified ListingWizard component
 * This replaces the previous complex data transformation logic with a clean,
 * service-based approach following React best practices.
 */
export default function EditListingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation(['listings', 'common']);

  const handleSuccess = (_listingId: string) => {
    // Navigate back to listings dashboard after successful update
    router.push(`/dashboard/listings`);
  };

  const handleCancel = () => {
    // Navigate back to listings dashboard
    router.push('/dashboard/listings');
  };

  return (
    <div className="px-0">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {t('listings:editListingTitle', 'Edit Listing')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('listings:editListingSubtitle', 'Update your vehicle listing details')}
        </p>
      </div>

      {/* Unified Listing Wizard with Auto-Loading */}
      <ListingWizard 
        mode="edit"
        listingId={id}
        autoLoad={true}
        showHeader={false}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}