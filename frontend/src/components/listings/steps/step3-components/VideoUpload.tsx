"use client";

import React, { memo } from 'react';
import { useDirection } from '@/utils/direction';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';
import ErrorMessage from '../../shared/ErrorMessage';

interface VideoUploadProps {
  formData: ListingFormData;
  formErrors: FormErrors;
  videoPreviewUrls: string[];
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeVideo: (index: number) => void;
}

const VideoUpload = memo(function VideoUpload({
  formData,
  formErrors,
  videoPreviewUrls,
  handleVideoUpload,
  removeVideo
}: VideoUploadProps) {
  const { t } = useLazyTranslation(['listings']);
  const { isRTL } = useDirection();

  return (
    <div className="animate-in slide-in-from-top-4 duration-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
      <div className="space-y-6" data-testid="video-upload-area">
        {/* Upload Header */}
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16l13-8z" />
            </svg>
          </div>
          <div>
            <h5 className="font-semibold text-blue-900 dark:text-blue-100">
              {t('listings:addVideoUpload', 'Upload Video File')}
            </h5>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Drag & drop or click to select
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center w-full" data-testid="video-dropzone">
          <label 
            htmlFor="video-upload"
            data-testid="video-dropzone-label"
            className="group flex flex-col items-center justify-center w-full h-56 border-2 border-blue-300 border-dashed rounded-2xl cursor-pointer bg-white/80 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg focus-within:ring-4 focus-within:ring-blue-200 dark:focus-within:ring-blue-800"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('video-upload')?.click();
              }
            }}
          >
            <div className="flex flex-col items-center justify-center pt-6 pb-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {t('listings:uploadVideoLabel', 'Choose your video file')}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  or drag and drop it here
                </p>
                <div className="flex items-center justify-center space-x-6 text-xs text-blue-500 dark:text-blue-400 mt-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{t('listings:videoMaxSize', 'Max 100MB')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{t('listings:videoMaxDuration', '3 min duration')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{t('listings:videoFormats', 'MP4, MOV, AVI')}</span>
                  </div>
                </div>
              </div>
            </div>
            <input
              id="video-upload"
              data-testid="video-input"
              type="file"
              className="sr-only"
              accept="video/*"
              onChange={handleVideoUpload}
              aria-describedby="video-upload-hint video-upload-description"
              aria-label="Select video file to upload (MP4, MOV, AVI, max 100MB, 3 minutes duration)"
              disabled={formData.videos && formData.videos.length > 0}
            />
          </label>
        </div>
        {formErrors.videos && <ErrorMessage error={formErrors.videos} id="videos-error" />}
      </div>

      {/* Enhanced Video Preview */}
      {formData.videos && formData.videos.length > 0 && videoPreviewUrls.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4 mt-6 pt-6 border-t border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {t('listings:videoPreview', 'Video Preview')}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {formData.videos[0].name} • {(formData.videos[0].size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeVideo(0)}
              className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 text-sm font-medium`}
              aria-label="Remove video"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Remove</span>
            </button>
          </div>
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={videoPreviewUrls[0]}
              controls
              className="w-full max-w-2xl mx-auto"
              style={{ maxHeight: '400px' }}
              poster=""
            >
              Your browser does not support the video tag.
            </video>
            <div className="absolute top-4 start-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">Ready to upload</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoUpload;
