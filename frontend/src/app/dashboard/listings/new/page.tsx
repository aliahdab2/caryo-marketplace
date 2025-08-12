"use client";

import React from 'react';
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
    // Navigate back to listings dashboard
    router.push('/dashboard/listings');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('listings:newListingTitle', 'Create New Listing')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('listings:newListingSubtitle', 'Fill in the details below to list your vehicle for sale')}
          </p>
        </div>

        {/* Unified Listing Wizard with Auto-Save */}
        <ListingWizard 
          mode="create"
          autoSave={true}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
