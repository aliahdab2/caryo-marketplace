"use client";

import React, { memo, useMemo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import ErrorMessage from '../../shared/ErrorMessage';

interface ContentFieldsProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ContentFields = memo(function ContentFields({
  formData,
  formErrors,
  handleChange
}: ContentFieldsProps) {
  const { t } = useLazyTranslation(['listings']);
  
  // Recommended character limits (soft limits for guidance only)
  const titleRecommendedMax = 70;
  const descriptionRecommendedMax = 1000;

  const titleLength = useMemo(() => (formData.title || '').length, [formData.title]);
  const descriptionLength = useMemo(() => (formData.description || '').length, [formData.description]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('listings:title')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border-gray-200 dark:border-gray-600 focus:border-blue-500"
          placeholder={t('listings:titlePlaceholder')}
          aria-invalid={!!formErrors.title}
        />
        {formErrors.title && <ErrorMessage error={formErrors.title} />}
        <div className="mt-1 flex items-center justify-between gap-3 text-xs">
          <p className="text-gray-500 dark:text-gray-400">
            {t('listings:titleHint', 'Create an attractive title for your listing')}
          </p>
          <span
            aria-live="polite"
            className={titleLength > titleRecommendedMax ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
          >
            {titleLength}/{titleRecommendedMax}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('listings:description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={6}
          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 resize-vertical border-gray-200 dark:border-gray-600 focus:border-blue-500"
          placeholder={t('listings:descriptionPlaceholder', 'Describe your car in detail...')}
          aria-invalid={!!formErrors.description}
        />
        {formErrors.description && <ErrorMessage error={formErrors.description} />}
        <div className="mt-1 flex items-center justify-between gap-3 text-xs">
          <p className="text-gray-500 dark:text-gray-400">
            {t('listings:descriptionHint', 'Provide detailed information about your vehicle\'s condition, features, and history')}
          </p>
          <span
            aria-live="polite"
            className={descriptionLength > descriptionRecommendedMax ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
          >
            {descriptionLength}/{descriptionRecommendedMax}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ContentFields;
