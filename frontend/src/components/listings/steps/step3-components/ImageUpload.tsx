"use client";

import React, { memo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { FormErrors } from '@/types/forms';
import ErrorMessage from '../../shared/ErrorMessage';

interface ImageUploadProps {
  isDragOver: boolean;
  formErrors: FormErrors;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

const ImageUpload = memo(function ImageUpload({
  isDragOver,
  formErrors,
  handleImageUpload,
  handleDragOver,
  handleDragLeave,
  handleDrop
}: ImageUploadProps) {
  const { t } = useLazyTranslation(['listings']);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t('listings:newListingCarImages', 'Car Images')} <span className="text-red-500">*</span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('listings:newListingImageUploadSubtitle', 'Upload high-quality photos to attract potential buyers')}
        </p>
      </div>

      {/* Enhanced Drag & Drop Upload Area */}
      <div className="space-y-6">
        <div
          className={`w-full transition-all duration-300 ${
            isDragOver
              ? 'scale-[1.02] shadow-xl ring-4 ring-blue-200 dark:ring-blue-700'
              : 'hover:shadow-lg'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label
            htmlFor="image-upload"
            className={`group flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-200 dark:focus-within:ring-blue-800 ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Upload car images by clicking or dragging files here"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('image-upload')?.click();
              }
            }}
          >
            <div className="flex flex-col items-center justify-center pt-8 pb-8 space-y-6">
              {/* Enhanced Upload Icon */}
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragOver
                  ? 'bg-blue-100 dark:bg-blue-800/50 scale-110'
                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 group-hover:scale-105'
              }`}>
                <svg className={`w-10 h-10 transition-colors duration-300 ${
                  isDragOver
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>

              {/* Main Text */}
              <div className="text-center space-y-3">
                <h4 className={`text-xl font-semibold transition-colors duration-300 ${
                  isDragOver
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {isDragOver
                    ? t('listings:dropImagesHere', 'Drop your images here!')
                    : t('listings:newListingUploadImages', 'Upload Car Images')
                  }
                </h4>

                <p className={`text-base transition-colors duration-300 ${
                  isDragOver
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {isDragOver
                    ? t('listings:newListingReleaseToAdd', 'Release to add images to your listing')
                    : t('listings:newListingDragAndDrop', 'Drag & drop images here, or click to browse')
                  }
                </p>

                {/* Format info moved below and muted */}
                <div className="pt-2 space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {t('listings:newListingImageUploadHint', 'Upload multiple images to showcase your car. First image will be the main photo.')}
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t('listings:newListingImageFormatsShort', 'PNG, JPG, JPEG')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t('listings:newListingImageMaxSize', 'Max size: {{size}}MB per image', { size: 5 })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t('listings:newListingImageMaxCount', 'Maximum {{max}} images', { max: 10 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <input
              id="image-upload"
              type="file"
              className="sr-only"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              aria-describedby="image-upload-hint"
              aria-label="Select car images to upload (PNG, JPG, JPEG, max 5MB each, up to 10 images)"
            />
          </label>
        </div>
      </div>
      {formErrors.images && <ErrorMessage error={formErrors.images} id="images-error" />}
    </div>
  );
});

export default ImageUpload;
