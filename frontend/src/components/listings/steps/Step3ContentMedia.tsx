"use client";

import React from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import StepHeader from '../shared/StepHeader';
import ErrorMessage from '../shared/ErrorMessage';
import { ImageUploadSection } from '../ImageUploadSection';
import { VideoUploadSection } from '../VideoUploadSection';

export interface Step3ContentMediaProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  isRTL: boolean;
  isAnyVideoFeatureEnabled: boolean;
  isVideoUploadEnabled: boolean;
  isVideoUrlEnabled: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFormDataChange: (updates: Partial<ListingFormData>) => void;
}

const Step3ContentMedia: React.FC<Step3ContentMediaProps> = ({
  formData,
  formErrors,
  isRTL,
  isAnyVideoFeatureEnabled,
  isVideoUploadEnabled,
  isVideoUrlEnabled,
  onTitleChange,
  onDescriptionChange,
  onFormDataChange,
}) => {
  const { t } = useLazyTranslation(['listings']);

  return (
    <div className="space-y-8 animate-fadeIn">
      <StepHeader
        title={t('listings:contentMediaTitle', 'Content & Media')}
        subtitle={t('listings:contentMediaSubtitle', 'Create your listing content and add photos')}
      />

      {/* Title */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('listings:title')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onTitleChange}
          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border-gray-200 dark:border-gray-600 focus:border-blue-500"
          placeholder={t('listings:titlePlaceholder')}
          aria-invalid={!!formErrors.title}
        />
        {formErrors.title && <ErrorMessage error={formErrors.title} />}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('listings:titleHint', 'Create an attractive title for your listing')}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('listings:description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onDescriptionChange}
          rows={6}
          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 resize-vertical border-gray-200 dark:border-gray-600 focus:border-blue-500"
          placeholder={t('listings:descriptionPlaceholder', 'Describe your car in detail...')}
          aria-invalid={!!formErrors.description}
        />
        {formErrors.description && <ErrorMessage error={formErrors.description} />}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('listings:descriptionHint', 'Provide detailed information about your vehicle\'s condition, features, and history')}
        </p>
      </div>

      {/* Images and Videos Section */}
      <div className="space-y-8">
        <ImageUploadSection
          formData={formData}
          onFormDataChange={onFormDataChange}
          formErrors={formErrors}
          isRTL={isRTL}
        />

        <VideoUploadSection
          formData={formData}
          onFormDataChange={onFormDataChange}
          formErrors={formErrors}
          isAnyVideoFeatureEnabled={isAnyVideoFeatureEnabled}
          isVideoUploadEnabled={isVideoUploadEnabled}
          isVideoUrlEnabled={isVideoUrlEnabled}
        />
      </div>
    </div>
  );
};

export default Step3ContentMedia;