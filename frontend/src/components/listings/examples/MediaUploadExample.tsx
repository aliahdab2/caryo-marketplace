/**
 * Example: Media Upload Integration with Custom Hooks
 * 
 * This demonstrates how to use the new useImageUpload and useVideoHandling
 * hooks to create a comprehensive media upload system with all features.
 */

"use client";

import React from 'react';
import Image from 'next/image';
import { useImageUpload, useVideoHandling } from '@/hooks/media';

interface MediaUploadExampleProps {
  onMediaChange?: (images: File[], videos: File[], videoUrls: string[]) => void;
}

/**
 * Example component showing best practices for media upload
 * 
 * Features demonstrated:
 * - Image upload with drag & drop
 * - Image reordering with drag & drop
 * - Video file upload
 * - Video URL input with embed preview
 * - Comprehensive validation and error handling
 * - Memory leak prevention
 * - Progress indicators
 */
export const MediaUploadExample: React.FC<MediaUploadExampleProps> = ({
  onMediaChange
}) => {
  // Image upload hook with full configuration
  const {
    images,
    imagePreviewUrls,
    isDragOver,
    draggedImageIndex,
    dragOverImageIndex,
    handleFileUpload,
    removeImage,
    clearAllImages,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImageDragStart,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDrop,
    handleImageDragEnd,
    canAddMoreFiles,
    getImageStats,
    getMainImageUrl
  } = useImageUpload({
    config: {
      maxFiles: 10,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      enableReordering: true,
      enableDragDrop: true,
      generatePreviews: true,
      debugEnabled: process.env.NODE_ENV === 'development'
    },
    onError: (error) => {
      console.error('Image upload error:', error);
      // Could show toast notification here
    }
  });

  // Video handling hook with full configuration
  const {
    videos,
    videoPreviewUrls,
    videoUrls,
    isVideoUploadEnabled,
    isVideoUrlEnabled,
    showVideoUpload,
    showVideoUrl,
    isProcessing,
    handleVideoUpload,
    removeVideo,
    handleVideoUrlChange,
    removeVideoUrl,
    setShowVideoUpload,
    setShowVideoUrl,
    getVideoEmbedUrl,
    canAddMoreFiles: canAddMoreVideos,
    getVideoStats
  } = useVideoHandling({
    config: {
      maxFiles: 1,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxDuration: 180, // 3 minutes
      acceptedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
      enableUpload: true,
      enableUrlInput: true,
      generatePreviews: true,
      debugEnabled: process.env.NODE_ENV === 'development'
    },
    onError: (error) => {
      console.error('Video error:', error);
      // Could show toast notification here
    }
  });

  // Notify parent when media changes
  React.useEffect(() => {
    onMediaChange?.(images, videos, videoUrls);
  }, [images, videos, videoUrls, onMediaChange]);

  const imageStats = getImageStats();
  const videoStats = getVideoStats();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Media Upload Example</h1>
        <p className="text-gray-600">
          Demonstrating image and video upload with custom hooks
        </p>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Images ({imageStats.count}/{10})</h2>
          <div className="text-sm text-gray-500">
            Total: {(imageStats.totalSize / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>

        {/* Image Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDragOver ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            
            <h3 className="text-lg font-medium mb-2">
              {isDragOver ? 'Drop images here!' : 'Upload Images'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              Drag & drop images here, or click to browse
            </p>
            
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={!canAddMoreFiles()}
                className="sr-only"
              />
              <span className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                canAddMoreFiles() 
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}>
                Select Images
              </span>
            </label>
            
            {images.length > 0 && (
              <button
                onClick={clearAllImages}
                className="ml-2 inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Image Preview Grid */}
        {imagePreviewUrls.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Image Previews (drag to reorder)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className={`relative group cursor-move transition-all duration-300 ${
                    draggedImageIndex === index
                      ? 'scale-105 rotate-2 opacity-75 z-10'
                      : dragOverImageIndex === index
                      ? 'scale-105 ring-2 ring-blue-300'
                      : 'hover:scale-[1.02]'
                  }`}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, index)}
                  onDragOver={(e) => handleImageDragOver(e, index)}
                  onDragLeave={handleImageDragLeave}
                  onDrop={(e) => handleImageDrop(e, index)}
                  onDragEnd={handleImageDragEnd}
                >
                  <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    index === 0 ? 'border-blue-400' : 'border-gray-200'
                  }`}>
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Section */}
      <div className="space-y-6 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Videos (Optional)</h2>
          <div className="text-sm text-gray-500">
            Files: {videoStats.fileCount} | URLs: {videoStats.urlCount}
          </div>
        </div>

        {/* Video Upload Options */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Video File Upload */}
          {isVideoUploadEnabled && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Upload Video File</h3>
                <button
                  onClick={() => setShowVideoUpload(!showVideoUpload)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {showVideoUpload ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showVideoUpload && (
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={!canAddMoreVideos() || isProcessing}
                      className="sr-only"
                    />
                    <span className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                      canAddMoreVideos() && !isProcessing
                        ? 'border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer'
                        : 'border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}>
                      {isProcessing ? 'Processing...' : 'Select Video'}
                    </span>
                  </label>
                  
                  <p className="text-xs text-gray-500">
                    Max: 100MB, 3 minutes, MP4/MOV/AVI
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Video URL Input */}
          {isVideoUrlEnabled && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Add Video URL</h3>
                <button
                  onClick={() => setShowVideoUrl(!showVideoUrl)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {showVideoUrl ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showVideoUrl && (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrls[0] || ''}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  
                  <p className="text-xs text-gray-500">
                    Supports YouTube, Vimeo, and other platforms
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Previews */}
        {(videoPreviewUrls.length > 0 || videoUrls.length > 0) && (
          <div className="space-y-4">
            <h3 className="font-medium">Video Previews</h3>
            
            {/* File Previews */}
            {videoPreviewUrls.map((url, index) => (
              <div key={url} className="relative border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Video File</h4>
                  <button
                    onClick={() => removeVideo(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <video
                  src={url}
                  controls
                  className="w-full max-w-md rounded"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support video preview.
                </video>
              </div>
            ))}
            
            {/* URL Previews */}
            {videoUrls.map((url, index) => (
              <div key={url} className="relative border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Video URL</h4>
                  <button
                    onClick={() => removeVideoUrl(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                {(() => {
                  const embedUrl = getVideoEmbedUrl(url);
                  if (embedUrl) {
                    return (
                      <div className="aspect-video max-w-md">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full rounded"
                          frameBorder="0"
                          allowFullScreen
                          title="Video preview"
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-700">External Video</p>
                        <p className="text-xs text-gray-500 break-all">{url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Preview not available for this URL format
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-3">Upload Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p><strong>Images:</strong> {imageStats.count}/10 files</p>
            <p><strong>Size:</strong> {(imageStats.totalSize / 1024 / 1024).toFixed(1)}MB</p>
            <p><strong>Main Image:</strong> {getMainImageUrl() ? 'Set' : 'None'}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Video Files:</strong> {videoStats.fileCount}/1</p>
            <p><strong>Video URLs:</strong> {videoStats.urlCount}/1</p>
            <p><strong>Video Size:</strong> {(videoStats.totalSize / 1024 / 1024).toFixed(1)}MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadExample;
