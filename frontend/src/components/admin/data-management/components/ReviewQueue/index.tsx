"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdRateReview } from 'react-icons/md';

export const ReviewQueue: React.FC = () => {
  const { t } = useTranslation(['datamanagement']);

  return (
    <div className="p-6">
      <div className="text-center py-12">
        <MdRateReview className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('datamanagement:reviewQueue')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Review and approve data from external sources like SyrianCars and CarQuery
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            🚧 Coming Soon: This feature will allow you to review and approve data imported from external APIs before it becomes active.
          </p>
        </div>
      </div>
    </div>
  );
};
