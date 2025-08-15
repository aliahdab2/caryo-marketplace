"use client";

import React, { memo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import ErrorMessage from '../../shared/ErrorMessage';

interface VideoUrlInputProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  handleVideoUrlChange: (url: string) => void;
  removeVideoUrl: (index: number) => void;
  getVideoEmbedUrl: (url: string) => string | null;
}

const VideoUrlInput = memo(function VideoUrlInput({
  formData,
  formErrors,
  handleVideoUrlChange,
  removeVideoUrl,
  getVideoEmbedUrl
}: VideoUrlInputProps) {
  const { t } = useLazyTranslation(['listings']);

  return (
    <div className="animate-in slide-in-from-top-4 duration-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg">
      <div className="space-y-6">
        {/* URL Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h5 className="font-semibold text-purple-900 dark:text-purple-100">
              Add Video URL
            </h5>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Paste your video link below
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="video-url" className="block text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
              {t('listings:videoUrlLabel', 'Video URL')}
            </label>
            <div className="relative">
              <input
                type="url"
                id="video-url"
                data-testid="video-url-input"
                placeholder={t('listings:videoUrlPlaceholder', 'https://youtube.com/watch?v=...')}
                className="w-full px-4 py-4 pl-12 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-purple-900/20 dark:text-white transition-all duration-200 text-lg placeholder:text-gray-400"
                value={formData.videoUrls?.[0]?.url || ''}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                aria-describedby="video-url-hint video-url-description"
                aria-label="Enter video URL from YouTube"
              />
              <div className="absolute start-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-purple-600 dark:text-purple-400" id="video-url-hint">
                {t('listings:videoUrlHelp', 'Supported: YouTube')}
              </p>
              {formData.videoUrls?.[0] && (
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>URL detected</span>
                </div>
              )}
            </div>
          </div>
          {formErrors.videoUrls && <ErrorMessage error={formErrors.videoUrls} id="video-urls-error" />}

          {/* Platform Example */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
              <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">▶</span>
              </div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">YouTube</span>
            </div>
          </div>
        </div>
      </div>

      {/* External Video Preview */}
      {formData.videoUrls && formData.videoUrls.length > 0 && formData.videoUrls[0] && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            {t('listings:videoPreview', 'Video preview')} - External
          </h4>
          
          {/* Video Embed Preview */}
          {(() => {
            const embedUrl = getVideoEmbedUrl(formData.videoUrls[0]?.url || '');
            if (embedUrl) {
              return (
                <div className="relative">
                  <div className="aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="External video preview"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideoUrl(0)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 z-10"
                    aria-label="Remove video URL"
                  >
                    ×
                  </button>
                </div>
              );
            }
            
            // Fallback for non-embeddable URLs
            return (
              <div className="relative p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      External Video URL
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 break-all">
                      {formData.videoUrls[0]?.url || ''}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Preview not available for this URL format
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideoUrl(0)}
                    className="ms-4 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                    aria-label="Remove video URL"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })()}
          
          {/* URL Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Source: {formData.videoUrls[0]?.url || ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoUrlInput;
