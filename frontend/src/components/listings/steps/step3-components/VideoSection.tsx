"use client";

import React, { memo } from 'react';
import { useDirection } from '@/utils/direction';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import VideoUpload from './VideoUpload';
import VideoUrlInput from './VideoUrlInput';

interface VideoSectionProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  videoPreviewUrls: string[];
  showVideoUpload: boolean;
  showVideoUrl: boolean;
  isVideoUploadEnabled: boolean;
  isVideoUrlEnabled: boolean;
  isAnyVideoFeatureEnabled: boolean;
  setShowVideoUpload: (show: boolean) => void;
  setShowVideoUrl: (show: boolean) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeVideo: (index: number) => void;
  handleVideoUrlChange: (url: string) => void;
  removeVideoUrl: (index: number) => void;
  getVideoEmbedUrl: (url: string) => string | null;
}

const VideoSection = memo(function VideoSection({
  formData,
  formErrors,
  videoPreviewUrls,
  showVideoUpload,
  showVideoUrl,
  isVideoUploadEnabled,
  isVideoUrlEnabled,
  isAnyVideoFeatureEnabled,
  setShowVideoUpload,
  setShowVideoUrl,
  handleVideoUpload,
  removeVideo,
  handleVideoUrlChange,
  removeVideoUrl,
  getVideoEmbedUrl
}: VideoSectionProps) {
  const { t } = useLazyTranslation(['listings']);
  const { isRTL } = useDirection();

  if (!isAnyVideoFeatureEnabled) {
    return null;
  }

  return (
    <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="text-center" data-testid="video-section">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('listings:videoFieldsTitle', 'Videos (Optional)')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('listings:videoFieldsSubtitle', 'Add videos to showcase your vehicle')}
        </p>
      </div>

      {/* Video Options - Enhanced UX with Configuration Handling */}
      <div className="space-y-4">
        {/* Header with better description - Adaptive based on available options */}
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} text-sm text-gray-600 dark:text-gray-400`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {isVideoUploadEnabled && isVideoUrlEnabled 
              ? t('listings:videoSectionTitleBoth', "Choose how you'd like to add videos to your listing")
              : isVideoUploadEnabled 
                ? t('listings:videoSectionTitleUploadOnly', "Upload a video file to showcase your vehicle")
                : t('listings:videoSectionTitleUrlOnly', "Add a video URL to showcase your vehicle")
            }
          </span>
        </div>

        {/* Enhanced Toggle Buttons - Responsive grid based on available options */}
        <div className={`grid gap-4 ${
          isVideoUploadEnabled && isVideoUrlEnabled 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1'
        }`}>
          {/* Video Upload Toggle */}
          {isVideoUploadEnabled && (
            <div className="group h-full">
              <button
                type="button"
                onClick={() => setShowVideoUpload(!showVideoUpload)}
                className={`w-full h-full p-5 rounded-2xl border-2 transition-all duration-300 ${isRTL ? 'text-right' : 'text-left'} group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 ${
                  showVideoUpload || (formData.videos && formData.videos.length > 0)
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-900 dark:text-blue-100 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                } ${
                  !isVideoUrlEnabled ? 'ring-2 ring-blue-200 dark:ring-blue-700' : ''
                }`}
                aria-label={`Upload video file - ${showVideoUpload ? 'expanded' : 'collapsed'}`}
                aria-expanded={showVideoUpload}
                aria-describedby="video-upload-description"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      showVideoUpload || (formData.videos && formData.videos.length > 0)
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16l13-8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">
                        {t('listings:addVideoUpload', 'Upload Video File')}
                        {!isVideoUrlEnabled && (
                          <span className="ms-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                            {t('listings:onlyOption', 'Only Option')}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" id="video-upload-description">
                        {t('listings:videoUploadToggleHelp', 'Upload a video file from your device')}
                      </p>
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} text-xs text-gray-500 dark:text-gray-500 mt-3`}>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{t('listings:videoMaxSize', 'Max 100MB')}</span>
                        </div>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{t('listings:videoMaxDuration', '3 min duration')}</span>
                        </div>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{t('listings:videoFormats', 'MP4, MOV, AVI')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`transform transition-all duration-300 ${
                    showVideoUpload
                      ? `${isRTL ? '-rotate-90' : 'rotate-90'} scale-110`
                      : `${isRTL ? 'rotate-180' : ''} group-hover:scale-105`
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {(formData.videos && formData.videos.length > 0) && (
                  <div className={`mt-3 flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {formData.videos.length} {t('listings:videoReadyToUpload', 'video file ready to upload')}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Video URL Toggle */}
          {isVideoUrlEnabled && (
            <div className="group h-full">
              <button
                type="button"
                onClick={() => setShowVideoUrl(!showVideoUrl)}
                className={`w-full h-full p-5 rounded-2xl border-2 transition-all duration-300 ${isRTL ? 'text-right' : 'text-left'} group-hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800 ${
                  showVideoUrl || (formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0])
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-900 dark:text-purple-100 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                } ${
                  !isVideoUploadEnabled ? 'ring-2 ring-purple-200 dark:ring-purple-700' : ''
                }`}
                aria-label={`Add video URL - ${showVideoUrl ? 'expanded' : 'collapsed'}`}
                aria-expanded={showVideoUrl}
                aria-describedby="video-url-description"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      showVideoUrl || (formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0])
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">
                        {t('listings:addVideoUrl', 'Add Video URL')}
                        {!isVideoUploadEnabled && (
                          <span className="ms-2 px-2 py-1 text-xs bg-purple-500 text-white rounded-full">
                            {t('listings:onlyOption', 'Only Option')}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" id="video-url-description">
                        {t('listings:videoUrlToggleHelp', 'Add a YouTube video URL')}
                      </p>
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} text-xs text-gray-500 dark:text-gray-500 mt-3`}>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>{t('listings:videoPlatformYouTube', 'YouTube')}</span>
                        </div>
                        {/* Vimeo removed */}
                        {/* External links note no longer needed */}
                      </div>
                    </div>
                  </div>
                  <div className={`transform transition-all duration-300 ${
                    showVideoUrl
                      ? `${isRTL ? '-rotate-90' : 'rotate-90'} scale-110`
                      : `${isRTL ? 'rotate-180' : ''} group-hover:scale-105`
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {(formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0]) && (
                  <div className={`mt-3 flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {t('listings:videoUrlReady', 'Video URL added and ready')}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Configuration-aware messaging and tips */}
        {!showVideoUpload && !showVideoUrl && (!formData.videos || formData.videos.length === 0) && (!formData.videoUrls || !formData.videoUrls[0]) && (
          <div className="space-y-3">
            {/* Pro tip - Always show when no videos are added */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    💡 {t('listings:videoProTip', 'Pro tip: Videos increase listing engagement by 3x')}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {isVideoUploadEnabled && isVideoUrlEnabled 
                      ? t('listings:videoSectionSubtitleBoth', "Upload a video file for the best quality, or add a YouTube link for easy sharing")
                      : isVideoUploadEnabled 
                        ? t('listings:videoSectionSubtitleUploadOnly', "Upload a video file to show your vehicle in action")
                        : t('listings:videoSectionSubtitleUrlOnly', "Add a YouTube link to showcase your vehicle")
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Upload Component */}
      {isVideoUploadEnabled && showVideoUpload && (
        <VideoUpload
          formData={formData}
          formErrors={formErrors}
          videoPreviewUrls={videoPreviewUrls}
          handleVideoUpload={handleVideoUpload}
          removeVideo={removeVideo}
        />
      )}

      {/* Video URL Component */}
      {isVideoUrlEnabled && showVideoUrl && (
        <VideoUrlInput
          formData={formData}
          formErrors={formErrors}
          handleVideoUrlChange={handleVideoUrlChange}
          removeVideoUrl={removeVideoUrl}
          getVideoEmbedUrl={getVideoEmbedUrl}
        />
      )}
    </div>
  );
});

export default VideoSection;
