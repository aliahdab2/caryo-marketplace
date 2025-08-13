"use client";

import React, { memo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import ContentFields from './step3-components/ContentFields';
import ImageUpload from './step3-components/ImageUpload';
import ImagePreviewGrid from './step3-components/ImagePreviewGrid';
import VideoSection from './step3-components/VideoSection';

interface Step3Props {
  formData: ListingFormData;
  formErrors: FormErrors;
  imagePreviewUrls: string[];
  videoPreviewUrls: string[];
  isDragOver: boolean;
  draggedImageIndex: number | null;
  dragOverImageIndex: number | null;
  showVideoUpload: boolean;
  showVideoUrl: boolean;
  isVideoUploadEnabled: boolean;
  isVideoUrlEnabled: boolean;
  isAnyVideoFeatureEnabled: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleImageDragStart: (e: React.DragEvent, index: number) => void;
  handleImageDragOver: (e: React.DragEvent, index: number) => void;
  handleImageDragLeave: () => void;
  handleImageDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleImageDragEnd: () => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeVideo: (index: number) => void;
  setShowVideoUpload: (show: boolean) => void;
  setShowVideoUrl: (show: boolean) => void;
  handleVideoUrlChange: (url: string) => void;
  removeVideoUrl: (index: number) => void;
  getVideoEmbedUrl: (url: string) => string | null;
}

const Step3ContentMedia = memo(function Step3ContentMedia({
  formData,
  formErrors,
  imagePreviewUrls,
  videoPreviewUrls,
  isDragOver,
  draggedImageIndex,
  dragOverImageIndex,
  showVideoUpload,
  showVideoUrl,
  isVideoUploadEnabled,
  isVideoUrlEnabled,
  isAnyVideoFeatureEnabled,
  handleChange,
  handleImageUpload,
  removeImage,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleImageDragStart,
  handleImageDragOver,
  handleImageDragLeave,
  handleImageDrop,
  handleImageDragEnd,
  handleVideoUpload,
  removeVideo,
  setShowVideoUpload,
  setShowVideoUrl,
  handleVideoUrlChange,
  removeVideoUrl,
  getVideoEmbedUrl
}: Step3Props) {
  const { t } = useLazyTranslation(['listings']);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('listings:contentMediaTitle', 'Content & Media')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t('listings:contentMediaSubtitle', 'Create your listing content and add photos')}
        </p>
      </div>

      {/* Content Fields (Title & Description) */}
      <ContentFields
        formData={formData}
        formErrors={formErrors}
        handleChange={handleChange}
      />

      {/* Images Section */}
      <div className="space-y-8">
        <ImageUpload
          isDragOver={isDragOver}
          formErrors={formErrors}
          handleImageUpload={handleImageUpload}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
        />

        <ImagePreviewGrid
          formData={formData}
          imagePreviewUrls={imagePreviewUrls}
          draggedImageIndex={draggedImageIndex}
          dragOverImageIndex={dragOverImageIndex}
          removeImage={removeImage}
          handleImageDragStart={handleImageDragStart}
          handleImageDragOver={handleImageDragOver}
          handleImageDragLeave={handleImageDragLeave}
          handleImageDrop={handleImageDrop}
          handleImageDragEnd={handleImageDragEnd}
        />
      </div>

      {/* Video Section */}
      <VideoSection
        formData={formData}
        formErrors={formErrors}
        videoPreviewUrls={videoPreviewUrls}
        showVideoUpload={showVideoUpload}
        showVideoUrl={showVideoUrl}
        isVideoUploadEnabled={isVideoUploadEnabled}
        isVideoUrlEnabled={isVideoUrlEnabled}
        isAnyVideoFeatureEnabled={isAnyVideoFeatureEnabled}
        setShowVideoUpload={setShowVideoUpload}
        setShowVideoUrl={setShowVideoUrl}
        handleVideoUpload={handleVideoUpload}
        removeVideo={removeVideo}
        handleVideoUrlChange={handleVideoUrlChange}
        removeVideoUrl={removeVideoUrl}
        getVideoEmbedUrl={getVideoEmbedUrl}
      />
    </div>
  );
});

export default Step3ContentMedia;