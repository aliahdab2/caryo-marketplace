"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ListingFormData, VideoUrlInput } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import { isYouTubeUrl, getYouTubeEmbedUrl, normalizeVideoUrls } from '@/utils/mediaUtils';
import VideoSection from './steps/step3-components/VideoSection';

interface VideoUploadSectionProps {
  formData: ListingFormData;
  onFormDataChange: (updates: Partial<ListingFormData>) => void;
  formErrors: FormErrors;
  isAnyVideoFeatureEnabled: boolean;
  isVideoUploadEnabled: boolean;
  isVideoUrlEnabled: boolean;
}

export const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  formData,
  onFormDataChange,
  formErrors,
  isAnyVideoFeatureEnabled,
  isVideoUploadEnabled,
  isVideoUrlEnabled
}) => {
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoUrl, setShowVideoUrl] = useState(false);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);

  // Build previews from current files
  useEffect(() => {
    const files = formData.videos || [];
    const urls = files.map((f) => URL.createObjectURL(f));
    setVideoPreviewUrls(urls);
    return () => {
      try { urls.forEach((u) => URL.revokeObjectURL(u)); } catch {}
    };
  }, [formData.videos]);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selected = Array.from(files).filter((f) => f.type.startsWith('video/'));
    if (selected.length > 0) {
      onFormDataChange({ videos: [...(formData.videos || []), ...selected] });
    }
  }, [formData.videos, onFormDataChange]);

  const removeVideo = useCallback((index: number) => {
    const updated = (formData.videos || []).filter((_, i) => i !== index);
    const toRevoke = videoPreviewUrls[index];
    if (toRevoke) {
      try { URL.revokeObjectURL(toRevoke); } catch {}
    }
    onFormDataChange({ videos: updated });
    setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [formData.videos, onFormDataChange, videoPreviewUrls]);

  const handleVideoUrlChange = useCallback((url: string) => {
    const isValid = isYouTubeUrl(url);
    const next: VideoUrlInput[] = url ? [{ url, isValidated: isValid }] : [];
    onFormDataChange({ videoUrls: normalizeVideoUrls(next) });
  }, [onFormDataChange]);

  const removeVideoUrl = useCallback((_index: number) => {
    onFormDataChange({ videoUrls: [] });
  }, [onFormDataChange]);

  const getVideoEmbedUrl = useCallback((url: string): string | null => getYouTubeEmbedUrl(url), []);

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
      handleVideoUpload={handleVideoUpload}
      removeVideo={removeVideo}
      handleVideoUrlChange={handleVideoUrlChange}
      removeVideoUrl={removeVideoUrl}
      getVideoEmbedUrl={getVideoEmbedUrl}
    />
  );
};
