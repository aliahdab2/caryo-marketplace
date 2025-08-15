"use client";

import React, { useState, useCallback } from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import VideoSection from './steps/step3-components/VideoSection';

interface VideoUploadSectionProps {
  formData: ListingFormData;
  onFormDataChange: (updates: Partial<ListingFormData>) => void;
  formErrors: FormErrors;
  isRTL: boolean;
  videoPreviewUrls: string[];
  existingVideos: string[];
  isDragOver: boolean;
  setIsDragOver: (isDragOver: boolean) => void;
  setVideoPreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: (index: number) => void;
  onRemoveVideoUrl: (index: number) => void;
  onVideoUrlChange: (index: number, value: string) => void;
  isAnyVideoFeatureEnabled: boolean;
  isVideoUploadEnabled: boolean;
  isVideoUrlEnabled: boolean;
  rtl: any;
}

export const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  formData,
  onFormDataChange: _onFormDataChange,
  formErrors,
  isRTL: _isRTL,
  videoPreviewUrls,
  existingVideos: _existingVideos,
  isDragOver: _isDragOver,
  setIsDragOver: _setIsDragOver,
  setVideoPreviewUrls: _setVideoPreviewUrls,
  onVideoUpload,
  onRemoveVideo,
  onRemoveVideoUrl,
  onVideoUrlChange,
  isAnyVideoFeatureEnabled,
  isVideoUploadEnabled,
  isVideoUrlEnabled,
  rtl: _rtl
}) => {
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoUrl, setShowVideoUrl] = useState(false);

  const handleVideoUrlChangeSingle = useCallback((url: string) => {
    onVideoUrlChange(0, url);
  }, [onVideoUrlChange]);

  const getVideoEmbedUrl = useCallback((url: string): string | null => {
    if (!url) return null;

    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

    return null;
  }, []);

  if (!isAnyVideoFeatureEnabled) return null;

  return (
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
      handleVideoUpload={onVideoUpload}
      removeVideo={onRemoveVideo}
      handleVideoUrlChange={handleVideoUrlChangeSingle}
      removeVideoUrl={onRemoveVideoUrl}
      getVideoEmbedUrl={getVideoEmbedUrl}
    />
  );
};
