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
      {/* Live region for validation feedback (accessibility) */}
      <div className="sr-only" aria-live="polite" role="status">
        {Object.values(formErrors).filter(Boolean).join('. ')}
      </div>
      
      <StepHeader
        title={t('listings:contentMediaTitle', 'Content & Media')}
        subtitle={t('listings:contentMediaSubtitle', 'Create your listing content and add photos')}
      />

      {/* Title */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
          {t('listings:title')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onTitleChange}
            className={`w-full h-12 px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              formErrors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            }`}
            placeholder={t('listings:titlePlaceholder')}
            aria-invalid={!!formErrors.title}
            aria-describedby="title-hint"
          />
          {/* Status icon */}
          <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center`}>
            {formErrors.title ? (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            ) : formData.title ? (
              <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : null}
          </div>
        </div>
        {formErrors.title && <ErrorMessage error={formErrors.title} />}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="title-hint">
          {t('listings:titleHint', 'Create an attractive title for your listing')}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
          {t('listings:description')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            name="description"
            value={formData.description}
            onChange={onDescriptionChange}
            rows={6}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-colors duration-200 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 resize-vertical ${
              formErrors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
            }`}
            placeholder={t('listings:descriptionPlaceholder', 'Describe your car in detail...')}
            aria-invalid={!!formErrors.description}
            aria-describedby="description-hint"
          />
          {/* Status icon */}
          <div className={`pointer-events-none absolute top-3 ${isRTL ? 'left-3' : 'right-3'} flex items-start`}>
            {formErrors.description ? (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            ) : formData.description ? (
              <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : null}
          </div>
        </div>
        {formErrors.description && <ErrorMessage error={formErrors.description} />}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="description-hint">
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
      
      {/* Bottom spacing to separate from navigation buttons */}
      <div className="pb-8"></div>
    </div>
  );
};

export default Step3ContentMedia;